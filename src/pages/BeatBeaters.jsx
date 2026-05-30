import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const LANE_COLORS = [
  '#FF3B3B', '#FF9F0A', '#30D158', '#0A84FF', '#FFFFFF',
  '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A',
]
const KEY_LABELS = ['W', 'A', 'S', 'D', 'SPACE', 'I', 'J', 'K', 'L']
const KEY_MAP    = { w: 0, a: 1, s: 2, d: 3, i: 5, j: 6, k: 7, l: 8 }

const DEFAULT_SCROLL_SPEED = 380
const HIT_ZONE_FRAC = 0.85
const NOTE_H        = 20
const HIT_ZONE_H    = 50
const LANE_GAP      = 2
const CLUSTER_GAP   = 6
const SPACE_MULT    = 2.5
const BEAT_BAR_H    = 6
const BEAT_BAR_GAP  = 12

const SCORE_PERFECT = 300
const SCORE_GOOD    = 150
const SCORE_LATE    = 50
const TIMING_PERFECT = 30
const TIMING_GOOD    = 80
const TIMING_WINDOW  = 150

const COMBO_THRESHOLDS = [
  { min: 0,  multiplier: 1 },
  { min: 10, multiplier: 2 },
  { min: 20, multiplier: 3 },
  { min: 30, multiplier: 4 },
]

const BEAT_METER_FILL_PER_PERFECT = 10
const BEAT_METER_ACTIVE_DURATION  = 8000
const BEAT_METER_SCORE_MULTIPLIER = 2
const BEAT_METER_ACTIVATE_KEY     = 'Shift'

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function computeLayout(w, h) {
  const totalFixedGap = 3 * LANE_GAP + CLUSTER_GAP + CLUSTER_GAP + 3 * LANE_GAP
  const unitW = (w - totalFixedGap) / (8 + SPACE_MULT)
  const laneWidths = [unitW, unitW, unitW, unitW, unitW * SPACE_MULT, unitW, unitW, unitW, unitW]
  const laneX = new Array(9)
  laneX[0] = 0
  laneX[1] = unitW + LANE_GAP
  laneX[2] = 2 * unitW + 2 * LANE_GAP
  laneX[3] = 3 * unitW + 3 * LANE_GAP
  laneX[4] = 4 * unitW + 3 * LANE_GAP + CLUSTER_GAP
  const rs  = laneX[4] + unitW * SPACE_MULT + CLUSTER_GAP
  laneX[5]  = rs
  laneX[6]  = rs + unitW + LANE_GAP
  laneX[7]  = rs + 2 * unitW + 2 * LANE_GAP
  laneX[8]  = rs + 3 * unitW + 3 * LANE_GAP
  return { laneWidths, laneX, hitZoneY: h * HIT_ZONE_FRAC, w, h }
}

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function lerpColor(hex1, hex2, t) {
  const r1=parseInt(hex1.slice(1,3),16),g1=parseInt(hex1.slice(3,5),16),b1=parseInt(hex1.slice(5,7),16)
  const r2=parseInt(hex2.slice(1,3),16),g2=parseInt(hex2.slice(3,5),16),b2=parseInt(hex2.slice(5,7),16)
  return [Math.round(r1+(r2-r1)*t), Math.round(g1+(g2-g1)*t), Math.round(b1+(b2-b1)*t)]
}

function rrect(ctx, x, y, w, h, r) {
  const s = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + s, y)
  ctx.lineTo(x + w - s, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + s)
  ctx.lineTo(x + w, y + h - s)
  ctx.quadraticCurveTo(x + w, y + h, x + w - s, y + h)
  ctx.lineTo(x + s, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - s)
  ctx.lineTo(x, y + s)
  ctx.quadraticCurveTo(x, y, x + s, y)
  ctx.closePath()
}

function getComboMultiplier(combo) {
  for (let i = COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
    if (combo >= COMBO_THRESHOLDS[i].min) return COMBO_THRESHOLDS[i].multiplier
  }
  return 1
}

function getGrade(accuracy) {
  if (accuracy >= 95) return { grade: 'S', color: '#FFD60A' }
  if (accuracy >= 80) return { grade: 'A', color: '#30D158' }
  if (accuracy >= 65) return { grade: 'B', color: '#0A84FF' }
  if (accuracy >= 50) return { grade: 'C', color: '#FF9F0A' }
  if (accuracy >= 35) return { grade: 'D', color: '#FF375F' }
  return { grade: 'F', color: '#FF3B3B' }
}

function popEl(el) {
  if (!el) return
  el.style.transition = 'none'
  el.style.transform  = 'scale(1.25)'
  el.offsetHeight
  el.style.transition = 'transform 150ms ease-out'
  el.style.transform  = 'scale(1.0)'
}

function initGame() {
  return {
    state: 'IDLE',
    notes: [],  // set by startGame()
    hitFlashes: Array.from({ length: 9 }, () => ({ opacity: 0, color: '#fff' })),
    popups: [],
    pressedLanes: new Set(),
    activeHolds: new Map(),
    startTime: 0,
    currentTime: 0,
    demoStartTS: 0,
    countdownStartTS: 0,
    countdown: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lastHitLane: 0,
    beatMeter: 0,
    beatMeterActive: false,
    beatMeterTimer: 0,
    stats: { perfect: 0, good: 0, late: 0, miss: 0, holdComplete: 0, holdPartial: 0 },
    shakeFrames: 0,
    comboBreakFlash: false,
    prevTS: 0,
    _prevScore: -1,
    _prevCombo: -1,
    _prevBeatActive: false,
  }
}

// ─── Visualizer ───────────────────────────────────────────────────────────────

function drawVisualizer(ctx, w, h, analyser, freqData, waveData, audioReady, pulse, now) {
  const isDemo  = !analyser || !audioReady
  const cx      = w / 2
  const cy      = h * 0.45
  const baseR   = w * 0.28
  const maxBarL = 80
  const numBars = analyser ? Math.floor(analyser.frequencyBinCount / 2) : 512

  if (!isDemo && freqData) {
    let bassAvg = 0
    for (let i = 0; i < 8; i++) bassAvg += freqData[i]
    bassAvg /= 8
    if (bassAvg > 180 && now - pulse.lastRingPulse > 300) {
      pulse.lastRingPulse = now; pulse.amt = 12
    }
  }

  const effectiveR = isDemo ? baseR + Math.sin(now / 600) * 8 : baseR + pulse.amt

  if (!isDemo && freqData) {
    let beatAvg = 0
    for (let i = 0; i < 5; i++) beatAvg += freqData[i]
    beatAvg /= 5
    if (beatAvg > 190 && now - pulse.lastBeatFlash > 300) {
      pulse.lastBeatFlash = now
      ctx.fillStyle = 'rgba(255,255,255,0.03)'
      ctx.fillRect(0, 0, w, h)
    }
  }

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1; ctx.shadowBlur = 0
  const waveY = h * 0.5
  let first = true
  for (let xi = 0; xi <= w; xi += 2) {
    let y
    if (isDemo) y = waveY + Math.sin(now / 400 + xi * 0.05) * 15
    else if (waveData) {
      const idx = Math.min(Math.floor((xi / w) * waveData.length), waveData.length - 1)
      y = waveY + ((waveData[idx] - 128) / 128) * 20
    } else y = waveY
    if (first) { ctx.moveTo(xi, y); first = false } else ctx.lineTo(xi, y)
  }
  ctx.stroke()

  ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1; ctx.shadowBlur = 0
  ctx.arc(cx, cy, effectiveR, 0, Math.PI * 2); ctx.stroke()

  ctx.lineWidth = 2; ctx.shadowBlur = 0
  for (let i = 0; i < numBars; i++) {
    const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2
    let amp, freqVal
    if (isDemo) { freqVal = Math.sin(now / 200 + i * 0.3) * 0.5 + 0.5; amp = freqVal * 60 }
    else if (freqData) { freqVal = freqData[i] / 255; amp = freqVal * maxBarL }
    else { freqVal = 0; amp = 0 }
    if (amp < 0.5) continue
    const colorT = i / numBars
    const ci     = colorT * (LANE_COLORS.length - 1)
    const c0     = ci | 0
    const [r, g, b] = lerpColor(LANE_COLORS[c0], LANE_COLORS[Math.min(c0+1, LANE_COLORS.length-1)], ci - c0)
    const op = 0.5 + freqVal * 0.5
    const cosA = Math.cos(angle), sinA = Math.sin(angle)
    ctx.beginPath()
    ctx.strokeStyle = `rgba(${r},${g},${b},${op})`
    ctx.moveTo(cx + cosA * effectiveR, cy + sinA * effectiveR)
    ctx.lineTo(cx + cosA * (effectiveR + amp), cy + sinA * (effectiveR + amp))
    ctx.stroke()
  }
}

// ─── End Screen ───────────────────────────────────────────────────────────────

function EndScreen({ score, maxCombo, stats, totalNotes, onPlayAgain }) {
  const hitCount = stats.perfect + stats.good
  const accuracy = totalNotes > 0 ? (hitCount / totalNotes * 100) : 0
  const { grade, color: gc } = getGrade(accuracy)

  const statBoxes = [
    { label: 'PERFECT', val: stats.perfect, color: '#FFD60A' },
    { label: 'GOOD',    val: stats.good,    color: '#30D158' },
    { label: 'LATE',    val: stats.late,    color: '#FF9F0A' },
    { label: 'MISS',    val: stats.miss,    color: '#FF3B3B' },
  ]

  const btn = {
    background: 'transparent', fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 13, letterSpacing: 3, padding: '10px 28px', cursor: 'pointer', transition: 'all 0.2s',
  }

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'all',
        background: 'rgba(8,8,14,0.97)',
        border: `1px solid ${gc}`,
        padding: '40px 52px', minWidth: 400, maxWidth: '90vw',
        fontFamily: '"IBM Plex Mono", monospace', color: '#F0F0F8',
        textAlign: 'center',
        boxShadow: `0 0 60px ${gc}22, 0 0 120px rgba(0,0,0,0.9)`,
      }}>
        <div style={{ fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
          BEAT BEATERS
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, color: gc, lineHeight: 1, marginBottom: 6, textShadow: `0 0 30px ${gc}` }}>
          {grade}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, marginBottom: 20 }}>
          {accuracy.toFixed(1)}% ACCURACY
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: 3, marginBottom: 10 }}>
          {score.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: '#FFD60A', letterSpacing: 2, marginBottom: 28 }}>
          ★ {maxCombo}x MAX COMBO
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 32 }}>
          {statBoxes.map(({ label, val, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 6px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <button
            onClick={onPlayAgain}
            style={{ ...btn, border: `1px solid ${gc}`, color: gc }}
            onMouseEnter={e => { e.currentTarget.style.background = `${gc}18` }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            PLAY AGAIN
          </button>
          <Link
            to="/lab/beat-beaters"
            style={{ ...btn, display: 'flex', alignItems: 'center', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          >
            ← LAB
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeatBeaters() {
  const { state: routerState } = useLocation()
  const navigate = useNavigate()

  // Chart data from router state
  const chartData          = routerState?.chartData    ?? null
  const selectedDifficulty = routerState?.difficulty   ?? 'easy'
  const audioFileName      = routerState?.audioFile    ?? null
  const songTitle          = routerState?.songTitle    ?? 'BEAT BEATERS'
  const songArtist         = routerState?.songArtist   ?? ''

  // Redirect to song select if arrived without chart data
  useEffect(() => {
    if (!chartData) navigate('/lab/beat-beaters', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Dynamic notes from chart
  const notes = useMemo(() => {
    if (!chartData || !selectedDifficulty) return []
    const diff = chartData.difficulties?.[selectedDifficulty]
    if (!diff) return []
    return diff.notes.map((n, i) => ({
      ...n, id: i,
      hit: false, missed: false,
      holdActive: false, holdComplete: false, holdPartial: false,
    }))
  }, [chartData, selectedDifficulty])

  // noteSpeed from chart (3.0–8.0 → px/sec)
  const scrollSpeed = chartData?.difficulties?.[selectedDifficulty]?.noteSpeed
    ? chartData.difficulties[selectedDifficulty].noteSpeed * 80
    : DEFAULT_SCROLL_SPEED

  // Stable refs for use inside RAF / event handlers
  const chartNotesRef  = useRef(notes)
  const scrollSpeedRef = useRef(scrollSpeed)
  chartNotesRef.current  = notes       // always current
  scrollSpeedRef.current = scrollSpeed // always current

  const canvasRef  = useRef(null)
  const rafRef     = useRef(null)
  const gameRef    = useRef(initGame())
  const layoutRef  = useRef(null)

  // HUD refs — direct DOM for 60fps updates
  const hudScoreRef = useRef(null)
  const hudComboRef = useRef(null)
  const hudMultRef  = useRef(null)

  // Audio
  const audioCtxRef   = useRef(null)
  const analyserRef   = useRef(null)
  const audioElRef    = useRef(null)
  const freqDataRef   = useRef(null)
  const waveDataRef   = useRef(null)
  const audioReadyRef = useRef(false)

  const pulseRef = useRef({ amt: 0, lastRingPulse: -1000, lastBeatFlash: -1000 })

  const [uiState,    setUiState]    = useState('IDLE')
  const [finalStats, setFinalStats] = useState(null)

  // ── Canvas resize ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function resize() {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth, h = window.innerHeight
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width  = `${w}px`
      canvas.style.height = `${h}px`
      layoutRef.current = computeLayout(w, h)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Game loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current

    function tick(ts) {
      rafRef.current = requestAnimationFrame(tick)
      const game   = gameRef.current
      const layout = layoutRef.current
      if (!canvas || !layout) return

      const ctx = canvas.getContext('2d')
      const dpr = window.devicePixelRatio || 1

      const dt = game.prevTS ? Math.min((ts - game.prevTS) / 1000, 0.05) : 0.016
      game.prevTS = ts

      const { laneWidths, laneX, hitZoneY, w, h } = layout
      const speed = scrollSpeedRef.current

      // Audio data
      const analyser   = analyserRef.current
      const freqData   = freqDataRef.current
      const waveData   = waveDataRef.current
      const audioReady = audioReadyRef.current
      const audioEl    = audioElRef.current
      if (analyser && freqData && waveData && audioReady) {
        analyser.getByteFrequencyData(freqData)
        analyser.getByteTimeDomainData(waveData)
      }

      // Visualizer pulse decay
      const pulse = pulseRef.current
      if (pulse.amt > 0) pulse.amt = Math.max(0, pulse.amt - dt * 150)

      // Shake offset
      let shakeX = 0
      if (game.shakeFrames > 0) {
        shakeX = game.shakeFrames >= 3 ? 4 : 2
        if (game.shakeFrames % 2 === 1) shakeX = -shakeX
        game.shakeFrames--
      }
      ctx.setTransform(dpr, 0, 0, dpr, shakeX * dpr, 0)

      // ── State machine ───────────────────────────────────────────────────────

      if (game.state === 'IDLE') {
        if (game.demoStartTS === 0) game.demoStartTS = ts
        const demoNotes = chartNotesRef.current
        const lastDemo  = demoNotes[demoNotes.length - 1]
        const demoDur   = lastDemo ? lastDemo.time + lastDemo.duration + 3 : 48
        game.currentTime = ((ts - game.demoStartTS) / 1000 + 2) % (demoDur + 5)

      } else if (game.state === 'COUNTDOWN') {
        const elapsed = (ts - game.countdownStartTS) / 1000
        game.currentTime = elapsed - 4
        game.countdown   = Math.min(3, Math.floor(elapsed))
        if (elapsed >= 4) {
          game.state       = 'PLAYING'
          game.startTime   = ts
          game.currentTime = 0
          setUiState('PLAYING')
          if (audioEl && audioReadyRef.current) {
            audioEl.currentTime = 0
            audioEl.play().catch(err => console.warn('[BeatBeaters] play():', err))
          }
        }

      } else if (game.state === 'PLAYING') {
        if (audioEl && audioReadyRef.current && !audioEl.paused && audioEl.currentTime > 0) {
          game.currentTime = audioEl.currentTime
        } else {
          game.currentTime = (ts - game.startTime) / 1000
        }

        // Beat meter drain
        if (game.beatMeterActive) {
          game.beatMeterTimer -= dt * 1000
          game.beatMeter = Math.max(0, (game.beatMeterTimer / BEAT_METER_ACTIVE_DURATION) * 100)
          if (game.beatMeterTimer <= 0) { game.beatMeterActive = false; game.beatMeter = 0 }
        }

        // Hold completion scoring
        for (const [lane, note] of game.activeHolds) {
          if (game.currentTime >= note.time + note.duration) {
            note.holdComplete = true; note.holdActive = false
            game.activeHolds.delete(lane)
            const cm = getComboMultiplier(game.combo)
            const bm = game.beatMeterActive ? BEAT_METER_SCORE_MULTIPLIER : 1
            game.score += SCORE_PERFECT * cm * bm
            game.stats.holdComplete += 1
            game.beatMeter   = Math.min(100, game.beatMeter + BEAT_METER_FILL_PER_PERFECT)
            game.combo       += 1
            game.maxCombo     = Math.max(game.maxCombo, game.combo)
            game.lastHitLane  = lane
            const popColor    = game.beatMeterActive ? '#FFD60A' : LANE_COLORS[lane]
            game.popups.push({ text: 'PERFECT', rx: laneX[lane] + laneWidths[lane] / 2, ry: hitZoneY - 30, alpha: 1, color: popColor })
          }
        }

        // Miss detection
        for (const note of game.notes) {
          if (note.hit || note.missed) continue
          if ((game.currentTime - note.time) * 1000 > TIMING_WINDOW) {
            const wasCombo = game.combo
            note.missed    = true; game.combo = 0; game.stats.miss += 1
            if (wasCombo >= 10) { game.shakeFrames = 4; game.comboBreakFlash = true }
            game.hitFlashes[note.lane] = { opacity: 1, color: '#666666' }
            game.popups.push({ text: 'MISS', rx: laneX[note.lane] + laneWidths[note.lane] / 2, ry: hitZoneY - 30, alpha: 1, color: '#FF3B3B' })
          }
        }

        // Fade hit flashes
        for (let i = 0; i < 9; i++) {
          const flash = game.hitFlashes[i]
          if (!game.pressedLanes.has(i) && !game.activeHolds.has(i) && flash.opacity > 0) {
            flash.opacity = Math.max(0, flash.opacity - dt * 8)
          }
        }

        // Advance popups
        game.popups = game.popups.filter(p => p.alpha > 0)
        for (const p of game.popups) { p.alpha = Math.max(0, p.alpha - dt / 0.6); p.ry -= dt * 50 }

        // HUD DOM updates on change
        if (game.score !== game._prevScore) {
          game._prevScore = game.score
          if (hudScoreRef.current) { hudScoreRef.current.textContent = game.score.toLocaleString(); popEl(hudScoreRef.current) }
        }
        if (game.combo !== game._prevCombo || game.beatMeterActive !== game._prevBeatActive) {
          game._prevCombo = game.combo; game._prevBeatActive = game.beatMeterActive
          if (hudComboRef.current) {
            if (game.combo >= 2) {
              const col = game.beatMeterActive ? '#FFFFFF' : LANE_COLORS[game.lastHitLane]
              hudComboRef.current.textContent = `${game.combo}x`
              hudComboRef.current.style.color   = col
              hudComboRef.current.style.display = 'block'
              popEl(hudComboRef.current)
            } else { hudComboRef.current.style.display = 'none' }
          }
          if (hudMultRef.current) {
            const mult = getComboMultiplier(game.combo)
            if (mult > 1) {
              hudMultRef.current.textContent  = `×${mult}`
              hudMultRef.current.style.color  = mult === 2 ? '#FF9F0A' : mult === 3 ? '#30D158' : '#FF3B3B'
              hudMultRef.current.style.display = 'inline'
              popEl(hudMultRef.current)
            } else { hudMultRef.current.style.display = 'none' }
          }
        }

        // End of song
        const last = game.notes[game.notes.length - 1]
        if (last && game.currentTime > last.time + last.duration + 2.5) {
          game.state = 'FINISHED'
          setUiState('FINISHED')
          setFinalStats({ score: game.score, maxCombo: game.maxCombo, stats: { ...game.stats }, totalNotes: game.notes.length })
          if (audioEl) audioEl.pause()
        }
      }

      // ── Canvas clear ───────────────────────────────────────────────────────
      const bgPad = Math.abs(shakeX) + 1
      ctx.fillStyle = '#0a0a0f'
      ctx.fillRect(-bgPad, 0, w + bgPad * 2, h)

      if (game.comboBreakFlash) {
        ctx.fillStyle = 'rgba(255,59,59,0.08)'
        ctx.fillRect(-bgPad, 0, w + bgPad * 2, h)
        game.comboBreakFlash = false
      }

      // ── Visualizer ─────────────────────────────────────────────────────────
      drawVisualizer(ctx, w, h, analyser, freqData, waveData, audioReady, pulse, ts)

      // ── Lane tints ─────────────────────────────────────────────────────────
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = hexAlpha(LANE_COLORS[i], 0.06)
        ctx.fillRect(laneX[i], 0, laneWidths[i], h)
      }

      // ── Center guide lines ──────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
      for (let i = 0; i < 9; i++) {
        const cx = laneX[i] + laneWidths[i] / 2
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, hitZoneY); ctx.stroke()
      }

      // ── Top accent strips ───────────────────────────────────────────────────
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = hexAlpha(LANE_COLORS[i], 0.7)
        ctx.fillRect(laneX[i], 0, laneWidths[i], 3)
      }

      // ── Beat meter bar ──────────────────────────────────────────────────────
      const barX = laneX[0]
      const barW = laneX[8] + laneWidths[8] - barX
      const barY = hitZoneY - BEAT_BAR_H - BEAT_BAR_GAP

      ctx.shadowBlur = 0
      ctx.fillStyle  = 'rgba(255,255,255,0.1)'
      rrect(ctx, barX, barY, barW, BEAT_BAR_H, 3); ctx.fill()

      const fillW = (game.beatMeter / 100) * barW
      if (fillW > 0.5) {
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0)
        grad.addColorStop(0, '#0A84FF'); grad.addColorStop(0.5, '#BF5AF2'); grad.addColorStop(1, '#FFD60A')
        if (game.beatMeterActive) ctx.globalAlpha = 0.65 + Math.sin(ts / 150) * 0.25
        ctx.save()
        ctx.beginPath(); ctx.rect(barX, barY - 1, fillW, BEAT_BAR_H + 2); ctx.clip()
        ctx.fillStyle = grad; rrect(ctx, barX, barY, barW, BEAT_BAR_H, 3); ctx.fill()
        ctx.restore(); ctx.globalAlpha = 1
      }

      if (game.beatMeter >= 100 && !game.beatMeterActive && Math.floor(ts / 500) % 2 === 0) {
        ctx.font = '11px "IBM Plex Mono", monospace'
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 0
        ctx.fillText('SHIFT', barX + barW, barY - 3)
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }

      // ── Hit zone tiles ──────────────────────────────────────────────────────
      for (let i = 0; i < 9; i++) {
        const flash   = game.hitFlashes[i]
        const pressed = game.pressedLanes.has(i)
        const holdLit = game.activeHolds.has(i)
        const isLit   = pressed || holdLit
        const tileClr = isLit ? LANE_COLORS[i] : (flash.opacity > 0.01 ? flash.color : LANE_COLORS[i])
        const fillOp  = isLit ? 0.8 : 0.35 + flash.opacity * 0.45

        ctx.shadowColor = tileClr; ctx.shadowBlur = isLit ? 24 : flash.opacity * 14
        ctx.fillStyle   = hexAlpha(tileClr, fillOp)
        ctx.strokeStyle = hexAlpha(tileClr, isLit ? 1.0 : Math.max(0.35, flash.opacity * 0.9 + 0.1))
        ctx.lineWidth   = isLit ? 2 : 1
        rrect(ctx, laneX[i] + 2, hitZoneY, laneWidths[i] - 4, HIT_ZONE_H, 4)
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
      }

      // ── Notes ───────────────────────────────────────────────────────────────
      const noteSrc = game.state === 'IDLE' ? chartNotesRef.current : game.notes
      for (const note of noteSrc) {
        const isHit    = game.state !== 'IDLE' && note.hit
        const isMissed = game.state !== 'IDLE' && note.missed
        const headY    = hitZoneY - (note.time - game.currentTime) * speed
        const col      = LANE_COLORS[note.lane]
        const nx       = laneX[note.lane]
        const nw       = laneWidths[note.lane]

        if (note.duration > 0) {
          const tailY = headY - note.duration * speed
          if (headY + NOTE_H < 0 || tailY > h + 20) continue
          if (isMissed) continue
          const rectTop = Math.max(tailY, -10); const rectH = headY - rectTop + NOTE_H
          ctx.shadowColor = col; ctx.shadowBlur = isHit ? 4 : 10
          ctx.fillStyle   = hexAlpha(col, isHit ? 0.25 : 0.6)
          ctx.strokeStyle = isHit ? hexAlpha(col, 0.35) : col; ctx.lineWidth = 1
          rrect(ctx, nx + 5, rectTop, nw - 10, rectH, 6); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
        } else {
          if (headY + NOTE_H < 0 || headY > h + 10) continue
          if (isHit) continue
          ctx.shadowColor = isMissed ? 'transparent' : col; ctx.shadowBlur = isMissed ? 0 : 8
          ctx.fillStyle   = isMissed ? hexAlpha('#555', 0.35) : hexAlpha(col, 0.9)
          ctx.strokeStyle = isMissed ? '#333' : col; ctx.lineWidth = 1
          rrect(ctx, nx + 3, headY, nw - 6, NOTE_H, 4); ctx.fill()
          if (!isMissed) ctx.stroke(); ctx.shadowBlur = 0
        }
      }

      // ── Key labels ──────────────────────────────────────────────────────────
      ctx.font = '11px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = hexAlpha(LANE_COLORS[i], 0.6)
        ctx.fillText(KEY_LABELS[i], laneX[i] + laneWidths[i] / 2, hitZoneY + HIT_ZONE_H + 8)
      }
      ctx.textBaseline = 'alphabetic'

      // ── Hit feedback popups ─────────────────────────────────────────────────
      ctx.textAlign = 'center'
      for (const p of game.popups) {
        ctx.globalAlpha = p.alpha; ctx.shadowColor = p.color; ctx.shadowBlur = 10
        ctx.font = 'bold 13px "IBM Plex Mono", monospace'; ctx.fillStyle = p.color
        ctx.fillText(p.text, p.rx, p.ry); ctx.shadowBlur = 0
      }
      ctx.globalAlpha = 1; ctx.textAlign = 'left'

      // ── Beat meter active border ────────────────────────────────────────────
      if (game.state === 'PLAYING' && game.beatMeterActive) {
        const borderOp = 0.65 + Math.sin(ts / 150) * 0.25
        ctx.strokeStyle = `rgba(255,214,10,${borderOp})`
        ctx.lineWidth = 3; ctx.shadowBlur = 0
        ctx.strokeRect(1.5, 1.5, w - 3, h - 3)
      }

      // ── Countdown overlay ───────────────────────────────────────────────────
      if (game.state === 'COUNTDOWN') {
        const label = ['3', '2', '1', 'GO!'][game.countdown]
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, w, h)
        ctx.font = 'bold 110px "IBM Plex Mono", monospace'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillStyle   = game.countdown < 3 ? '#ffffff' : '#30D158'
        ctx.shadowColor = game.countdown < 3 ? '#00C8FF' : '#30D158'
        ctx.shadowBlur  = 60; ctx.fillText(label, w / 2, h / 2)
        ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Input ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    function getLane(e) { return e.key === ' ' ? 4 : KEY_MAP[e.key.toLowerCase()] }

    function onKeyDown(e) {
      if (e.repeat) return
      if (e.key === BEAT_METER_ACTIVATE_KEY) {
        const game = gameRef.current
        if (game.state === 'PLAYING' && game.beatMeter >= 50 && !game.beatMeterActive) {
          game.beatMeterActive = true; game.beatMeterTimer = BEAT_METER_ACTIVE_DURATION
        }
        return
      }
      const lane = getLane(e)
      if (lane === undefined) return
      if (e.key === ' ') e.preventDefault()
      const game = gameRef.current
      game.pressedLanes.add(lane)
      if (game.state !== 'PLAYING') return

      let best = null, bestDiffMs = Infinity
      for (const note of game.notes) {
        if (note.lane !== lane || note.hit || note.missed) continue
        const diffMs = Math.abs(note.time - game.currentTime) * 1000
        if (diffMs <= TIMING_WINDOW && diffMs < bestDiffMs) { best = note; bestDiffMs = diffMs }
      }
      if (!best) return

      best.hit = true
      if (best.duration > 0) { best.holdActive = true; game.activeHolds.set(lane, best) }

      const offset = game.currentTime - best.time
      let judgment, popColor
      if (bestDiffMs <= TIMING_PERFECT) {
        judgment = 'PERFECT'; popColor = game.beatMeterActive ? '#FFD60A' : LANE_COLORS[lane]
        game.stats.perfect += 1; game.beatMeter = Math.min(100, game.beatMeter + BEAT_METER_FILL_PER_PERFECT)
      } else if (bestDiffMs <= TIMING_GOOD) {
        judgment = 'GOOD'; popColor = game.beatMeterActive ? '#FFD60A' : '#FFFFFF'
        game.stats.good += 1
      } else {
        judgment = offset < 0 ? 'EARLY' : 'LATE'; popColor = game.beatMeterActive ? '#FFD60A' : '#888888'
        game.stats.late += 1
      }

      const baseScore = judgment === 'PERFECT' ? SCORE_PERFECT : judgment === 'GOOD' ? SCORE_GOOD : SCORE_LATE
      const cm = getComboMultiplier(game.combo), bm = game.beatMeterActive ? BEAT_METER_SCORE_MULTIPLIER : 1
      game.score += baseScore * cm * bm
      game.combo += 1; game.maxCombo = Math.max(game.maxCombo, game.combo); game.lastHitLane = lane
      game.hitFlashes[lane] = { opacity: 1.0, color: LANE_COLORS[lane] }
      const layout = layoutRef.current
      if (layout) game.popups.push({ text: judgment, rx: layout.laneX[lane] + layout.laneWidths[lane] / 2, ry: layout.hitZoneY - 30, alpha: 1, color: popColor })
    }

    function onKeyUp(e) {
      const lane = getLane(e)
      if (lane === undefined) return
      const game = gameRef.current
      game.pressedLanes.delete(lane)
      const hold = game.activeHolds.get(lane)
      if (hold) {
        if (!hold.holdComplete) {
          hold.holdPartial = true
          const heldSec = Math.max(0, game.currentTime - hold.time)
          const ratio   = hold.duration > 0 ? Math.min(1, heldSec / hold.duration) : 1
          const cm = getComboMultiplier(game.combo), bm = game.beatMeterActive ? BEAT_METER_SCORE_MULTIPLIER : 1
          game.score += Math.floor(SCORE_GOOD * ratio * cm * bm)
          game.stats.holdPartial += 1
          const wasCombo = game.combo; game.combo = 0
          if (wasCombo >= 10) { game.shakeFrames = 4; game.comboBreakFlash = true }
        }
        hold.holdActive = false; game.activeHolds.delete(lane)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  // ── Audio cleanup ─────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      const el = audioElRef.current
      if (el) { el.pause(); el.removeAttribute('src'); el.load() }
      const actx = audioCtxRef.current
      if (actx && actx.state !== 'closed') actx.close().catch(() => {})
    }
  }, [])

  // ── Audio setup ───────────────────────────────────────────────────────────

  async function setupAudio(audioSrc) {
    const audioEl = audioElRef.current
    if (!audioEl) return
    try {
      if (!audioCtxRef.current) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        audioCtxRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 2048
        analyserRef.current = analyser
        freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)
        waveDataRef.current = new Uint8Array(analyser.frequencyBinCount)
        const source = audioCtx.createMediaElementSource(audioEl)
        source.connect(analyser); analyser.connect(audioCtx.destination)
        audioEl.crossOrigin = 'anonymous'
        audioEl.src  = audioSrc
        audioEl.load()
        audioEl.addEventListener('canplay', () => { audioReadyRef.current = true }, { once: true })
        audioEl.addEventListener('error', () => {
          console.warn(`[BeatBeaters] audio not found (${audioSrc}) — demo pulse mode active`)
          audioReadyRef.current = false
        }, { once: true })
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume()
    } catch (err) { console.warn('[BeatBeaters] Web Audio setup failed:', err) }
  }

  // ── Start / restart ───────────────────────────────────────────────────────

  async function startGame() {
    setFinalStats(null)
    const g = gameRef.current
    // Initialize from chart notes
    g.notes = notes.map(n => ({
      ...n, hit: false, missed: false,
      holdActive: false, holdComplete: false, holdPartial: false,
    }))
    g.score = 0; g.combo = 0; g.maxCombo = 0; g.lastHitLane = 0
    g.beatMeter = 0; g.beatMeterActive = false; g.beatMeterTimer = 0
    g.stats            = { perfect: 0, good: 0, late: 0, miss: 0, holdComplete: 0, holdPartial: 0 }
    g.shakeFrames      = 0; g.comboBreakFlash = false
    g.popups           = []; g.pressedLanes = new Set(); g.activeHolds = new Map()
    g.hitFlashes       = Array.from({ length: 9 }, () => ({ opacity: 0, color: '#fff' }))
    g.state            = 'COUNTDOWN'
    g.countdownStartTS = performance.now()
    g.countdown        = 0
    g._prevScore = -1; g._prevCombo = -1; g._prevBeatActive = false

    if (hudScoreRef.current) hudScoreRef.current.textContent = '0'
    if (hudComboRef.current) hudComboRef.current.style.display = 'none'
    if (hudMultRef.current)  hudMultRef.current.style.display  = 'none'

    setUiState('COUNTDOWN')
    const audioSrc = audioFileName ? `/audio/${audioFileName}` : '/audio/test.mp3'
    await setupAudio(audioSrc)
    const el = audioElRef.current
    if (el && audioReadyRef.current) el.currentTime = 0
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Don't render game if no chart data (redirect fires async, brief blank is fine)
  if (!chartData) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', overflow: 'hidden', fontFamily: '"IBM Plex Mono", monospace' }}>

      <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute', inset: 0 }} />
      <audio  ref={audioElRef} preload="auto" style={{ display: 'none' }} />

      {/* CRT scanlines */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 3px)' }} />
      {/* CRT vignette */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5, background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.6) 100%)' }} />

      {/* HUD top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none',
      }}>
        {/* Song info */}
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, marginBottom: 4 }}>
            BEAT BEATERS
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.1em' }}>
            {songTitle}
          </div>
          {songArtist && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginTop: 2 }}>
              {songArtist}
            </div>
          )}
        </div>

        {/* Score + Combo */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 2 }}>SCORE</span>
            <span ref={hudScoreRef} style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: 2, display: 'inline-block', transformOrigin: 'right center' }}>0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 5, minHeight: 22 }}>
            <span ref={hudMultRef} style={{ display: 'none', fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.12)', padding: '2px 6px', transformOrigin: 'right center' }}>×2</span>
            <span ref={hudComboRef} style={{ display: 'none', fontSize: 18, fontWeight: 700, letterSpacing: 1, transformOrigin: 'right center' }}>0x</span>
          </div>
        </div>
      </div>

      {/* Back to song select */}
      <Link
        to="/lab/beat-beaters"
        style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, color: 'rgba(255,255,255,0.22)', textDecoration: 'none',
          letterSpacing: 2, zIndex: 10, transition: 'color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.22)' }}
      >
        ← SELECT
      </Link>

      {/* IDLE — PRESS START */}
      {uiState === 'IDLE' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none' }}>
          <button
            onClick={startGame}
            style={{
              pointerEvents: 'all', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.6)', color: '#FFFFFF',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 18, letterSpacing: 5, padding: '14px 44px', cursor: 'pointer',
              textShadow: '0 0 12px rgba(255,255,255,0.5)',
              boxShadow: '0 0 24px rgba(255,255,255,0.1), inset 0 0 24px rgba(255,255,255,0.03)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.boxShadow   = '0 0 48px rgba(255,255,255,0.25), inset 0 0 24px rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = 'transparent'
              e.currentTarget.style.boxShadow   = '0 0 24px rgba(255,255,255,0.1), inset 0 0 24px rgba(255,255,255,0.03)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
            }}
          >
            PRESS START
          </button>
          <div style={{ marginTop: 18, color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 3 }}>
            W A S D — SPACE — I J K L
          </div>
        </div>
      )}

      {/* End screen */}
      {finalStats && uiState === 'FINISHED' && (
        <EndScreen
          score={finalStats.score}
          maxCombo={finalStats.maxCombo}
          stats={finalStats.stats}
          totalNotes={finalStats.totalNotes}
          onPlayAgain={startGame}
        />
      )}
    </div>
  )
}

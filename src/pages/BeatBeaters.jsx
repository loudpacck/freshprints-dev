import { useEffect, useRef, useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

// ─── Beat Saber design tokens ──────────────────────────────────────────────────

const BB_BG       = '#05060f'
const BB_PANEL_BG = 'rgba(4, 8, 28, 0.88)'
const BB_BORDER   = 'rgba(0, 140, 255, 0.2)'
const BB_BORDER_A = 'rgba(0, 180, 255, 0.6)'
const BB_PRIMARY  = '#0088FF'
const BB_TEXT_SEC = 'rgba(255,255,255,0.55)'
const BB_BEVEL    = 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)'
const BB_FONT     = "'Rajdhani', sans-serif"

// ─── Constants ────────────────────────────────────────────────────────────────

const LANE_COLORS = [
  '#FF3B3B', '#FF7A1A', '#FFB300', '#FFE600', '#FFFFFF',
  '#0A84FF', '#5E5CE6', '#AF52DE', '#FF2D92',
]
const KEY_LABELS = ['A', 'S', 'D', 'F', 'SPACE', 'J', 'K', 'L', ';']
const KEY_MAP    = { a: 0, s: 1, d: 2, f: 3, j: 5, k: 6, l: 7 }
const LANE_COUNT = 9
const SPACE_LANE = 4

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

const EDGE_PAD = 0

function computeLayout(w, h) {
  // 8 standard lanes + 1 wide (2.5x) Space lane = 10.5 width units.
  // 6 standard lane gaps (2px) + 2 cluster gaps (6px) = 24px of fixed gaps.
  const totalFixedGap = 6 * LANE_GAP + 2 * CLUSTER_GAP
  const unitW = (w - totalFixedGap - EDGE_PAD) / (8 + SPACE_MULT)
  const laneWidths = new Array(LANE_COUNT)
  for (let i = 0; i < LANE_COUNT; i++) laneWidths[i] = i === SPACE_LANE ? unitW * SPACE_MULT : unitW
  const laneX = new Array(LANE_COUNT)
  let x = EDGE_PAD / 2
  for (let i = 0; i < LANE_COUNT; i++) {
    laneX[i] = x
    x += laneWidths[i]
    if (i < LANE_COUNT - 1) {
      // Cluster gaps flank the Space lane: after F (3|4) and after Space (4|5)
      x += (i === 3 || i === 4) ? CLUSTER_GAP : LANE_GAP
    }
  }
  return { laneWidths, laneX, hitZoneY: h * HIT_ZONE_FRAC, w, h }
}

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// Pull a hex toward its most vivid form by boosting saturation around the
// channel mean, clamped to valid [0,255]. Returns an [r,g,b] tuple.
function saturate(hex, f) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const m = (r + g + b) / 3
  const cl = v => Math.max(0, Math.min(255, Math.round(v)))
  return [cl(m + (r - m) * f), cl(m + (g - m) * f), cl(m + (b - m) * f)]
}

// Vivid version of the lane palette — precomputed once.
const VIVID = LANE_COLORS.map(c => saturate(c, 1.5))

// Sample a continuously-looping position p (any real) across VIVID, wrapping
// from the last color back to the first. Returns a float [r,g,b] tuple.
function vividCycle(p) {
  const n = VIVID.length
  const f = (((p % 1) + 1) % 1) * n
  const i = Math.floor(f), fr = f - i
  const a = VIVID[i % n], b = VIVID[(i + 1) % n]
  return [a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr, a[2] + (b[2] - a[2]) * fr]
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
    hitFlashes: Array.from({ length: LANE_COUNT }, () => ({ opacity: 0, color: '#fff' })),
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
//
// Vivid, Windows-Media-Player-style background. Five modes cycle every 22s with
// a 1.8s crossfade. Everything is drawn under additive ('lighter') compositing
// so overlapping layers bloom into bright glow — the signature WMP look. Glow
// comes from drawing each element in 2-3 widening, dimming passes; shadowBlur is
// kept OFF in every hot loop to protect the frame rate.
//
// Hard rules for mode functions: never touch ctx.globalAlpha (the master alpha
// set by drawMode drives the crossfade), and never set shadowBlur.

const MODE_COUNT    = 5
const MODE_DURATION = 22000 // ms per mode
const CROSSFADE     = 1800  // ms crossfade between modes
const MAX_PARTICLES = 250
const FORCE_MODE    = null  // set 0..4 to lock a single mode for debugging

// Per-frame audio snapshot. In demo mode (no live audio) all fields are
// synthesized from sines so the visualizer animates on the IDLE screen.
function computeAudio(analyser, freqData, waveData, audioReady, viz, now, dt) {
  const isDemo = !analyser || !audioReady || !freqData
  const N = 64
  const bands = new Float32Array(N)
  let bass, mid, treble, level

  if (isDemo) {
    let sum = 0
    for (let i = 0; i < N; i++) {
      const v = (Math.sin(now / 280 + i * 0.5) * 0.5 + 0.5) *
                (0.45 + 0.55 * Math.pow(Math.sin(now / 1900 + i * 0.16), 2))
      bands[i] = v; sum += v
    }
    level  = sum / N
    bass   = 0.5  + 0.45 * Math.sin(now / 240)
    mid    = 0.4  + 0.3  * Math.sin(now / 330 + 1)
    treble = 0.35 + 0.3  * Math.sin(now / 180 + 2)
  } else {
    const len    = freqData.length
    const usable = Math.floor(len * 0.75)
    let sum = 0
    for (let i = 0; i < N; i++) {
      const a = Math.floor(i / N * usable), b = Math.floor((i + 1) / N * usable)
      let s = 0, c = 0
      for (let j = a; j <= b && j < len; j++) { s += freqData[j]; c++ }
      bands[i] = c ? (s / c) / 255 : 0; sum += bands[i]
    }
    level = sum / N
    let bs = 0; for (let i = 0;  i < 8;   i++)         bs += freqData[i]; bass   = bs / 8  / 255
    let ms = 0; for (let i = 8;  i < 32;  i++)         ms += freqData[i]; mid    = ms / 24 / 255
    let ttl = 0; for (let i = 64; i < 128 && i < len; i++) ttl += freqData[i]; treble = ttl / 64 / 255
  }

  // Shared beat flag — bass over threshold with a short refractory window.
  let beat = false
  if (bass > 0.55 && now - viz.lastBeat > 170) { beat = true; viz.lastBeat = now }

  // Bass envelope for the color wash: snaps up to bass, decays quickly.
  viz.washAmt = Math.max(bass, viz.washAmt - dt * 2.5)

  return { isDemo, bands, wave: waveData, bass, mid, treble, level, beat }
}

// Advance persistent particle/ring physics every frame (independent of which
// mode is drawing) so nothing accumulates or freezes between mode windows.
function updateViz(viz, dt) {
  const grav = 480
  for (let i = viz.particles.length - 1; i >= 0; i--) {
    const p = viz.particles[i]; p.life += dt
    if (p.life >= p.maxLife) { viz.particles.splice(i, 1); continue }
    p.vy += grav * dt; p.x += p.vx * dt; p.y += p.vy * dt
  }
  for (let i = viz.rings.length - 1; i >= 0; i--) {
    const r = viz.rings[i]; r.life += dt
    if (r.life >= r.dur) viz.rings.splice(i, 1)
  }
}

// A glowing line = wide-faint pass + mid pass + bright core, additive.
function glowLine(ctx, x1, y1, x2, y2, r, g, b, a, width) {
  const ri = r | 0, gi = g | 0, bi = b | 0
  ctx.strokeStyle = `rgba(${ri},${gi},${bi},${a * 0.45})`; ctx.lineWidth = width * 2.6
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.strokeStyle = `rgba(${ri},${gi},${bi},${a * 0.8})`;  ctx.lineWidth = width * 1.4
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
  ctx.strokeStyle = `rgba(${ri},${gi},${bi},${a})`;        ctx.lineWidth = width
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
}

// Mode 0 — RADIAL BARS: frequency bars radiating from a large central ring.
function modeRadial(ctx, A, w, h, viz, now) {
  const cx = w / 2, cy = h * 0.42
  const baseR = Math.min(w * 0.40, h * 0.42) + A.bass * 24
  const M = 110
  // Ring outline glow
  for (let pass = 0; pass < 3; pass++) {
    ctx.lineWidth   = [6, 3, 1.5][pass]
    ctx.strokeStyle = `rgba(120,180,255,${[0.05, 0.08, 0.14][pass]})`
    ctx.beginPath(); ctx.arc(cx, cy, baseR, 0, Math.PI * 2); ctx.stroke()
  }
  for (let i = 0; i < M; i++) {
    const t   = i / M
    // Mirror across the vertical axis so the ring reads symmetric and full.
    const mir = t < 0.5 ? t * 2 : (1 - t) * 2
    const v   = A.bands[Math.min(A.bands.length - 1, Math.floor(mir * (A.bands.length - 1)))]
    const ang = t * Math.PI * 2 - Math.PI / 2
    const len = (0.12 + v * 0.88) * 180
    const [r, g, b] = vividCycle(t + now / 26000)
    const ca = Math.cos(ang), sa = Math.sin(ang)
    glowLine(ctx, cx + ca * baseR, cy + sa * baseR,
                  cx + ca * (baseR + len), cy + sa * (baseR + len),
                  r, g, b, 0.35 + v * 0.6, 2.2)
  }
}

// Mode 1 — SPECTRUM BARS: classic full-width bars with a mirrored reflection.
function modeSpectrum(ctx, A, w, h, viz, now) {
  const N = A.bands.length
  const bw = w / N
  const baseY = h * 0.72
  const maxH  = h * 0.5
  for (let i = 0; i < N; i++) {
    const v  = A.bands[i]
    const bh = (0.06 + v * 0.94) * maxH
    const x  = i * bw
    const [r, g, b] = vividCycle(i / N + now / 30000)
    const ri = r | 0, gi = g | 0, bi = b | 0
    const a  = 0.4 + v * 0.55
    ctx.fillStyle = `rgba(${ri},${gi},${bi},${a * 0.4})`            // glow halo
    ctx.fillRect(x - bw * 0.1, baseY - bh, bw * 1.0, bh)
    ctx.fillStyle = `rgba(${ri},${gi},${bi},${a})`                  // bright core
    ctx.fillRect(x + bw * 0.18, baseY - bh, bw * 0.64, bh)
    ctx.fillStyle = `rgba(${ri},${gi},${bi},${a * 0.18})`          // reflection
    ctx.fillRect(x + bw * 0.18, baseY, bw * 0.64, bh * 0.4)
    ctx.fillStyle = `rgba(255,255,255,${a * 0.5})`                 // cap
    ctx.fillRect(x + bw * 0.18, baseY - bh - 2, bw * 0.64, 2)
  }
}

// Mode 2 — WAVEFORM TUNNEL: concentric waveform-modulated rings, slowly turning.
function modeTunnel(ctx, A, w, h, viz, now) {
  const cx = w / 2, cy = h * 0.45
  const rings = 6
  const maxR  = Math.min(w * 0.45, h * 0.5)
  const wave  = A.wave
  const segs  = 90
  for (let ringi = 0; ringi < rings; ringi++) {
    const baseRad = maxR * (0.2 + 0.8 * ringi / (rings - 1))
    const [r, g, b] = vividCycle(ringi / rings + now / 24000)
    const ri = r | 0, gi = g | 0, bi = b | 0
    const rot = now / 2600 * (ringi % 2 ? 1 : -1)
    const amp = (8 + A.level * 44) * (0.6 + ringi * 0.12)
    for (let pass = 0; pass < 2; pass++) {
      ctx.lineWidth   = pass === 0 ? 5 : 2
      ctx.strokeStyle = pass === 0
        ? `rgba(${ri},${gi},${bi},0.12)`
        : `rgba(${ri},${gi},${bi},${0.5 + A.level * 0.4})`
      ctx.beginPath()
      for (let s = 0; s <= segs; s++) {
        const ang = s / segs * Math.PI * 2 + rot
        let wv
        if (wave) { const idx = Math.floor((s / segs) * wave.length) % wave.length; wv = (wave[idx] - 128) / 128 }
        else      { wv = Math.sin(s * 0.5 + now / 200 + ringi) }
        const rad = baseRad + wv * amp
        const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad
        if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.closePath(); ctx.stroke()
    }
  }
}

// Mode 3 — PARTICLE FOUNTAIN: bursts erupt on each beat, arc up, fall, fade.
function modeFountain(ctx, A, w, h, viz, now) {
  if (A.beat) {
    const count = 26 + Math.floor(A.bass * 34)
    for (let i = 0; i < count && viz.particles.length < MAX_PARTICLES; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.4
      const spd = 240 + Math.random() * 460
      const [r, g, b] = vividCycle(Math.random() + now / 20000)
      viz.particles.push({
        x: w * 0.5 + (Math.random() - 0.5) * w * 0.28, y: h * 0.84,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: 0, maxLife: 1.8 + Math.random() * 1.6,
        size: 2.5 + Math.random() * 5, r, g, b,
      })
    }
  }
  for (const p of viz.particles) {
    const lifeT = 1 - p.life / p.maxLife
    const a  = lifeT * lifeT
    const sz = p.size * (0.55 + lifeT * 0.45)
    const ri = p.r | 0, gi = p.g | 0, bi = p.b | 0
    ctx.fillStyle = `rgba(${ri},${gi},${bi},${a * 0.32})`; ctx.beginPath(); ctx.arc(p.x, p.y, sz * 2.4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = `rgba(${ri},${gi},${bi},${a * 0.9})`;  ctx.beginPath(); ctx.arc(p.x, p.y, sz,       0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = `rgba(255,255,255,${a * 0.7})`;        ctx.beginPath(); ctx.arc(p.x, p.y, sz * 0.4, 0, Math.PI * 2); ctx.fill()
  }
}

// Mode 4 — PLASMA PULSE: a breathing core glow plus rings emitted on each beat.
function modePlasma(ctx, A, w, h, viz, now) {
  const cx = w / 2, cy = h * 0.45
  // Central breathing glow
  const gr = (0.2 + A.level * 0.85) * Math.min(w, h) * 0.5
  const [cr, cg, cb] = vividCycle(now / 16000)
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, gr))
  grad.addColorStop(0, `rgba(${cr | 0},${cg | 0},${cb | 0},${0.18 + A.bass * 0.24})`)
  grad.addColorStop(1, `rgba(${cr | 0},${cg | 0},${cb | 0},0)`)
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, gr), 0, Math.PI * 2); ctx.fill()
  // Emit a ring on the beat
  if (A.beat) {
    const [r, g, b] = vividCycle(now / 12000 + 0.3)
    viz.rings.push({ x: cx, y: cy, maxR: Math.min(w, h) * 0.7, life: 0, dur: 1.3 + Math.random() * 0.5, r, g, b })
  }
  for (const ring of viz.rings) {
    const t   = ring.life / ring.dur
    const rad = ring.maxR * t
    const a   = (1 - t) * 0.55 // higher peak opacity
    const ri = ring.r | 0, gi = ring.g | 0, bi = ring.b | 0
    ctx.lineWidth = 10; ctx.strokeStyle = `rgba(${ri},${gi},${bi},${a * 0.4})`
    ctx.beginPath(); ctx.arc(ring.x, ring.y, rad, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 4;  ctx.strokeStyle = `rgba(${ri},${gi},${bi},${a})`
    ctx.beginPath(); ctx.arc(ring.x, ring.y, rad, 0, Math.PI * 2); ctx.stroke()
  }
}

const MODE_FNS = [modeRadial, modeSpectrum, modeTunnel, modeFountain, modePlasma]

// Draw a single mode at a master alpha (drives the crossfade). The mode itself
// never touches globalAlpha; we set it here and reset after.
function drawMode(ctx, idx, A, w, h, viz, now, alpha) {
  if (alpha <= 0.001) return
  ctx.globalAlpha = alpha
  MODE_FNS[idx](ctx, A, w, h, viz, now)
  ctx.globalAlpha = 1
}

function drawVisualizer(ctx, w, h, analyser, freqData, waveData, audioReady, viz, now, dt) {
  if (!viz.startTS) viz.startTS = now
  const A = computeAudio(analyser, freqData, waveData, audioReady, viz, now, dt)
  updateViz(viz, dt)

  // Mode selection + crossfade window
  const elapsed = now - viz.startTS
  const curIdx  = Math.floor(elapsed / MODE_DURATION) % MODE_COUNT
  const into    = elapsed % MODE_DURATION
  let nextIdx = -1, nextA = 0, curA = 1
  if (into > MODE_DURATION - CROSSFADE) {
    const t = (into - (MODE_DURATION - CROSSFADE)) / CROSSFADE
    curA = 1 - t; nextIdx = (curIdx + 1) % MODE_COUNT; nextA = t
  }

  ctx.globalCompositeOperation = 'lighter'
  ctx.shadowBlur = 0

  // §4 — bass-driven full-screen color wash, hue drifting slowly through palette
  const [wr, wg, wb] = vividCycle(now / 45000)
  const washA = Math.min(0.06, viz.washAmt * 0.06)
  if (washA > 0.002) { ctx.fillStyle = `rgba(${wr | 0},${wg | 0},${wb | 0},${washA})`; ctx.fillRect(0, 0, w, h) }

  if (FORCE_MODE != null) {
    drawMode(ctx, FORCE_MODE, A, w, h, viz, now, 1)
  } else {
    drawMode(ctx, curIdx, A, w, h, viz, now, curA)
    if (nextIdx >= 0) drawMode(ctx, nextIdx, A, w, h, viz, now, nextA)
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

// ─── End Screen ───────────────────────────────────────────────────────────────

function EndScreen({ score, maxCombo, stats, totalNotes, onPlayAgain }) {
  const hitCount = stats.perfect + stats.good
  const accuracy = totalNotes > 0 ? (hitCount / totalNotes * 100) : 0
  const { grade, color: gc } = getGrade(accuracy)

  const statBoxes = [
    { label: 'PERFECT', val: stats.perfect, color: '#FFD60A' },
    { label: 'GOOD',    val: stats.good,    color: '#00E676' },
    { label: 'LATE',    val: stats.late,    color: '#FF9100' },
    { label: 'MISS',    val: stats.miss,    color: '#FF1744' },
  ]

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'all',
        background: BB_PANEL_BG,
        border: `1px solid ${BB_BORDER}`,
        borderLeft: `3px solid ${gc}`,
        padding: '40px 52px', minWidth: 400, maxWidth: 480, width: '90vw',
        fontFamily: BB_FONT, color: '#FFFFFF',
        textAlign: 'center',
        clipPath: BB_BEVEL,
        boxShadow: '0 0 80px rgba(0,0,0,0.9)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.3em', color: BB_TEXT_SEC, marginBottom: 8 }}>
          RANK
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, color: gc, lineHeight: 1, marginBottom: 8, filter: `drop-shadow(0 0 20px ${gc})` }}>
          {grade}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: BB_TEXT_SEC, letterSpacing: '0.1em', marginBottom: 20 }}>
          {accuracy.toFixed(1)}% ACCURACY
        </div>

        <div style={{ borderTop: `1px solid ${BB_BORDER}`, paddingTop: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: BB_TEXT_SEC, letterSpacing: '0.2em', marginBottom: 4 }}>SCORE</div>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '0.05em', fontFamily: '"IBM Plex Mono", monospace' }}>
            {score.toLocaleString()}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFD60A', letterSpacing: '0.1em', marginTop: 8 }}>
            ★ {maxCombo}× MAX COMBO
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 32 }}>
          {statBoxes.map(({ label, val, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${BB_BORDER}`,
              borderLeft: `2px solid ${color}`,
              padding: '10px 12px', textAlign: 'left',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: '"IBM Plex Mono", monospace' }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: BB_TEXT_SEC, letterSpacing: '0.15em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onPlayAgain}
            style={{
              background: BB_PRIMARY, color: '#FFFFFF', border: 'none',
              fontFamily: BB_FONT, fontSize: 16, fontWeight: 700,
              letterSpacing: '0.1em', padding: '12px 28px',
              cursor: 'pointer', transition: 'filter 0.2s',
              clipPath: BB_BEVEL,
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = `drop-shadow(0 0 8px ${BB_PRIMARY})` }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
          >
            PLAY AGAIN
          </button>
          <Link
            to="/lab/beat-beaters"
            style={{
              display: 'flex', alignItems: 'center', textDecoration: 'none',
              border: `1px solid ${BB_BORDER}`, color: BB_TEXT_SEC,
              fontFamily: BB_FONT, fontSize: 16, fontWeight: 600,
              letterSpacing: '0.1em', padding: '12px 24px',
              transition: 'all 0.2s',
              clipPath: BB_BEVEL,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BB_BORDER_A; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BB_BORDER; e.currentTarget.style.color = BB_TEXT_SEC }}
          >
            ← SONG SELECT
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

  const vizRef = useRef({ startTS: 0, particles: [], rings: [], lastBeat: -1e9, washAmt: 0 })

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
        for (let i = 0; i < LANE_COUNT; i++) {
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
      ctx.fillStyle = BB_BG
      ctx.fillRect(-bgPad, 0, w + bgPad * 2, h)

      if (game.comboBreakFlash) {
        ctx.fillStyle = 'rgba(255,59,59,0.08)'
        ctx.fillRect(-bgPad, 0, w + bgPad * 2, h)
        game.comboBreakFlash = false
      }

      // ── Visualizer (additive bloom; restores composite + alpha internally) ──
      drawVisualizer(ctx, w, h, analyser, freqData, waveData, audioReady, vizRef.current, ts, dt)

      // ── Lane tints (very translucent so the visualizer dominates) ──────────
      for (let i = 0; i < LANE_COUNT; i++) {
        ctx.fillStyle = hexAlpha(LANE_COLORS[i], 0.02)
        ctx.fillRect(laneX[i], 0, laneWidths[i], h)
      }

      // ── Center guide lines ──────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
      for (let i = 0; i < LANE_COUNT; i++) {
        const cx = laneX[i] + laneWidths[i] / 2
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, hitZoneY); ctx.stroke()
      }

      // ── Top accent strips ───────────────────────────────────────────────────
      for (let i = 0; i < LANE_COUNT; i++) {
        ctx.fillStyle = hexAlpha(LANE_COLORS[i], 0.7)
        ctx.fillRect(laneX[i], 0, laneWidths[i], 3)
      }

      // ── Beat meter bar ──────────────────────────────────────────────────────
      const barX = laneX[0]
      const barW = laneX[LANE_COUNT - 1] + laneWidths[LANE_COUNT - 1] - barX
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
      for (let i = 0; i < LANE_COUNT; i++) {
        const flash   = game.hitFlashes[i]
        const pressed = game.pressedLanes.has(i)
        const holdLit = game.activeHolds.has(i)
        const isLit   = pressed || holdLit
        const tileClr = isLit ? LANE_COLORS[i] : (flash.opacity > 0.01 ? flash.color : LANE_COLORS[i])
        const fillOp  = isLit ? 0.8 : 0.15 + flash.opacity * 0.45

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
          // Dark backing keeps the note legible over peak visualizer bloom.
          ctx.shadowBlur = 0
          ctx.fillStyle  = 'rgba(0,0,0,0.45)'
          rrect(ctx, nx + 3, rectTop - 1, nw - 6, rectH + 2, 7); ctx.fill()
          ctx.shadowColor = col; ctx.shadowBlur = isHit ? 4 : 10
          ctx.fillStyle   = hexAlpha(col, isHit ? 0.3 : 0.7)
          ctx.strokeStyle = isHit ? hexAlpha(col, 0.4) : col; ctx.lineWidth = 1.5
          rrect(ctx, nx + 5, rectTop, nw - 10, rectH, 6); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
        } else {
          if (headY + NOTE_H < 0 || headY > h + 10) continue
          if (isHit) continue
          // Dark backing + white edge keep the note legible over peak bloom.
          if (!isMissed) {
            ctx.shadowBlur = 0
            ctx.fillStyle  = 'rgba(0,0,0,0.5)'
            rrect(ctx, nx + 1, headY - 1.5, nw - 2, NOTE_H + 3, 5); ctx.fill()
          }
          ctx.shadowColor = isMissed ? 'transparent' : col; ctx.shadowBlur = isMissed ? 0 : 8
          ctx.fillStyle   = isMissed ? hexAlpha('#555', 0.35) : hexAlpha(col, 0.95)
          ctx.strokeStyle = isMissed ? '#333' : '#ffffff'; ctx.lineWidth = isMissed ? 1 : 1.5
          rrect(ctx, nx + 3, headY, nw - 6, NOTE_H, 4); ctx.fill()
          if (!isMissed) ctx.stroke(); ctx.shadowBlur = 0
        }
      }

      // ── Key labels ──────────────────────────────────────────────────────────
      ctx.font = '11px "IBM Plex Mono", monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      for (let i = 0; i < LANE_COUNT; i++) {
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
    function getLane(e) {
      if (e.key === ' ') return SPACE_LANE
      if (e.key === ';') return 8
      return KEY_MAP[e.key.toLowerCase()]
    }

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
      if (e.key === ' ' || e.key === ';') e.preventDefault()
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
    g.hitFlashes       = Array.from({ length: LANE_COUNT }, () => ({ opacity: 0, color: '#fff' }))
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
    <div style={{ position: 'fixed', inset: 0, background: BB_BG, overflow: 'hidden', fontFamily: BB_FONT }}>

      <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute', inset: 0 }} />
      <audio  ref={audioElRef} preload="auto" style={{ display: 'none' }} />

      {/* CRT scanlines */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 3px)' }} />
      {/* CRT vignette */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5, background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.6) 100%)' }} />

      {/* HUD top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none',
      }}>
        {/* Song info — floating text, no bg panel */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: BB_PRIMARY, letterSpacing: '0.3em', marginBottom: 5 }}>
            BEAT BEATERS
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em', lineHeight: 1.2 }}>
            {songTitle}
          </div>
          {songArtist && (
            <div style={{ fontSize: 13, fontWeight: 500, color: BB_TEXT_SEC, marginTop: 3 }}>
              {songArtist}
            </div>
          )}
        </div>

        {/* Score + Combo */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: BB_TEXT_SEC, letterSpacing: '0.15em' }}>SCORE</span>
            <span ref={hudScoreRef} style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em', display: 'inline-block', transformOrigin: 'right center', fontFamily: '"IBM Plex Mono", monospace' }}>0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 6, minHeight: 24 }}>
            <span ref={hudMultRef} style={{ display: 'none', fontSize: 11, fontWeight: 700, padding: '2px 8px', transformOrigin: 'right center', clipPath: BB_BEVEL }}>×2</span>
            <span ref={hudComboRef} style={{ display: 'none', fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', transformOrigin: 'right center' }}>0x</span>
          </div>
        </div>
      </div>

      {/* Back to song select */}
      <Link
        to="/lab/beat-beaters"
        style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          fontSize: 13, fontWeight: 500,
          color: BB_TEXT_SEC, textDecoration: 'none',
          letterSpacing: '0.1em', zIndex: 10, transition: 'color 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF' }}
        onMouseLeave={e => { e.currentTarget.style.color = BB_TEXT_SEC }}
      >
        ← SELECT
      </Link>

      {/* IDLE — PRESS START */}
      {uiState === 'IDLE' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20, pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              fontSize: 56, fontWeight: 700, color: '#FFFFFF',
              letterSpacing: '0.2em', lineHeight: 1,
              textShadow: `0 0 30px ${BB_PRIMARY}, 0 0 80px rgba(0,136,255,0.3)`,
            }}>
              BEAT BEATERS
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, color: BB_TEXT_SEC, marginTop: 12 }}>
              {songTitle}
            </div>
            {songArtist && (
              <div style={{ fontSize: 14, fontWeight: 400, color: BB_TEXT_SEC, opacity: 0.7, marginTop: 4 }}>
                {songArtist}
              </div>
            )}
          </div>
          <button
            onClick={startGame}
            style={{
              pointerEvents: 'all',
              background: BB_PRIMARY, color: '#FFFFFF', border: 'none',
              fontSize: 18, fontWeight: 700, letterSpacing: '0.15em',
              padding: '16px 52px', cursor: 'pointer',
              transition: 'filter 0.2s',
              clipPath: BB_BEVEL,
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = `drop-shadow(0 0 12px ${BB_PRIMARY})` }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
          >
            PRESS START
          </button>
          <div style={{ marginTop: 20, color: BB_TEXT_SEC, fontSize: 13, fontWeight: 500, letterSpacing: '0.15em' }}>
            A S D F — SPACE — J K L ;
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

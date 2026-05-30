import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const LANE_COLORS = [
  '#FF3B3B', '#FF9F0A', '#30D158', '#0A84FF', '#FFFFFF',
  '#BF5AF2', '#FF375F', '#64D2FF', '#FFD60A',
]
const LANE_LABELS = ['W', 'A', 'S', 'D', 'SP', 'I', 'J', 'K', 'L']
const REC_KEY_MAP = { w: 0, a: 1, s: 2, d: 3, i: 5, j: 6, k: 7, l: 8 }

const PX_PER_SEC = 120
const LABEL_COL  = 64
const RULER_H    = 32

let _seq = 0
function makeId() { return `n${++_seq}_${Math.random().toString(36).slice(2, 5)}` }

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
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

function getGridSize(bpm, grid) {
  const beat = 60 / bpm
  return beat / (grid === '1/4' ? 1 : grid === '1/8' ? 2 : 4)
}

function snap(time, bpm, grid) {
  const gs = getGridSize(bpm, grid)
  return gs > 0 ? Math.round(time / gs) * gs : time
}

// ─── Timeline renderer (module-level, pure canvas) ────────────────────────────

function drawTimeline(canvas, notes, scroll, currentTime, duration, selIds) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const W   = canvas.width / dpr
  const H   = canvas.height / dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const laneH = (H - RULER_H) / 9

  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, W, H)

  // Lane rows
  for (let i = 0; i < 9; i++) {
    const ry = RULER_H + i * laneH
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.025)'
      ctx.fillRect(LABEL_COL, ry, W - LABEL_COL, laneH)
    }
    ctx.fillStyle = hexA(LANE_COLORS[i], 0.4)
    ctx.fillRect(LABEL_COL, ry, 3, laneH)
    ctx.fillStyle    = hexA(LANE_COLORS[i], 0.7)
    ctx.font         = '11px "IBM Plex Mono", monospace'
    ctx.textAlign    = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(LANE_LABELS[i], LABEL_COL - 8, ry + laneH / 2)
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'

  // Label column separator
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth   = 1
  ctx.beginPath(); ctx.moveTo(LABEL_COL, 0); ctx.lineTo(LABEL_COL, H); ctx.stroke()

  // Ruler background
  ctx.fillStyle = 'rgba(8,8,14,0.95)'
  ctx.fillRect(LABEL_COL, 0, W - LABEL_COL, RULER_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth   = 1
  ctx.beginPath(); ctx.moveTo(LABEL_COL, RULER_H); ctx.lineTo(W, RULER_H); ctx.stroke()

  if (duration > 0) {
    const s0 = Math.max(0, Math.floor(scroll / PX_PER_SEC) - 1)
    const s1 = Math.ceil((scroll + W - LABEL_COL) / PX_PER_SEC) + 2

    for (let s = s0; s <= Math.min(s1, Math.ceil(duration) + 1); s++) {
      const x      = LABEL_COL + s * PX_PER_SEC - scroll
      const isFive = s % 5 === 0

      ctx.strokeStyle = isFive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
      ctx.lineWidth   = 1
      ctx.beginPath()
      ctx.moveTo(x, RULER_H - (isFive ? 14 : 7))
      ctx.lineTo(x, RULER_H)
      ctx.stroke()

      if (isFive) {
        ctx.fillStyle    = 'rgba(255,255,255,0.45)'
        ctx.font         = '9px "IBM Plex Mono", monospace'
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(fmt(s), x, 3)
        // Major grid line through lanes
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth   = 1
        ctx.beginPath(); ctx.moveTo(x, RULER_H); ctx.lineTo(x, H); ctx.stroke()
      } else if (s % 1 === 0) {
        ctx.fillStyle    = 'rgba(255,255,255,0.2)'
        ctx.font         = '8px "IBM Plex Mono", monospace'
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(fmt(s), x, 4)
      }
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'

    // Notes
    for (const n of notes) {
      const nx  = LABEL_COL + n.time * PX_PER_SEC - scroll
      const nW  = n.type === 'hold' ? Math.max(8, n.duration * PX_PER_SEC) : 8
      const ny  = RULER_H + n.lane * laneH + (laneH - 12) / 2
      const col = LANE_COLORS[n.lane]
      const sel = selIds.has(n.id)

      if (nx + nW < LABEL_COL || nx > W) continue

      ctx.shadowBlur  = sel ? 6 : 0
      ctx.shadowColor = col

      if (n.type === 'hold') {
        ctx.fillStyle   = hexA(col, sel ? 0.75 : 0.5)
        ctx.strokeStyle = sel ? '#ffffff' : col
        ctx.lineWidth   = sel ? 1.5 : 1
      } else {
        ctx.fillStyle   = hexA(col, sel ? 1.0 : 0.8)
        ctx.strokeStyle = sel ? '#ffffff' : hexA(col, 0.5)
        ctx.lineWidth   = sel ? 1.5 : 1
      }

      rrect(ctx, nx, ny, nW, 12, 3)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Playhead
    const px = LABEL_COL + currentTime * PX_PER_SEC - scroll
    if (px >= LABEL_COL && px <= W) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth   = 1.5
      ctx.shadowColor = 'rgba(255,255,255,0.3)'
      ctx.shadowBlur  = 4
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke()
      ctx.shadowBlur  = 0
    }
  } else {
    ctx.fillStyle    = 'rgba(255,255,255,0.15)'
    ctx.font         = '13px "IBM Plex Mono", monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('NO AUDIO LOADED', W / 2, H / 2)
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BeatBeatersEditor() {

  // Form state
  const [audioLoaded,  setAudioLoaded]  = useState(false)
  const [filename,     setFilename]     = useState('')
  const [title,        setTitle]        = useState('')
  const [artist,       setArtist]       = useState('')
  const [bpm,          setBpm]          = useState(120)
  const [difficulty,   setDifficulty]   = useState('easy')
  const [noteSpeed,    setNoteSpeed]    = useState(4.0)
  const [quantizeGrid, setQuantizeGrid] = useState('1/4')

  // Playback/record state
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // UI state
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [noteCount,   setNoteCount]   = useState(0)
  const [exportMsg,   setExportMsg]   = useState('')
  const [contextMenu, setContextMenu] = useState(null) // { x, y, noteId }

  // DOM refs
  const canvasRef     = useRef(null)
  const canvasAreaRef = useRef(null)
  const audioRef      = useRef(null)
  const fileInputRef  = useRef(null)
  const timeDispRef   = useRef(null)
  const seekBarRef    = useRef(null)

  // Mutable game state refs (used inside RAF / event handlers)
  const notesRef        = useRef([])
  const scrollRef       = useRef(0)
  const dirtyRef        = useRef(true)
  const seekingRef      = useRef(false)
  const pendingHoldsRef = useRef(new Map())
  const dragRef         = useRef(null)
  const rafRef          = useRef(null)

  // Mirrors of React state for use inside effects with [] deps
  const isPlayingRef   = useRef(false)
  const isRecordingRef = useRef(false)
  const selectedIdsRef = useRef(new Set())
  const bpmRef         = useRef(120)
  const quantizeRef    = useRef('1/4')

  // ── Sync mirrors ─────────────────────────────────────────────────────────────
  useEffect(() => { isPlayingRef.current   = isPlaying   }, [isPlaying])
  useEffect(() => { isRecordingRef.current = isRecording }, [isRecording])
  useEffect(() => { selectedIdsRef.current = selectedIds }, [selectedIds])
  useEffect(() => { bpmRef.current         = bpm         }, [bpm])
  useEffect(() => { quantizeRef.current    = quantizeGrid }, [quantizeGrid])

  // ── Canvas resize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const area = canvasAreaRef.current
    const canvas = canvasRef.current
    if (!area || !canvas) return
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = Math.round(area.clientWidth  * dpr)
      canvas.height = Math.round(area.clientHeight * dpr)
      canvas.style.width  = `${area.clientWidth}px`
      canvas.style.height = `${area.clientHeight}px`
      dirtyRef.current = true
    })
    ro.observe(area)
    return () => ro.disconnect()
  }, [])

  // ── Audio events ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    function onEnded() {
      setIsPlaying(false)
      isPlayingRef.current = false
      if (isRecordingRef.current) {
        setIsRecording(false)
        isRecordingRef.current = false
        scrollRef.current = 0
      }
      dirtyRef.current = true
    }
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [])

  // ── RAF loop ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let prevTime = -1
    function tick() {
      rafRef.current = requestAnimationFrame(tick)
      const audio  = audioRef.current
      const canvas = canvasRef.current
      if (!audio || !canvas) return

      const ct  = audio.currentTime
      const dur = isFinite(audio.duration) ? audio.duration : 0

      // Time display
      if (timeDispRef.current) {
        timeDispRef.current.textContent = `${fmt(ct)} / ${fmt(dur)}`
      }

      // Seek bar sync
      if (seekBarRef.current && !seekingRef.current && dur > 0) {
        seekBarRef.current.value = ct / dur
      }

      // Auto-scroll when playing
      if (isPlayingRef.current && dur > 0) {
        const dpr        = window.devicePixelRatio || 1
        const W          = canvas.width / dpr
        const timelineW  = W - LABEL_COL
        const phScreenX  = ct * PX_PER_SEC - scrollRef.current
        if (phScreenX > timelineW * 0.72) {
          scrollRef.current = Math.max(0, ct * PX_PER_SEC - timelineW * 0.3)
          dirtyRef.current  = true
        } else if (phScreenX < 0) {
          scrollRef.current = Math.max(0, ct * PX_PER_SEC - 40)
          dirtyRef.current  = true
        }
      }

      if (ct !== prevTime) { prevTime = ct; dirtyRef.current = true }

      if (dirtyRef.current) {
        drawTimeline(canvas, notesRef.current, scrollRef.current, ct, dur, selectedIdsRef.current)
        dirtyRef.current = false
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  // ── Wheel scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function onWheel(e) {
      e.preventDefault()
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      scrollRef.current = Math.max(0, scrollRef.current + delta)
      dirtyRef.current  = true
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  // ── Keyboard: recording + delete ──────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e) {
      if (isRecordingRef.current) {
        if (e.repeat) return
        const lane = e.key === ' ' ? 4 : REC_KEY_MAP[e.key.toLowerCase()]
        if (lane === undefined) return
        if (e.key === ' ') e.preventDefault()
        const audio = audioRef.current
        const time  = audio ? audio.currentTime : 0
        pendingHoldsRef.current.set(lane, { id: makeId(), lane, time, duration: 0, type: 'tap' })
        return
      }

      // Normal mode — ignore if typing in a form field
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const ids = selectedIdsRef.current
        if (ids.size > 0) {
          notesRef.current = notesRef.current.filter(n => !ids.has(n.id))
          const ns = new Set()
          selectedIdsRef.current = ns
          setSelectedIds(ns)
          setNoteCount(notesRef.current.length)
          dirtyRef.current = true
        }
      }
    }

    function onKeyUp(e) {
      if (!isRecordingRef.current) return
      const lane = e.key === ' ' ? 4 : REC_KEY_MAP[e.key.toLowerCase()]
      if (lane === undefined) return
      const pending = pendingHoldsRef.current.get(lane)
      if (!pending) return
      const audio    = audioRef.current
      const held     = audio ? audio.currentTime - pending.time : 0
      if (held > 0.12) { pending.type = 'hold'; pending.duration = held }
      notesRef.current.push(pending)
      pendingHoldsRef.current.delete(lane)
      setNoteCount(notesRef.current.length)
      dirtyRef.current = true
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])

  // ── Outside click closes context menu ────────────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return
    function dismiss() { setContextMenu(null) }
    setTimeout(() => window.addEventListener('click', dismiss), 0)
    return () => window.removeEventListener('click', dismiss)
  }, [contextMenu])

  // ── Transport ──────────────────────────────────────────────────────────────────

  function handlePlay() {
    const audio = audioRef.current
    if (!audio || !audioLoaded) return
    audio.play().catch(() => {})
    setIsPlaying(true)
    isPlayingRef.current = true
  }

  function handlePause() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setIsPlaying(false)
    isPlayingRef.current = false
    dirtyRef.current = true
  }

  function handleStop() {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
    isPlayingRef.current = false
    if (isRecording) {
      setIsRecording(false)
      isRecordingRef.current = false
    }
    dirtyRef.current = true
  }

  // ── Recording ────────────────────────────────────────────────────────────────

  function toggleRecording() {
    if (!audioLoaded) return
    const next = !isRecording
    if (next) {
      // Start recording — play audio
      const audio = audioRef.current
      if (audio) {
        audio.play().catch(() => {})
        setIsPlaying(true)
        isPlayingRef.current = true
      }
    } else {
      // Stop recording
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        setIsPlaying(false)
        isPlayingRef.current = false
      }
      scrollRef.current = 0
      dirtyRef.current  = true
    }
    setIsRecording(next)
    isRecordingRef.current = next
  }

  // ── File upload ───────────────────────────────────────────────────────────────

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const audio = audioRef.current
    if (!audio) return
    const url = URL.createObjectURL(file)
    audio.src = url
    audio.load()
    setFilename(file.name)
    setAudioLoaded(true)
    dirtyRef.current = true
  }

  // ── Edit tools ────────────────────────────────────────────────────────────────

  function doQuantize(idsToSnap) {
    notesRef.current = notesRef.current.map(n => {
      if (idsToSnap === 'all' || idsToSnap.has(n.id)) {
        return { ...n, time: Math.max(0, snap(n.time, bpmRef.current, quantizeRef.current)) }
      }
      return n
    })
    dirtyRef.current = true
  }

  function handleDeleteSelected() {
    const ids = selectedIdsRef.current
    if (ids.size === 0) return
    notesRef.current = notesRef.current.filter(n => !ids.has(n.id))
    selectedIdsRef.current = new Set()
    setSelectedIds(new Set())
    setNoteCount(notesRef.current.length)
    dirtyRef.current = true
  }

  function handleClearAll() {
    if (!window.confirm('Delete all notes? This cannot be undone.')) return
    notesRef.current = []
    selectedIdsRef.current = new Set()
    setSelectedIds(new Set())
    setNoteCount(0)
    dirtyRef.current = true
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  function exportChart() {
    const safeTitle  = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'untitled'
    const safeArtist = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'unknown'
    const notes      = [...notesRef.current]
      .sort((a, b) => a.time - b.time)
      .map(n => ({
        lane:     n.lane,
        time:     parseFloat(n.time.toFixed(3)),
        duration: parseFloat(n.duration.toFixed(3)),
        type:     n.type,
      }))

    const chart = {
      title:     title || 'Untitled',
      artist:    artist || 'Unknown',
      bpm,
      audioFile: filename || `${safeArtist}-${safeTitle}.mp3`,
      difficulties: {
        [difficulty]: { noteSpeed, notes },
      },
    }

    const json  = JSON.stringify(chart, null, 2)
    const blob  = new Blob([json], { type: 'application/json' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href      = url
    a.download  = `${safeArtist}-${safeTitle}-${difficulty}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMsg('SAVED — copy audio to public/audio/')
    setTimeout(() => setExportMsg(''), 5000)
  }

  // ── Canvas helpers ────────────────────────────────────────────────────────────

  function getLaneH() {
    const canvas = canvasRef.current
    if (!canvas) return 30
    const dpr = window.devicePixelRatio || 1
    return (canvas.height / dpr - RULER_H) / 9
  }

  function findNoteAt(cx, cy) {
    const scroll = scrollRef.current
    const laneH  = getLaneH()
    const notes  = notesRef.current
    for (let i = notes.length - 1; i >= 0; i--) {
      const n  = notes[i]
      const nx = LABEL_COL + n.time * PX_PER_SEC - scroll
      const nw = n.type === 'hold' ? Math.max(8, n.duration * PX_PER_SEC) : 8
      const ny = RULER_H + n.lane * laneH + (laneH - 12) / 2
      if (cx >= nx && cx <= nx + nw && cy >= ny && cy <= ny + 12) return n
    }
    return null
  }

  // ── Canvas mouse events ───────────────────────────────────────────────────────

  function canvasCoords(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onCanvasContextMenu(e) {
    e.preventDefault()
    const { x, y } = canvasCoords(e)
    const hit = findNoteAt(x, y)
    if (hit) setContextMenu({ x: e.clientX, y: e.clientY, noteId: hit.id })
  }

  function onCanvasMousedown(e) {
    if (e.button !== 0) return
    const { x, y } = canvasCoords(e)

    // Ruler click → seek
    if (y < RULER_H) {
      const audio = audioRef.current
      if (audio && isFinite(audio.duration)) {
        audio.currentTime = Math.max(0, Math.min(
          (x - LABEL_COL + scrollRef.current) / PX_PER_SEC,
          audio.duration,
        ))
        dirtyRef.current = true
      }
      return
    }

    const hit = findNoteAt(x, y)
    if (hit) {
      const ns = e.shiftKey
        ? new Set(selectedIdsRef.current[Symbol.iterator]
            ? (selectedIdsRef.current.has(hit.id)
              ? [...selectedIdsRef.current].filter(id => id !== hit.id)
              : [...selectedIdsRef.current, hit.id])
            : [hit.id])
        : new Set([hit.id])
      selectedIdsRef.current = ns
      setSelectedIds(ns)
      dragRef.current = { type: 'move', noteId: hit.id, startX: x, origTime: hit.time }
    } else {
      // Click empty → deselect, start create-drag
      const lane = Math.floor((y - RULER_H) / getLaneH())
      if (lane >= 0 && lane < 9) {
        const t = snap(Math.max(0, (x - LABEL_COL + scrollRef.current) / PX_PER_SEC), bpmRef.current, quantizeRef.current)
        dragRef.current = { type: 'create', lane, startX: x, startTime: t, created: null }
      }
      selectedIdsRef.current = new Set()
      setSelectedIds(new Set())
    }
    dirtyRef.current = true
  }

  function onCanvasMousemove(e) {
    const drag = dragRef.current
    if (!drag) return
    const { x } = canvasCoords(e)
    const dx = x - drag.startX

    if (drag.type === 'move') {
      const note = notesRef.current.find(n => n.id === drag.noteId)
      if (note) {
        note.time = Math.max(0, snap(drag.origTime + dx / PX_PER_SEC, bpmRef.current, quantizeRef.current))
        dirtyRef.current = true
      }
    } else if (drag.type === 'create' && Math.abs(dx) > 4) {
      if (!drag.created) {
        const n = { id: makeId(), lane: drag.lane, time: drag.startTime, duration: 0, type: 'tap' }
        notesRef.current.push(n)
        drag.created = n
      }
      if (dx > 0) {
        const dur = Math.max(0, snap(dx / PX_PER_SEC, bpmRef.current, quantizeRef.current))
        drag.created.duration = dur
        drag.created.type     = dur >= 0.1 ? 'hold' : 'tap'
        dirtyRef.current      = true
      }
    }
  }

  function onCanvasMouseup() {
    const drag = dragRef.current
    if (!drag) return
    if (drag.type === 'create') {
      if (!drag.created) {
        // Simple click → tap note
        notesRef.current.push({
          id: makeId(), lane: drag.lane,
          time: Math.max(0, drag.startTime), duration: 0, type: 'tap',
        })
      } else if (drag.created.duration < 0.05) {
        drag.created.type = 'tap'; drag.created.duration = 0
      }
      setNoteCount(notesRef.current.length)
    } else if (drag.type === 'move') {
      notesRef.current.sort((a, b) => a.time - b.time)
    }
    dragRef.current  = null
    dirtyRef.current = true
  }

  // ── Shared styles ─────────────────────────────────────────────────────────────

  const inputSt = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#F0F0F8',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 12, padding: '5px 8px',
    width: '100%', boxSizing: 'border-box',
    outline: 'none',
  }

  const btnSt = (active, accent) => ({
    background: active ? (accent ? hexA(accent, 0.2) : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? (accent || 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.12)'}`,
    color: active ? (accent || '#FFFFFF') : 'rgba(255,255,255,0.6)',
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 11, padding: '5px 10px',
    cursor: 'pointer', letterSpacing: 1,
    transition: 'all 0.15s',
  })

  const secHdr = {
    fontSize: 9, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 3, marginBottom: 8, marginTop: 16,
    paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.07)',
  }

  const lbl = { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginBottom: 3, display: 'block' }

  const ctxNote = contextMenu ? notesRef.current.find(n => n.id === contextMenu.noteId) : null

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0f', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"IBM Plex Mono", monospace', color: '#F0F0F8',
    }}>
      <style>{`
        @keyframes rec-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,59,59,0.5) }
          50%      { box-shadow: 0 0 0 8px rgba(255,59,59,0) }
        }
        .rec-on { animation: rec-pulse 1s ease-in-out infinite; }
        .editor-btn:hover { filter: brightness(1.2); }
        input[type=range] { cursor: pointer; accent-color: #00C8FF; }
      `}</style>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
      {/* Hidden file input */}
      <input
        ref={fileInputRef} type="file" accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Top bar */}
      <div style={{
        height: 48, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(8,8,14,0.9)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.6)' }}>
          BEAT BEATERS — CHART EDITOR
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { to: '/lab/beat-beaters', label: '← BACK TO GAME' },
            { to: '/lab',              label: '← LAB' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
              letterSpacing: 2, transition: 'color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{
          width: 280, flexShrink: 0, overflowY: 'auto',
          padding: '12px 16px 20px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(8,8,14,0.6)',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* ── AUDIO FILE ────────────────────────── */}
          <div style={secHdr}>AUDIO FILE</div>

          <button
            className="editor-btn"
            style={{
              ...btnSt(false), width: '100%', padding: '8px', marginBottom: 8,
              border: '1px solid rgba(0,200,255,0.4)', color: '#00C8FF',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            UPLOAD AUDIO
          </button>

          {filename
            ? <div style={{ fontSize: 10, color: '#30D158', letterSpacing: 1, marginBottom: 8, wordBreak: 'break-all' }}>
                ✓ {filename}
              </div>
            : <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
                No file selected
              </div>
          }

          {/* ── METADATA ──────────────────────────── */}
          <div style={secHdr}>SONG METADATA</div>

          <div style={{ marginBottom: 8 }}>
            <span style={lbl}>TITLE</span>
            <input style={inputSt} value={title} onChange={e => setTitle(e.target.value)} placeholder="Song title" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={lbl}>ARTIST</span>
            <input style={inputSt} value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={lbl}>BPM</span>
              <input style={inputSt} type="number" min={40} max={300} value={bpm}
                onChange={e => setBpm(parseInt(e.target.value) || 120)} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={lbl}>SPEED</span>
              <input style={inputSt} type="number" min={3.0} max={8.0} step={0.5} value={noteSpeed}
                onChange={e => setNoteSpeed(parseFloat(e.target.value) || 4.0)} />
            </div>
          </div>
          <div>
            <span style={lbl}>DIFFICULTY</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d} className="editor-btn"
                  style={btnSt(difficulty === d, '#00C8FF')}
                  onClick={() => setDifficulty(d)}>
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* ── TRANSPORT ─────────────────────────── */}
          <div style={secHdr}>TRANSPORT</div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button className="editor-btn"
              style={{ ...btnSt(isPlaying, '#30D158'), flex: 1, opacity: audioLoaded ? 1 : 0.4 }}
              disabled={!audioLoaded}
              onClick={isPlaying ? handlePause : handlePlay}>
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>
            <button className="editor-btn"
              style={{ ...btnSt(false), opacity: audioLoaded ? 1 : 0.4 }}
              disabled={!audioLoaded}
              onClick={handleStop}>
              ■ STOP
            </button>
          </div>

          <div ref={timeDispRef} style={{
            fontSize: 13, color: '#00C8FF', letterSpacing: 2,
            textAlign: 'center', marginBottom: 6,
          }}>
            0:00 / 0:00
          </div>

          <input
            ref={seekBarRef}
            type="range" min={0} max={1} step={0.001} defaultValue={0}
            style={{ width: '100%', marginBottom: 4 }}
            disabled={!audioLoaded}
            onPointerDown={() => { seekingRef.current = true }}
            onPointerUp={e => {
              seekingRef.current = false
              const audio = audioRef.current
              if (audio && isFinite(audio.duration)) {
                audio.currentTime = parseFloat(e.target.value) * audio.duration
                dirtyRef.current = true
              }
            }}
            onChange={e => {
              const audio = audioRef.current
              if (audio && isFinite(audio.duration)) {
                audio.currentTime = parseFloat(e.target.value) * audio.duration
                dirtyRef.current = true
              }
            }}
          />

          {/* ── RECORD ────────────────────────────── */}
          <div style={secHdr}>RECORD</div>

          <button
            className={`editor-btn${isRecording ? ' rec-on' : ''}`}
            style={{
              width: '100%', padding: '10px',
              background:   isRecording ? '#FF3B3B' : 'rgba(255,59,59,0.08)',
              border:       `1px solid ${isRecording ? '#FF3B3B' : 'rgba(255,59,59,0.3)'}`,
              color:        isRecording ? '#FFFFFF' : 'rgba(255,59,59,0.7)',
              fontFamily:   '"IBM Plex Mono", monospace',
              fontSize:     13, letterSpacing: 3,
              cursor:       audioLoaded ? 'pointer' : 'not-allowed',
              opacity:      audioLoaded ? 1 : 0.4,
              transition:   'all 0.2s',
            }}
            disabled={!audioLoaded}
            onClick={toggleRecording}
          >
            {isRecording ? '● RECORDING' : '○ REC'}
          </button>
          {isRecording && (
            <div style={{ fontSize: 9, color: '#FF9F0A', letterSpacing: 2, textAlign: 'center', marginTop: 6 }}>
              PRESS W A S D SPACE I J K L
            </div>
          )}

          {/* ── EDIT TOOLS ───────────────────────── */}
          <div style={secHdr}>EDIT TOOLS</div>

          <div style={{ marginBottom: 8 }}>
            <span style={lbl}>QUANTIZE GRID</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1/4', '1/8', '1/16'].map(g => (
                <button key={g} className="editor-btn"
                  style={btnSt(quantizeGrid === g, '#00C8FF')}
                  onClick={() => setQuantizeGrid(g)}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button className="editor-btn" style={{ ...btnSt(false), textAlign: 'left' }}
              onClick={() => doQuantize('all')}>
              QUANTIZE ALL
            </button>
            <button className="editor-btn" style={{ ...btnSt(false), textAlign: 'left' }}
              onClick={() => doQuantize(selectedIdsRef.current)}>
              QUANTIZE SELECTED
            </button>
            <button className="editor-btn" style={{ ...btnSt(false), textAlign: 'left' }}
              onClick={handleDeleteSelected}>
              DELETE SELECTED
            </button>
            <button className="editor-btn"
              style={{ ...btnSt(false, '#FF3B3B'), textAlign: 'left', borderColor: 'rgba(255,59,59,0.3)', color: 'rgba(255,59,59,0.7)' }}
              onClick={handleClearAll}>
              CLEAR ALL
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#00C8FF', letterSpacing: 2, marginTop: 10 }}>
            {noteCount} NOTE{noteCount !== 1 ? 'S' : ''}
          </div>

          {/* ── EXPORT ───────────────────────────── */}
          <div style={secHdr}>EXPORT</div>

          <button className="editor-btn"
            style={{
              width: '100%', padding: '9px',
              background: 'rgba(255,180,0,0.1)',
              border: '1px solid rgba(255,180,0,0.4)',
              color: '#FFD60A',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 12, letterSpacing: 2, cursor: 'pointer',
            }}
            onClick={exportChart}>
            EXPORT JSON
          </button>

          {exportMsg && (
            <div style={{ fontSize: 10, color: '#30D158', marginTop: 6, letterSpacing: 1 }}>
              {exportMsg}
            </div>
          )}

          {/* ── HELP ─────────────────────────────── */}
          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
              REC to record · DEL to delete<br />
              SCROLL to navigate · drag note to move<br />
              right-click note for options
            </div>
          </div>

        </div>{/* end sidebar */}

        {/* Timeline canvas area */}
        <div
          ref={canvasAreaRef}
          style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'crosshair' }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block' }}
            onMouseDown={onCanvasMousedown}
            onMouseMove={onCanvasMousemove}
            onMouseUp={onCanvasMouseup}
            onMouseLeave={onCanvasMouseup}
            onContextMenu={onCanvasContextMenu}
          />
        </div>

      </div>{/* end body */}

      {/* Context menu */}
      {contextMenu && ctxNote && (
        <div
          style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y,
            background: '#14141e', border: '1px solid rgba(255,255,255,0.15)',
            zIndex: 200, minWidth: 190, padding: '6px 0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
        >
          <div style={{ padding: '4px 12px 6px', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 2 }}>
            MOVE TO LANE
          </div>
          <div style={{ padding: '0 10px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {LANE_LABELS.map((lbl, i) => (
              <button key={i} style={{
                background: hexA(LANE_COLORS[i], 0.18),
                border: `1px solid ${LANE_COLORS[i]}`,
                color: LANE_COLORS[i],
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10, padding: '3px 7px', cursor: 'pointer',
              }} onClick={() => {
                const n = notesRef.current.find(x => x.id === contextMenu.noteId)
                if (n) { n.lane = i; dirtyRef.current = true }
                setContextMenu(null)
              }}>{lbl}</button>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0 0 4px' }} />
          {[
            {
              label: `Convert to ${ctxNote.type === 'hold' ? 'TAP' : 'HOLD'}`,
              color: '#F0F0F8',
              action: () => {
                const n = notesRef.current.find(x => x.id === contextMenu.noteId)
                if (n) {
                  n.type     = n.type === 'hold' ? 'tap' : 'hold'
                  n.duration = n.type === 'tap' ? 0 : (n.duration || 0.5)
                  dirtyRef.current = true
                }
                setContextMenu(null)
              },
            },
            {
              label: 'Delete',
              color: '#FF3B3B',
              action: () => {
                notesRef.current = notesRef.current.filter(n => n.id !== contextMenu.noteId)
                setNoteCount(notesRef.current.length)
                dirtyRef.current = true
                setContextMenu(null)
              },
            },
          ].map(({ label, color, action }) => (
            <button key={label} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '7px 14px', background: 'none', border: 'none',
              color, fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 11, cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            onClick={action}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* CRT scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)',
      }} />
      {/* CRT vignette */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5,
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)',
      }} />

    </div>
  )
}

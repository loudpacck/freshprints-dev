import { useEffect, useRef, useState } from 'react'

// Blobert's body + eyes. The EYES are the identity constant — the same white
// sclera, dark pupil, and specular highlight in every skin. Only the body layer
// (fill, rim, shape, motion) changes per theme via the `skin` prop.
//
// state: 'idle' | 'thinking' | 'napping'
export default function BlobertBlob({ skin, reduced, state = 'idle', size = 72 }) {
  const wrapRef = useRef(null)
  const [pupil, setPupil] = useState({ x: 0, y: 0 })
  const [blinking, setBlinking] = useState(false)
  const napping = state === 'napping'
  const thinking = state === 'thinking'
  const b = skin.body

  // --- Pupil tracking: cursor on fine pointers, scroll drift on touch --------
  useEffect(() => {
    if (reduced || napping) { setPupil({ x: 0, y: 0 }); return undefined }

    const fine = window.matchMedia('(pointer: fine)').matches
    let raf = 0

    if (fine) {
      const onMove = (e) => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          const el = wrapRef.current
          if (!el) return
          const r = el.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const dx = e.clientX - cx
          const dy = e.clientY - cy
          const dist = Math.hypot(dx, dy) || 1
          const mag = Math.min(1, dist / 220)
          setPupil({ x: (dx / dist) * mag, y: (dy / dist) * mag })
        })
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      return () => { window.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf) }
    }

    // Touch device: pupils drift with scroll position.
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const max = (document.documentElement.scrollHeight - window.innerHeight) || 1
        const p = Math.min(1, Math.max(0, window.scrollY / max))
        setPupil({ x: 0, y: p * 2 - 1 })
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [reduced, napping])

  // --- Blink loop (every 3–8s) — runs even under reduced motion --------------
  useEffect(() => {
    if (napping) { setBlinking(false); return undefined }
    let t1, t2, cancelled = false
    const loop = () => {
      const delay = 3000 + Math.random() * 5000
      t1 = setTimeout(() => {
        if (cancelled) return
        setBlinking(true)
        t2 = setTimeout(() => { setBlinking(false); loop() }, 130)
      }, delay)
    }
    loop()
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2) }
  }, [napping])

  const px = pupil.x * 4
  const py = pupil.y * 4
  const closed = napping || blinking
  const openScaleY = thinking ? 0.5 : 1

  // --- Body layer styling from the skin --------------------------------------
  const bodyStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: b.morph ? undefined : b.radius,
    background: b.gradient || b.fill,
    border: b.strokeWidth ? `${b.strokeWidth}px solid ${b.stroke}` : 'none',
    boxShadow: [
      b.rim && b.rim !== 'none' ? `0 0 14px ${b.rim}, inset 0 0 8px ${b.rim}` : '',
      b.bevel ? 'inset 2px 2px 0 var(--bevel-highlight, rgba(255,255,255,0.7)), inset -2px -2px 0 var(--bevel-dark, rgba(0,0,0,0.4))' : '',
    ].filter(Boolean).join(', ') || undefined,
    imageRendering: b.crispEdges ? 'pixelated' : undefined,
  }

  const motionClass = reduced || napping
    ? ''
    : b.morph ? 'blobert-body-morph'
      : b.breathe ? 'blobert-body-breathe'
        : b.jitter ? 'blobert-body-jitter'
          : ''

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} aria-hidden="true">
      <div className={motionClass} style={bodyStyle}>
        {b.scanlines && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)',
            opacity: 0.5, mixBlendMode: 'multiply',
          }} />
        )}
      </div>

      {/* Eyes — identical in every skin. */}
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        {[36, 64].map((ex) => (
          closed ? (
            <line key={ex} x1={ex - 8} y1={46} x2={ex + 8} y2={46} stroke="#1a1a22" strokeWidth={3} strokeLinecap="round" />
          ) : (
            <g key={ex} style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: `scaleY(${openScaleY})`, transition: 'transform 100ms ease' }}>
              <circle cx={ex} cy={46} r={10} fill="#ffffff" stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
              <circle cx={ex + px} cy={46 + py} r={4.6} fill="#1a1a22" />
              <circle cx={ex + px - 1.5} cy={46 + py - 1.6} r={1.4} fill="#ffffff" />
            </g>
          )
        ))}
      </svg>
    </div>
  )
}

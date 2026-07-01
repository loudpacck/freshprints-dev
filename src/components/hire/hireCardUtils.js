import { useEffect, useMemo, useRef, useState } from 'react'

// ── In-view trigger (SPA-bug-proof) ────────────────────────────────────────
// Fires ONCE when the element enters the viewport, and — critically — also
// fires immediately if the element is already on-screen at mount (the case
// that Framer's whileInView + once:true silently drops under SPA scroll
// restoration). We check getBoundingClientRect synchronously on mount first,
// then fall back to an IntersectionObserver for cards still below the fold.
export function useInViewOnce(ref, { rootMargin = '0px 0px -10% 0px', threshold = 0.15 } = {}) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Guard: element already visible on mount → trigger now, no observer needed.
    const alreadyVisible = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const vw = window.innerWidth || document.documentElement.clientWidth
      if (r.bottom <= 0 || r.top >= vh) return false
      if (r.right <= 0 || r.left >= vw) return false
      return r.top < vh * 0.92
    }
    if (alreadyVisible()) {
      setInView(true)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setInView(true)
            io.disconnect()
          }
        })
      },
      { rootMargin, threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, rootMargin, threshold])

  return inView
}

// ── Stat display parsing ───────────────────────────────────────────────────
// The card stats arrive pre-formatted for display ("11,458", "~1.9M", "58%",
// "6"). To count them up we split each into prefix / number / suffix, animate
// the numeric core from 0 → target, and re-assemble with comma grouping.
function parseStatValue(display) {
  const str = String(display)
  const m = str.match(/^(\D*?)([\d.,]+)(.*)$/)
  if (!m) return null
  const prefix = m[1] || ''
  const rawNum = m[2] || ''
  const suffix = m[3] || ''
  const noCommas = rawNum.replace(/,/g, '')
  const target = parseFloat(noCommas)
  if (!Number.isFinite(target)) return null
  const dot = noCommas.indexOf('.')
  const decimals = dot === -1 ? 0 : noCommas.length - dot - 1
  return { prefix, suffix, target, decimals }
}

function formatStat(n, decimals) {
  if (decimals > 0) {
    const fixed = n.toFixed(decimals)
    const [int, frac] = fixed.split('.')
    return Number(int).toLocaleString('en-US') + '.' + frac
  }
  return Math.round(n).toLocaleString('en-US')
}

// Counts a formatted stat string up from 0 once `active` becomes true (i.e. the
// card scrolled into view). Reduced motion → shows the final value instantly.
// Returns { text, done } — `done` gates the live-pulse so it only breathes after
// the number has settled.
export function useStatCountUp(display, { reduced = false, active = false, duration = 1500 } = {}) {
  const parsed = useMemo(() => parseStatValue(display), [display])
  const [n, setN] = useState(() => (reduced && parsed ? parsed.target : 0))
  const rafRef = useRef()

  useEffect(() => {
    if (!parsed) return
    if (reduced) {
      setN(parsed.target)
      return
    }
    if (!active) {
      setN(0)
      return
    }
    let start
    const step = t => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setN(parsed.target * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [parsed, reduced, active, duration])

  if (!parsed) return { text: String(display), done: true }
  const done = reduced || n >= parsed.target - 0.0001
  return {
    text: parsed.prefix + formatStat(n, parsed.decimals) + parsed.suffix,
    done: active ? done : false,
  }
}

// ── Pointer reactivity (no React re-render) ─────────────────────────────────
// Writes normalized pointer position to CSS custom properties on the card:
//   --rx / --ry  →  -0.5..0.5 relative to card center (drives tilt / parallax)
//   --mx / --my  →   0..1 within the card (drives the neon highlight position)
//   --pactive    →   0 at rest, 1 while hovered (gates scale/shadow/glow)
// rAF-throttled, fine-pointer only, disabled under reduced motion or when the
// caller opts out (e.g. Retro, which uses a chunky snap instead of smooth tilt).
export function useCardPointer(ref, { reduced = false, disabled = false } = {}) {
  useEffect(() => {
    if (reduced || disabled) return
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const el = ref.current
    if (!el) return

    let raf
    const onMove = e => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--rx', (px - 0.5).toFixed(4))
        el.style.setProperty('--ry', (py - 0.5).toFixed(4))
        el.style.setProperty('--mx', px.toFixed(4))
        el.style.setProperty('--my', py.toFixed(4))
      })
    }
    const onEnter = () => el.style.setProperty('--pactive', '1')
    const onLeave = () => {
      cancelAnimationFrame(raf)
      el.style.setProperty('--pactive', '0')
      el.style.setProperty('--rx', '0')
      el.style.setProperty('--ry', '0')
      el.style.setProperty('--mx', '0.5')
      el.style.setProperty('--my', '0.5')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [ref, reduced, disabled])
}

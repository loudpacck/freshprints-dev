import { useEffect, useRef, useState } from 'react'
import { useSound } from '@/sound/useSound'

// Count a number up from 0 → target with an eased ramp. When reduced motion
// is on, the target is shown instantly (no animation). Always returns a finite
// number so the caller never renders 0/blank once a real target is supplied.
export function useCountUp(target, { duration = 1400, reduced = false } = {}) {
  const safeTarget = Number.isFinite(target) ? target : 0
  const [value, setValue] = useState(reduced ? safeTarget : 0)
  const rafRef = useRef()

  useEffect(() => {
    if (reduced) {
      setValue(safeTarget)
      return
    }
    let start
    const from = 0
    const step = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setValue(Math.round(from + (safeTarget - from) * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [safeTarget, duration, reduced])

  return value
}

// Plays one subtle entrance sound on mount. soundManager.play() already honors
// the active theme's per-theme mute default AND prefers-reduced-motion, so this
// never forces audio on — muted themes stay silent.
export function useEntranceSound(name = 'activate') {
  const { play } = useSound()
  useEffect(() => {
    const id = setTimeout(() => play(name), 160)
    return () => clearTimeout(id)
  }, [play])
}

// Writes normalized cursor position (-0.5..0.5) to --px / --py CSS custom
// properties on the given element, throttled via rAF, with NO React re-render.
// Desktop only (fine pointer) and disabled under reduced motion — touch devices
// and reduced-motion users get the static resting state.
export function usePointerVars(elRef, reduced) {
  useEffect(() => {
    if (reduced) return
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const el = elRef.current
    if (!el) return

    let raf
    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', nx.toFixed(4))
        el.style.setProperty('--py', ny.toFixed(4))
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [elRef, reduced])
}

// Character-by-character typewriter. Instant + complete under reduced motion.
export function useTypewriter(text, { reduced = false, speed = 34 } = {}) {
  const [out, setOut] = useState(reduced ? text : '')
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    if (reduced) {
      setOut(text)
      setDone(true)
      return
    }
    setOut('')
    setDone(false)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, reduced, speed])

  return { out, done }
}

// Formats the live view count with locale grouping.
export function formatViews(n) {
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-US')
}

// Smoothly scrolls one viewport down to the content below the hero.
export function scrollToContent(reduced) {
  if (typeof window === 'undefined') return
  window.scrollTo({
    top: window.innerHeight - 4,
    behavior: reduced ? 'auto' : 'smooth',
  })
}

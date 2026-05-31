import { useEffect, useRef, useState } from 'react'
import useReducedMotion from '@/hooks/useReducedMotion'

/* Soft color pulse on click — funky-only, deliberately minimal.
   A transient ripple is spawned at the pointer and removed when its CSS
   animation ends. No blob parallax (that would fight the keyframe transforms
   and risk jank, per the Part B spec). Disabled under reduced motion and on
   coarse / touch pointers. */
let nextId = 0

export default function FunkyCursorPulse() {
  const reduced = useReducedMotion()
  const [pulses, setPulses] = useState([])
  const finePointer = useRef(false)

  useEffect(() => {
    finePointer.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches
  }, [])

  useEffect(() => {
    if (reduced) return
    function onClick(e) {
      if (!finePointer.current) return
      const id = nextId++
      setPulses(prev => [...prev, { id, x: e.clientX, y: e.clientY }])
    }
    window.addEventListener('pointerdown', onClick)
    return () => window.removeEventListener('pointerdown', onClick)
  }, [reduced])

  if (reduced) return null

  return (
    <div className="funky-pulse-layer" aria-hidden="true">
      {pulses.map(p => (
        <span
          key={p.id}
          className="funky-pulse"
          style={{ left: p.x, top: p.y }}
          onAnimationEnd={() => setPulses(prev => prev.filter(x => x.id !== p.id))}
        />
      ))}
    </div>
  )
}

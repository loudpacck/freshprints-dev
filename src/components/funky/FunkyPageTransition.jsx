import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'

/* Liquid page transition — funky-only.
   FunkyLayout remounts on every route change (it lives inside each route
   element under AnimatePresence key={pathname}), so this overlay plays a
   one-shot "wipe off to reveal" on mount. A module-level flag suppresses it
   on the very first cold load so there's no flash before the app is ready.
   Scoped entirely to Funky — Digital/Standard/Retro navigation is untouched.
   Under reduced motion it renders nothing (the page's own opacity fade plays). */

let hasMountedOnce = false

export default function FunkyPageTransition() {
  const reduced = useReducedMotion()
  // Skip the wipe on first cold load; only play on real navigations.
  const [play] = useState(() => {
    const should = hasMountedOnce
    hasMountedOnce = true
    return should
  })
  const [done, setDone] = useState(!play)

  useEffect(() => {
    if (!play) return
    const t = setTimeout(() => setDone(true), 720)
    return () => clearTimeout(t)
  }, [play])

  if (reduced || !play || done) return null

  return (
    <motion.div
      className="funky-transition"
      aria-hidden="true"
      initial={{ scaleY: 1, borderRadius: '0 0 0 0' }}
      animate={{ scaleY: 0, borderRadius: '0 0 50% 50%' }}
      transition={{ duration: 0.56, ease: [0.5, 1.4, 0.4, 1] }}
      style={{ transformOrigin: 'top center' }}
    />
  )
}

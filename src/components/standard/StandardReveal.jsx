import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'

export default function Reveal({ children, delay = 0 }) {
  const reduced = useReducedMotion()
  const { themeId } = useTheme()
  // Phase 8: in Standard the reveal is roughly half its former travel and
  // duration — motion you feel rather than watch. Retro and Funky render this
  // same component and keep the original 24px / 0.6s reveal.
  const isStandard = themeId === 'standard'
  const travel = isStandard ? 12 : 24
  const duration = isStandard ? 0.3 : 0.6

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: travel }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

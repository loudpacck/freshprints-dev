import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'
import Button from '@/components/ui/Button'
import ParticleField from '@/components/effects/ParticleField'

function fadeUp(delay, reduced) {
  if (reduced) return {}
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  }
}

export default function Landing() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const { themeId } = useTheme()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.')

  const handleEnter = () => navigate(themeId === 'standard' ? '/home' : '/hub')

  return (
    <motion.div
      data-ui="digital"
      data-mode="dark"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}
    >
      <ParticleField />

      {/* Centered content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-6)',
          textAlign: 'center',
          padding: 'var(--space-8)',
        }}
      >
        <motion.span
          {...fadeUp(0.0, reduced)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
          }}
        >
          FRESHPRINTS.DEV
        </motion.span>

        <motion.h1
          {...fadeUp(0.3, reduced)}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-hero)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            margin: 0,
          }}
        >
          ENGINEER. DEVELOPER. BUILDER.
        </motion.h1>

        <motion.p
          {...fadeUp(0.6, reduced)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          Mechanical design, software, games, AI.
        </motion.p>

        <motion.div {...fadeUp(0.9, reduced)}>
          <div className="landing-enter-aura">
            <Button size="lg" onClick={handleEnter}>
              ENTER
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bottom-left version */}
      <motion.span
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          left: 'var(--space-6)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          zIndex: 1,
        }}
      >
        v1.0 // INITIALIZED
      </motion.span>

      {/* Bottom-right date */}
      <motion.span
        initial={reduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          zIndex: 1,
        }}
      >
        {today}
      </motion.span>
    </motion.div>
  )
}

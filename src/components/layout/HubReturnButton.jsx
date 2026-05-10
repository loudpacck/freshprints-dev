import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function HubReturnButton() {
  const navigate = useNavigate()

  return (
    <motion.button
      onClick={() => navigate('/hub')}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 'calc(var(--space-6) + env(safe-area-inset-top, 0px))',
        left: 'calc(var(--space-6) + env(safe-area-inset-left, 0px))',
        zIndex: 'var(--z-sticky)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-2) var(--space-4)',
        cursor: 'pointer',
        transition: 'color var(--duration-base), border-color var(--duration-base)',
      }}
      whileHover={{
        color: 'var(--color-text-accent)',
        borderColor: 'var(--color-accent-primary)',
      }}
    >
      ← HUB
    </motion.button>
  )
}

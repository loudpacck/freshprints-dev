import { motion } from 'framer-motion'
import { useTheme } from '@/themes/useTheme'

export default function Card({
  children,
  hoverable = false,
  accentColor,
  onClick,
  style,
}) {
  const { themeId } = useTheme()
  // Phase 9 — Digital only: terminal-drawn (transparent fill, 1px border) and
  // no hover-lift; hover flips the border to accent instead. Standard, Retro
  // and Funky reach this component through PackageCard on /hire and keep the
  // original surface fill and lift.
  const isDigital = themeId === 'digital'

  const base = {
    background: isDigital ? 'transparent' : 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    borderTop: accentColor ? `2px solid ${accentColor}` : undefined,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }

  if (!isDigital) base.border = '1px solid var(--color-border-subtle)'

  if (hoverable) {
    return (
      <motion.div
        style={base}
        onClick={onClick}
        whileHover={isDigital
          ? { borderColor: 'var(--color-accent-primary)' }
          : { y: -2, borderColor: 'var(--color-border-default)' }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div style={base} onClick={onClick}>
      {children}
    </div>
  )
}

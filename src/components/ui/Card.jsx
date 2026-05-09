import { motion } from 'framer-motion'

export default function Card({
  children,
  hoverable = false,
  accentColor,
  onClick,
  style,
}) {
  const base = {
    background: 'var(--color-bg-surface)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    borderTop: accentColor ? `2px solid ${accentColor}` : undefined,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }

  if (hoverable) {
    return (
      <motion.div
        style={base}
        onClick={onClick}
        whileHover={{
          y: -2,
          borderColor: 'var(--color-border-default)',
        }}
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

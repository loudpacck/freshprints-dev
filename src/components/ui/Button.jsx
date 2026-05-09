import { motion } from 'framer-motion'
import { useSound } from '@/sound/useSound'

const sizeStyles = {
  sm: { fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', gap: 'var(--space-2)' },
  md: { fontSize: 'var(--text-sm)', padding: 'var(--space-3) var(--space-6)', gap: 'var(--space-2)' },
  lg: { fontSize: 'var(--text-base)', padding: 'var(--space-4) var(--space-8)', gap: 'var(--space-3)' },
}

const variantStyles = {
  primary: {
    background: 'var(--color-accent-primary)',
    color: 'var(--color-text-inverse)',
    border: '1px solid var(--color-accent-primary)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-accent-primary)',
    border: '1px solid var(--color-accent-primary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border-subtle)',
  },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  icon,
  onClick,
  type = 'button',
  style: styleProp,
  silent = false,
}) {
  const { play } = useSound()

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'var(--weight-medium)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-wider)',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'border-color var(--duration-base)',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...styleProp,
  }

  function handleMouseEnter() {
    if (!silent && !disabled) play('hover')
  }

  function handleClick(e) {
    if (disabled) return
    if (!silent) play('click')
    onClick?.(e)
  }

  return (
    <motion.button
      type={type}
      style={base}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, filter: 'brightness(1.1)' }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </motion.button>
  )
}

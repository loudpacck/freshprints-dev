import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'

const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--accent-text)',
    border: '1px solid var(--accent)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--accent)',
    border: '1px solid transparent',
  },
}

export default function StandardButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
  style: styleProp,
}) {
  const reduced = useReducedMotion()
  const variantStyle = VARIANTS[variant] || VARIANTS.primary

  const sizeStyle =
    size === 'lg'
      ? { fontSize: 'var(--text-base)', padding: 'var(--space-4) var(--space-7)' }
      : size === 'sm'
      ? { fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-5)' }
      : { fontSize: 'var(--text-sm)', padding: 'var(--space-3) var(--space-6)' }

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-semibold)',
    letterSpacing: 'var(--tracking-wide)',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)',
    textDecoration: 'none',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...sizeStyle,
    ...variantStyle,
    ...styleProp,
  }

  const hoverProps = reduced ? {} : {
    whileHover: disabled ? {} : {
      ...(variant === 'primary' && { background: 'var(--accent-hover)', boxShadow: 'var(--shadow-md)' }),
      ...(variant === 'secondary' && { background: 'var(--accent-muted)', borderColor: 'var(--border-accent)' }),
      ...(variant === 'ghost' && { background: 'var(--accent-muted)' }),
    },
    whileTap: disabled ? {} : { scale: 0.98 },
    transition: { duration: 0.15 },
  }

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        style={base}
        {...hoverProps}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={base}
      {...hoverProps}
    >
      {children}
    </motion.button>
  )
}

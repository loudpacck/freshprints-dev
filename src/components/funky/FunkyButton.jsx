import { useSound } from '@/sound/useSound'

/* Tactile liquid pill button. Variants:
   - primary:  lime gradient fill, dark text
   - secondary: turquoise outline that fills on hover
   - ghost:    text-only with liquid pill hover */
const VARIANTS = {
  primary: {
    background: 'var(--gradient-pill)',
    color: 'var(--accent-text)',
    boxShadow: 'var(--shadow-lime)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--accent-turquoise)',
    border: '2px solid var(--accent-turquoise)',
    boxShadow: 'var(--shadow-turquoise)',
  },
  ghost: {
    background: 'var(--accent-muted)',
    color: 'var(--text-primary)',
  },
}

export default function FunkyButton({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  href,
  target,
  rel,
  style,
  silent = false,
  ...rest
}) {
  const { play } = useSound()
  const variantStyle = VARIANTS[variant] || VARIANTS.primary

  function handleClick(e) {
    if (!silent) play('select')
    onClick?.(e)
  }
  function handleEnter() {
    if (!silent) play('hover')
  }

  const baseStyle = {
    fontSize: 'var(--text-base)',
    ...variantStyle,
    ...style,
  }

  if (href) {
    return (
      <a
        className="funky-button"
        href={href}
        target={target}
        rel={rel}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        style={{ textDecoration: 'none', display: 'inline-block', ...baseStyle }}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      className="funky-button"
      type={type}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      style={baseStyle}
      {...rest}
    >
      {children}
    </button>
  )
}

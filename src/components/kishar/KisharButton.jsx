import { Link } from 'react-router-dom'
import { useSound } from '@/sound/useSound'

/**
 * Kishar button. Three variants, all defined in kishar/tokens.css:
 *   primary   — leather body, outset gold bevel, bone text
 *   secondary — gold outline on transparent
 *   ghost     — gold text only
 *
 * There is no hover-lift anywhere. :active flips the bevel to inset so the
 * control presses IN, the way a real cast fitting does.
 */

const SIZES = {
  sm: { padding: '0.4rem 0.9rem',  fontSize: 'var(--text-sm)' },
  md: { padding: '0.6rem 1.35rem', fontSize: 'var(--text-base)' },
  lg: { padding: '0.8rem 1.9rem',  fontSize: 'var(--text-lg)' },
}

export default function KisharButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  to,
  onClick,
  type = 'button',
  disabled = false,
  target,
  rel,
  style,
  ...rest
}) {
  const { play } = useSound()
  const className = `kishar-btn kishar-btn--${variant}`
  const baseStyle = { ...SIZES[size] || SIZES.md, ...style }

  function handleClick(e) {
    play('select')
    onClick?.(e)
  }
  function handleEnter() {
    play('hover')
  }

  // Internal route -> Link; external/mailto -> anchor; otherwise a button.
  const isExternal = typeof href === 'string' && !href.startsWith('/')

  if (to || (href && !isExternal)) {
    return (
      <Link
        to={to || href}
        className={className}
        style={baseStyle}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        className={className}
        style={baseStyle}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        onClick={handleClick}
        onMouseEnter={handleEnter}
        {...rest}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      className={className}
      style={baseStyle}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={handleEnter}
      {...rest}
    >
      {children}
    </button>
  )
}

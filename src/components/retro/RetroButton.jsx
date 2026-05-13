import { useSound } from '@/sound/useSound'

const RAISED = `
  inset 1px 1px 0 var(--bevel-highlight),
  inset -1px -1px 0 var(--bevel-dark),
  inset 2px 2px 0 var(--bevel-light),
  inset -2px -2px 0 var(--bevel-shadow)
`.trim()

const INSET = `
  inset 1px 1px 0 var(--bevel-dark),
  inset -1px -1px 0 var(--bevel-highlight),
  inset 2px 2px 0 var(--bevel-shadow),
  inset -2px -2px 0 var(--bevel-light)
`.trim()

export default function RetroButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  style = {},
  ...props
}) {
  const { play } = useSound()

  function handleClick(e) {
    if (disabled) return
    play('click')
    onClick?.(e)
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          background: 'none',
          border: 'none',
          padding: '0 2px',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-md)',
          color: 'var(--accent-bright)',
          textDecoration: 'underline',
          cursor: disabled ? 'default' : 'pointer',
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && play('hover')}
      style={{
        background: 'var(--bg-elevated)',
        border: 'none',
        padding: '4px 12px',
        minWidth: 80,
        minHeight: 23,
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-md)',
        fontWeight: variant === 'primary' ? 700 : 400,
        color: disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? INSET : RAISED,
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        outline: 'none',
        position: 'relative',
        ...style,
      }}
      // CSS can't do "translate on active" + outline on focus from inline styles alone.
      // We use onMouseDown/Up for the pressed effect instead.
      onMouseDown={e => {
        if (disabled) return
        e.currentTarget.style.boxShadow = INSET
        e.currentTarget.style.transform = 'translate(1px, 1px)'
      }}
      onMouseUp={e => {
        if (disabled) return
        e.currentTarget.style.boxShadow = RAISED
        e.currentTarget.style.transform = ''
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = disabled ? INSET : RAISED
        e.currentTarget.style.transform = ''
      }}
      onFocus={e => {
        e.currentTarget.style.outline = '1px dotted #000'
        e.currentTarget.style.outlineOffset = '-4px'
      }}
      onBlur={e => {
        e.currentTarget.style.outline = 'none'
      }}
      {...props}
    >
      {children}
    </button>
  )
}

const categoryColors = {
  software:    { color: '#00C8FF', bg: 'rgba(0, 200, 255, 0.10)',   border: 'rgba(0, 200, 255, 0.25)' },
  games:       { color: '#FFB347', bg: 'rgba(255, 179, 71, 0.10)',  border: 'rgba(255, 179, 71, 0.25)' },
  engineering: { color: '#A0A0B8', bg: 'rgba(160, 160, 184, 0.08)', border: 'rgba(160, 160, 184, 0.20)' },
  ai:          { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.10)',  border: 'rgba(139, 92, 246, 0.25)' },
  content:     { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)',  border: 'rgba(251, 191, 36, 0.25)' },
  default:     { color: 'var(--color-text-muted)', bg: 'var(--color-bg-elevated)', border: 'var(--color-border-subtle)' },
}

const sizeStyles = {
  sm: { fontSize: 'var(--text-xs)', padding: '2px var(--space-2)' },
  md: { fontSize: 'var(--text-sm)', padding: 'var(--space-1) var(--space-3)' },
}

export default function Tag({ label, category = 'default', size = 'sm' }) {
  const { color, bg, border } = categoryColors[category] ?? categoryColors.default

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 'var(--weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-sm)',
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
      }}
    >
      {label}
    </span>
  )
}

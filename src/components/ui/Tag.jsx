// Phase 9: the tinted fills and colored borders are gone — a tag is drawn, not
// filled. The label reads through the per-theme --color-category-* hooks, so
// Digital resolves phosphor and every other theme keeps its own fallback hex.
const categoryColors = {
  software:    { color: 'var(--color-category-software, #00C8FF)' },
  games:       { color: 'var(--color-category-games, #FFB347)' },
  engineering: { color: 'var(--color-category-engineering, #A0A0B8)' },
  ai:          { color: 'var(--color-category-ai, #8B5CF6)' },
  content:     { color: 'var(--color-category-content, #FBBF24)' },
  default:     { color: 'var(--color-text-muted)' },
}
const TAG_SURFACE = { bg: 'transparent', border: 'var(--color-border-default)' }

const sizeStyles = {
  sm: { fontSize: 'var(--text-xs)', padding: '2px var(--space-2)' },
  md: { fontSize: 'var(--text-sm)', padding: 'var(--space-1) var(--space-3)' },
}

export default function Tag({ label, category = 'default', size = 'sm' }) {
  const { color } = categoryColors[category] ?? categoryColors.default
  const { bg, border } = TAG_SURFACE

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

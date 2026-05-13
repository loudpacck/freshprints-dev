const statusMap = {
  ACTIVE:         { color: 'var(--color-status-active)',         label: 'Active' },
  BETA:           { color: 'var(--color-status-beta)',           label: 'Beta' },
  STABLE:         { color: 'var(--color-status-stable)',         label: 'Stable' },
  CONCEPT:        { color: 'var(--color-status-concept)',        label: 'Concept' },
  PRODUCTION:     { color: 'var(--color-status-active)',         label: 'Production' },
  PROFESSIONAL:   { color: 'var(--color-status-stable)',         label: 'Professional' },
  RESEARCH:       { color: 'var(--color-status-concept)',        label: 'Research' },
  IN_DEVELOPMENT: { color: 'var(--color-status-in-development)', label: 'In Development' },
  AVAILABLE:      { color: 'var(--color-status-available)',      label: 'Available',
    dotStyle: { boxShadow: '0 0 6px rgba(255,255,255,0.6)', border: '1px solid rgba(180,180,180,0.4)' } },
  DEFAULT:        { color: 'var(--color-text-muted)',            label: 'Unknown' },
}

export default function Badge({ status = 'DEFAULT', pulse = false, label: labelProp }) {
  const { color, label: statusLabel, dotStyle = {} } = statusMap[status] ?? statusMap.DEFAULT
  const label = labelProp ?? statusLabel

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        color: 'var(--color-text-secondary)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-full)',
        padding: 'var(--space-1) var(--space-3)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          animation: pulse ? 'glowPulse 2s ease-in-out infinite' : 'none',
          ...dotStyle,
        }}
      />
      {label}
    </span>
  )
}

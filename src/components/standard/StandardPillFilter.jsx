export default function StandardPillFilter({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const isActive = opt.value === active
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--accent-muted)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

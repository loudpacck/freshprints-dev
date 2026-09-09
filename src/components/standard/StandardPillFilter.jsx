import { useTheme } from '@/themes/useTheme'

export default function StandardPillFilter({ options, active, onChange }) {
  const { themeId } = useTheme()
  // Phase 8: in Standard the active filter is an orange outline on a
  // transparent ground, not an orange fill. Retro and Funky render this same
  // component inside their own chrome and keep the original filled treatment.
  const isStandard = themeId === 'standard'

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const isActive = opt.value === active
        const activeBg = isStandard ? 'transparent' : 'var(--accent)'
        const activeFg = isStandard ? 'var(--accent-ink, var(--accent))' : 'var(--accent-text)'
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
              background: isActive ? activeBg : 'transparent',
              color: isActive ? activeFg : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                if (isStandard) {
                  e.currentTarget.style.borderColor = 'var(--text-secondary)'
                } else {
                  e.currentTarget.style.background = 'var(--accent-muted)'
                }
                e.currentTarget.style.color = 'var(--text-primary)'
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                if (isStandard) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                } else {
                  e.currentTarget.style.background = 'transparent'
                }
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

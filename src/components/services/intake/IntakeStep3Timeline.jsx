const TIMELINE_OPTIONS = [
  { id: 'asap',      label: 'ASAP (rush)' },
  { id: '1-2w',      label: '1–2 weeks' },
  { id: '1-2m',      label: '1–2 months' },
  { id: '3plus',     label: '3+ months' },
  { id: 'flexible',  label: 'Flexible' },
]

const BUDGET_OPTIONS = [
  { id: '0-1k',  label: '$0–1K' },
  { id: '1-5k',  label: '$1K–5K' },
  { id: '5-15k', label: '$5K–15K' },
  { id: '15k+',  label: '$15K+' },
]

function OptionButton({ label, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide)',
        color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
        background: isSelected ? 'var(--color-accent-primary-dim)' : 'var(--color-bg-surface)',
        border: `1px solid ${isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3) var(--space-4)',
        cursor: 'pointer',
        transition: 'all 150ms',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

export default function IntakeStep3Timeline({ watch, setValue }) {
  const timeline = watch('timeline')
  const budget = watch('budget')

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        marginBottom: 'var(--space-2)',
      }}>
        Timeline and budget
      </h2>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-8)',
      }}>
        Rough estimates are fine — this helps me prioritize and respond accurately.
      </p>

      {/* Timeline */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-3)',
        }}>
          // WHEN DO YOU NEED THIS?
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {TIMELINE_OPTIONS.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              isSelected={timeline === opt.id}
              onClick={() => setValue('timeline', opt.id)}
            />
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-3)',
        }}>
          // BUDGET RANGE
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {BUDGET_OPTIONS.map(opt => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              isSelected={budget === opt.id}
              onClick={() => setValue('budget', opt.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

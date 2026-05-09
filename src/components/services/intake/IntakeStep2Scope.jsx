const SCOPE_OPTIONS = [
  {
    id: 'new-build',
    label: 'New build from scratch',
    desc: 'Starting with a blank slate — new product, system, or feature.',
  },
  {
    id: 'existing-project',
    label: 'Existing project (improvements/fixes)',
    desc: 'Taking on an existing codebase, design, or system.',
  },
  {
    id: 'consulting',
    label: 'Consulting only',
    desc: 'Advice, review, or design direction — no hands-on build.',
  },
]

export default function IntakeStep2Scope({ watch, setValue }) {
  const selected = watch('scope')

  return (
    <div>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-4xl)',
        color: 'var(--color-text-primary)',
        letterSpacing: 'var(--tracking-tight)',
        marginBottom: 'var(--space-2)',
      }}>
        What&apos;s the scope?
      </h2>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-6)',
      }}>
        Pick the option that best describes your situation.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {SCOPE_OPTIONS.map(opt => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setValue('scope', opt.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                padding: 'var(--space-5)',
                background: isSelected ? 'var(--color-accent-primary-dim)' : 'var(--color-bg-surface)',
                border: `1px solid ${isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 150ms',
              }}
            >
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `2px solid ${isSelected ? 'var(--color-accent-primary)' : 'var(--color-border-default)'}`,
                background: isSelected ? 'var(--color-accent-primary)' : 'transparent',
                flexShrink: 0,
                marginTop: 2,
                transition: 'all 150ms',
              }} />
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {opt.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 'var(--leading-snug)',
                }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

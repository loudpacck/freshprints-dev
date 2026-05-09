const STEPS = [
  { num: '01', label: 'DISCOVERY',  desc: 'Scoping call, requirements, and timeline alignment.' },
  { num: '02', label: 'SCOPE',      desc: 'Fixed deliverables, milestones, and pricing locked in.' },
  { num: '03', label: 'BUILD',      desc: 'Solo execution with async check-ins at each milestone.' },
  { num: '04', label: 'HANDOFF',    desc: 'Delivery, documentation, and a 7-day support window.' },
]

export default function ProcessSection() {
  return (
    <section style={{ marginBottom: 'var(--space-20)' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-8)',
      }}>
        // HOW I WORK
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 0,
        position: 'relative',
      }}>
        {/* Connecting line (desktop) */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: '12.5%',
          right: '12.5%',
          height: 1,
          background: 'linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-primary))',
          opacity: 0.2,
          pointerEvents: 'none',
        }} />

        {STEPS.map((step, i) => (
          <div
            key={step.num}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: 'var(--space-4)',
              position: 'relative',
            }}
          >
            {/* Step circle */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-accent-primary)',
                fontWeight: 'var(--weight-medium)',
              }}>
                {step.num}
              </span>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-text-primary)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              marginBottom: 'var(--space-2)',
            }}>
              {step.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 'var(--leading-snug)',
            }}>
              {step.desc}
            </div>

            {/* Arrow between steps */}
            {i < STEPS.length - 1 && (
              <div style={{
                position: 'absolute',
                right: -8,
                top: 20,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-accent-primary)',
                opacity: 0.4,
                zIndex: 2,
                transform: 'translateY(-50%)',
              }}>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

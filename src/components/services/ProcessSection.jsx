import { useTheme } from '@/themes/useTheme'
import Reveal from '@/components/standard/StandardReveal'

// Single source of truth for the process copy. Digital uppercases `title` in CSS.
const STEPS = [
  {
    num: '01',
    title: 'Discovery',
    desc: 'Scoping call, requirements, and timeline alignment.',
  },
  {
    num: '02',
    title: 'Proposal',
    desc: 'I write a scoped proposal with deliverables, timeline, and fixed pricing.',
  },
  {
    num: '03',
    title: 'Build',
    desc: 'Solo execution with async check-ins at each milestone.',
  },
  {
    num: '04',
    title: 'Handoff',
    desc: 'Delivery with documentation, source files, and a 7-day support window.',
  },
]

// ─────────────────────────────────────────────────────────────── DIGITAL ──
// Horizontal timeline: circled step numbers on a connecting rule, arrows between.

function DigitalVariant() {
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
              {step.title}
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

// ────────────────────────────────────────────────────────────── STANDARD ──
// Four cards in a responsive grid under an eyebrow + heading.

function StandardVariant() {
  return (
    <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
      <div className="s-container">
        <Reveal>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            // HOW IT WORKS
          </div>
          <h2 style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-semibold)',
            fontSize: 'var(--text-4xl)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-10)',
          }}>
            The Process
          </h2>
        </Reveal>
        <div className="ss-process-grid">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.08}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-6)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--accent)',
                }}>
                  {step.num}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 'var(--weight-semibold)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-primary)',
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-normal)',
                }}>
                  {step.desc}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        .ss-process-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-5);
        }
        @media (max-width: 960px) {
          .ss-process-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .ss-process-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}

export default function ProcessSection() {
  const { themeId } = useTheme()
  return themeId === 'digital' ? <DigitalVariant /> : <StandardVariant />
}

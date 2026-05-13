import { useState } from 'react'
import { motion } from 'framer-motion'
import { services } from '@/data/services'
import { siteStatus } from '@/data/siteStatus'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import IntakeWizard from '@/components/services/IntakeWizard'

const TABS = [
  { id: 'all',         label: 'All Services' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'software',    label: 'Software' },
  { id: 'games',       label: 'Games' },
  { id: 'ai',          label: 'AI' },
  { id: 'content',     label: 'Content' },
]

const PROCESS = [
  { num: '01', title: 'Discovery', desc: 'We talk through the problem, scope, and goals. I ask hard questions.' },
  { num: '02', title: 'Proposal', desc: 'I write a scoped proposal with deliverables, timeline, and fixed pricing.' },
  { num: '03', title: 'Build', desc: 'I build it. Regular check-ins, real progress, no surprises.' },
  { num: '04', title: 'Handoff', desc: 'Clean delivery with documentation, source files, and a handoff call.' },
]

const AVAIL_COLOR = {
  OPEN:   '#22C55E',
  BUSY:   '#F59E0B',
  CLOSED: '#EF4444',
}

function PackageCard({ pkg, onInquire }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      transition: 'border-color 200ms ease, box-shadow 200ms ease',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--border-strong)'
      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          {pkg.name}
        </div>
        {pkg.timeline && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {pkg.timeline}
          </div>
        )}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {pkg.deliverables.map((item, i) => (
          <li key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-normal)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3, color: 'var(--accent)' }} aria-hidden="true">
              <path d="M2.5 7L6 10.5l5.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {item}
          </li>
        ))}
      </ul>

      <div style={{
        marginTop: 'auto',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-bold)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
        }}>
          {pkg.priceFrom ? `From $${pkg.priceFrom.toLocaleString()}` : 'Custom quote'}
        </span>
        <StandardButton variant="secondary" size="sm" onClick={onInquire}>
          Inquire
        </StandardButton>
      </div>
    </div>
  )
}

export default function StandardServices() {
  const reduced = useReducedMotion()
  const [activeTab, setActiveTab] = useState('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPrefill, setWizardPrefill] = useState(null)

  const visibleServices = activeTab === 'all'
    ? services
    : services.filter(s => s.category === activeTab)

  const avail = siteStatus.availability
  const availColor = AVAIL_COLOR[avail] || '#A0A0B8'

  function inquire(serviceId) {
    setWizardPrefill(serviceId)
    setWizardOpen(true)
  }

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section style={{
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-10)',
        background: 'var(--gradient-hero)',
      }}>
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
              // SERVICES
            </div>
            <h1 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-6xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-4)',
            }}>
              What I Build For Clients
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 640,
              lineHeight: 'var(--leading-normal)',
            }}>
              Freelance and consulting work across six lanes. Pick what fits — or describe something else entirely.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Tab bar */}
      <div style={{
        position: 'sticky',
        top: 'var(--nav-height)',
        zIndex: 10,
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="s-container" style={{ padding: 0 }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  padding: 'var(--space-4) var(--space-5)',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => {
                  if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            {visibleServices.map((service, si) => (
              <Reveal key={service.id} delay={si * 0.05}>
                <div>
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <h2 style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 'var(--weight-semibold)',
                      fontSize: 'var(--text-3xl)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      {service.name}
                    </h2>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--leading-normal)',
                    }}>
                      {service.description}
                    </p>
                  </div>
                  <div className="s-grid-2">
                    {service.packages.map(pkg => (
                      <PackageCard
                        key={pkg.name}
                        pkg={pkg}
                        onInquire={() => inquire(service.id)}
                      />
                    ))}
                  </div>
                  {service.customAvailable && (
                    <div style={{
                      marginTop: 'var(--space-4)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                    }}>
                      Need something custom?{' '}
                      <button
                        onClick={() => inquire(service.id)}
                        style={{
                          color: 'var(--accent)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-sm)',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Describe your scope →
                      </button>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
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
            {PROCESS.map((step, i) => (
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
      </section>

      {/* Availability */}
      <section style={{ paddingTop: 0, paddingBottom: 'var(--space-6)', background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-4) var(--space-5)',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: availColor, flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}>
                {siteStatus.availabilityNote}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}>
                Updated {siteStatus.lastUpdated}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              maxWidth: 600,
              margin: '0 auto',
              textAlign: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-12) var(--space-8)',
              backgroundImage: 'var(--gradient-hero)',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-bold)',
                fontSize: 'var(--text-4xl)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                marginBottom: 'var(--space-4)',
              }}>
                Have a project in mind?
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                marginBottom: 'var(--space-8)',
              }}>
                Tell me about it. Takes 2 minutes.
              </p>
              <StandardButton size="lg" onClick={() => setWizardOpen(true)}>
                Start Intake
              </StandardButton>
            </div>
          </Reveal>
        </div>
      </section>

      {wizardOpen && (
        <IntakeWizard
          isOpen={wizardOpen}
          prefillServiceType={wizardPrefill}
          onClose={() => { setWizardOpen(false); setWizardPrefill(null) }}
        />
      )}

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
    </motion.div>
  )
}

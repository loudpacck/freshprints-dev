import { useState } from 'react'
import { motion } from 'framer-motion'
import { services } from '@/data/services'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import AvailabilityIndicator from '@/components/ui/AvailabilityIndicator'
import PackageCard from '@/components/services/PackageCard'
import ProcessSection from '@/components/services/ProcessSection'
import ServiceCategoryTabs, { filterServicesByTab } from '@/components/services/ServiceCategoryTabs'
import IntakeWizard from '@/components/services/IntakeWizard'

export default function StandardServices() {
  const reduced = useReducedMotion()
  const [activeTab, setActiveTab] = useState('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPrefill, setWizardPrefill] = useState(null)

  const visibleServices = filterServicesByTab(services, activeTab)

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
      <ServiceCategoryTabs active={activeTab} onChange={setActiveTab} />

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
                        serviceCategory={service.category}
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
      <ProcessSection />

      {/* Availability */}
      <section style={{ paddingTop: 0, paddingBottom: 'var(--space-6)', background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <Reveal>
            <AvailabilityIndicator />
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
    </motion.div>
  )
}

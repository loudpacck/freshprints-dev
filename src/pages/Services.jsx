import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { services } from '@/data/services'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import AvailabilityIndicator from '@/components/services/AvailabilityIndicator'
import DecisionTree from '@/components/services/DecisionTree'
import ServiceCategoryTabs from '@/components/services/ServiceCategoryTabs'
import ServiceCategoryBlock from '@/components/services/ServiceCategoryBlock'
import ProcessSection from '@/components/services/ProcessSection'
import TestimonialsPlaceholder from '@/components/services/TestimonialsPlaceholder'
import IntakeWizard from '@/components/services/IntakeWizard'

const CATEGORY_FOR_ID = {
  engineering: 'engineering',
  software: 'software',
  gamedev: 'games',
  ai: 'ai',
  content: 'content',
  'fresh-prints': 'engineering',
}

export default function Services() {
  const { category: paramCategory } = useParams()
  const navigate = useNavigate()
  const initialTab = paramCategory ? (CATEGORY_FOR_ID[paramCategory] ?? 'all') : 'all'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardServiceType, setWizardServiceType] = useState('')

  function openWizard(serviceId = '') {
    setWizardServiceType(serviceId)
    setWizardOpen(true)
  }

  const filteredServices = activeTab === 'all'
    ? services
    : services.filter(s => s.category === activeTab || (activeTab === 'engineering' && s.id === 'fresh-prints'))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        paddingTop: 'var(--space-20)',
        paddingBottom: 'var(--space-20)',
      }}
    >
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 var(--space-6)',
      }}>

        {/* ── Hero ── */}
        <div style={{
          marginBottom: 'var(--space-16)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-3)',
          }}>
            // SERVICES
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-6xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 'var(--leading-tight)',
            marginBottom: 'var(--space-5)',
          }}>
            WHAT I BUILD
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            maxWidth: 560,
            margin: '0 auto var(--space-8)',
            lineHeight: 'var(--leading-normal)',
          }}>
            Fixed-price packages for predictable engagements. Custom contracts for everything else.
            Solo execution — no overhead, no handoffs, no agency markup.
          </p>
          <AvailabilityIndicator />
        </div>

        {/* ── Decision tree ── */}
        <DecisionTree />

        {/* ── Service packages ── */}
        <section id="packages-section" style={{ marginBottom: 'var(--space-20)' }}>
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <ServiceCategoryTabs active={activeTab} onChange={setActiveTab} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
                gap: 'var(--space-6)',
              }}
            >
              {filteredServices.map(service => (
                <ServiceCategoryBlock
                  key={service.id}
                  service={service}
                  onInquire={(id) => openWizard(id)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── Process ── */}
        <ProcessSection />

        {/* ── Testimonials ── */}
        <TestimonialsPlaceholder />

        {/* ── Final CTA ── */}
        <Card style={{
          textAlign: 'center',
          padding: 'var(--space-12)',
          background: 'var(--color-bg-surface)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-4xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-4)',
          }}>
            HAVE A PROJECT IN MIND?
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-8)',
            maxWidth: 400,
            margin: '0 auto var(--space-8)',
          }}>
            Tell me what you&apos;re building. I&apos;ll respond with a clear scope and timeline.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => openWizard()}>
              START A COMMISSION
            </Button>
            <Button variant="ghost" onClick={() => navigate('/contact')}>
              BOOK A CALL
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Intake Wizard ── */}
      <IntakeWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        prefillServiceType={wizardServiceType}
      />
    </motion.div>
  )
}

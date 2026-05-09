import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import AboutStatus from '@/components/about/AboutStatus'
import AboutStory from '@/components/about/AboutStory'
import AboutCapabilities from '@/components/about/AboutCapabilities'
import AboutStack from '@/components/about/AboutStack'
import AboutConnect from '@/components/about/AboutConnect'
import IntakeWizard from '@/components/services/IntakeWizard'

export default function About() {
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-container">

        {/* A. Hero block */}
        <header style={{ marginBottom: 'var(--space-20)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-4)',
          }}>
            // ABOUT
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-hero)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-4)',
          }}>
            KYLE
          </h1>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xl)',
            color: 'var(--color-text-accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wide)',
            marginBottom: 'var(--space-8)',
          }}>
            Engineer. Developer. Builder.
          </p>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
            maxWidth: 680,
          }}>
            I design real things. Software systems, mechanical assemblies, and games. Some get shipped to clients, some get shipped to my own platforms, and some live as experiments in the lab. I work solo across disciplines because the interesting problems sit in the seams where they meet.
          </p>
        </header>

        {/* B. Status widget */}
        <AboutStatus />

        {/* C. The Story */}
        <AboutStory />

        {/* D. Capabilities */}
        <AboutCapabilities />

        {/* E. Stack */}
        <AboutStack />

        {/* F. Connect */}
        <AboutConnect />

        {/* G. Final CTA strip */}
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-12)',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-4xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-8)',
          }}>
            WANT TO WORK TOGETHER?
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" onClick={() => setWizardOpen(true)}>
              START A PROJECT
            </Button>
            <Link to="/contact" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                JUST SAY HI
              </Button>
            </Link>
          </div>
        </div>

      </div>

      <IntakeWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </motion.div>
  )
}

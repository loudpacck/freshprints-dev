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
          <div className="da-hero-grid">
            <div>
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
            </div>

            <div className="da-portrait">
              <div
                style={{
                  border: '1px solid rgba(0, 200, 255, 0.2)',
                  overflow: 'hidden',
                  aspectRatio: '4/5',
                  position: 'relative',
                  transition: 'box-shadow 200ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 200, 255, 0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <img
                  src="/images/profile_picture/prof%20pic%201.jpg"
                  alt="Kyle DeBord"
                  loading="lazy"
                  decoding="async"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 'var(--space-3)',
                  background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--color-accent-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    // KYLE.EXE
                  </span>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            .da-hero-grid {
              display: grid;
              grid-template-columns: 3fr 2fr;
              gap: var(--space-12);
              align-items: start;
            }
            @media (max-width: 768px) {
              .da-hero-grid { grid-template-columns: 1fr; }
              .da-portrait { display: none; }
            }
          `}</style>
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

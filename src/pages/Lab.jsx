import { motion } from 'framer-motion'
import { experiments } from '@/data/labExperiments'
import ExperimentCard from '@/components/lab/ExperimentCard'

const blueprintGrid = {
  backgroundImage: [
    'linear-gradient(rgba(0, 200, 255, 0.04) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(0, 200, 255, 0.04) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '40px 40px',
}

const liveCount = experiments.filter(e => e.status === 'ACTIVE').length
const betaCount = experiments.filter(e => e.status === 'BETA').length
const researchCount = experiments.filter(e => e.status === 'CONCEPT').length

export default function Lab() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
        ...blueprintGrid,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-8) var(--space-24)',
        }}
      >
        {/* Header strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-12)',
            paddingBottom: 'var(--space-6)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            // FRESHPRINTS.DEV / LAB
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--color-status-active)',
                animation: 'glowPulse 2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            STATUS: ONLINE
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'var(--color-accent-primary)',
            opacity: 0.3,
            marginBottom: 'var(--space-16)',
          }}
        />

        {/* Hero block */}
        <div style={{ marginBottom: 'var(--space-16)' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-widest)',
              marginBottom: 'var(--space-4)',
            }}
          >
            // EXPERIMENTAL
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-hero)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-6)',
            }}
          >
            THE LAB
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
              maxWidth: 520,
              marginBottom: 'var(--space-10)',
            }}
          >
            Live tools. Working prototypes. Things you can touch.
          </p>

          {/* Terminal stats readout */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-5)',
            }}
          >
            {[
              `EXPERIMENTS: ${experiments.length}`,
              `LIVE: ${liveCount}`,
              `BETA: ${betaCount}`,
              `RESEARCH: ${researchCount}`,
            ].map((stat, i, arr) => (
              <span key={stat} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{stat}</span>
                {i < arr.length - 1 && (
                  <span
                    style={{
                      margin: '0 var(--space-4)',
                      color: 'var(--color-border-default)',
                    }}
                  >
                    |
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Experiment grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-16)',
          }}
          className="lab-grid"
        >
          {experiments.map((exp, i) => (
            <ExperimentCard key={exp.slug} experiment={exp} animationDelay={i * 80} />
          ))}
        </div>

        {/* Footer note */}
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            textAlign: 'center',
          }}
        >
          // New experiments shipped quarterly. Subscribe at /media for updates.
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .lab-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </motion.div>
  )
}

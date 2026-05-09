import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getExperimentBySlug } from '@/data/labExperiments'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NotFound from '@/pages/NotFound'

import PredictinatorWidget from '@/components/lab/experiments/PredictinatorWidget'
import PlutusSimulator from '@/components/lab/experiments/PlutusSimulator'
import ArchitectDemo from '@/components/lab/experiments/ArchitectDemo'
import CADViewer from '@/components/lab/experiments/CADViewer'

const COMPONENT_MAP = {
  PredictinatorWidget,
  PlutusSimulator,
  ArchitectDemo,
  CADViewer,
}

export default function LabExperiment() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const experiment = getExperimentBySlug(slug)

  if (!experiment) return <NotFound />

  const ExperimentComponent = COMPONENT_MAP[experiment.component]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ minHeight: '100vh', background: 'var(--color-bg-base)' }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-8) var(--space-24)',
        }}
      >
        {/* Top nav strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-12)',
            paddingBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--color-border-subtle)',
            marginBottom: 'var(--space-12)',
          }}
        >
          <button
            onClick={() => navigate('/lab')}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 0,
              transition: 'color var(--duration-base)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9.5 6h-7M5.5 3L2.5 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            BACK TO LAB
          </button>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}
          >
            {experiment.name}
          </span>

          <Badge status={experiment.status} pulse={experiment.status === 'ACTIVE'} />
        </div>

        {/* Title block */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-widest)',
              marginBottom: 'var(--space-3)',
            }}
          >
            {experiment.classification}
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-5xl)',
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {experiment.name}
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--leading-normal)',
              maxWidth: 560,
            }}
          >
            {experiment.description}
          </p>
        </div>

        {/* Experiment component */}
        {ExperimentComponent && <ExperimentComponent />}

        {/* Bottom CTA strip */}
        <div
          style={{
            marginTop: 'var(--space-20)',
            padding: 'var(--space-10)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-6)',
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Want this kind of work for your project?
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => navigate('/contact')}>
              DISCUSS A BUILD
            </Button>
            <Button variant="secondary" onClick={() => navigate('/services')}>
              VIEW SERVICES
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getExperimentBySlug, experiments } from '@/data/labExperiments'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import StandardCard from '@/components/standard/StandardCard'
import NotFound from '@/pages/NotFound'

import CADViewer from '@/components/lab/experiments/CADViewer'

const COMPONENT_MAP = {
  CADViewer,
}

const STATUS_COLORS = {
  ACTIVE:  '#22C55E',
  BETA:    '#F59E0B',
  STABLE:  'var(--accent)',
  CONCEPT: '#8B5CF6',
}

export default function StandardLabExperiment() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const experiment = getExperimentBySlug(slug)

  if (!experiment) return <NotFound />

  const ExperimentComponent = COMPONENT_MAP[experiment.component]
  const statusColor = STATUS_COLORS[experiment.status] || 'var(--accent)'

  const related = experiments
    .filter(e => e.slug !== slug)
    .slice(0, 2)

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top bar */}
      <div style={{
        position: 'sticky',
        top: 'var(--nav-height)',
        zIndex: 10,
        background: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="s-container" style={{ padding: 'var(--space-3) var(--space-8)' }}>
          <button
            onClick={() => navigate('/lab')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Lab
          </button>
        </div>
      </div>

      {/* Hero */}
      <section style={{
        paddingTop: 'var(--space-12)',
        paddingBottom: 'var(--space-8)',
        background: `linear-gradient(135deg, ${experiment.accentColor}08 0%, var(--bg-base) 60%)`,
      }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: experiment.accentColor,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              {experiment.classification}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-5xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-4)',
            }}>
              {experiment.name}
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 600,
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-4)',
            }}>
              {experiment.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {experiment.status}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Experiment widget */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-md)',
          }}>
            {ExperimentComponent ? (
              <ExperimentComponent />
            ) : (
              <div style={{
                padding: 'var(--space-16)',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                color: 'var(--text-secondary)',
              }}>
                This experiment is not yet available.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About this experiment */}
      <section style={{ paddingBottom: 'var(--space-16)', background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              maxWidth: 760,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-8)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                marginBottom: 'var(--space-4)',
              }}>
                About This Experiment
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-5)',
              }}>
                {experiment.description}
              </p>
              <div style={{
                display: 'flex',
                gap: 'var(--space-2)',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginRight: 'var(--space-2)',
                }}>
                  Category:
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: experiment.accentColor,
                  background: `${experiment.accentColor}18`,
                  border: `1px solid ${experiment.accentColor}30`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-1) var(--space-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {experiment.category}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Related experiments */}
      {related.length > 0 && (
        <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
          <div className="s-container">
            <Reveal>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                marginBottom: 'var(--space-8)',
              }}>
                More Experiments
              </div>
            </Reveal>
            <div className="s-grid-2">
              {related.map((exp, i) => (
                <Reveal key={exp.slug} delay={i * 0.08}>
                  <StandardCard
                    eyebrow={exp.category}
                    title={exp.name}
                    description={exp.description}
                    href={`/lab/${exp.slug}`}
                    status={exp.status}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ paddingBottom: 'var(--space-16)', background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-8)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                Want this kind of work for your project?
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <StandardButton href="/contact">Discuss a Build</StandardButton>
                <StandardButton variant="secondary" href="/services">View Services</StandardButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </motion.div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProjectBySlug, projects } from '@/data/projects'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import StandardCard from '@/components/standard/StandardCard'
import NotFound from '@/pages/NotFound'

const CATEGORY_COLORS = {
  software:    '#00C8FF',
  games:       '#FFB347',
  engineering: '#A0A0B8',
  ai:          '#8B5CF6',
  content:     '#FBBF24',
}

const STATUS_COLORS = {
  ACTIVE:  '#22C55E',
  BETA:    '#F59E0B',
  STABLE:  'var(--accent)',
  CONCEPT: '#8B5CF6',
}

function HeroImage({ project }) {
  const [failed, setFailed] = useState(false)
  const catColor = CATEGORY_COLORS[project.category[0]] || 'var(--accent)'

  return (
    <div style={{
      width: '100%',
      aspectRatio: '21/9',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xl)',
      background: 'var(--bg-elevated)',
    }}>
      {project.thumbnail && !failed ? (
        <img
          src={project.thumbnail}
          alt={project.name}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: `linear-gradient(135deg, ${catColor}22 0%, var(--bg-elevated) 60%, var(--bg-base) 100%)`,
        }} />
      )}
    </div>
  )
}

function GalleryImage({ src, alt }) {
  const [failed, setFailed] = useState(false)
  const reduced = useReducedMotion()
  return (
    <motion.div
      style={{
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: 'var(--bg-elevated)',
        aspectRatio: '16/10',
      }}
      whileHover={reduced ? {} : { scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'var(--accent-muted)' }} />
      )}
    </motion.div>
  )
}

export default function StandardProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const project = getProjectBySlug(slug)

  if (!project) return <NotFound />

  const catColor = CATEGORY_COLORS[project.category[0]] || 'var(--accent)'
  const statusColor = STATUS_COLORS[project.status] || 'var(--accent)'

  const related = project.relatedSlugs
    .map(s => projects.find(p => p.slug === s))
    .filter(Boolean)
    .slice(0, 3)

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <button
              onClick={() => navigate('/portfolio')}
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
              Back to Portfolio
            </button>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: catColor,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
            }}>
              {project.category[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <section style={{
        paddingTop: 'var(--space-12)',
        paddingBottom: 'var(--space-10)',
        background: 'var(--gradient-hero)',
      }}>
        <div className="s-container">
          <Reveal>
            <div style={{ maxWidth: 840, marginBottom: 'var(--space-8)' }}>
              <h1 style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-bold)',
                fontSize: 'var(--text-6xl)',
                color: 'var(--text-primary)',
                letterSpacing: 'var(--tracking-tight)',
                lineHeight: 'var(--leading-tight)',
                marginBottom: 'var(--space-4)',
              }}>
                {project.name}
              </h1>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-snug)',
                marginBottom: 'var(--space-5)',
              }}>
                {project.tagline}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--space-2) var(--space-4)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {project.status}
                  </span>
                </div>
                {project.timeline && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {project.timeline}
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <HeroImage project={project} />
          </Reveal>
        </div>
      </section>

      {/* Two-column: overview + stack + metrics */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="sp-two-col">
            {/* Left: overview */}
            <Reveal>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wider)',
                  marginBottom: 'var(--space-4)',
                }}>
                  Overview
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {project.description}
                </p>
              </div>
            </Reveal>

            {/* Right: stack + metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              {project.stack && project.stack.length > 0 && (
                <Reveal delay={0.1}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wider)',
                      marginBottom: 'var(--space-4)',
                    }}>
                      Stack
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {project.stack.map(tech => (
                        <span key={tech} style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          background: 'var(--accent-muted)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-1) var(--space-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {project.metrics && project.metrics.length > 0 && (
                <Reveal delay={0.15}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--accent)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--tracking-wider)',
                      marginBottom: 'var(--space-4)',
                    }}>
                      Metrics
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {project.metrics.map(m => (
                        <div key={m.label} style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--space-4) var(--space-5)',
                        }}>
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 'var(--space-1)',
                          }}>
                            {m.label}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 'var(--text-3xl)',
                            fontWeight: 'var(--weight-bold)',
                            color: 'var(--text-primary)',
                            lineHeight: 1,
                          }}>
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {project.images && project.images.length > 0 && (
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
                Gallery
              </div>
            </Reveal>
            <div className="s-grid-2">
              {project.images.map((src, i) => (
                <Reveal key={i} delay={i * 0.07}>
                  <GalleryImage src={src} alt={`${project.name} screenshot ${i + 1}`} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Model viewer */}
      {project.model && (
        <section className="s-section" style={{ background: 'var(--bg-base)' }}>
          <div className="s-container">
            <Reveal>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-wider)',
                marginBottom: 'var(--space-6)',
              }}>
                3D Model
              </div>
              <div style={{
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
              }}>
                <model-viewer
                  src={project.model}
                  alt={project.name}
                  camera-controls
                  auto-rotate
                  style={{ width: '100%', height: 480, display: 'block', background: 'var(--bg-elevated)' }}
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              maxWidth: 600,
              margin: '0 auto',
              textAlign: 'center',
              background: 'var(--bg-card)',
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
                marginBottom: 'var(--space-6)',
              }}>
                {project.cta?.label || 'Discuss This Work'}
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <StandardButton size="lg" href={project.cta?.href || '/contact'}>
                  Get in Touch
                </StandardButton>
                <StandardButton variant="ghost" href="/portfolio">
                  See More Work →
                </StandardButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Related projects */}
      {related.length > 0 && (
        <section className="s-section" style={{ background: 'var(--bg-base)' }}>
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
                Related Work
              </div>
            </Reveal>
            <div className="s-grid-3">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.07}>
                  <StandardCard
                    image={p.thumbnail}
                    eyebrow={p.category[0]}
                    title={p.name}
                    description={p.tagline}
                    href={`/portfolio/${p.slug}`}
                    status={p.status}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <style>{`
        .sp-two-col {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: var(--space-12);
          align-items: start;
        }
        @media (max-width: 900px) {
          .sp-two-col {
            grid-template-columns: 1fr;
            gap: var(--space-8);
          }
        }
      `}</style>
    </motion.div>
  )
}

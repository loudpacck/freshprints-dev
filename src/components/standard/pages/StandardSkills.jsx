import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { skillTiers, getToolsForDiscipline, getSpecializationsForTool } from '@/data/skills'
import { projects } from '@/data/projects'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'
import StandardCard from '@/components/standard/StandardCard'

const PROFICIENCY_LABELS = {
  PRODUCTION:   { label: 'Production', color: '#22C55E' },
  PROFESSIONAL: { label: 'Professional', color: 'var(--accent)' },
  ACTIVE:       { label: 'Active', color: '#F59E0B' },
}

function DisciplineDetail({ discipline }) {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const tools = getToolsForDiscipline(discipline.id)

  const relatedSlugs = [...new Set(tools.flatMap(t => t.projectLinks))]
  const relatedProjects = relatedSlugs
    .map(slug => projects.find(p => p.slug === slug))
    .filter(Boolean)
    .slice(0, 3)

  return (
    <motion.div
      key={discipline.id}
      initial={reduced ? {} : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? {} : { opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Heading */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-3xl)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          {discipline.label}
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-normal)',
          maxWidth: 600,
        }}>
          {discipline.description}
        </p>
      </div>

      {/* Tools + Specializations */}
      <div className="sd-detail-grid">
        {/* Tools */}
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-5)',
          }}>
            Tools
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {tools.map(tool => {
              const prof = PROFICIENCY_LABELS[tool.proficiency] || { label: tool.proficiency, color: 'var(--text-secondary)' }
              return (
                <div key={tool.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  gap: 'var(--space-3)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--weight-medium)',
                    color: 'var(--text-primary)',
                  }}>
                    {tool.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: prof.color }} />
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {prof.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Specializations */}
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-5)',
          }}>
            Specializations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {tools.flatMap(tool => {
              const specs = getSpecializationsForTool(tool.id)
              return specs.map(spec => (
                <div key={spec.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: discipline.color,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}>
                    {spec.label}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--text-quaternary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    via {skillTiers.tools.find(t => t.id === spec.parentId)?.label}
                  </span>
                </div>
              ))
            })}
            {tools.flatMap(t => getSpecializationsForTool(t.id)).length === 0 && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                More specializations being documented.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Related projects */}
      {relatedProjects.length > 0 && (
        <div style={{ marginTop: 'var(--space-10)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            marginBottom: 'var(--space-6)',
          }}>
            Projects Using These Skills
          </div>
          <div className="s-grid-3">
            {relatedProjects.map(p => (
              <StandardCard
                key={p.slug}
                image={p.thumbnail}
                eyebrow={p.category[0]}
                title={p.name}
                description={p.tagline}
                href={`/portfolio/${p.slug}`}
                status={p.status}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function StandardSkills() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(skillTiers.disciplines[0].id)

  const activeDiscipline = skillTiers.disciplines.find(d => d.id === activeId)

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
              // SKILLS
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
              Tools &amp; Disciplines
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              lineHeight: 'var(--leading-normal)',
            }}>
              Five disciplines, dozens of tools, learned through years of building.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Discipline tabs */}
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
          <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {skillTiers.disciplines.map(disc => (
              <button
                key={disc.id}
                onClick={() => setActiveId(disc.id)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: activeId === disc.id ? disc.color : 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeId === disc.id ? disc.color : 'transparent'}`,
                  cursor: 'pointer',
                  padding: 'var(--space-4) var(--space-5)',
                  whiteSpace: 'nowrap',
                  transition: 'all 150ms ease',
                }}
              >
                {disc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Discipline detail */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <AnimatePresence mode="wait">
            <DisciplineDetail key={activeId} discipline={activeDiscipline} />
          </AnimatePresence>
        </div>
      </section>

      {/* CTA */}
      <section style={{ paddingBottom: 'var(--space-16)', background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <div style={{
              textAlign: 'center',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 'var(--space-12)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-6)',
              }}>
                Want to talk about a project?
              </p>
              <StandardButton href="/contact">Get in Touch</StandardButton>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        .sd-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
          align-items: start;
        }
        @media (max-width: 768px) {
          .sd-detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </motion.div>
  )
}

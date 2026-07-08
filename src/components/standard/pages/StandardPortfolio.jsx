import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { projects } from '@/data/projects'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardPillFilter from '@/components/standard/StandardPillFilter'
import { factKeyForSlug } from '@/components/hire/blobert/blobertLines'

const FILTERS = [
  { value: 'all',         label: 'All' },
  { value: 'software',    label: 'Software' },
  { value: 'games',       label: 'Games' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'ai',          label: 'AI' },
  { value: 'content',     label: 'Content' },
]

const CATEGORY_COLORS = {
  software:    '#00C8FF',
  games:       '#FFB347',
  engineering: '#A0A0B8',
  ai:          '#8B5CF6',
  content:     '#FBBF24',
}

const STATUS_COLORS = {
  ACTIVE:         '#22C55E',
  BETA:           '#F59E0B',
  STABLE:         'var(--accent)',
  CONCEPT:        '#8B5CF6',
  PRODUCTION:     '#22C55E',
  IN_DEVELOPMENT: '#F59E0B',
  AVAILABLE:      '#FFFFFF',
}
const STATUS_DOT_EXTRA = {
  AVAILABLE: { boxShadow: '0 0 6px rgba(255,255,255,0.6)', border: '1px solid rgba(180,180,180,0.4)' },
}

function ProjectCard({ project }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [imgFailed, setImgFailed] = useState(false)
  const category = project.category[0]
  const catColor = CATEGORY_COLORS[category] || 'var(--accent)'
  const statusColor = STATUS_COLORS[project.status] || 'var(--accent)'
  const dotExtra = STATUS_DOT_EXTRA[project.status] || {}

  return (
    <motion.div
      onClick={() => navigate(`/portfolio/${project.slug}`)}
      data-blobert-fact={factKeyForSlug(project.slug) || undefined}
      whileHover={reduced ? {} : { y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        aspectRatio: '16/10',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}>
        {project.thumbnail && !imgFailed ? (
          <motion.img
            src={project.thumbnail}
            alt={project.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            whileHover={reduced ? {} : { scale: 1.02 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${catColor}22 0%, var(--bg-elevated) 100%)`,
          }} />
        )}
      </div>

      <div style={{
        padding: 'var(--space-5)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: catColor,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
        }}>
          {category}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
        }}>
          {project.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--leading-normal)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {project.tagline}
        </div>
        <div style={{
          marginTop: 'auto',
          paddingTop: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--accent)',
          }}>
            View →
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0, ...dotExtra }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
            }}>
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function StandardPortfolio() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState('all')

  const filtered = active === 'all'
    ? projects
    : projects.filter(p => p.category.includes(active))

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
              // PORTFOLIO
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
              Selected Work
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 640,
              lineHeight: 'var(--leading-normal)',
            }}>
              A small selection of recent builds across software, games, hardware, and AI.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <Reveal>
            <StandardPillFilter options={FILTERS} active={active} onChange={setActive} />
          </Reveal>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-16) 0',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              <p style={{ marginBottom: 'var(--space-4)' }}>No projects in this category yet.</p>
              <button
                onClick={() => setActive('all')}
                style={{
                  color: 'var(--accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  textDecoration: 'underline',
                }}
              >
                Show all →
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduced ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="s-grid-3"
                style={{ marginTop: 'var(--space-8)' }}
              >
                {filtered.map((project, i) => (
                  <Reveal key={project.slug} delay={i * 0.05}>
                    <ProjectCard project={project} />
                  </Reveal>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </motion.div>
  )
}

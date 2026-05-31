import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import FunkyCard from '@/components/funky/FunkyCard'
import FunkyButton from '@/components/funky/FunkyButton'
import FunkyDivider from '@/components/funky/FunkyDivider'
import { getFeaturedProjects } from '@/data/projects'

const CAPABILITIES = [
  { label: 'Software',    color: 'var(--accent-lime)' },
  { label: 'Games',       color: 'var(--accent-turquoise)' },
  { label: 'Engineering', color: 'var(--accent-coral)' },
  { label: 'AI',          color: 'var(--accent-peach)' },
]

const SECTION_CTAS = [
  { label: 'Browse Work', to: '/portfolio', variant: 'primary' },
  { label: 'Services',    to: '/services',  variant: 'secondary' },
  { label: 'The Lab',     to: '/lab',       variant: 'ghost' },
  { label: 'Get in Touch', to: '/contact',  variant: 'ghost' },
]

// Two-line title; each word reveals with a settling skew ("warp") + rise.
const TITLE_LINES = [['Fresh'], ['Prints']]

function FeaturedCard({ project, onClick }) {
  return (
    <FunkyCard onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {project.thumbnail && (
        <div style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          <img
            src={project.thumbnail}
            alt={project.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--accent-turquoise)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
      }}>
        {project.category[0]}
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
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        lineHeight: 'var(--leading-normal)',
        margin: 0,
      }}>
        {project.tagline}
      </p>
    </FunkyCard>
  )
}

export default function FunkyLanding() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const featured = getFeaturedProjects().slice(0, 3)

  // Orchestrated load reveal: eyebrow → title words → subhead → CTAs → chips.
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  }
  const word = {
    // Starts fully below its own box (mask-reveals up out of the clip wrapper),
    // with a settling skew + deblur for the "warp". y is a % of the word height
    // so the clip wrapper's bottom padding (for descenders) is unaffected.
    hidden: reduced ? {} : { opacity: 0, y: '100%', skewX: '8deg', filter: 'blur(6px)' },
    show: reduced ? {} : {
      opacity: 1, y: 0, skewX: '0deg', filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
    },
  }
  const rise = {
    hidden: reduced ? {} : { opacity: 0, y: 18 },
    show: reduced ? {} : { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Hero ── */}
      <section style={{
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-10)',
        background: 'var(--gradient-hero)',
      }}>
        <div className="s-container">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={rise} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-turquoise)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-widest)',
              marginBottom: 'var(--space-4)',
            }}>
              // PSYCHEDELIC STUDIO
            </motion.div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-extrabold)',
              fontSize: 'var(--display-2xl)',
              lineHeight: 'var(--leading-display)',
              letterSpacing: 'var(--tracking-display)',
              margin: 0,
              marginBottom: 'var(--space-5)',
            }}>
              {TITLE_LINES.map((line, li) => (
                <span key={li} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.2em', marginBottom: '-0.2em' }}>
                  {line.map((w, wi) => (
                    <motion.span
                      key={wi}
                      variants={word}
                      style={{
                        display: 'inline-block',
                        background: 'var(--gradient-text)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'var(--accent)',
                        paddingRight: '0.12em',
                      }}
                    >
                      {w}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>

            <motion.p variants={rise} style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
              maxWidth: 'var(--measure-prose)',
              marginBottom: 'var(--space-7)',
            }}>
              I'm Kyle — I build software, games, hardware, and AI experiments.
              Same work, wilder wrapper. Pick a thread and pull.
            </motion.p>

            <motion.div variants={rise} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {SECTION_CTAS.map(cta => (
                <FunkyButton key={cta.to} variant={cta.variant} onClick={() => navigate(cta.to)}>
                  {cta.label}
                </FunkyButton>
              ))}
            </motion.div>

            <motion.div variants={rise} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-8)' }}>
              {CAPABILITIES.map(cap => (
                <span key={cap.label} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--text-primary)',
                  border: `1.5px solid ${cap.color}`,
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 12px',
                }}>
                  {cap.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <FunkyDivider variant="rings" />

      {/* ── Featured Work ── */}
      {featured.length > 0 && (
        <section className="s-section" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="s-container">
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--display-md)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-display)',
              marginBottom: 'var(--space-6)',
            }}>
              Featured Work
            </h2>
            <div className="s-grid-3">
              {featured.map(project => (
                <FeaturedCard
                  key={project.slug}
                  project={project}
                  onClick={() => navigate(`/portfolio/${project.slug}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <FunkyDivider variant="waves" />

      {/* ── Contact CTA ── */}
      <section className="s-section" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="s-container">
          <FunkyCard style={{
            padding: 'var(--space-10) var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 'var(--space-4)',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--display-md)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-display)',
              margin: 0,
            }}>
              Got something to build?
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              maxWidth: 'var(--measure-prose)',
              margin: 0,
            }}>
              Available for contracting work. Response time typically under 24 hours.
            </p>
            <FunkyButton variant="primary" onClick={() => navigate('/contact')}>
              Start a Conversation
            </FunkyButton>
          </FunkyCard>
        </div>
      </section>
    </motion.div>
  )
}

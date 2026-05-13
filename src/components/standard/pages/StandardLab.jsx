import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { experiments } from '@/data/labExperiments'
import useReducedMotion from '@/hooks/useReducedMotion'
import Reveal from '@/components/standard/StandardReveal'
import StandardButton from '@/components/standard/StandardButton'

const STATUS_COLORS = {
  ACTIVE:  '#22C55E',
  BETA:    '#F59E0B',
  STABLE:  'var(--accent)',
  CONCEPT: '#8B5CF6',
}

function ExperimentCard({ experiment }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const statusColor = STATUS_COLORS[experiment.status] || 'var(--accent)'

  return (
    <motion.div
      onClick={() => navigate(`/lab/${experiment.slug}`)}
      whileHover={reduced ? {} : { y: -2, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Preview area */}
      <div style={{
        aspectRatio: '16/9',
        background: `linear-gradient(135deg, ${experiment.accentColor}18 0%, var(--bg-elevated) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--weight-bold)',
          color: experiment.accentColor,
          opacity: 0.35,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {experiment.shortName}
        </span>
        {/* Status badge */}
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-overlay)',
          backdropFilter: 'blur(8px)',
          borderRadius: '999px',
          padding: '0.25rem 0.625rem',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {experiment.status}
          </span>
        </div>
      </div>

      {/* Body */}
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
          color: experiment.accentColor,
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
        }}>
          {experiment.category}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--weight-semibold)',
          fontSize: 'var(--text-xl)',
          color: 'var(--text-primary)',
          lineHeight: 'var(--leading-snug)',
        }}>
          {experiment.name}
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
          {experiment.description}
        </div>
        <div style={{
          marginTop: 'auto',
          paddingTop: 'var(--space-3)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          color: 'var(--accent)',
        }}>
          Try it →
        </div>
      </div>
    </motion.div>
  )
}

function NewsletterStrip() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', email }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section style={{
      background: 'var(--bg-elevated)',
      padding: 'var(--space-12) 0',
      borderTop: '1px solid var(--border-subtle)',
    }}>
      <div className="s-container">
        <Reveal>
          <div style={{
            maxWidth: 560,
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wider)',
              marginBottom: 'var(--space-3)',
            }}>
              // STAY IN THE LOOP
            </div>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-3xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}>
              Get notified about new experiments
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-6)',
            }}>
              No noise. Just a note when something new ships.
            </p>
            {status === 'success' ? (
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: '#22C55E',
              }}>
                You're in. Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                gap: 'var(--space-3)',
                maxWidth: 400,
                margin: '0 auto',
              }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: 1,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-3)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
                <StandardButton
                  type="submit"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? '…' : 'Subscribe'}
                </StandardButton>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export default function StandardLab() {
  const reduced = useReducedMotion()

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
              // THE LAB
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
              Experiments in Progress
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 600,
              lineHeight: 'var(--leading-normal)',
            }}>
              Interactive research. Some become products. Most teach me something. All of them get shipped here first.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Experiments grid */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="s-grid-2">
            {experiments.map((exp, i) => (
              <Reveal key={exp.slug} delay={i * 0.07}>
                <ExperimentCard experiment={exp} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <NewsletterStrip />
    </motion.div>
  )
}

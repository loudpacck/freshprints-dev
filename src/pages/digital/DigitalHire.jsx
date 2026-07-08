import { useRef } from 'react'
import { motion } from 'framer-motion'
import { bottomCtas } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'
import useReducedMotion from '@/hooks/useReducedMotion'
import HireHeroDigital from '@/components/hire/HireHeroDigital'
import HireThemeTiles from '@/components/hire/HireThemeTiles'
import HireActionButton from '@/components/hire/HireActionButton'
import { useInViewOnce, useStatCountUp, useCardPointer } from '@/components/hire/hireCardUtils'

// One stat, counting up from 0 once its card scrolls into view, then breathing
// a subtle cyan "live" pulse so the numbers feel real-time.
function StatValue({ value, label, reduced, active }) {
  const { text, done } = useStatCountUp(value, { reduced, active })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <span
        className={done && !reduced ? 'dh-stat-num is-live' : 'dh-stat-num'}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--color-text-primary)',
          lineHeight: 1,
        }}
      >
        {text}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
      }}>
        {label}
      </span>
    </div>
  )
}

function ProjectRow({ project }) {
  const reduced = useReducedMotion()
  const cardRef = useRef(null)
  const inView = useInViewOnce(cardRef)
  useCardPointer(cardRef, { reduced })
  const isLive = project.id === 'pantheon-wars'

  return (
    <div
      ref={cardRef}
      id={`blobert-card-${project.id}`}
      className="dh-row"
      style={{
        position: 'relative',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        // Pointer-driven 3D tilt toward the cursor (fine-pointer only; vars stay
        // 0 at rest and under reduced motion / touch → flat static card).
        ['--rx']: 0, ['--ry']: 0, ['--mx']: 0.5, ['--my']: 0.5, ['--pactive']: 0,
        transform: reduced
          ? 'none'
          : 'perspective(1000px) rotateY(calc(var(--rx) * 9deg)) rotateX(calc(var(--ry) * -9deg))',
        transformStyle: 'preserve-3d',
        transition: 'transform 160ms ease-out',
        willChange: 'transform',
      }}
    >
      {/* Neon edge highlight that follows the pointer */}
      {!reduced && (
        <div
          aria-hidden="true"
          className="dh-glow"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            opacity: 'var(--pactive)',
            transition: 'opacity 200ms ease',
            background: 'radial-gradient(420px circle at calc(var(--mx) * 100%) calc(var(--my) * 100%), var(--color-accent-primary-glow), transparent 62%)',
            mixBlendMode: 'screen',
          }}
        />
      )}

      <div style={{ aspectRatio: '16/10', background: 'var(--color-bg-elevated)', overflow: 'hidden' }}>
        <img
          src={project.thumbnail}
          alt={project.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      </div>

      <div style={{ padding: 'var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-3xl)',
            color: 'var(--color-text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: 'var(--space-2)',
          }}>
            {project.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
          }}>
            {project.tagline}
          </div>
        </div>

        {project.highlight && (
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              color: 'var(--color-accent-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              {project.highlight}
            </div>
            {project.supporting && (
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-normal)',
              }}>
                {project.supporting}
              </div>
            )}
          </div>
        )}

        {project.features && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {project.features.map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <span aria-hidden="true" style={{
                  width: 8, height: 8, marginTop: 6, flexShrink: 0,
                  background: 'var(--color-accent-primary)',
                }} />
                <div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'var(--weight-medium)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                  }}>
                    {f.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {' '}— {f.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLive && (
          <div className="dh-live" aria-label="Live game" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            alignSelf: 'flex-start',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            color: 'var(--color-accent-primary)',
          }}>
            <span className={reduced ? 'dh-live-dot' : 'dh-live-dot dh-beat'} aria-hidden="true" />
            Live
          </div>
        )}

        {project.stats?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
            {project.stats.map(stat => (
              <StatValue key={stat.label} value={stat.value} label={stat.label} reduced={reduced} active={inView} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
          <HireActionButton url={project.buttonUrl} isExternal={project.isExternal} variant="primary">
            {project.buttonLabel}
          </HireActionButton>
        </div>
      </div>
    </div>
  )
}

export default function DigitalHire() {
  const { hireProjects } = useHirePageStats()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cinematic hero (Phase 1 overhaul) */}
      <HireHeroDigital />

      <div className="page-container" style={{ position: 'relative', zIndex: 1, background: 'var(--color-bg-base)' }}>

        {/* Project rows */}
        <section style={{ marginBottom: 'var(--space-20)', paddingTop: 'var(--space-16)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-6)',
          }}>
            // THE PROOF
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {hireProjects.map(project => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </section>

        {/* Theme tiles */}
        <section style={{ marginBottom: 'var(--space-20)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-widest)',
            marginBottom: 'var(--space-6)',
          }}>
            // SEE IT IN ANY INTERFACE
          </div>
          <HireThemeTiles />
        </section>

        {/* Bottom CTAs */}
        <div id="blobert-contact-cta" style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <HireActionButton url={bottomCtas.otherStuff.url} variant="secondary" size="lg">
            {bottomCtas.otherStuff.label}
          </HireActionButton>
          <HireActionButton
            url={bottomCtas.letsWork.url}
            variant="primary"
            size="lg"
            style={{ boxShadow: 'var(--shadow-lg)', fontSize: 'var(--text-base)', padding: 'var(--space-5) var(--space-10)' }}
          >
            {bottomCtas.letsWork.label} →
          </HireActionButton>
        </div>

      </div>

      <style>{`
        .dh-row {
          display: grid;
          grid-template-columns: 320px 1fr;
        }
        @media (max-width: 768px) {
          .dh-row { grid-template-columns: 1fr; }
        }
        /* Live pulse — a soft cyan breath on each stat after it counts up. */
        .dh-stat-num.is-live {
          animation: dh-stat-breath 3.2s ease-in-out infinite;
        }
        @keyframes dh-stat-breath {
          0%, 100% { text-shadow: 0 0 0 transparent; opacity: 1; }
          50% { text-shadow: 0 0 14px var(--color-accent-primary-glow); opacity: 0.9; }
        }
        /* Pantheon "LIVE" heartbeat dot. */
        .dh-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-accent-primary);
          box-shadow: 0 0 8px var(--color-accent-primary-glow);
        }
        .dh-live-dot.dh-beat { animation: dh-beat 1.8s ease-in-out infinite; }
        @keyframes dh-beat {
          0%, 100% { transform: scale(1); opacity: 1; }
          14% { transform: scale(1.5); opacity: 0.75; }
          28% { transform: scale(1); opacity: 1; }
          42% { transform: scale(1.35); opacity: 0.8; }
          56% { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dh-stat-num.is-live, .dh-live-dot.dh-beat { animation: none !important; }
          .dh-row { transform: none !important; }
        }
      `}</style>
    </motion.div>
  )
}

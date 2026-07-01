import { useRef } from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'
import Reveal from '@/components/standard/StandardReveal'
import StandardSectionHeader from '@/components/standard/StandardSectionHeader'
import HireHeroStandard from '@/components/hire/HireHeroStandard'
import HireThemeTiles from '@/components/hire/HireThemeTiles'
import HireActionButton from '@/components/hire/HireActionButton'
import { bottomCtas } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'
import { useInViewOnce, useStatCountUp, useCardPointer } from '@/components/hire/hireCardUtils'

// Win95 raised bevel (matches HireThemeTiles / RetroButton) — used for the
// Retro card's chunky beveled-panel feel.
const RETRO_RAISED = `
  inset 1px 1px 0 var(--bevel-highlight),
  inset -1px -1px 0 var(--bevel-dark),
  inset 2px 2px 0 var(--bevel-light),
  inset -2px -2px 0 var(--bevel-shadow)
`.trim()

// One stat, counting up from 0 once the card enters view, then a subtle
// theme-adaptive "live" breath (CSS scoped by [data-ui] in the style block).
function StatValue({ value, label, reduced, active }) {
  const { text, done } = useStatCountUp(value, { reduced, active })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <span
        className={done && !reduced ? 'hire-stat-num is-live' : 'hire-stat-num'}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 'var(--weight-bold)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {text}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wide)',
      }}>
        {label}
      </span>
    </div>
  )
}

function ProjectRow({ project, index }) {
  const reduced = useReducedMotion()
  const { themeId } = useTheme()
  const cardRef = useRef(null)
  const inView = useInViewOnce(cardRef)

  const isRetro = themeId === 'retro'
  const isFunky = themeId === 'funky'
  const isStandard = !isRetro && !isFunky
  const isLive = project.id === 'pantheon-wars'

  // Retro uses a chunky hover-snap (handlers below), not smooth pointer tilt.
  useCardPointer(cardRef, { reduced, disabled: isRetro })

  // Per-theme card presentation.
  const cardStyle = {
    position: 'relative',
    background: 'var(--bg-card)',
    border: isRetro ? 'none' : '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    ['--rx']: 0, ['--ry']: 0, ['--mx']: 0.5, ['--my']: 0.5, ['--pactive']: 0,
  }

  if (isRetro) {
    cardStyle.boxShadow = RETRO_RAISED
    cardStyle.transition = 'transform 60ms ease-out'
  } else if (isFunky) {
    // Springy, playful tilt toward the cursor + gentle squish, liquid easing.
    cardStyle.boxShadow = 'var(--shadow-sm)'
    cardStyle.transformStyle = 'preserve-3d'
    cardStyle.willChange = 'transform'
    cardStyle.transform = reduced
      ? 'none'
      : 'perspective(900px) rotateY(calc(var(--rx) * 11deg)) rotateX(calc(var(--ry) * -11deg)) scale(calc(1 + var(--pactive) * 0.03))'
    cardStyle.transition = 'transform 420ms var(--ease-liquid, cubic-bezier(0.5, 1.4, 0.4, 1))'
  } else {
    // Standard — no tilt: a soft shadow that shifts with the pointer + inner
    // parallax (thumbnail deeper than content). Premium, restrained.
    cardStyle.boxShadow = reduced
      ? 'var(--shadow-sm)'
      : 'calc(var(--rx) * 20px) calc(10px + var(--ry) * 20px) 42px var(--shadow-color, rgba(2, 6, 23, 0.16))'
    cardStyle.transition = 'box-shadow 240ms ease-out'
  }

  // Retro snap handlers — chunky lift on hover, no pointer tracking.
  const retroHandlers = isRetro && !reduced
    ? {
        onMouseEnter: e => {
          e.currentTarget.style.transform = 'translate(-3px, -3px)'
          e.currentTarget.style.boxShadow = `${RETRO_RAISED}, 4px 4px 0 var(--bevel-dark)`
        },
        onMouseLeave: e => {
          e.currentTarget.style.transform = ''
          e.currentTarget.style.boxShadow = RETRO_RAISED
        },
      }
    : {}

  const thumbImgStyle = {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    ...(isStandard && !reduced
      ? {
          transform: 'translate(calc(var(--rx) * 5px), calc(var(--ry) * 5px)) scale(calc(1 + var(--pactive) * 0.08))',
          transition: 'transform 260ms ease-out',
          willChange: 'transform',
        }
      : {}),
  }

  const contentParallax = isStandard && !reduced
    ? {
        transform: 'translate(calc(var(--rx) * 2px), calc(var(--ry) * 2px))',
        transition: 'transform 260ms ease-out',
      }
    : {}

  return (
    <Reveal delay={index * 0.06}>
      <div
        ref={cardRef}
        className="hire-row"
        style={cardStyle}
        {...retroHandlers}
      >
        <div style={{
          aspectRatio: '16/10',
          background: 'var(--bg-elevated)',
          overflow: 'hidden',
        }}>
          <img
            src={project.thumbnail}
            alt={project.name}
            style={thumbImgStyle}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        <div style={{ padding: 'var(--space-7)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', ...contentParallax }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--display-sm)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-2)',
            }}>
              {project.name}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
            }}>
              {project.tagline}
            </div>
          </div>

          {project.highlight && (
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-xl)',
                color: 'var(--accent)',
                marginBottom: 'var(--space-2)',
              }}>
                {project.highlight}
              </div>
              {project.supporting && (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
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
                    background: 'var(--accent)', borderRadius: 2,
                  }} />
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 'var(--weight-semibold)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}>
                      {f.label}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)',
                    }}>
                      {' '}— {f.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLive && (
            <div className="hire-live" aria-label="Live game" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              alignSelf: 'flex-start',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              color: 'var(--accent)',
            }}>
              <span className={reduced ? 'hire-live-dot' : 'hire-live-dot hire-beat'} aria-hidden="true" />
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
            <HireActionButton url={project.buttonUrl} isExternal={project.isExternal} size="md">
              {project.buttonLabel}
            </HireActionButton>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

export default function StandardHire() {
  const reduced = useReducedMotion()
  const { hireProjects } = useHirePageStats()

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cinematic hero (Phase 1 overhaul) — branches Standard / Retro / Funky by themeId */}
      <HireHeroStandard />

      {/* Project rows */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <StandardSectionHeader eyebrow="// THE PROOF" heading="What I've Shipped" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {hireProjects.map((project, i) => (
              <ProjectRow key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Theme tiles */}
      <section className="s-section" style={{ background: 'var(--bg-elevated)' }}>
        <div className="s-container">
          <StandardSectionHeader eyebrow="// LIVE PREVIEW" heading="See It In Any Interface" subtitle="Click a tile to swap the UI right here, in place." />
          <HireThemeTiles />
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="s-section" style={{ background: 'var(--bg-base)' }}>
        <div className="s-container">
          <div className="hire-cta-row">
            <HireActionButton url={bottomCtas.otherStuff.url} variant="secondary" size="lg">
              {bottomCtas.otherStuff.label}
            </HireActionButton>
            <HireActionButton
              url={bottomCtas.letsWork.url}
              variant="primary"
              size="lg"
              style={{
                fontSize: 'var(--text-lg)',
                padding: 'var(--space-5) var(--space-10)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {bottomCtas.letsWork.label} →
            </HireActionButton>
          </div>
        </div>
      </section>

      <style>{`
        .hire-row {
          display: grid;
          grid-template-columns: 320px 1fr;
        }
        @media (max-width: 768px) {
          .hire-row { grid-template-columns: 1fr; }
        }
        .hire-cta-row {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
        }

        /* Live pulse — subtle breath on each stat after it counts up.
           Base is a restrained opacity breath (Standard/Retro); Funky adds an
           accent glow. Theme-adaptive via [data-ui] scoping. */
        .hire-stat-num.is-live {
          animation: hire-stat-breath 3.4s ease-in-out infinite;
        }
        @keyframes hire-stat-breath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
        [data-ui="funky"] .hire-stat-num.is-live {
          animation: hire-stat-glow 3s ease-in-out infinite;
        }
        @keyframes hire-stat-glow {
          0%, 100% { opacity: 1; text-shadow: 0 0 0 transparent; }
          50% { opacity: 0.92; text-shadow: 0 0 16px var(--accent); }
        }

        /* Pantheon "LIVE" indicator — accent dot with a soft heartbeat. */
        .hire-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
        }
        [data-ui="funky"] .hire-live-dot {
          box-shadow: 0 0 8px var(--accent);
        }
        [data-ui="retro"] .hire-live-dot {
          width: 9px;
          height: 9px;
          border-radius: 0;
          box-shadow:
            inset 1px 1px 0 var(--bevel-highlight),
            inset -1px -1px 0 var(--bevel-dark);
        }
        .hire-live-dot.hire-beat { animation: hire-beat 1.8s ease-in-out infinite; }
        @keyframes hire-beat {
          0%, 100% { transform: scale(1); opacity: 1; }
          14% { transform: scale(1.5); opacity: 0.75; }
          28% { transform: scale(1); opacity: 1; }
          42% { transform: scale(1.35); opacity: 0.8; }
          56% { transform: scale(1); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hire-stat-num.is-live,
          .hire-live-dot.hire-beat { animation: none !important; }
          .hire-row { transform: none !important; }
        }
      `}</style>
    </motion.div>
  )
}

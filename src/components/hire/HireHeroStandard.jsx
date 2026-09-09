import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import { useTheme } from '@/themes/useTheme'
import { useHireTone } from '@/components/hire/HireToneContext'
import RetroCard from '@/components/retro/RetroCard'
import RetroButton from '@/components/retro/RetroButton'
import KisharCard from '@/components/kishar/KisharCard'
import KisharButton from '@/components/kishar/KisharButton'
import KisharSectionRule from '@/components/kishar/KisharSectionRule'
import { formatEyebrow } from '@/utils/eyebrow'
import { heroCopy } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'
import {
  useCountUp,
  useEntranceSound,
  usePointerVars,
  formatViews,
  scrollToContent,
} from './hireHeroUtils'

const TOGGLE = [
  { id: 'confident', label: 'Confident' },
  { id: 'funny', label: 'Funny' },
]

// ─────────────────────────────────────────────────────────── shared bits ──

function LiveViews({ views, mono = 'var(--font-mono)', color = 'var(--text-tertiary)', accent = 'var(--accent-ink, var(--accent))' }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 'var(--text-sm)', color, whiteSpace: 'nowrap' }}>
      <span style={{ color: accent }}>{formatViews(views)}</span> page views and counting
    </div>
  )
}

// ────────────────────────────────────────────────────────────── STANDARD ──
// Words rise + fade in, staggered. Restrained cursor-follow gradient. Polished.

function StandardVariant({ copyMode, setCopyMode, copy, reduced, views }) {
  const rootRef = useRef(null)
  const words = copy.headline.split(' ')

  return (
    <section
      ref={rootRef}
      className="hhs-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-16) 0 var(--space-10)',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      {/* Phase 8: the cursor-follow accent glow is gone. Standard is a flat,
          unlit surface — no bloom, no gradient wash. */}

      <div className="s-container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent-ink, var(--accent))',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-4)',
        }}>
          // HIRE ME
        </div>

        <motion.h1
          key={copyMode}
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduced ? 0 : 0.05 } },
          }}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 'var(--weight-bold)',
            fontSize: 'var(--display-2xl)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 'var(--leading-tight)',
            margin: 0,
            marginBottom: 'var(--space-5)',
            maxWidth: 960,
          }}
        >
          {words.map((w, i) => (
            <motion.span
              key={`${copyMode}-${i}`}
              variants={{
                hidden: reduced ? {} : { opacity: 0, y: '0.5em' },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              style={{ display: 'inline-block', marginRight: '0.28em' }}
            >
              {w}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          key={`${copyMode}-sub`}
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.25 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xl)',
            color: 'var(--text-secondary)',
            maxWidth: 640,
            lineHeight: 'var(--leading-normal)',
            margin: 0,
            marginBottom: 'var(--space-6)',
          }}
        >
          {copy.subhead}
        </motion.p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: 'var(--space-1)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
          }}>
            {TOGGLE.map(opt => {
              const active = copyMode === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setCopyMode(opt.id)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-medium)',
                    padding: 'var(--space-2) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <LiveViews views={views} />
        </div>
      </div>

      <ScrollCue reduced={reduced} theme="standard" />
    </section>
  )
}

// ───────────────────────────────────────────────────────────────── RETRO ──
// Brief "loading" beat, then the headline opens in a Win95 window.

function RetroVariant({ copyMode, setCopyMode, copy, reduced, views }) {
  const rootRef = useRef(null)
  const [phase, setPhase] = useState(reduced ? 'open' : 'loading')
  usePointerVars(rootRef, reduced)

  useEffect(() => {
    if (reduced) return
    const id = setTimeout(() => setPhase('open'), 850)
    return () => clearTimeout(id)
  }, [reduced])

  return (
    <section
      ref={rootRef}
      className="hhr-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-6)',
        background: 'var(--bg-base)',
        overflow: 'hidden',
        ['--px']: 0,
        ['--py']: 0,
      }}
    >
      {phase === 'loading' ? (
        <div style={{ width: 'min(360px, 90vw)' }}>
          <RetroCard title="Starting HIRE.EXE…">
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Loading portfolio…
            </div>
            <div className="retro-inset" style={{ height: 20, padding: 2, background: 'var(--bg-content)' }}>
              <div className="hhr-progress" style={{ height: '100%', background: 'var(--titlebar-active-end)' }} />
            </div>
          </RetroCard>
        </div>
      ) : (
        <motion.div
          initial={reduced ? {} : { scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1] }}
          style={{
            width: 'min(880px, 94vw)',
            transform: 'translate(calc(var(--px) * 8px), calc(var(--py) * 8px))',
          }}
        >
          <RetroCard title="HIRE.EXE — Kyle // Fresh Prints">
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--accent-bright, var(--text-primary))',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'var(--space-3)',
            }}>
              C:\HIRE ME
            </div>

            <motion.h1
              key={copyMode}
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 800,
                fontSize: 'clamp(2rem, 1.4rem + 3.4vw, 3.5rem)',
                color: 'var(--text-primary)',
                lineHeight: 1.05,
                margin: 0,
                marginBottom: 'var(--space-4)',
              }}
            >
              {copy.headline}
            </motion.h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-normal)',
              margin: 0,
              marginBottom: 'var(--space-5)',
              maxWidth: 620,
            }}>
              {copy.subhead}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
              {TOGGLE.map(opt => (
                <RetroButton
                  key={opt.id}
                  variant={copyMode === opt.id ? 'primary' : 'default'}
                  onClick={() => setCopyMode(opt.id)}
                >
                  {opt.label}
                </RetroButton>
              ))}
            </div>

            <div className="retro-inset" style={{
              display: 'inline-block',
              padding: '2px 8px',
              background: 'var(--bg-content)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
            }}>
              {formatViews(views)} page views and counting
            </div>
          </RetroCard>
        </motion.div>
      )}

      <ScrollCue reduced={reduced} theme="retro" />

      <style>{`
        .hhr-progress {
          width: 0%;
          animation: hhr-load 0.85s linear 1 forwards;
        }
        @keyframes hhr-load { from { width: 0%; } to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) {
          .hhr-progress { animation: none !important; width: 100%; }
        }
      `}</style>
    </section>
  )
}

// ───────────────────────────────────────────────────────────────── FUNKY ──
// Gradient headline with springy bounce-in + gentle idle wobble. The global
// FunkyBackground blobs show through (section is transparent under funky).

function FunkyVariant({ copyMode, setCopyMode, copy, reduced, views }) {
  const rootRef = useRef(null)
  usePointerVars(rootRef, reduced)
  const words = copy.headline.split(' ')

  return (
    <section
      ref={rootRef}
      className="hhf-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-16) 0 var(--space-10)',
        overflow: 'hidden',
        ['--px']: 0,
        ['--py']: 0,
      }}
    >
      <div className="s-container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
          marginBottom: 'var(--space-4)',
        }}>
          // HIRE ME
        </div>

        <h1
          className={reduced ? 'hhf-headline' : 'hhf-headline hhf-wobble'}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'var(--display-2xl)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            margin: 0,
            marginBottom: 'var(--space-5)',
            maxWidth: 980,
            transform: 'rotate(calc(var(--px) * 1.4deg))',
          }}
        >
          {words.map((w, i) => (
            <motion.span
              key={`${copyMode}-${i}`}
              initial={reduced ? {} : { opacity: 0, y: 26, rotate: -6 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                duration: 0.6,
                delay: reduced ? 0 : i * 0.06,
                ease: [0.5, 1.4, 0.4, 1], // rubbery overshoot (matches --ease-liquid)
              }}
              style={{
                display: 'inline-block',
                marginRight: '0.28em',
                backgroundImage: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          key={`${copyMode}-sub`}
          initial={reduced ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.3 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-xl)',
            color: 'var(--text-secondary)',
            maxWidth: 640,
            lineHeight: 'var(--leading-normal)',
            margin: 0,
            marginBottom: 'var(--space-6)',
          }}
        >
          {copy.subhead}
        </motion.p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: 'var(--space-1)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 999,
          }}>
            {TOGGLE.map(opt => {
              const active = copyMode === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setCopyMode(opt.id)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    padding: 'var(--space-2) var(--space-5)',
                    borderRadius: 999,
                    border: 'none',
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--bg-base)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 200ms var(--ease-liquid, ease)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <LiveViews views={views} />
        </div>
      </div>

      <ScrollCue reduced={reduced} theme="funky" />

      <style>{`
        .hhf-wobble { animation: hhf-wobble 6s ease-in-out infinite; transform-origin: left center; }
        @keyframes hhf-wobble {
          0%, 100% { transform: rotate(-0.6deg) translateY(0); }
          50% { transform: rotate(0.6deg) translateY(-4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hhf-wobble { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

// ────────────────────────────────────────────────────────── scroll cue ──


// -------------------------------------------------------------- KISHAR --
// The headline is set on a plate: leather-dark in the dark, parchment in the
// light, inside the same double frame and gilt corner marks the cards carry.
// Words fade up in sequence. Nothing tilts, nothing lifts, nothing glows.

function KisharVariant({ copyMode, setCopyMode, copy, reduced, views }) {
  const words = copy.headline.split(' ')

  return (
    <section
      className="hhk-root"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--space-16) 0 var(--space-10)',
        overflow: 'hidden',
      }}
    >
      <div className="s-container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <KisharCard padding="var(--space-12) var(--space-10)">
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--label-size)',
            color: 'var(--accent-ink)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--label-tracking)',
            marginBottom: 'var(--space-5)',
          }}>
            {formatEyebrow('Hire Me', 'kishar')}
          </div>

          <motion.h1
            key={copyMode}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: reduced ? 0 : 0.05 } },
            }}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--display-xl)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-display)',
              lineHeight: 'var(--leading-display)',
              margin: '0 0 var(--space-6)',
              maxWidth: 960,
            }}
          >
            {words.map((w, i) => (
              <motion.span
                key={copyMode + '-' + i}
                variants={{
                  hidden: reduced ? {} : { opacity: 0, y: '0.3em' },
                  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                }}
                style={{ display: 'inline-block', marginRight: '0.26em' }}
              >
                {w}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            key={copyMode + '-sub'}
            initial={reduced ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.25 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: 'var(--measure-prose)',
              lineHeight: 'var(--leading-relaxed)',
              margin: '0 0 var(--space-7)',
            }}
          >
            {copy.subhead}
          </motion.p>

          <KisharSectionRule margin="0 0 var(--space-7)" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', gap: 'var(--space-3)' }}>
              {TOGGLE.map(opt => (
                <KisharButton
                  key={opt.id}
                  variant={copyMode === opt.id ? 'primary' : 'secondary'}
                  onClick={() => setCopyMode(opt.id)}
                >
                  {opt.label}
                </KisharButton>
              ))}
            </div>
            <LiveViews views={views} color="var(--text-tertiary)" accent="var(--accent-ink)" />
          </div>
        </KisharCard>
      </div>

      <ScrollCue reduced={reduced} theme="kishar" />
    </section>
  )
}

function ScrollCue({ reduced, theme }) {
  const color = theme === 'retro' ? 'var(--accent-bright, var(--text-primary))' : 'var(--accent-ink, var(--accent))'
  return (
    <button
      onClick={() => scrollToContent(reduced)}
      aria-label="Scroll to projects"
      className="hh-scrollcue"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 'var(--space-6)',
        transform: 'translateX(-50%)',
        zIndex: 2,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-wider)',
      }}
    >
      <span>Scroll</span>
      <span className={reduced ? '' : 'hh-bob'} aria-hidden="true" style={{ fontSize: '1.1rem', lineHeight: 1 }}>▾</span>
      <style>{`
        .hh-bob { animation: hh-bob 1.8s ease-in-out infinite; }
        @keyframes hh-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
        @media (prefers-reduced-motion: reduce) { .hh-bob { animation: none !important; } }
      `}</style>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────── router ──

export default function HireHeroStandard() {
  const { themeId } = useTheme()
  const reduced = useReducedMotion()
  const { copyMode, setCopyMode } = useHireTone()
  const copy = heroCopy[copyMode]
  const { stats } = useHirePageStats()

  useEntranceSound()
  const views = useCountUp(stats.gamePageViews, { reduced, duration: 1600 })

  const shared = { copyMode, setCopyMode, copy, reduced, views }

  if (themeId === 'retro') return <RetroVariant {...shared} />
  if (themeId === 'funky') return <FunkyVariant {...shared} />
  if (themeId === 'kishar') return <KisharVariant {...shared} />
  return <StandardVariant {...shared} />
}

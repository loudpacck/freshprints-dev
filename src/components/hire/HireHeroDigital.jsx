import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '@/hooks/useReducedMotion'
import ParticleField from '@/components/effects/ParticleField'
import { heroCopy } from '@/data/hirePageData'
import { useHirePageStats } from '@/hooks/useHirePageStats'
import {
  useCountUp,
  useEntranceSound,
  useTypewriter,
  formatViews,
  scrollToContent,
} from './hireHeroUtils'

const TOGGLE = [
  { id: 'confident', label: 'CONFIDENT' },
  { id: 'funny', label: 'FUNNY' },
]

export default function HireHeroDigital() {
  const reduced = useReducedMotion()
  const [copyMode, setCopyMode] = useState('confident')
  const copy = heroCopy[copyMode]
  const { stats } = useHirePageStats()

  useEntranceSound()
  const views = useCountUp(stats.gamePageViews, { reduced, duration: 1600 })
  const { out: typedHeadline, done } = useTypewriter(copy.headline, { reduced, speed: 30 })

  return (
    <section
      className="hhd-root"
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-6)',
        overflow: 'hidden',
      }}
    >
      {/* Neon particle field (fixed, mouse-reactive, self-manages reduced motion) */}
      <ParticleField />

      {/* One-shot scanline sweep on load */}
      {!reduced && <div className="hhd-scanline" aria-hidden="true" />}

      <div className="hhd-inner" style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-accent)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-widest)',
          marginBottom: 'var(--space-4)',
        }}>
          <span className={reduced ? '' : 'hhd-prompt-blink'}>▸</span> kyle@freshprints:~/hire
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-6xl)',
          color: 'var(--color-text-primary)',
          lineHeight: 'var(--leading-tight)',
          letterSpacing: 'var(--tracking-tight)',
          margin: 0,
          marginBottom: 'var(--space-5)',
          textShadow: '0 0 34px var(--color-accent-primary-glow)',
          maxWidth: 900,
          minHeight: '1.2em',
        }}>
          {typedHeadline}
          {!done && <span className="hhd-cursor" aria-hidden="true">█</span>}
        </h1>

        <motion.p
          key={copyMode}
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: done ? 1 : (reduced ? 1 : 0), y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--leading-normal)',
            maxWidth: 620,
            margin: 0,
            marginBottom: 'var(--space-6)',
          }}
        >
          {copy.subhead}
        </motion.p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          {/* Copy toggle */}
          <div style={{
            display: 'inline-flex',
            gap: 'var(--space-1)',
            padding: 'var(--space-1)',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}>
            {TOGGLE.map(opt => {
              const active = copyMode === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setCopyMode(opt.id)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--tracking-wider)',
                    padding: 'var(--space-2) var(--space-5)',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: active ? 'var(--color-accent-primary)' : 'transparent',
                    color: active ? 'var(--color-bg-base)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Live number */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: 'var(--color-accent-primary)' }}>{formatViews(views)}</span> page views and counting
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <button
        onClick={() => scrollToContent(reduced)}
        aria-label="Scroll to projects"
        className="hhd-scrollcue"
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
          color: 'var(--color-text-accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-widest)',
        }}
      >
        <span>scroll</span>
        <span className={reduced ? '' : 'hhd-bob'} aria-hidden="true" style={{ fontSize: '1.1rem', lineHeight: 1 }}>▾</span>
      </button>

      <style>{`
        .hhd-cursor {
          color: var(--color-accent-primary);
          animation: hhd-blink 1s steps(2, start) infinite;
        }
        .hhd-prompt-blink { animation: hhd-blink 1.1s steps(2, start) infinite; }
        @keyframes hhd-blink { 0%, 50% { opacity: 1; } 50.01%, 100% { opacity: 0; } }
        .hhd-scanline {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 140px;
          pointer-events: none;
          z-index: 1;
          background: linear-gradient(to bottom, transparent, var(--color-accent-primary-glow), transparent);
          opacity: 0.5;
          animation: hhd-sweep 1.4s ease-out 1 both;
        }
        @keyframes hhd-sweep {
          0% { transform: translateY(-160px); opacity: 0; }
          25% { opacity: 0.55; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .hhd-bob { animation: hhd-bob 1.8s ease-in-out infinite; }
        @keyframes hhd-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
        .hhd-scrollcue:hover { color: var(--color-accent-primary); }
        @media (prefers-reduced-motion: reduce) {
          .hhd-cursor, .hhd-prompt-blink, .hhd-scanline, .hhd-bob { animation: none !important; }
        }
      `}</style>
    </section>
  )
}

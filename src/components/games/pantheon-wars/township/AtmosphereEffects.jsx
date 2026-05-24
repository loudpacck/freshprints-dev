import { useEffect, useRef } from 'react'
import { getExtrasUrl } from './townshipConfig'

// All extras are 3×3 grid sprite sheets (1254×1254 → 418×418 per frame, 9 frames total)
const COLS         = 3
const ROWS         = 3
const TOTAL_FRAMES = 9
const CELL_PX      = 120  // display size of one cell (3×3 grid → 360×360 display)
const SHEET_PX     = CELL_PX * COLS  // 360px

const KEYFRAMES = `
  @keyframes tw-smoke-rise {
    0%   { transform: translateY(0) scaleX(1); opacity: 0; }
    20%  { opacity: 0.35; }
    80%  { opacity: 0.15; }
    100% { transform: translateY(-80px) scaleX(1.4); opacity: 0; }
  }
  @keyframes tw-ashes {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    15%  { opacity: 0.2; }
    85%  { opacity: 0.1; }
    100% { transform: translateY(50px) translateX(20px); opacity: 0; }
  }
  @keyframes tw-particles {
    0%, 100% { transform: translateX(0) translateY(0); }
    50%      { transform: translateX(12px) translateY(-18px); }
  }
  @keyframes tw-birds-drift-a {
    0%   { left: -5%; }
    100% { left: 108%; }
  }
  @keyframes tw-birds-drift-b {
    0%   { left: -5%; }
    100% { left: 108%; }
  }
  @keyframes tw-birds-drift-c {
    0%   { left: -5%; }
    100% { left: 108%; }
  }
`

// Birds have a two-part animation:
//   1. CSS 'left' drift across the sky (tw-birds-drift-*)
//   2. JS frame advance (same 3×3 grid as all extras)
// Non-bird extras: only JS frame advance + CSS helper keyframe where relevant
const SPRITES = [
  // ── Birds (sky — drift horizontally) ─────────────────────────────────
  {
    id: 'birds-a', name: 'birds', fps: 10,
    style: {
      position: 'absolute', top: '10%', left: '-5%', opacity: 0.6, zIndex: 7,
      animation: 'tw-birds-drift-a 35s linear infinite',
    },
  },
  {
    id: 'birds-b', name: 'birds', fps: 10,
    style: {
      position: 'absolute', top: '16%', left: '-5%', opacity: 0.4, zIndex: 7,
      animation: 'tw-birds-drift-b 42s linear infinite 10s',
    },
  },
  {
    id: 'birds-c', name: 'birds', fps: 10,
    style: {
      position: 'absolute', top: '8%', left: '-5%', opacity: 0.3, zIndex: 7,
      animation: 'tw-birds-drift-c 55s linear infinite 22s',
    },
  },

  // ── Fire (ground level near buildings) ───────────────────────────────
  {
    id: 'fire-a', name: 'fire', fps: 12,
    style: { position: 'absolute', bottom: '18%', left: '25%', opacity: 0.5, zIndex: 11 },
  },
  {
    id: 'fire-b', name: 'fire', fps: 12,
    style: { position: 'absolute', bottom: '18%', left: '50%', opacity: 0.4, zIndex: 11 },
  },
  {
    id: 'fire-c', name: 'fire', fps: 12,
    style: { position: 'absolute', bottom: '18%', left: '70%', opacity: 0.35, zIndex: 11 },
  },

  // ── Smoke (above fire, rises upward) ─────────────────────────────────
  {
    id: 'smoke-a', name: 'smoke', fps: 8,
    style: {
      position: 'absolute', bottom: '22%', left: '24%', opacity: 0.28, zIndex: 11,
      animation: 'tw-smoke-rise 7s ease-in-out infinite',
    },
  },
  {
    id: 'smoke-b', name: 'smoke', fps: 8,
    style: {
      position: 'absolute', bottom: '22%', left: '50%', opacity: 0.2, zIndex: 11,
      animation: 'tw-smoke-rise 9s ease-in-out infinite 2.5s',
    },
  },
  {
    id: 'smoke-c', name: 'smoke', fps: 8,
    style: {
      position: 'absolute', bottom: '22%', left: '70%', opacity: 0.15, zIndex: 11,
      animation: 'tw-smoke-rise 8s ease-in-out infinite 5s',
    },
  },

  // ── Ashes/sparks (drifting near ground/mid-scene) ────────────────────
  {
    id: 'ashes-a', name: 'ashes', fps: 8,
    style: {
      position: 'absolute', bottom: '22%', left: '28%', opacity: 0.18, zIndex: 8,
      animation: 'tw-ashes 11s ease-in-out infinite 1s',
    },
  },
  {
    id: 'ashes-b', name: 'ashes', fps: 8,
    style: {
      position: 'absolute', bottom: '20%', left: '60%', opacity: 0.13, zIndex: 8,
      animation: 'tw-ashes 14s ease-in-out infinite 6s',
    },
  },

  // ── Enviro particles (mid-scene scatter) ─────────────────────────────
  {
    id: 'env-a', name: 'enviroparticles', fps: 8,
    style: {
      position: 'absolute', top: '35%', left: '38%', opacity: 0.1, zIndex: 8,
      animation: 'tw-particles 14s ease-in-out infinite',
    },
  },
  {
    id: 'env-b', name: 'enviroparticles', fps: 8,
    style: {
      position: 'absolute', top: '55%', left: '72%', opacity: 0.08, zIndex: 8,
      animation: 'tw-particles 18s ease-in-out infinite 3s',
    },
  },
]

export default function AtmosphereEffects({ assetKey }) {
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const refs   = useRef(SPRITES.map(() => null))
  const frames = useRef(SPRITES.map((_, i) => i % TOTAL_FRAMES))

  useEffect(() => {
    if (reducedMotion) return

    const timers = SPRITES.map((cfg, i) =>
      setInterval(() => {
        frames.current[i] = (frames.current[i] + 1) % TOTAL_FRAMES
        const el = refs.current[i]
        if (!el) return
        const f   = frames.current[i]
        const col = f % COLS
        const row = Math.floor(f / COLS)
        el.style.backgroundPositionX = `${-(col * CELL_PX)}px`
        el.style.backgroundPositionY = `${-(row * CELL_PX)}px`
      }, Math.round(1000 / cfg.fps))
    )

    return () => timers.forEach(id => clearInterval(id))
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <>
      <style>{KEYFRAMES}</style>
      {SPRITES.map((cfg, i) => {
        const src = getExtrasUrl(assetKey, cfg.name)
        return (
          <div
            key={cfg.id}
            ref={el => { refs.current[i] = el }}
            style={{
              width:               CELL_PX,
              height:              CELL_PX,
              backgroundImage:     `url("${src}")`,
              backgroundSize:      `${SHEET_PX}px ${SHEET_PX}px`,
              backgroundRepeat:    'no-repeat',
              backgroundPosition:  '0 0',
              pointerEvents:       'none',
              userSelect:          'none',
              willChange:          'background-position',
              ...cfg.style,
            }}
          />
        )
      })}
    </>
  )
}

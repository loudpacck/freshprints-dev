import { useEffect, useRef } from 'react'
import { getExtrasUrl } from './townshipConfig'

// All extras are 3×3 grid sprite sheets (1254×1254 → 418×418 per frame, 9 frames total)
const COLS        = 3
const ROWS        = 3
const TOTAL_FRAMES = COLS * ROWS
const ORIG_FRAME  = 418  // original frame size in pixels

const KEYFRAMES = `
  @keyframes tw-smoke-rise {
    0%   { transform: translateY(0) scaleX(1); opacity: 0; }
    20%  { opacity: 0.35; }
    80%  { opacity: 0.15; }
    100% { transform: translateY(-80px) scaleX(1.4); opacity: 0; }
  }
  @keyframes tw-birds-a {
    0%, 100% { transform: translateX(0) translateY(0); }
    30%      { transform: translateX(3%) translateY(-10px); }
    70%      { transform: translateX(-2%) translateY(-5px); }
  }
  @keyframes tw-birds-b {
    0%, 100% { transform: translateX(0) translateY(0); }
    50%      { transform: translateX(-4%) translateY(-14px); }
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
`

// Each entry: name (for URL), displaySize (px), fps, style overrides
// Positions per problem spec:
//   fire/sparks: bottom 20%, near buildings (x=20%, 40%, 65%)
//   smoke: bottom 25%, same x zones
//   birds: sky (top 10-20%)
//   ashes: drift from top 30% downward
//   enviroparticles: mid-scene
const SPRITES = [
  // ── Birds (sky) ───────────────────────────────────────────────────────
  {
    id: 'birds-a', name: 'birds', displaySize: 80, fps: 10,
    style: {
      position: 'absolute', top: '11%', left: '18%', opacity: 0.55,
      animation: 'tw-birds-a 20s ease-in-out infinite', zIndex: 7,
    },
  },
  {
    id: 'birds-b', name: 'birds', displaySize: 64, fps: 10,
    style: {
      position: 'absolute', top: '19%', left: '63%', opacity: 0.38,
      animation: 'tw-birds-b 27s ease-in-out infinite 4s', zIndex: 7,
    },
  },

  // ── Fire (ground, near buildings) ────────────────────────────────────
  {
    id: 'fire-a', name: 'fire', displaySize: 60, fps: 12,
    style: {
      position: 'absolute', bottom: '20%', left: '40%', opacity: 0.5, zIndex: 11,
    },
  },
  {
    id: 'fire-b', name: 'fire', displaySize: 50, fps: 12,
    style: {
      position: 'absolute', bottom: '20%', left: '20%', opacity: 0.38, zIndex: 11,
    },
  },

  // ── Smoke (slightly above fire base) ─────────────────────────────────
  {
    id: 'smoke-a', name: 'smoke', displaySize: 80, fps: 8,
    style: {
      position: 'absolute', bottom: '25%', left: '16%', opacity: 0.28,
      animation: 'tw-smoke-rise 7s ease-in-out infinite', zIndex: 11,
    },
  },
  {
    id: 'smoke-b', name: 'smoke', displaySize: 70, fps: 8,
    style: {
      position: 'absolute', bottom: '25%', left: '50%', opacity: 0.2,
      animation: 'tw-smoke-rise 9s ease-in-out infinite 2.5s', zIndex: 11,
    },
  },
  {
    id: 'smoke-c', name: 'smoke', displaySize: 60, fps: 8,
    style: {
      position: 'absolute', bottom: '25%', left: '65%', opacity: 0.16,
      animation: 'tw-smoke-rise 8s ease-in-out infinite 5s', zIndex: 11,
    },
  },

  // ── Ashes (drifting down from upper portion) ──────────────────────────
  {
    id: 'ashes-a', name: 'ashes', displaySize: 60, fps: 8,
    style: {
      position: 'absolute', top: '30%', left: '28%', opacity: 0.18,
      animation: 'tw-ashes 11s ease-in-out infinite 1s', zIndex: 8,
    },
  },
  {
    id: 'ashes-b', name: 'ashes', displaySize: 50, fps: 8,
    style: {
      position: 'absolute', top: '30%', left: '60%', opacity: 0.13,
      animation: 'tw-ashes 14s ease-in-out infinite 6s', zIndex: 8,
    },
  },

  // ── Enviro particles (mid-scene scatter) ─────────────────────────────
  {
    id: 'env-a', name: 'enviroparticles', displaySize: 80, fps: 8,
    style: {
      position: 'absolute', top: '35%', left: '38%', opacity: 0.1,
      animation: 'tw-particles 14s ease-in-out infinite', zIndex: 8,
    },
  },
  {
    id: 'env-b', name: 'enviroparticles', displaySize: 64, fps: 8,
    style: {
      position: 'absolute', top: '42%', left: '72%', opacity: 0.08,
      animation: 'tw-particles 18s ease-in-out infinite 3s', zIndex: 8,
    },
  },
]

export default function AtmosphereEffects({ assetKey }) {
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const refs   = useRef(SPRITES.map(() => null))
  const frames = useRef(SPRITES.map((_, i) => i % TOTAL_FRAMES))  // stagger starts

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
        el.style.backgroundPositionX = `${-(col * cfg.displaySize)}px`
        el.style.backgroundPositionY = `${-(row * cfg.displaySize)}px`
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
              width:               cfg.displaySize,
              height:              cfg.displaySize,
              backgroundImage:     `url("${src}")`,
              backgroundSize:      `${COLS * cfg.displaySize}px ${ROWS * cfg.displaySize}px`,
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

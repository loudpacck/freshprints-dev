import { memo, useEffect, useRef } from 'react'
import { getExtrasUrl } from './townshipConfig'

const COLS         = 3
const ROWS         = 3
const TOTAL_FRAMES = 9
const CELL_PX      = 120
const SHEET_PX     = CELL_PX * COLS  // 360px

const KEYFRAMES = `
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

const SPRITES = [
  // ── Birds (sky — drift horizontally) ─────────────────────────────────
  {
    id: 'birds-a', name: 'birds', fps: 10, group: 'sky',
    style: {
      position: 'absolute', top: '10%', left: '-5%', opacity: 0.6, zIndex: 5,
      animation: 'tw-birds-drift-a 35s linear infinite',
    },
  },
  {
    id: 'birds-b', name: 'birds', fps: 10, group: 'sky',
    style: {
      position: 'absolute', top: '16%', left: '-5%', opacity: 0.4, zIndex: 5,
      animation: 'tw-birds-drift-b 42s linear infinite 10s',
    },
  },
  {
    id: 'birds-c', name: 'birds', fps: 10, group: 'sky',
    style: {
      position: 'absolute', top: '8%', left: '-5%', opacity: 0.3, zIndex: 5,
      animation: 'tw-birds-drift-c 55s linear infinite 22s',
    },
  },

  // ── Fire (pinned to ground) ───────────────────────────────────────────
  {
    id: 'fire-a', name: 'fire', fps: 12, group: 'ground',
    style: { position: 'absolute', bottom: '0%', left: '25%', opacity: 0.5, zIndex: 15 },
  },
  {
    id: 'fire-b', name: 'fire', fps: 12, group: 'ground',
    style: { position: 'absolute', bottom: '0%', left: '50%', opacity: 0.4, zIndex: 15 },
  },
  {
    id: 'fire-c', name: 'fire', fps: 12, group: 'ground',
    style: { position: 'absolute', bottom: '0%', left: '72%', opacity: 0.35, zIndex: 15 },
  },

  // ── Smoke (pinned just above fire — no vertical drift) ────────────────
  {
    id: 'smoke-a', name: 'smoke', fps: 8, group: 'ground',
    style: { position: 'absolute', bottom: '5%', left: '25%', opacity: 0.28, zIndex: 15 },
  },
  {
    id: 'smoke-b', name: 'smoke', fps: 8, group: 'ground',
    style: { position: 'absolute', bottom: '5%', left: '50%', opacity: 0.2, zIndex: 15 },
  },
  {
    id: 'smoke-c', name: 'smoke', fps: 8, group: 'ground',
    style: { position: 'absolute', bottom: '5%', left: '72%', opacity: 0.15, zIndex: 15 },
  },

  // ── Ashes (pinned near ground — no vertical drift) ───────────────────
  {
    id: 'ashes-a', name: 'ashes', fps: 8, group: 'ground',
    style: { position: 'absolute', bottom: '3%', left: '30%', opacity: 0.18, zIndex: 15 },
  },
  {
    id: 'ashes-b', name: 'ashes', fps: 8, group: 'ground',
    style: { position: 'absolute', bottom: '3%', left: '60%', opacity: 0.13, zIndex: 15 },
  },

  // ── Enviro particles (mid-scene scatter — gentle horizontal drift) ────
  {
    id: 'env-a', name: 'enviroparticles', fps: 8, group: 'ground',
    style: {
      position: 'absolute', top: '35%', left: '38%', opacity: 0.1, zIndex: 8,
      animation: 'tw-particles 14s ease-in-out infinite',
    },
  },
  {
    id: 'env-b', name: 'enviroparticles', fps: 8, group: 'ground',
    style: {
      position: 'absolute', top: '55%', left: '72%', opacity: 0.08, zIndex: 8,
      animation: 'tw-particles 18s ease-in-out infinite 3s',
    },
  },
]

// group: 'sky' = birds (render outside world container, viewport-relative)
//        'ground' = fire/smoke/ashes/env (render inside world container, world-relative)
function AtmosphereEffects({ assetKey, group = 'all' }) {
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const filtered = group === 'all' ? SPRITES : SPRITES.filter(s => s.group === group)

  const refs   = useRef(filtered.map(() => null))
  const frames = useRef(filtered.map((_, i) => i % TOTAL_FRAMES))

  useEffect(() => {
    if (reducedMotion) return

    // Set initial frame positions directly on DOM so React's style prop cannot reset them.
    // (Parent re-renders would re-apply `backgroundPosition` shorthand and zero out the interval's work.)
    filtered.forEach((_, i) => {
      const el = refs.current[i]
      if (!el) return
      const f   = frames.current[i]
      const col = f % COLS
      const row = Math.floor(f / COLS)
      el.style.backgroundPositionX = `${-(col * CELL_PX)}px`
      el.style.backgroundPositionY = `${-(row * CELL_PX)}px`
    })

    const timers = filtered.map((cfg, i) =>
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
  }, [reducedMotion]) // eslint-disable-line react-hooks/exhaustive-deps

  if (reducedMotion) return null

  return (
    <>
      <style>{KEYFRAMES}</style>
      {filtered.map((cfg, i) => {
        const src = getExtrasUrl(assetKey, cfg.name)
        return (
          <div
            key={cfg.id}
            ref={el => { refs.current[i] = el }}
            style={{
              width:            CELL_PX,
              height:           CELL_PX,
              backgroundImage:  `url("${src}")`,
              backgroundSize:   `${SHEET_PX}px ${SHEET_PX}px`,
              backgroundRepeat: 'no-repeat',
              pointerEvents:    'none',
              userSelect:       'none',
              willChange:       'background-position',
              ...cfg.style,
            }}
          />
        )
      })}
    </>
  )
}

export default memo(AtmosphereEffects)

import { useEffect, useRef } from 'react'
import { SCENE_WIDTH, getNPCUrl } from './townshipConfig'

const NPC_HEIGHT    = '42px'
const GROUND_BOTTOM = '18%'

// Patrol configs: one villager + one animal per zone, evenly spread across all three zones
const CONFIGS = [
  { type: 'villager', minX: 0.05 * SCENE_WIDTH, maxX: 0.20 * SCENE_WIDTH, speed: 30, startRatio: 0.3, initialDir:  1, staggerMs:    0 },
  { type: 'animal',   minX: 0.09 * SCENE_WIDTH, maxX: 0.17 * SCENE_WIDTH, speed: 20, startRatio: 0.7, initialDir: -1, staggerMs:  900 },
  { type: 'villager', minX: 0.34 * SCENE_WIDTH, maxX: 0.58 * SCENE_WIDTH, speed: 30, startRatio: 0.5, initialDir:  1, staggerMs: 1600 },
  { type: 'animal',   minX: 0.40 * SCENE_WIDTH, maxX: 0.56 * SCENE_WIDTH, speed: 20, startRatio: 0.2, initialDir: -1, staggerMs:  400 },
  { type: 'villager', minX: 0.63 * SCENE_WIDTH, maxX: 0.76 * SCENE_WIDTH, speed: 30, startRatio: 0.8, initialDir:  1, staggerMs: 1200 },
  { type: 'animal',   minX: 0.68 * SCENE_WIDTH, maxX: 0.80 * SCENE_WIDTH, speed: 20, startRatio: 0.4, initialDir:  1, staggerMs:  700 },
]

function makePauseMs() {
  return 2000 + Math.random() * 2000
}

export default function AmbientNPC({ assetKey }) {
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  // Each NPC: refs to DOM elements + mutable state
  const stateRef = useRef(
    CONFIGS.map(cfg => ({
      containerEl: null,
      idleEl:      null,
      walkEl:      null,
      posX:        cfg.minX + (cfg.maxX - cfg.minX) * cfg.startRatio,
      dir:         cfg.initialDir,
      isWalking:   false,
      pauseUntil:  Date.now() + cfg.staggerMs,
    }))
  )

  const rafRef      = useRef(null)
  const lastTimeRef = useRef(null)

  useEffect(() => {
    // Position statically for reduced motion
    if (reducedMotion) {
      stateRef.current.forEach(s => {
        if (s.containerEl) s.containerEl.style.left = s.posX + 'px'
      })
      return
    }

    function tick(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt  = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp
      const now = Date.now()

      stateRef.current.forEach((s, i) => {
        const cfg = CONFIGS[i]
        if (!s.containerEl) return

        if (!s.isWalking) {
          if (now >= s.pauseUntil) {
            s.isWalking = true
            if (s.idleEl) s.idleEl.style.display = 'none'
            if (s.walkEl) s.walkEl.style.display = 'block'
          }
        } else {
          const step = cfg.speed * dt * s.dir
          s.posX += step

          if (s.posX >= cfg.maxX) {
            s.posX      = cfg.maxX
            s.dir       = -1
            s.isWalking = false
            s.pauseUntil = now + makePauseMs()
            if (s.idleEl) s.idleEl.style.display = 'block'
            if (s.walkEl) s.walkEl.style.display = 'none'
          } else if (s.posX <= cfg.minX) {
            s.posX      = cfg.minX
            s.dir       = 1
            s.isWalking = false
            s.pauseUntil = now + makePauseMs()
            if (s.idleEl) s.idleEl.style.display = 'block'
            if (s.walkEl) s.walkEl.style.display = 'none'
          }
        }

        const flip = s.dir < 0 ? -1 : 1
        s.containerEl.style.left      = s.posX + 'px'
        s.containerEl.style.transform = `translateX(-50%) scaleX(${flip})`
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {CONFIGS.map((cfg, i) => {
        const idleSrc = getNPCUrl(assetKey, cfg.type, 'idle')
        const walkSrc = getNPCUrl(assetKey, cfg.type, 'walk')
        const s = stateRef.current[i]

        return (
          <div
            key={i}
            ref={el => { s.containerEl = el }}
            style={{
              position:        'absolute',
              left:            s.posX + 'px',
              bottom:          GROUND_BOTTOM,
              transform:       'translateX(-50%)',
              transformOrigin: 'bottom center',
              pointerEvents:   'none',
              userSelect:      'none',
              zIndex:          4,
            }}
          >
            <img
              ref={el => { s.idleEl = el }}
              src={idleSrc}
              alt=""
              draggable={false}
              decoding="async"
              loading="lazy"
              style={{ height: NPC_HEIGHT, width: 'auto', display: 'block' }}
            />
            <img
              ref={el => { s.walkEl = el }}
              src={walkSrc}
              alt=""
              draggable={false}
              decoding="async"
              loading="lazy"
              style={{
                height:   NPC_HEIGHT,
                width:    'auto',
                display:  'none',
                position: 'absolute',
                bottom:   0,
                left:     '50%',
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        )
      })}
    </>
  )
}

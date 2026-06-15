import { useEffect, useRef } from 'react'
import { getNPCUrl, DEFAULT_NPC_CONFIGS } from './townshipConfig'

const VILLAGER_DISPLAY_H = 180
const ANIMAL_DISPLAY_H   = 110
const GROUND_BOTTOM      = '0%'

// Per-faction, per-type sprite info derived from actual sprite sheet pixel measurements
// srcW/srcH = one frame's natural dimensions; display height is fixed, width scales proportionally
// animalDisplayH overrides ANIMAL_DISPLAY_H per faction (norse frames are much larger source images)
const SPRITE_CONFIG = {
  greek: {
    animalDisplayH: 110,
    villager: {
      idle: { frames: 11, srcW: 140, srcH: 140 },
      walk: { frames: 8,  srcW: 140, srcH: 140 },
    },
    animal: {
      idle: { frames: 4, srcW: 415, srcH: 311 },
      walk: { frames: 4, srcW: 432, srcH: 275 },
    },
  },
  mesop: {
    animalDisplayH: 130,
    villager: {
      idle: { frames: 6,  srcW: 184, srcH: 137 },
      walk: { frames: 8,  srcW: 184, srcH: 137 },
    },
    animal: {
      idle: { frames: 4, srcW: 429, srcH: 334 },
      // Walk sheet is 1774x887 (4 frames of ~444x887 each), but the ox only
      // occupies the middle ~38% of that tall canvas vs ~98% in the idle
      // sheet. displayH/bottomOffsetPx compensate so the walking ox matches
      // idle's on-screen size and keeps its feet on the ground line.
      walk: { frames: 4, srcW: 444, srcH: 887, displayH: 334, bottomOffsetPx: -114 },
    },
  },
  norse: {
    animalDisplayH: 160,
    villager: {
      idle: { frames: 8,  srcW: 150, srcH: 150 },
      walk: { frames: 8,  srcW: 150, srcH: 150 },
    },
    animal: {
      idle: { frames: 4, srcW: 444, srcH: 887 },
      walk: { frames: 4, srcW: 426, srcH: 885 },
    },
  },
}

function getDisplayW(srcW, srcH, displayH) {
  return Math.round(displayH * srcW / srcH)
}

// Resolves a per-state sprite config ({ srcW, srcH, frames, displayH?, bottomOffsetPx? })
// into render dimensions. displayH/bottomOffsetPx default to the type's shared
// display height / no offset, but can be overridden per-state for sheets whose
// idle and walk canvases have very different content-to-canvas ratios.
function resolveState(stateCfg, defaultH) {
  const h = stateCfg.displayH ?? defaultH
  return {
    w: getDisplayW(stateCfg.srcW, stateCfg.srcH, h),
    h,
    bottomOffset: stateCfg.bottomOffsetPx ?? 0,
  }
}

function makeNPCKeyframes(cfg) {
  const animalH = cfg.animalDisplayH ?? ANIMAL_DISPLAY_H
  const vIdle   = resolveState(cfg.villager.idle, VILLAGER_DISPLAY_H)
  const vWalk   = resolveState(cfg.villager.walk, VILLAGER_DISPLAY_H)
  const aIdle   = resolveState(cfg.animal.idle, animalH)
  const aWalk   = resolveState(cfg.animal.walk, animalH)

  return `
    @keyframes npc-villager-idle {
      from { background-position-x: 0 }
      to   { background-position-x: ${-(cfg.villager.idle.frames * vIdle.w)}px }
    }
    @keyframes npc-villager-walk {
      from { background-position-x: 0 }
      to   { background-position-x: ${-(cfg.villager.walk.frames * vWalk.w)}px }
    }
    @keyframes npc-animal-idle {
      from { background-position-x: 0 }
      to   { background-position-x: ${-(cfg.animal.idle.frames * aIdle.w)}px }
    }
    @keyframes npc-animal-walk {
      from { background-position-x: 0 }
      to   { background-position-x: ${-(cfg.animal.walk.frames * aWalk.w)}px }
    }
  `
}

function makeSpriteInfo(cfg) {
  const animalH = cfg.animalDisplayH ?? ANIMAL_DISPLAY_H
  const vIdle   = resolveState(cfg.villager.idle, VILLAGER_DISPLAY_H)
  const vWalk   = resolveState(cfg.villager.walk, VILLAGER_DISPLAY_H)
  const aIdle   = resolveState(cfg.animal.idle, animalH)
  const aWalk   = resolveState(cfg.animal.walk, animalH)

  return {
    villager: {
      idle: { frames: cfg.villager.idle.frames, w: vIdle.w, h: vIdle.h, bottomOffset: vIdle.bottomOffset, anim: 'npc-villager-idle', dur: '1.1s' },
      walk: { frames: cfg.villager.walk.frames, w: vWalk.w, h: vWalk.h, bottomOffset: vWalk.bottomOffset, anim: 'npc-villager-walk', dur: '0.8s' },
    },
    animal: {
      idle: { frames: cfg.animal.idle.frames, w: aIdle.w, h: aIdle.h, bottomOffset: aIdle.bottomOffset, anim: 'npc-animal-idle', dur: '0.8s' },
      walk: { frames: cfg.animal.walk.frames, w: aWalk.w, h: aWalk.h, bottomOffset: aWalk.bottomOffset, anim: 'npc-animal-walk', dur: '0.7s' },
    },
  }
}

function makePauseMs() {
  return 2000 + Math.random() * 2000
}

export default function AmbientNPC({ assetKey, configs }) {
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const cfg        = SPRITE_CONFIG[assetKey] || SPRITE_CONFIG.greek
  const keyframes  = makeNPCKeyframes(cfg)
  const spriteInfo = makeSpriteInfo(cfg)

  // NPC patrol configs — minX/maxX/startX are absolute scene-pixel positions
  const CONFIGS = configs || DEFAULT_NPC_CONFIGS

  const stateRef = useRef(
    CONFIGS.map(c => ({
      containerEl: null,
      idleEl:      null,
      walkEl:      null,
      posX:        c.startX,
      dir:         c.initialDir,
      isWalking:   false,
      pauseUntil:  Date.now() + c.staggerMs,
      footOffsetPx: c.footOffsetPx?.[assetKey] ?? 0,
    }))
  )

  // Refresh per-frame from latest configs so late-arriving admin overrides apply
  stateRef.current.forEach((s, i) => {
    s.footOffsetPx = CONFIGS[i]?.footOffsetPx?.[assetKey] ?? 0
  })

  const rafRef      = useRef(null)
  const lastTimeRef = useRef(null)

  // Reduced-motion: re-apply static position/offset whenever configs change
  // (handles late-arriving admin overrides, since the rAF loop below never starts)
  useEffect(() => {
    if (!reducedMotion) return
    stateRef.current.forEach(s => {
      if (s.containerEl) {
        const flip = s.dir < 0 ? -1 : 1
        s.containerEl.style.left      = s.posX + 'px'
        s.containerEl.style.transform = `translateX(-50%) translateY(${s.footOffsetPx}px) scaleX(${flip})`
      }
    })
  }, [configs, assetKey, reducedMotion])

  useEffect(() => {
    if (reducedMotion) return

    function tick(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const dt  = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp
      const now = Date.now()

      stateRef.current.forEach((s, i) => {
        const c = CONFIGS[i]
        if (!s.containerEl) return

        if (!s.isWalking) {
          if (now >= s.pauseUntil) {
            s.isWalking = true
            if (s.idleEl) s.idleEl.style.display = 'none'
            if (s.walkEl) s.walkEl.style.display = 'block'
          }
        } else {
          const step = c.speed * dt * s.dir
          s.posX += step

          if (s.posX >= c.maxX) {
            s.posX       = c.maxX
            s.dir        = -1
            s.isWalking  = false
            s.pauseUntil = now + makePauseMs()
            if (s.idleEl) s.idleEl.style.display = 'block'
            if (s.walkEl) s.walkEl.style.display = 'none'
          } else if (s.posX <= c.minX) {
            s.posX       = c.minX
            s.dir        = 1
            s.isWalking  = false
            s.pauseUntil = now + makePauseMs()
            if (s.idleEl) s.idleEl.style.display = 'block'
            if (s.walkEl) s.walkEl.style.display = 'none'
          }
        }

        const flip = s.dir < 0 ? -1 : 1
        s.containerEl.style.left      = s.posX + 'px'
        s.containerEl.style.transform = `translateX(-50%) translateY(${s.footOffsetPx}px) scaleX(${flip})`
      })

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{keyframes}</style>
      {CONFIGS.map((c, i) => {
        const idleSrc  = getNPCUrl(assetKey, c.type, 'idle')
        const walkSrc  = getNPCUrl(assetKey, c.type, 'walk')
        const s        = stateRef.current[i]
        const idleInfo = spriteInfo[c.type].idle
        const walkInfo = spriteInfo[c.type].walk

        return (
          <div
            key={i}
            ref={el => { s.containerEl = el }}
            style={{
              position:        'absolute',
              left:            s.posX + 'px',
              bottom:          GROUND_BOTTOM,
              transform:       `translateX(-50%) translateY(${s.footOffsetPx}px)`,
              transformOrigin: 'bottom center',
              pointerEvents:   'none',
              userSelect:      'none',
              zIndex:          20,
            }}
          >
            <div
              ref={el => { s.idleEl = el }}
              style={{
                width:              idleInfo.w,
                height:             idleInfo.h,
                display:            'block',
                backgroundImage:    `url("${idleSrc}")`,
                backgroundSize:     `${idleInfo.frames * idleInfo.w}px ${idleInfo.h}px`,
                backgroundRepeat:   'no-repeat',
                backgroundPosition: '0 0',
                animation:          `${idleInfo.anim} ${idleInfo.dur} steps(${idleInfo.frames}, end) infinite`,
              }}
            />
            <div
              ref={el => { s.walkEl = el }}
              style={{
                width:              walkInfo.w,
                height:             walkInfo.h,
                display:            'none',
                position:           'absolute',
                bottom:             walkInfo.bottomOffset,
                left:               '50%',
                transform:          'translateX(-50%)',
                backgroundImage:    `url("${walkSrc}")`,
                backgroundSize:     `${walkInfo.frames * walkInfo.w}px ${walkInfo.h}px`,
                backgroundRepeat:   'no-repeat',
                backgroundPosition: '0 0',
                animation:          `${walkInfo.anim} ${walkInfo.dur} steps(${walkInfo.frames}, end) infinite`,
              }}
            />
          </div>
        )
      })}
    </>
  )
}

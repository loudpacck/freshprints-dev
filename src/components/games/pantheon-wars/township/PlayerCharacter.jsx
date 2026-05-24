import { useEffect, useRef } from 'react'
import { SCENE_WIDTH, FACTION_FOLDER } from './townshipConfig'

const DISPLAY_H = 160
const GROUND_BOTTOM = '18%'
const SPEED = 120  // px/sec in scene space

// Per-faction sprite info — all source frames are square
const CHAR_CONFIG = {
  greek: { idle: { frames: 10, srcH: 135 }, walk: { frames: 6,  srcH: 135 } },
  mesop: { idle: { frames: 10, srcH: 126 }, walk: { frames: 8,  srcH: 126 } },
  norse: { idle: { frames: 10, srcH: 162 }, walk: { frames: 8,  srcH: 162 } },
}

function makeKeyframes(idleFrames, walkFrames) {
  const displayW = DISPLAY_H  // square source → square display
  return `
    @keyframes char-idle {
      from { background-position-x: 0 }
      to   { background-position-x: ${-(idleFrames * displayW)}px }
    }
    @keyframes char-walk {
      from { background-position-x: 0 }
      to   { background-position-x: ${-(walkFrames * displayW)}px }
    }
  `
}

// charXRef is owned by TownshipScene; PlayerCharacter writes its position into it
export default function PlayerCharacter({ plot, assetKey, targetX, targetSeq, charXRef }) {
  const folder = FACTION_FOLDER[assetKey]
  const cfg    = CHAR_CONFIG[assetKey] || CHAR_CONFIG.greek
  const { idle, walk } = cfg

  const idleSrc = `/pantheon_wars_assets/sprites/player_characters/${folder}/char_${assetKey}_idle.png`
  const walkSrc = `/pantheon_wars_assets/sprites/player_characters/${folder}/char_${assetKey}_walk.png`

  const displayW    = DISPLAY_H
  const keyframes   = makeKeyframes(idle.frames, walk.frames)

  const containerRef  = useRef(null)
  const idleRef       = useRef(null)
  const walkRef       = useRef(null)

  // Mutable animation state — never triggers re-renders
  const targetXRef    = useRef(null)
  const facingLeftRef = useRef(false)
  const lastTimeRef   = useRef(null)
  const rafRef        = useRef(null)

  useEffect(() => {
    function tick(timestamp) {
      if (targetXRef.current !== null) {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp
        const dt     = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
        lastTimeRef.current = timestamp

        const target = targetXRef.current
        const dx     = target - charXRef.current

        if (Math.abs(dx) < 1.5) {
          charXRef.current    = target
          targetXRef.current  = null
          lastTimeRef.current = null
          if (idleRef.current) idleRef.current.style.display = 'block'
          if (walkRef.current) walkRef.current.style.display = 'none'
        } else {
          const step = Math.sign(dx) * Math.min(SPEED * dt, Math.abs(dx))
          charXRef.current      += step
          facingLeftRef.current  = dx < 0
          if (idleRef.current) idleRef.current.style.display = 'none'
          if (walkRef.current) walkRef.current.style.display = 'block'
        }
      }

      const el = containerRef.current
      if (el) {
        const flip = facingLeftRef.current ? -1 : 1
        el.style.left      = charXRef.current + 'px'
        el.style.transform = `translateX(-50%) scaleX(${flip})`
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (targetX === null || targetX === undefined) return
    const clamped = Math.max(0, Math.min(SCENE_WIDTH, targetX))
    targetXRef.current  = clamped
    lastTimeRef.current = null
  }, [targetSeq]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      style={{
        position:        'absolute',
        left:            charXRef.current + 'px',
        bottom:          GROUND_BOTTOM,
        transform:       'translateX(-50%)',
        transformOrigin: 'bottom center',
        pointerEvents:   'none',
        userSelect:      'none',
        zIndex:          30,
      }}
    >
      <style>{keyframes}</style>

      <div
        ref={idleRef}
        style={{
          width:              displayW,
          height:             DISPLAY_H,
          display:            'block',
          backgroundImage:    `url("${idleSrc}")`,
          backgroundSize:     `${idle.frames * displayW}px ${DISPLAY_H}px`,
          backgroundRepeat:   'no-repeat',
          backgroundPosition: '0 0',
          animation:          `char-idle 1s steps(${idle.frames}, end) infinite`,
        }}
      />

      <div
        ref={walkRef}
        style={{
          width:              displayW,
          height:             DISPLAY_H,
          display:            'none',
          position:           'absolute',
          bottom:             0,
          left:               '50%',
          transform:          'translateX(-50%)',
          backgroundImage:    `url("${walkSrc}")`,
          backgroundSize:     `${walk.frames * displayW}px ${DISPLAY_H}px`,
          backgroundRepeat:   'no-repeat',
          backgroundPosition: '0 0',
          animation:          `char-walk 0.5s steps(${walk.frames}, end) infinite`,
        }}
      />
    </div>
  )
}

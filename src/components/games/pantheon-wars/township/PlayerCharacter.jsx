import { useEffect, useRef } from 'react'
import { SCENE_WIDTH, FACTION_FOLDER } from './townshipConfig'

// Display size of one frame in scene-space pixels (~80px on screen at typical scale)
const FRAME_W = 200
const FRAME_H = 200

const GROUND_BOTTOM = '8%'
const SPEED         = 120  // px/sec in scene space

// Idle: 10 frames × 135px each (1350px total original)
// Walk:  6 frames × 135px each (810px total original)
const CHAR_KEYFRAMES = `
  @keyframes char-idle {
    from { background-position-x: 0 }
    to   { background-position-x: ${-(10 * FRAME_W)}px }
  }
  @keyframes char-walk {
    from { background-position-x: 0 }
    to   { background-position-x: ${-(6 * FRAME_W)}px }
  }
`

export default function PlayerCharacter({ plot, assetKey, targetX, targetSeq }) {
  const folder  = FACTION_FOLDER[assetKey]
  const idleSrc = `/pantheon_wars_assets/sprites/player_characters/${folder}/char_${assetKey}_idle.png`
  const walkSrc = `/pantheon_wars_assets/sprites/player_characters/${folder}/char_${assetKey}_walk.png`

  const containerRef  = useRef(null)
  const idleRef       = useRef(null)
  const walkRef       = useRef(null)

  // Mutable animation state — never triggers re-renders
  const charXRef      = useRef(plot.x * SCENE_WIDTH)
  const targetXRef    = useRef(null)
  const facingLeftRef = useRef(false)
  const lastTimeRef   = useRef(null)
  const rafRef        = useRef(null)

  // rAF loop: moves character and syncs DOM position
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

  // Accept a new move target from TownshipScene
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
        zIndex:          12,
      }}
    >
      <style>{CHAR_KEYFRAMES}</style>

      {/* Idle sprite sheet — block element sets container height */}
      <div
        ref={idleRef}
        style={{
          width:              FRAME_W,
          height:             FRAME_H,
          display:            'block',
          backgroundImage:    `url("${idleSrc}")`,
          backgroundSize:     `${10 * FRAME_W}px ${FRAME_H}px`,
          backgroundRepeat:   'no-repeat',
          backgroundPosition: '0 0',
          animation:          'char-idle 1s steps(10, end) infinite',
        }}
      />

      {/* Walk sprite sheet — absolute overlay, shown during movement */}
      <div
        ref={walkRef}
        style={{
          width:              FRAME_W,
          height:             FRAME_H,
          display:            'none',
          position:           'absolute',
          bottom:             0,
          left:               '50%',
          transform:          'translateX(-50%)',
          backgroundImage:    `url("${walkSrc}")`,
          backgroundSize:     `${6 * FRAME_W}px ${FRAME_H}px`,
          backgroundRepeat:   'no-repeat',
          backgroundPosition: '0 0',
          animation:          'char-walk 0.6s steps(6, end) infinite',
        }}
      />
    </div>
  )
}

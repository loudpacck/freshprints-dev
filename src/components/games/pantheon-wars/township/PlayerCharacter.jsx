import { useEffect, useRef } from 'react'
import { SCENE_WIDTH, FACTION_FOLDER } from './townshipConfig'

const CHAR_HEIGHT    = '13vh'
const GROUND_BOTTOM  = '8%'
const SPEED          = 120 // px/sec

export default function PlayerCharacter({ plot, assetKey, targetX, targetSeq }) {
  const folder   = FACTION_FOLDER[assetKey]
  const idleSrc  = `/pantheon_wars_assets/sprites/player_characters/${folder}/char_${assetKey}_idle.png`
  const walkSrc  = `/pantheon_wars_assets/sprites/player_characters/${folder}/char_${assetKey}_walk.png`

  const containerRef  = useRef(null)
  const idleRef       = useRef(null)
  const walkRef       = useRef(null)

  // Mutable animation state (never triggers re-renders)
  const charXRef      = useRef(plot.x * SCENE_WIDTH)
  const targetXRef    = useRef(null)
  const facingLeftRef = useRef(false)
  const lastTimeRef   = useRef(null)
  const rafRef        = useRef(null)

  // rAF loop — always syncs DOM position so React re-renders can't clobber it
  useEffect(() => {
    function tick(timestamp) {
      if (targetXRef.current !== null) {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp
        const dt     = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
        lastTimeRef.current = timestamp

        const target = targetXRef.current
        const dx     = target - charXRef.current

        if (Math.abs(dx) < 1.5) {
          charXRef.current   = target
          targetXRef.current = null
          lastTimeRef.current = null
          if (idleRef.current) idleRef.current.style.display = 'block'
          if (walkRef.current) walkRef.current.style.display = 'none'
        } else {
          const step = Math.sign(dx) * Math.min(SPEED * dt, Math.abs(dx))
          charXRef.current   += step
          facingLeftRef.current = dx < 0
          if (idleRef.current) idleRef.current.style.display = 'none'
          if (walkRef.current) walkRef.current.style.display = 'block'
        }
      }

      // Always write position to DOM so React reconciler can't reset it
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

  // Respond to a new move target from the parent
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
      <img
        ref={idleRef}
        src={idleSrc}
        alt=""
        draggable={false}
        style={{ height: CHAR_HEIGHT, width: 'auto', display: 'block' }}
      />
      <img
        ref={walkRef}
        src={walkSrc}
        alt=""
        draggable={false}
        style={{
          height:   CHAR_HEIGHT,
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
}

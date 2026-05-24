import { useRef, useState, useEffect } from 'react'
import ParallaxLayer     from './ParallaxLayer'
import BuildingSprite    from './BuildingSprite'
import PlayerCharacter   from './PlayerCharacter'
import AmbientNPC        from './AmbientNPC'
import AtmosphereEffects from './AtmosphereEffects'
import {
  SCENE_WIDTH, FACTION_MAP, BG_LAYERS, PLOTS,
  getBgLayerUrl, getTooltipInfo,
} from './townshipConfig'

// Inner world height matching 16:9 ratio so scale fills container exactly
const SCENE_HEIGHT = Math.round(SCENE_WIDTH * 9 / 16)

const SCENE_KEYFRAMES = `
  @keyframes tw-bldg-popin {
    from { opacity: 0; transform: translateX(-50%) scaleY(0.82); }
    to   { opacity: 1; transform: translateX(-50%) scaleY(1); }
  }
`

const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export default function TownshipScene({ faction, townships, templeData, onBuildingClick }) {
  const assetKey = FACTION_MAP[faction] || 'greek'
  const bgLayers = BG_LAYERS[assetKey] || BG_LAYERS.greek

  const containerRef = useRef(null)

  // Scale: containerWidth / SCENE_WIDTH so the world fills the 16:9 container exactly
  const [scale, setScale] = useState(1)
  const scaleRef = useRef(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const s = entry.contentRect.width / SCENE_WIDTH
      scaleRef.current = s
      setScale(s)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Scene fade-in on mount
  const [sceneVisible, setSceneVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSceneVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Player click-to-move
  const [charTargetX, setCharTargetX] = useState(null)
  const [charMoveSeq, setCharMoveSeq] = useState(0)
  const movePlayerRef = useRef(null)
  movePlayerRef.current = (sceneX) => {
    setCharTargetX(sceneX)
    setCharMoveSeq(s => s + 1)
  }

  // Building click
  const onBuildingClickRef = useRef(onBuildingClick)
  useEffect(() => { onBuildingClickRef.current = onBuildingClick }, [onBuildingClick])

  function handleBuildingClick(plotId) {
    onBuildingClickRef.current?.(plotId)
  }

  // Ground click → move player to clicked scene-space X
  function handleSceneClick(e) {
    if (e.target.closest('[data-plot-id]')) return
    const rect   = containerRef.current.getBoundingClientRect()
    const sceneX = (e.clientX - rect.left) / scaleRef.current
    movePlayerRef.current(sceneX)
  }

  // Hover (fine-pointer desktops only)
  const [hoveredPlotId, setHoveredPlotId] = useState(null)
  const [hoverInfo, setHoverInfo]         = useState(null)

  function handleHoverStart(plotId, rect) {
    if (!hasFinePointer()) return
    setHoveredPlotId(plotId)
    setHoverInfo({ plotId, rect })
  }
  function handleHoverEnd() {
    setHoveredPlotId(null)
    setHoverInfo(null)
  }

  // Touch tap: distinguish tap vs. scroll/drag
  const touchStartRef = useRef(null)

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  function onTouchEnd(e) {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return
    const t  = e.changedTouches[0]
    const dx = Math.abs(t.clientX - touchStartRef.current.x)
    const dy = Math.abs(t.clientY - touchStartRef.current.y)
    touchStartRef.current = null
    if (dx > 10 || dy > 10) return

    const el2    = document.elementFromPoint(t.clientX, t.clientY)
    const plotId = el2?.dataset?.plotId || el2?.closest?.('[data-plot-id]')?.dataset?.plotId
    if (plotId) {
      handleBuildingClick(plotId)
    } else {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) movePlayerRef.current((t.clientX - rect.left) / scaleRef.current)
    }
  }

  // Tooltip data
  const hoveredPlot = hoverInfo ? PLOTS.find(p => p.id === hoverInfo.plotId) : null
  const tooltipData = hoveredPlot
    ? getTooltipInfo(hoveredPlot, assetKey, townships, templeData)
    : null

  const townhallPlot = PLOTS.find(p => p.id === 'townhall')

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Your Township - interactive settlement view"
      style={{
        width:            '100%',
        aspectRatio:      '16 / 9',
        position:         'relative',
        overflow:         'hidden',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        background:       'linear-gradient(to bottom, #2a5a8a 0%, #3a7aaa 45%, #6a9aba 100%)',
        opacity:          sceneVisible ? 1 : 0,
        transition:       'opacity 0.6s ease',
      }}
      onClick={handleSceneClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{SCENE_KEYFRAMES}</style>

      {/* Parallax background layers — pan=0 centers all layers */}
      {bgLayers.map((layer, i) => (
        <ParallaxLayer
          key={layer.file}
          src={getBgLayerUrl(assetKey, layer.file)}
          speed={layer.speed}
          pan={0}
          zIndex={i + 1}
        />
      ))}

      <AtmosphereEffects assetKey={assetKey} />

      {/* Scaled world: SCENE_WIDTH × SCENE_HEIGHT scaled down to fill the 16:9 container */}
      <div style={{
        position:        'absolute',
        top:             0,
        left:            0,
        width:           SCENE_WIDTH,
        height:          SCENE_HEIGHT,
        transformOrigin: '0 0',
        transform:       `scale(${scale})`,
        willChange:      'transform',
        zIndex:          10,
      }}>
        <AmbientNPC assetKey={assetKey} />

        {PLOTS.map((plot, i) => (
          <BuildingSprite
            key={plot.id}
            plot={plot}
            assetKey={assetKey}
            townships={townships}
            templeData={templeData}
            isHovered={hoveredPlotId === plot.id}
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
            onBuildingClick={handleBuildingClick}
            onBuildingFocus={() => {}}
            staggerIndex={i}
          />
        ))}

        {townhallPlot && (
          <PlayerCharacter
            plot={townhallPlot}
            assetKey={assetKey}
            targetX={charTargetX}
            targetSeq={charMoveSeq}
          />
        )}
      </div>

      {/* Tooltip — fixed so it escapes overflow:hidden; rect is already in viewport space */}
      {hoverInfo?.rect && tooltipData && (
        <div
          style={{
            position:       'fixed',
            left:           hoverInfo.rect.left + hoverInfo.rect.width / 2,
            top:            hoverInfo.rect.top - 8,
            transform:      'translate(-50%, -100%)',
            zIndex:         9999,
            pointerEvents:  'none',
            background:     'rgba(10,7,18,0.95)',
            border:         '1px solid rgba(201,169,97,0.28)',
            borderRadius:   5,
            padding:        '6px 12px',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            gap:            3,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <span style={{
            fontFamily:    "'Cinzel', serif",
            fontSize:      11,
            letterSpacing: '0.08em',
            color:         '#EDC87C',
            whiteSpace:    'nowrap',
          }}>
            {tooltipData.name}
          </span>
          <span style={{
            fontFamily:    "'IBM Plex Mono', monospace",
            fontSize:      9,
            letterSpacing: '0.06em',
            color:         tooltipData.isUpgrading ? '#F59E0B' : 'rgba(237,227,204,0.5)',
            whiteSpace:    'nowrap',
          }}>
            {tooltipData.isUpgrading ? '⟳ UPGRADING' : tooltipData.levelText}
          </span>
          <div style={{
            position:     'absolute',
            bottom:       -7,
            left:         '50%',
            transform:    'translateX(-50%)',
            width:        0,
            height:       0,
            borderLeft:   '7px solid transparent',
            borderRight:  '7px solid transparent',
            borderTop:    '7px solid rgba(201,169,97,0.28)',
          }} />
          <div style={{
            position:     'absolute',
            bottom:       -6,
            left:         '50%',
            transform:    'translateX(-50%)',
            width:        0,
            height:       0,
            borderLeft:   '6px solid transparent',
            borderRight:  '6px solid transparent',
            borderTop:    '6px solid rgba(10,7,18,0.95)',
          }} />
        </div>
      )}

      <div style={{
        position:      'absolute',
        bottom:        12,
        left:          '50%',
        transform:     'translateX(-50%)',
        zIndex:        20,
        fontFamily:    "'IBM Plex Mono', monospace",
        fontSize:      9,
        letterSpacing: '0.12em',
        color:         'rgba(201,169,97,0.3)',
        pointerEvents: 'none',
        whiteSpace:    'nowrap',
      }}>
        CLICK GROUND TO MOVE
      </div>
    </div>
  )
}

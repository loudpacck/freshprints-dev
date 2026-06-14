import { useRef, useState, useEffect } from 'react'
import BuildingSprite    from './BuildingSprite'
import PlayerCharacter   from './PlayerCharacter'
import AmbientNPC        from './AmbientNPC'
import AtmosphereEffects from './AtmosphereEffects'
import {
  SCENE_WIDTH, FACTION_MAP, BG_LAYERS, PLOTS,
  DEFAULT_NPC_CONFIGS, DEFAULT_ATMOSPHERE_CONFIGS,
  getBgLayerUrl, getTooltipInfo,
} from './townshipConfig'

const WORLD_NATIVE_HEIGHT = 1080
const CHAT_BAR_HEIGHT     = 40

const SCENE_KEYFRAMES = `
  @keyframes tw-bldg-popin {
    from { opacity: 0; transform: translateX(-50%) scaleY(0.82); }
    to   { opacity: 1; transform: translateX(-50%) scaleY(1); }
  }
  @keyframes tw-ground-marker {
    0%   { opacity: 1; transform: translateX(-50%) scale(1.3); }
    100% { opacity: 0; transform: translateX(-50%) scale(0.7); }
  }
`

const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export default function TownshipScene({
  faction, townships, templeData, onBuildingClick,
  plotOverrides, npcOverrides, atmosphereOverrides, playerFootOffsetOverride,
}) {
  const assetKey = FACTION_MAP[faction] || 'greek'
  const bgLayers = BG_LAYERS[assetKey] || BG_LAYERS.greek

  // Merge optional admin-configured layout overrides (by id) with defaults
  const effectivePlots = plotOverrides?.length
    ? PLOTS.map(p => {
        const o = plotOverrides.find(o => o.id === p.id)
        if (!o) return p
        return {
          ...p,
          x: o.x ?? p.x,
          bottomPct: o.bottomPct ?? p.bottomPct,
          footOffsetPx: o.footOffsetPx ? { ...p.footOffsetPx, ...o.footOffsetPx } : p.footOffsetPx,
        }
      })
    : PLOTS

  const effectiveNpcConfigs = npcOverrides?.length
    ? DEFAULT_NPC_CONFIGS.map(c => {
        const o = npcOverrides.find(o => o.id === c.id)
        if (!o) return c
        return {
          ...c,
          minX: o.minX ?? c.minX,
          maxX: o.maxX ?? c.maxX,
          startX: o.startX ?? c.startX,
          footOffsetPx: o.footOffsetPx ? { ...c.footOffsetPx, ...o.footOffsetPx } : c.footOffsetPx,
        }
      })
    : undefined

  const effectiveAtmosphereConfigs = atmosphereOverrides?.length
    ? DEFAULT_ATMOSPHERE_CONFIGS.map(c => {
        const o = atmosphereOverrides.find(o => o.id === c.id)
        return o ? { ...c, leftPct: o.leftPct ?? c.leftPct } : c
      })
    : undefined

  const containerRef = useRef(null)
  const worldRef     = useRef(null)
  const layerRefs    = useRef(bgLayers.map(() => null))

  const scaleRef = useRef(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // Scale world to fit available height above chat bar
    scaleRef.current = (el.clientHeight - CHAT_BAR_HEIGHT) / WORLD_NATIVE_HEIGHT
    const ro = new ResizeObserver(([entry]) => {
      scaleRef.current = (entry.contentRect.height - CHAT_BAR_HEIGHT) / WORLD_NATIVE_HEIGHT
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

  // Player position ref — shared with PlayerCharacter which writes its position here
  const townhallPlot = effectivePlots.find(p => p.id === 'townhall')
  const charXRef     = useRef((townhallPlot?.x ?? 0.48) * SCENE_WIDTH)

  // Camera offset in viewport pixels (lerped toward target)
  const cameraXRef     = useRef(0)
  const cameraInitRef  = useRef(false)

  // Camera rAF: follow player, update world transform and parallax layers
  useEffect(() => {
    let raf
    function tick() {
      const s          = scaleRef.current
      const containerW = containerRef.current?.clientWidth || 0
      const worldW     = SCENE_WIDTH * s
      const playerView = charXRef.current * s
      const targetCam  = Math.max(0, Math.min(
        playerView - containerW / 2,
        worldW - containerW
      ))

      if (!cameraInitRef.current) {
        // Snap to correct position on first frame (no lag)
        cameraXRef.current = targetCam
        cameraInitRef.current = true
      } else {
        // Smooth follow
        cameraXRef.current += (targetCam - cameraXRef.current) * 0.12
      }

      const cam = cameraXRef.current

      if (worldRef.current) {
        worldRef.current.style.transform = `translateX(-${cam}px) scale(${s})`
      }

      bgLayers.forEach((layer, i) => {
        const el = layerRefs.current[i]
        if (el) {
          el.style.backgroundPositionX = `${-cam * layer.speed}px`
        }
      })

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Player click-to-move
  const [charTargetX, setCharTargetX] = useState(null)
  const [charMoveSeq, setCharMoveSeq] = useState(0)
  const [groundMarkerX, setGroundMarkerX] = useState(null)
  const markerTimerRef = useRef(null)
  const movePlayerRef  = useRef(null)
  movePlayerRef.current = (sceneX) => {
    setCharTargetX(sceneX)
    setCharMoveSeq(s => s + 1)
  }

  const onBuildingClickRef = useRef(onBuildingClick)
  useEffect(() => { onBuildingClickRef.current = onBuildingClick }, [onBuildingClick])

  function handleBuildingClick(plotId) {
    onBuildingClickRef.current?.(plotId)
  }

  // Ground click → move player + show ground marker
  // Click coords: viewport offset + camera = world-viewport offset, then / scale = scene coords
  function handleSceneClick(e) {
    if (e.target.closest('[data-plot-id]')) return
    const rect   = containerRef.current.getBoundingClientRect()
    const sceneX = (e.clientX - rect.left + cameraXRef.current) / scaleRef.current
    movePlayerRef.current(sceneX)
    setGroundMarkerX(sceneX)
    if (markerTimerRef.current) clearTimeout(markerTimerRef.current)
    markerTimerRef.current = setTimeout(() => setGroundMarkerX(null), 600)
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
      if (rect) {
        const sceneX = (t.clientX - rect.left + cameraXRef.current) / scaleRef.current
        movePlayerRef.current(sceneX)
        setGroundMarkerX(sceneX)
        if (markerTimerRef.current) clearTimeout(markerTimerRef.current)
        markerTimerRef.current = setTimeout(() => setGroundMarkerX(null), 600)
      }
    }
  }

  // Tooltip data
  const hoveredPlot = hoverInfo ? effectivePlots.find(p => p.id === hoverInfo.plotId) : null
  const tooltipData = hoveredPlot
    ? getTooltipInfo(hoveredPlot, assetKey, townships, templeData)
    : null

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Your Township - interactive settlement view"
      style={{
        width:                    '100%',
        aspectRatio:              '16 / 9',
        position:                 'relative',
        overflow:                 'hidden',
        userSelect:               'none',
        WebkitUserSelect:         'none',
        outline:                  'none',
        WebkitTapHighlightColor:  'transparent',
        background:               'linear-gradient(to bottom, #2a5a8a 0%, #3a7aaa 45%, #6a9aba 100%)',
        opacity:                  sceneVisible ? 1 : 0,
        transition:               'opacity 0.6s ease',
      }}
      onClick={handleSceneClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{SCENE_KEYFRAMES}</style>

      {/* Parallax background layers — tiling with repeat-x for endless scroll */}
      {bgLayers.map((layer, i) => (
        <div
          key={layer.file}
          ref={el => { layerRefs.current[i] = el }}
          aria-hidden="true"
          style={{
            position:             'absolute',
            inset:                0,
            zIndex:               i + 1,
            backgroundImage:      `url("${getBgLayerUrl(assetKey, layer.file)}")`,
            backgroundSize:       'auto 100%',
            backgroundRepeat:     'repeat-x',
            backgroundPositionY:  'bottom',
            willChange:           'background-position-x',
          }}
        />
      ))}

      {/* Sky effects — viewport-relative, drift independently across the sky */}
      <AtmosphereEffects assetKey={assetKey} group="sky" configs={effectiveAtmosphereConfigs} />

      {/* World container — camera offset + scale applied via rAF (not React state) */}
      <div
        ref={worldRef}
        style={{
          position:        'absolute',
          bottom:          CHAT_BAR_HEIGHT,
          left:            0,
          width:           SCENE_WIDTH,
          height:          WORLD_NATIVE_HEIGHT,
          transformOrigin: '0 100%',
          willChange:      'transform',
          zIndex:          10,
        }}
      >
        {/* Ground effects inside world so they scroll with camera and z-sort with buildings/NPCs */}
        <AtmosphereEffects assetKey={assetKey} group="ground" configs={effectiveAtmosphereConfigs} />

        <AmbientNPC assetKey={assetKey} configs={effectiveNpcConfigs} />

        {effectivePlots.map((plot, i) => (
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
            charXRef={charXRef}
            footOffsetPx={playerFootOffsetOverride}
          />
        )}

        {groundMarkerX !== null && (
          <div
            key={charMoveSeq}
            style={{
              position:      'absolute',
              left:          groundMarkerX + 'px',
              bottom:        '2%',
              transform:     'translateX(-50%)',
              color:         '#C9A961',
              fontSize:      28,
              lineHeight:    1,
              pointerEvents: 'none',
              userSelect:    'none',
              zIndex:        31,
              animation:     'tw-ground-marker 0.6s ease-out forwards',
            }}
          >
            ✦
          </div>
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

    </div>
  )
}

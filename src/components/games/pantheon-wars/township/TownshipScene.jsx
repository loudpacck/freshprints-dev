import { useRef, useState, useEffect } from 'react'
import ParallaxLayer      from './ParallaxLayer'
import BuildingSprite     from './BuildingSprite'
import PlayerCharacter    from './PlayerCharacter'
import AmbientNPC         from './AmbientNPC'
import AtmosphereEffects  from './AtmosphereEffects'
import TownshipMobileNav  from './TownshipMobileNav'
import {
  SCENE_WIDTH, FACTION_MAP, BG_LAYERS, PLOTS,
  getBgLayerUrl, getTooltipInfo,
} from './townshipConfig'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3.0

const SCENE_KEYFRAMES = `
  @keyframes tw-bldg-popin {
    from { opacity: 0; transform: translateX(-50%) scaleY(0.82); }
    to   { opacity: 1; transform: translateX(-50%) scaleY(1); }
  }
  @keyframes tw-zoom-flash {
    0%, 100% { opacity: 0; }
    20%, 80%  { opacity: 1; }
  }
`

const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export default function TownshipScene({ faction, townships, templeData, onBuildingClick, isModalOpen }) {
  const assetKey = FACTION_MAP[faction] || 'greek'
  const bgLayers = BG_LAYERS[assetKey] || BG_LAYERS.greek

  const containerRef = useRef(null)
  const panRef       = useRef(0)
  const zoomRef      = useRef(1)

  const [tick, setTick] = useState(0)
  const commit = () => setTick(n => n + 1)

  const pan  = panRef.current
  const zoom = zoomRef.current

  // Scene fade-in on mount
  const [sceneVisible, setSceneVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setSceneVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Zoom limit feedback
  const [zoomLimitMsg, setZoomLimitMsg]   = useState(null)
  const zoomFlashTimer = useRef(null)

  function flashZoomLimit(isMax) {
    setZoomLimitMsg(isMax ? 'MAX ZOOM' : 'MIN ZOOM')
    clearTimeout(zoomFlashTimer.current)
    zoomFlashTimer.current = setTimeout(() => setZoomLimitMsg(null), 700)
  }

  // Player click-to-move
  const [charTargetX, setCharTargetX] = useState(null)
  const [charMoveSeq, setCharMoveSeq] = useState(0)

  function movePlayerTo(sceneX) {
    setCharTargetX(sceneX)
    setCharMoveSeq(s => s + 1)
  }
  const movePlayerRef = useRef(movePlayerTo)
  movePlayerRef.current = movePlayerTo

  // Smooth pan lerp (for mobile nav zone buttons)
  const panLerpTargetRef = useRef(null)
  const panLerpRafRef    = useRef(null)

  function startPanLerp() {
    function tick() {
      const target = panLerpTargetRef.current
      if (target === null) { panLerpRafRef.current = null; return }
      const diff = target - panRef.current
      if (Math.abs(diff) < 0.5) {
        panRef.current         = target
        panLerpTargetRef.current = null
        panLerpRafRef.current    = null
        commit()
        return
      }
      panRef.current += diff * 0.12
      commit()
      panLerpRafRef.current = requestAnimationFrame(tick)
    }
    panLerpRafRef.current = requestAnimationFrame(tick)
  }

  function panToSceneX(sceneX) {
    const viewW  = containerRef.current?.clientWidth || window.innerWidth
    panLerpTargetRef.current = clampPan(viewW / 2 - sceneX * zoomRef.current, zoomRef.current)
    if (!panLerpRafRef.current) startPanLerp()
  }

  // Cleanup pan lerp on unmount
  useEffect(() => {
    return () => { if (panLerpRafRef.current) cancelAnimationFrame(panLerpRafRef.current) }
  }, [])

  // Drag tracking
  const isDragging   = useRef(false)
  const lastMouseX   = useRef(0)
  const mouseDownPos = useRef({ x: 0, y: 0 })
  const didDragRef   = useRef(false)

  // Touch tracking
  const touch1Ref = useRef(null)
  const pinchRef  = useRef(null)

  // Hover state (desktop only)
  const [hoveredPlotId, setHoveredPlotId] = useState(null)
  const [hoverInfo, setHoverInfo]         = useState(null)

  const onBuildingClickRef = useRef(onBuildingClick)
  useEffect(() => { onBuildingClickRef.current = onBuildingClick }, [onBuildingClick])

  // ── Pan / zoom helpers ─────────────────────────────────────────────────────

  function clampPan(p, z) {
    const viewW = containerRef.current?.clientWidth || window.innerWidth
    const minP  = Math.min(0, viewW - SCENE_WIDTH * z)
    return Math.max(minP, Math.min(0, p))
  }

  function applyPan(p) {
    panRef.current = clampPan(p, zoomRef.current)
    commit()
  }

  function applyZoom(newZ, pivotX) {
    const oldZ    = zoomRef.current
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZ))
    if (clamped !== newZ) flashZoomLimit(newZ > MAX_ZOOM)
    newZ = clamped
    const newPan = pivotX - ((pivotX - panRef.current) / oldZ) * newZ
    zoomRef.current = newZ
    panRef.current  = clampPan(newPan, newZ)
    commit()
  }

  // ── Building click ─────────────────────────────────────────────────────────

  function handleBuildingClick(plotId) {
    if (didDragRef.current) return
    onBuildingClick?.(plotId)
  }
  const handleBuildingClickRef = useRef(handleBuildingClick)
  handleBuildingClickRef.current = handleBuildingClick

  // ── Ground click (click-to-move player) ───────────────────────────────────

  function handleSceneClick(e) {
    if (didDragRef.current) return
    if (e.target.closest('[data-plot-id]')) return
    const rect  = containerRef.current.getBoundingClientRect()
    const relX  = e.clientX - rect.left
    const sceneX = (relX - panRef.current) / zoomRef.current
    movePlayerRef.current(sceneX)
  }

  // ── Hover ──────────────────────────────────────────────────────────────────

  function handleHoverStart(plotId, rect) {
    if (isDragging.current || !hasFinePointer()) return
    setHoveredPlotId(plotId)
    setHoverInfo({ plotId, rect })
  }
  function handleHoverEnd() {
    setHoveredPlotId(null)
    setHoverInfo(null)
  }

  // ── Mouse events ──────────────────────────────────────────────────────────

  function onMouseDown(e) {
    if (e.button !== 0) return
    isDragging.current   = true
    didDragRef.current   = false
    lastMouseX.current   = e.clientX
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
    setHoveredPlotId(null)
    setHoverInfo(null)
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }

  function onMouseMove(e) {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouseX.current
    lastMouseX.current = e.clientX
    if (!didDragRef.current) {
      const totalDx = e.clientX - mouseDownPos.current.x
      const totalDy = e.clientY - mouseDownPos.current.y
      if (Math.hypot(totalDx, totalDy) > 5) didDragRef.current = true
    }
    applyPan(panRef.current + dx)
  }

  function onMouseUp() {
    if (!isDragging.current) return
    isDragging.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
  }

  // ── Wheel zoom ────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onWheel(e) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZ  = zoomRef.current * (1 + delta)
      applyZoom(newZ, e.clientX)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Touch events ──────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onTouchStart(e) {
      if (e.touches.length === 1) {
        touch1Ref.current = {
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startPan: panRef.current,
        }
        pinchRef.current = null
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        pinchRef.current  = { startDist: dist, startZoom: zoomRef.current, midX: (t1.clientX + t2.clientX) / 2, startPan: panRef.current }
        touch1Ref.current = null
      }
    }

    function onTouchMove(e) {
      e.preventDefault()
      if (e.touches.length === 1 && touch1Ref.current) {
        const dx = e.touches[0].clientX - touch1Ref.current.startX
        applyPan(touch1Ref.current.startPan + dx)
      } else if (e.touches.length === 2 && pinchRef.current) {
        const t1 = e.touches[0], t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        const { startDist, startZoom, midX, startPan } = pinchRef.current
        const newZ   = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, startZoom * (dist / startDist)))
        const newPan = midX - ((midX - startPan) / startZoom) * newZ
        zoomRef.current = newZ
        panRef.current  = clampPan(newPan, newZ)
        commit()
      }
    }

    function onTouchEnd(e) {
      if (e.changedTouches.length === 1 && touch1Ref.current) {
        const t  = e.changedTouches[0]
        const dx = Math.abs(t.clientX - touch1Ref.current.startX)
        const dy = Math.abs(t.clientY - touch1Ref.current.startY)
        if (dx < 10 && dy < 10) {
          const el2   = document.elementFromPoint(t.clientX, t.clientY)
          const plotId = el2?.dataset?.plotId || el2?.closest?.('[data-plot-id]')?.dataset?.plotId
          if (plotId) {
            handleBuildingClickRef.current(plotId)
          } else {
            // Ground tap → move player
            const rect   = containerRef.current?.getBoundingClientRect()
            if (rect) {
              const relX   = t.clientX - rect.left
              const sceneX = (relX - panRef.current) / zoomRef.current
              movePlayerRef.current(sceneX)
            }
          }
        }
      }
      if (e.touches.length < 2) pinchRef.current  = null
      if (e.touches.length < 1) touch1Ref.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard pan ──────────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft')  applyPan(panRef.current + 80)
      if (e.key === 'ArrowRight') applyPan(panRef.current - 80)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Building focus (keyboard tab nav → auto-pan) ─────────────────────────

  function handleBuildingFocus(plotId) {
    const plot = PLOTS.find(p => p.id === plotId)
    if (plot) panToSceneX(plot.x * SCENE_WIDTH)
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const hoveredPlot = hoverInfo ? PLOTS.find(p => p.id === hoverInfo.plotId) : null
  const tooltipData = hoveredPlot
    ? getTooltipInfo(hoveredPlot, assetKey, townships, templeData)
    : null

  const townhallPlot = PLOTS.find(p => p.id === 'townhall')

  // Active zone for mobile nav highlight
  const viewW          = containerRef.current?.clientWidth || window.innerWidth
  const centerSceneX   = (viewW / 2 - pan) / zoom
  const activeZone     = centerSceneX < 900 ? 'military' : centerSceneX < 2100 ? 'center' : 'sacred'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Your Township - interactive settlement view"
      style={{
        flex:          1,
        position:      'relative',
        overflow:      'hidden',
        cursor:        'grab',
        touchAction:   'none',
        userSelect:    'none',
        WebkitUserSelect: 'none',
        background:    '#0A0710',
        opacity:       sceneVisible ? 1 : 0,
        transition:    'opacity 0.6s ease',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={handleSceneClick}
    >
      <style>{SCENE_KEYFRAMES}</style>

      {/* Parallax background layers */}
      {bgLayers.map((layer, i) => (
        <ParallaxLayer
          key={layer.file}
          src={getBgLayerUrl(assetKey, layer.file)}
          speed={layer.speed}
          pan={pan}
          zIndex={i + 1}
        />
      ))}

      {/* Atmosphere effects — viewport-space overlays, behind buildings */}
      <AtmosphereEffects assetKey={assetKey} />

      {/* Pan/zoom container — buildings, NPCs, player */}
      <div style={{
        position:        'absolute',
        top: 0, left: 0,
        width:           SCENE_WIDTH,
        height:          '100%',
        transformOrigin: '0 0',
        transform:       `translateX(${pan}px) scale(${zoom})`,
        willChange:      'transform',
        zIndex:          10,
      }}>
        {/* Ambient NPCs — behind buildings (z:4) */}
        <AmbientNPC assetKey={assetKey} />

        {/* Buildings (z:6) with pop-in stagger */}
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
            onBuildingFocus={handleBuildingFocus}
            staggerIndex={i}
          />
        ))}

        {/* Player character (z:12) — always on top */}
        {townhallPlot && (
          <PlayerCharacter
            plot={townhallPlot}
            assetKey={assetKey}
            targetX={charTargetX}
            targetSeq={charMoveSeq}
          />
        )}
      </div>

      {/* Tooltip — fixed so it escapes overflow:hidden */}
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
          {/* Arrow caret pointing to building */}
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

      {/* Zoom limit flash */}
      {zoomLimitMsg && (
        <div style={{
          position:       'absolute',
          bottom:         40,
          left:           '50%',
          transform:      'translateX(-50%)',
          zIndex:         20,
          fontFamily:     "'IBM Plex Mono', monospace",
          fontSize:       9,
          letterSpacing:  '0.14em',
          color:          'rgba(201,169,97,0.7)',
          pointerEvents:  'none',
          whiteSpace:     'nowrap',
          animation:      'tw-zoom-flash 0.7s ease both',
        }}>
          {zoomLimitMsg}
        </div>
      )}

      {/* Pan/zoom hint */}
      <div style={{
        position:      'absolute',
        bottom:        16,
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
        DRAG TO PAN · SCROLL TO ZOOM · CLICK GROUND TO MOVE
      </div>

      {/* Mobile zone navigation */}
      <TownshipMobileNav
        activeZone={activeZone}
        isModalOpen={isModalOpen}
        panToSceneX={panToSceneX}
      />
    </div>
  )
}

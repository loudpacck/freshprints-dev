import { useState, useRef, useEffect } from 'react'
import {
  SCENE_WIDTH, BG_LAYERS,
  DEFAULT_NPC_CONFIGS, DEFAULT_ATMOSPHERE_CONFIGS, DEFAULT_PLAYER_FOOT_OFFSETS,
  PLOTS, getBgLayerUrl, getBuildingUrl, getTempleUrl,
} from '@/components/games/pantheon-wars/township/townshipConfig'

const WORLD_H = 1080

const FACTIONS = [
  { assetKey: 'greek', label: '🏛 GREEK' },
  { assetKey: 'norse', label: '❄ NORSE' },
  { assetKey: 'mesop', label: '🏺 MESOPOTAMIAN' },
]

const ATMOSPHERE_ICONS = {
  fire: '🔥',
  smoke: '💨',
  ashes: '🌫',
  enviroparticles: '✨',
}

const NPC_ICONS = {
  villager: '🧍',
  animal: '🐐',
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function getEditorBuildingUrl(plot, assetKey) {
  if (plot.templeType) return getTempleUrl(plot.templeType)
  if (plot.id === 'embassy')  return getBuildingUrl(assetKey, `bldg_embassy_${assetKey}.png`)
  if (plot.id === 'shop')     return getBuildingUrl(assetKey, `bldg_shop_${assetKey}.png`)
  if (plot.id === 'townhall') return getBuildingUrl(assetKey, `bldg_townhall_${assetKey}_t1.png`)
  return getBuildingUrl(assetKey, `bldg_${plot.id}_${assetKey}_t1.png`)
}

function getEmptyBuildingUrl(assetKey) {
  return getBuildingUrl(assetKey, `bldg_empty_${assetKey}.png`)
}

function clonePlots() {
  return PLOTS.map(p => ({ id: p.id, x: p.x, bottomPct: p.bottomPct, templeType: p.templeType }))
}
function cloneNpcs() {
  return DEFAULT_NPC_CONFIGS.map(c => ({ id: c.id, type: c.type, minX: c.minX, maxX: c.maxX, startX: c.startX, footOffsetPx: { ...c.footOffsetPx } }))
}
function cloneAtmosphere() {
  return DEFAULT_ATMOSPHERE_CONFIGS.map(c => ({ id: c.id, sprite: c.sprite, leftPct: c.leftPct }))
}
function clonePlayer() {
  return { footOffsetPx: { ...DEFAULT_PLAYER_FOOT_OFFSETS } }
}

function mergeById(defaults, overrides) {
  if (!overrides?.length) return defaults
  return defaults.map(d => {
    const o = overrides.find(o => o.id === d.id)
    return o ? { ...d, ...o } : d
  })
}
function mergeNpcs(defaults, overrides) {
  if (!overrides?.length) return defaults
  return defaults.map(d => {
    const o = overrides.find(o => o.id === d.id)
    if (!o) return d
    return {
      ...d,
      ...o,
      footOffsetPx: o.footOffsetPx ? { ...d.footOffsetPx, ...o.footOffsetPx } : d.footOffsetPx,
    }
  })
}
function mergePlayer(defaults, override) {
  if (!override) return defaults
  return { footOffsetPx: { ...defaults.footOffsetPx, ...(override.footOffsetPx || {}) } }
}

// ── Shared styles ───────────────────────────────────────────────────────────────

const labelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-muted)',
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
}

const toolBtnStyle = (active) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  padding: 'var(--space-2) var(--space-4)',
  background: active ? 'rgba(0,200,255,0.12)' : 'rgba(0,200,255,0.06)',
  border: `1px solid ${active ? 'rgba(0,200,255,0.5)' : 'rgba(0,200,255,0.2)'}`,
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-accent-primary)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})

const numberInputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-2) var(--space-3)',
  width: '100%',
  outline: 'none',
}

export default function TownshipLayoutEditor() {
  const [faction, setFaction]       = useState('greek')
  const [plots, setPlots]           = useState(clonePlots)
  const [npcs, setNpcs]             = useState(cloneNpcs)
  const [atmosphere, setAtmosphere] = useState(cloneAtmosphere)
  const [player, setPlayer]         = useState(clonePlayer)
  const [dirty, setDirty]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')
  const [showGrid, setShowGrid]     = useState(false)
  const [selected, setSelected]     = useState(null) // { type: 'plot'|'npc'|'atmosphere', id }
  const [hovered, setHovered]       = useState(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  const containerRef = useRef(null)

  // Measure container for editorScale
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth)
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Load saved layout config
  useEffect(() => {
    fetch('/api/admin/overview?action=get_config&key=township_layout')
      .then(r => r.json())
      .then(({ config }) => {
        if (!config) return
        if (config.plots?.length)      setPlots(mergeById(clonePlots(), config.plots))
        if (config.npcs?.length)       setNpcs(mergeNpcs(cloneNpcs(), config.npcs))
        if (config.atmosphere?.length) setAtmosphere(mergeById(cloneAtmosphere(), config.atmosphere))
        if (config.player)             setPlayer(mergePlayer(clonePlayer(), config.player))
      })
      .catch(() => {})
  }, [])

  const editorScale = containerWidth / SCENE_WIDTH
  const worldDisplayW = SCENE_WIDTH * editorScale
  const worldDisplayH = WORLD_H * editorScale

  // ── Arrow-key nudge for selected element ────────────────────────────────────
  useEffect(() => {
    if (!selected) return
    function handleKey(e) {
      const STEP = 0.001
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
      e.preventDefault()

      if (selected.type === 'plot') {
        setPlots(prev => prev.map(p => {
          if (p.id !== selected.id) return p
          let { x, bottomPct } = p
          if (e.key === 'ArrowLeft')  x = clamp(x - STEP, 0, 1)
          if (e.key === 'ArrowRight') x = clamp(x + STEP, 0, 1)
          if (e.key === 'ArrowUp')    bottomPct = clamp(bottomPct + STEP, 0, 1)
          if (e.key === 'ArrowDown')  bottomPct = clamp(bottomPct - STEP, 0, 1)
          return { ...p, x, bottomPct }
        }))
      } else if (selected.type === 'npc') {
        const stepPx = STEP * SCENE_WIDTH
        setNpcs(prev => prev.map(n => {
          if (n.id !== selected.id) return n
          let { minX, maxX, startX } = n
          let footOffsetPx = n.footOffsetPx
          if (e.key === 'ArrowLeft')  { minX -= stepPx; maxX -= stepPx; startX -= stepPx }
          if (e.key === 'ArrowRight') { minX += stepPx; maxX += stepPx; startX += stepPx }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const cur  = footOffsetPx?.[faction] ?? 0
            const next = clamp(cur + (e.key === 'ArrowUp' ? 1 : -1), -50, 100)
            footOffsetPx = { ...footOffsetPx, [faction]: next }
          }
          return {
            ...n,
            minX: clamp(minX, 0, SCENE_WIDTH),
            maxX: clamp(maxX, 0, SCENE_WIDTH),
            startX: clamp(startX, 0, SCENE_WIDTH),
            footOffsetPx,
          }
        }))
      } else if (selected.type === 'player') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          setPlayer(prev => {
            const cur  = prev.footOffsetPx[faction] ?? 0
            const next = clamp(cur + (e.key === 'ArrowUp' ? 1 : -1), -50, 100)
            return { footOffsetPx: { ...prev.footOffsetPx, [faction]: next } }
          })
        }
      } else if (selected.type === 'atmosphere') {
        setAtmosphere(prev => prev.map(a => {
          if (a.id !== selected.id) return a
          let leftPct = a.leftPct
          if (e.key === 'ArrowLeft')  leftPct = clamp(leftPct - STEP, 0, 1)
          if (e.key === 'ArrowRight') leftPct = clamp(leftPct + STEP, 0, 1)
          return { ...a, leftPct }
        }))
      }
      setDirty(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selected, faction])

  // ── Drag handlers (Pointer Events) ──────────────────────────────────────────

  function handlePlotPointerDown(e, plot) {
    e.preventDefault()
    e.stopPropagation()
    setSelected({ type: 'plot', id: plot.id })
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startX = plot.x
    const startBottomPct = plot.bottomPct

    function handleMove(ev) {
      const dxWorld = (ev.clientX - startClientX) / editorScale
      const dyWorld = (ev.clientY - startClientY) / editorScale
      const newX = clamp(startX + dxWorld / SCENE_WIDTH, 0, 1)
      const newBottomPct = clamp(startBottomPct - dyWorld / WORLD_H, 0, 1)
      setPlots(prev => prev.map(p => p.id === plot.id ? { ...p, x: newX, bottomPct: newBottomPct } : p))
      setDirty(true)
    }
    function handleUp() {
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerup', handleUp)
    }
    el.addEventListener('pointermove', handleMove)
    el.addEventListener('pointerup', handleUp)
  }

  function handleNpcCenterPointerDown(e, npc) {
    e.preventDefault()
    e.stopPropagation()
    setSelected({ type: 'npc', id: npc.id })
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startClientX = e.clientX
    const start = { minX: npc.minX, maxX: npc.maxX, startX: npc.startX }

    function handleMove(ev) {
      const dxWorld = (ev.clientX - startClientX) / editorScale
      setNpcs(prev => prev.map(n => n.id === npc.id ? {
        ...n,
        minX: clamp(start.minX + dxWorld, 0, SCENE_WIDTH),
        maxX: clamp(start.maxX + dxWorld, 0, SCENE_WIDTH),
        startX: clamp(start.startX + dxWorld, 0, SCENE_WIDTH),
      } : n))
      setDirty(true)
    }
    function handleUp() {
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerup', handleUp)
    }
    el.addEventListener('pointermove', handleMove)
    el.addEventListener('pointerup', handleUp)
  }

  function handleNpcEdgePointerDown(e, npc, edge) {
    e.preventDefault()
    e.stopPropagation()
    setSelected({ type: 'npc', id: npc.id })
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startClientX = e.clientX
    const field = edge === 'min' ? 'minX' : 'maxX'
    const startVal = npc[field]

    function handleMove(ev) {
      const dxWorld = (ev.clientX - startClientX) / editorScale
      const newVal = clamp(startVal + dxWorld, 0, SCENE_WIDTH)
      setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, [field]: newVal } : n))
      setDirty(true)
    }
    function handleUp() {
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerup', handleUp)
    }
    el.addEventListener('pointermove', handleMove)
    el.addEventListener('pointerup', handleUp)
  }

  function handleAtmospherePointerDown(e, item) {
    e.preventDefault()
    e.stopPropagation()
    setSelected({ type: 'atmosphere', id: item.id })
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const startClientX = e.clientX
    const startLeftPct = item.leftPct

    function handleMove(ev) {
      const dxWorld = (ev.clientX - startClientX) / editorScale
      const newLeftPct = clamp(startLeftPct + dxWorld / SCENE_WIDTH, 0, 1)
      setAtmosphere(prev => prev.map(a => a.id === item.id ? { ...a, leftPct: newLeftPct } : a))
      setDirty(true)
    }
    function handleUp() {
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', handleMove)
      el.removeEventListener('pointerup', handleUp)
    }
    el.addEventListener('pointermove', handleMove)
    el.addEventListener('pointerup', handleUp)
  }

  // ── Field editors (info panel inputs) ───────────────────────────────────────

  function updatePlotField(id, field, value) {
    if (Number.isNaN(value)) return
    setPlots(prev => prev.map(p => p.id === id ? { ...p, [field]: clamp(value, 0, 1) } : p))
    setDirty(true)
  }
  function updateNpcField(id, field, value) {
    if (Number.isNaN(value)) return
    setNpcs(prev => prev.map(n => n.id === id ? { ...n, [field]: clamp(value, 0, SCENE_WIDTH) } : n))
    setDirty(true)
  }
  function updateAtmosphereField(id, field, value) {
    if (Number.isNaN(value)) return
    setAtmosphere(prev => prev.map(a => a.id === id ? { ...a, [field]: clamp(value, 0, 1) } : a))
    setDirty(true)
  }
  function updateNpcFootOffset(id, value) {
    if (Number.isNaN(value)) return
    setNpcs(prev => prev.map(n => n.id === id
      ? { ...n, footOffsetPx: { ...n.footOffsetPx, [faction]: clamp(value, -50, 100) } }
      : n))
    setDirty(true)
  }
  function updatePlayerFootOffset(value) {
    if (Number.isNaN(value)) return
    setPlayer(prev => ({ footOffsetPx: { ...prev.footOffsetPx, [faction]: clamp(value, -50, 100) } }))
    setDirty(true)
  }

  // ── Toolbar actions ──────────────────────────────────────────────────────────

  function buildPayload() {
    return {
      plots: plots.map(p => ({ id: p.id, x: p.x, bottomPct: p.bottomPct })),
      npcs: npcs.map(n => ({ id: n.id, minX: n.minX, maxX: n.maxX, startX: n.startX, footOffsetPx: n.footOffsetPx })),
      atmosphere: atmosphere.map(a => ({ id: a.id, leftPct: a.leftPct })),
      player: { footOffsetPx: player.footOffsetPx },
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/admin/overview?action=set_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'township_layout', value: buildPayload() }),
      })
      if (!res.ok) throw new Error()
      setDirty(false)
      setSaveMsg('SAVED')
    } catch {
      setSaveMsg('SAVE FAILED')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  function handleReset() {
    setPlots(clonePlots())
    setNpcs(cloneNpcs())
    setAtmosphere(cloneAtmosphere())
    setPlayer(clonePlayer())
    setSelected(null)
    setDirty(true)
  }

  function handleCopyJson() {
    const json = JSON.stringify(buildPayload(), null, 2)
    navigator.clipboard?.writeText(json)
    setSaveMsg('COPIED')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  // ── Selected element lookups ────────────────────────────────────────────────

  const selectedPlot = selected?.type === 'plot' ? plots.find(p => p.id === selected.id) : null
  const selectedNpc = selected?.type === 'npc' ? npcs.find(n => n.id === selected.id) : null
  const selectedAtmosphere = selected?.type === 'atmosphere' ? atmosphere.find(a => a.id === selected.id) : null
  const isPlayerSelected = selected?.type === 'player'

  let coordsLabel = null
  if (selectedPlot) coordsLabel = `${selectedPlot.id}  x=${selectedPlot.x.toFixed(3)}  bottomPct=${selectedPlot.bottomPct.toFixed(3)}`
  else if (selectedNpc) coordsLabel = `${selectedNpc.id}  min=${selectedNpc.minX.toFixed(0)}  max=${selectedNpc.maxX.toFixed(0)}  start=${selectedNpc.startX.toFixed(0)}  footOffsetPx[${faction}]=${(selectedNpc.footOffsetPx?.[faction] ?? 0).toFixed(0)}`
  else if (selectedAtmosphere) coordsLabel = `${selectedAtmosphere.id}  leftPct=${selectedAtmosphere.leftPct.toFixed(3)}`
  else if (isPlayerSelected) coordsLabel = `player  faction=${faction}  footOffsetPx=${(player.footOffsetPx[faction] ?? 0).toFixed(0)}`

  const townhallPlot = plots.find(p => p.id === 'townhall')
  const bgLayers = BG_LAYERS[faction] || BG_LAYERS.greek

  return (
    <div>
      <p style={{ ...labelStyle, marginBottom: 'var(--space-6)' }}>
        // TOWNSHIP LAYOUT EDITOR
      </p>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-4)',
      }}>
        {FACTIONS.map(f => (
          <button
            key={f.assetKey}
            onClick={() => setFaction(f.assetKey)}
            style={toolBtnStyle(faction === f.assetKey)}
          >
            {f.label}
          </button>
        ))}

        <button onClick={() => setShowGrid(g => !g)} style={toolBtnStyle(showGrid)}>
          SHOW GRID
        </button>

        <div style={{ flex: 1 }} />

        {dirty && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: '#F59E0B', letterSpacing: 'var(--tracking-wider)' }}>
            ● Unsaved changes
          </span>
        )}
        {saveMsg && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-accent-primary)', letterSpacing: 'var(--tracking-wider)' }}>
            {saveMsg}
          </span>
        )}

        <button onClick={handleCopyJson} style={toolBtnStyle(false)}>COPY JSON</button>
        <button onClick={handleReset} style={toolBtnStyle(false)}>RESET TO DEFAULTS</button>
        <button onClick={handleSave} disabled={saving} style={{ ...toolBtnStyle(false), opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'SAVING…' : 'SAVE LAYOUT'}
        </button>
      </div>

      {/* Coordinates readout */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-muted)',
        letterSpacing: 'var(--tracking-wider)',
        marginBottom: 'var(--space-3)',
        minHeight: 18,
      }}>
        {coordsLabel || 'Click a building, NPC, or effect to select it'}
      </div>

      {/* Canvas + info panel */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            minWidth: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            background: '#000',
          }}
        >
          <div style={{ position: 'relative', width: worldDisplayW, height: worldDisplayH }}>
            <div
              onClick={() => setSelected(null)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SCENE_WIDTH,
                height: WORLD_H,
                transform: `scale(${editorScale})`,
                transformOrigin: '0 0',
                overflow: 'hidden',
              }}
            >
              {/* Static background layers */}
              {bgLayers.map((layer, i) => (
                <div
                  key={layer.file}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: i + 1,
                    backgroundImage: `url("${getBgLayerUrl(faction, layer.file)}")`,
                    backgroundSize: 'auto 100%',
                    backgroundRepeat: 'repeat-x',
                    backgroundPositionY: 'bottom',
                  }}
                />
              ))}

              {/* Atmosphere (ground only) */}
              {atmosphere.map(item => {
                const icon = ATMOSPHERE_ICONS[item.sprite] || '✨'
                const isSelected = selected?.type === 'atmosphere' && selected.id === item.id
                return (
                  <div
                    key={item.id}
                    title={item.id}
                    onPointerDown={e => handleAtmospherePointerDown(e, item)}
                    onClick={e => { e.stopPropagation(); setSelected({ type: 'atmosphere', id: item.id }) }}
                    style={{
                      position: 'absolute',
                      left: `${item.leftPct * 100}%`,
                      bottom: 20,
                      transform: 'translateX(-50%)',
                      fontSize: 64,
                      lineHeight: 1,
                      cursor: 'grab',
                      zIndex: 10,
                      userSelect: 'none',
                      filter: isSelected ? 'drop-shadow(0 0 14px #00C8FF)' : 'none',
                    }}
                  >
                    {icon}
                  </div>
                )
              })}

              {/* NPC patrol ranges */}
              {npcs.map(npc => {
                const isSelected = selected?.type === 'npc' && selected.id === npc.id
                const icon = NPC_ICONS[npc.type] || '🧍'
                return (
                  <div key={npc.id}>
                    {/* range bar */}
                    <div
                      style={{
                        position: 'absolute',
                        left: npc.minX,
                        width: Math.max(0, npc.maxX - npc.minX),
                        bottom: 0,
                        height: 10,
                        background: 'rgba(255,200,50,0.25)',
                        border: '1px solid rgba(255,200,50,0.6)',
                        zIndex: 11,
                      }}
                    />
                    {/* min edge handle */}
                    <div
                      onPointerDown={e => handleNpcEdgePointerDown(e, npc, 'min')}
                      style={{
                        position: 'absolute',
                        left: npc.minX - 7,
                        bottom: -5,
                        width: 14,
                        height: 20,
                        background: '#FFC832',
                        border: '1px solid rgba(0,0,0,0.4)',
                        cursor: 'ew-resize',
                        zIndex: 12,
                      }}
                    />
                    {/* max edge handle */}
                    <div
                      onPointerDown={e => handleNpcEdgePointerDown(e, npc, 'max')}
                      style={{
                        position: 'absolute',
                        left: npc.maxX - 7,
                        bottom: -5,
                        width: 14,
                        height: 20,
                        background: '#FFC832',
                        border: '1px solid rgba(0,0,0,0.4)',
                        cursor: 'ew-resize',
                        zIndex: 12,
                      }}
                    />
                    {/* center pin */}
                    <div
                      title={npc.id}
                      onPointerDown={e => handleNpcCenterPointerDown(e, npc)}
                      onClick={e => { e.stopPropagation(); setSelected({ type: 'npc', id: npc.id }) }}
                      style={{
                        position: 'absolute',
                        left: npc.startX,
                        bottom: 8,
                        transform: 'translateX(-50%)',
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 44,
                        lineHeight: 1,
                        background: 'rgba(0,0,0,0.45)',
                        border: isSelected ? '4px solid #00C8FF' : '3px solid rgba(255,255,255,0.5)',
                        cursor: 'grab',
                        userSelect: 'none',
                        zIndex: 13,
                      }}
                    >
                      {icon}
                    </div>
                  </div>
                )
              })}

              {/* Buildings */}
              {plots.map(plot => {
                const src = getEditorBuildingUrl(plot, faction)
                const isSelected = selected?.type === 'plot' && selected.id === plot.id
                const isHovered = hovered === plot.id
                return (
                  <div
                    key={plot.id}
                    onPointerDown={e => handlePlotPointerDown(e, plot)}
                    onClick={e => { e.stopPropagation(); setSelected({ type: 'plot', id: plot.id }) }}
                    onMouseEnter={() => setHovered(plot.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'absolute',
                      left: `${plot.x * 100}%`,
                      bottom: `${plot.bottomPct * 100}%`,
                      transform: 'translateX(-50%)',
                      cursor: 'grab',
                      zIndex: 20,
                      outline: isSelected
                        ? '5px solid #00C8FF'
                        : isHovered
                          ? '5px solid rgba(255,255,255,0.6)'
                          : 'none',
                    }}
                  >
                    <img
                      src={src}
                      onError={e => { e.currentTarget.src = getEmptyBuildingUrl(faction) }}
                      alt={plot.id}
                      draggable={false}
                      style={{ display: 'block', height: 220, width: 'auto', userSelect: 'none', pointerEvents: 'none' }}
                    />
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: 28,
                        fontFamily: 'monospace',
                        background: 'rgba(0,0,0,0.85)',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 4,
                        marginBottom: 6,
                      }}>
                        {plot.id}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Player marker — tracks the townhall plot's x position */}
              {townhallPlot && (
                <div
                  title="player"
                  onPointerDown={e => { e.stopPropagation(); setSelected({ type: 'player', id: 'player' }) }}
                  onClick={e => { e.stopPropagation(); setSelected({ type: 'player', id: 'player' }) }}
                  style={{
                    position: 'absolute',
                    left: `${townhallPlot.x * 100}%`,
                    bottom: 0,
                    transform: `translateX(-50%) translateY(${player.footOffsetPx[faction] ?? 0}px)`,
                    width: 70,
                    height: 70,
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    lineHeight: 1,
                    gap: 2,
                    background: 'rgba(191,255,0,0.18)',
                    border: isPlayerSelected ? '4px solid #00C8FF' : '3px solid #BFFF00',
                    cursor: 'pointer',
                    userSelect: 'none',
                    zIndex: 22,
                  }}
                >
                  <span>🧍</span>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#BFFF00', fontWeight: 'bold', letterSpacing: 1 }}>
                    PLAYER
                  </span>
                </div>
              )}

              {/* Ground line reference */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 999, pointerEvents: 'none' }}>
                <div style={{ borderTop: '2px dashed rgba(0,255,100,0.65)' }} />
                <span style={{
                  position: 'absolute', left: 8, bottom: 4,
                  fontSize: 24, fontFamily: 'monospace', letterSpacing: 2,
                  color: 'rgba(0,255,100,0.85)',
                }}>
                  GROUND LINE
                </span>
              </div>

              {/* Grid overlay */}
              {showGrid && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
                  {Array.from({ length: 11 }).map((_, i) => {
                    const pct = i * 0.1
                    return (
                      <div key={`v${i}`} style={{ position: 'absolute', left: `${pct * 100}%`, top: 0, bottom: 0, width: 2, background: 'rgba(0,200,255,0.25)' }}>
                        <span style={{ position: 'absolute', top: 6, left: 6, fontSize: 26, fontFamily: 'monospace', color: 'rgba(0,200,255,0.8)' }}>
                          {pct.toFixed(1)}
                        </span>
                      </div>
                    )
                  })}
                  {Array.from({ length: 11 }).map((_, i) => {
                    const pct = i * 0.1
                    return (
                      <div key={`h${i}`} style={{ position: 'absolute', top: `${(1 - pct) * 100}%`, left: 0, right: 0, height: 2, background: 'rgba(0,200,255,0.25)' }}>
                        <span style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 26, fontFamily: 'monospace', color: 'rgba(0,200,255,0.8)' }}>
                          {pct.toFixed(1)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info panel */}
        {selected && (
          <div style={{
            width: 260,
            flexShrink: 0,
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-4)',
            background: 'var(--color-bg-elevated)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span style={{ ...labelStyle, marginBottom: 0 }}>
                {selected.type.toUpperCase()}
              </span>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)', wordBreak: 'break-all' }}>
              {selected.id}
            </p>

            {selectedPlot && (
              <>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>X (0–1)</label>
                  <input
                    type="number" step="0.001" min="0" max="1"
                    value={selectedPlot.x}
                    onChange={e => updatePlotField(selectedPlot.id, 'x', parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Bottom % (0–1)</label>
                  <input
                    type="number" step="0.001" min="0" max="1"
                    value={selectedPlot.bottomPct}
                    onChange={e => updatePlotField(selectedPlot.id, 'bottomPct', parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
              </>
            )}

            {selectedNpc && (
              <>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Min X (px)</label>
                  <input
                    type="number" step="1" min="0" max={SCENE_WIDTH}
                    value={selectedNpc.minX}
                    onChange={e => updateNpcField(selectedNpc.id, 'minX', parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Max X (px)</label>
                  <input
                    type="number" step="1" min="0" max={SCENE_WIDTH}
                    value={selectedNpc.maxX}
                    onChange={e => updateNpcField(selectedNpc.id, 'maxX', parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Start X (px)</label>
                  <input
                    type="number" step="1" min="0" max={SCENE_WIDTH}
                    value={selectedNpc.startX}
                    onChange={e => updateNpcField(selectedNpc.id, 'startX', parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Foot Offset — {faction.toUpperCase()} (px)</label>
                  <input
                    type="number" step="1" min="-50" max="100"
                    value={selectedNpc.footOffsetPx?.[faction] ?? 0}
                    onChange={e => updateNpcFootOffset(selectedNpc.id, parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
              </>
            )}

            {isPlayerSelected && (
              <>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Faction</label>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', margin: 0, textTransform: 'uppercase' }}>
                    {faction}
                  </p>
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Foot Offset (px)</label>
                  <input
                    type="number" step="1" min="-50" max="100"
                    value={player.footOffsetPx[faction] ?? 0}
                    onChange={e => updatePlayerFootOffset(parseFloat(e.target.value))}
                    style={numberInputStyle}
                  />
                </div>
              </>
            )}

            {selectedAtmosphere && (
              <div>
                <label style={{ ...labelStyle, display: 'block', marginBottom: 'var(--space-2)' }}>Left % (0–1)</label>
                <input
                  type="number" step="0.001" min="0" max="1"
                  value={selectedAtmosphere.leftPct}
                  onChange={e => updateAtmosphereField(selectedAtmosphere.id, 'leftPct', parseFloat(e.target.value))}
                  style={numberInputStyle}
                />
              </div>
            )}

            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 'var(--space-4)', lineHeight: 1.6 }}>
              {isPlayerSelected
                ? 'Use ↑/↓ arrow keys to nudge Foot Offset by 1px.'
                : selectedNpc
                  ? 'Drag to move. ←/→ nudges position, ↑/↓ nudges Foot Offset by 1px.'
                  : 'Drag to move, or use arrow keys to nudge by 0.001.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useRef } from 'react'
import {
  TEMPLE_CONFIG,
  getBuildingUrl,
  getTempleUrl,
  levelToTier,
  getTownhallTier,
  getBuildingAriaLabel,
} from './townshipConfig'

// Per-temple-type size multiplier — stacks on top of the level-based scale.
// roadside_shrine is ~0.25× the height of pantheon_citadel at the same level.
const TEMPLE_SIZE_MULTIPLIER = {
  roadside_shrine:  0.45,
  minor_temple:     0.65,
  grand_temple:     0.90,
  divine_fortress:  1.30,
  pantheon_citadel: 1.80,
}

// Returns the base height as % of scene height for each building category.
// Tier 1 < Tier 2 < Tier 3; Town Hall is the most prominent structure.
// Temples use this as a base multiplied by templeScale (level-based) × TEMPLE_SIZE_MULTIPLIER.
function getBuildingBaseHeight(plot, townships) {
  if (plot.templeType) return 22
  if (plot.id === 'embassy' || plot.id === 'shop') return 20
  if (plot.id === 'townhall') {
    const tier = getTownhallTier(townships)
    if (tier >= 3) return 36
    if (tier >= 2) return 28
    return 22
  }
  const t = (townships || []).find(t => t.type === plot.id)
  if (!t || !t.is_owned) return 8
  const tier = levelToTier(t.current_level)
  if (tier >= 3) return 32
  if (tier >= 2) return 25
  return 18
}

function getBuildingAssetUrl(plot, assetKey, townships, templeData) {
  if (plot.templeType) {
    const owned = (templeData?.owned || []).find(t => t.temple_type === plot.templeType)
    if (!owned) return null
    return getTempleUrl(plot.templeType)
  }
  if (plot.id === 'embassy') return getBuildingUrl(assetKey, `bldg_embassy_${assetKey}.png`)
  if (plot.id === 'shop')    return getBuildingUrl(assetKey, `bldg_shop_${assetKey}.png`)
  if (plot.id === 'townhall') {
    const tier = getTownhallTier(townships)
    return getBuildingUrl(assetKey, `bldg_townhall_${assetKey}_t${tier}.png`)
  }
  const t = (townships || []).find(t => t.type === plot.id)
  if (!t || !t.is_owned) return getBuildingUrl(assetKey, `bldg_empty_${assetKey}.png`)
  const tier = levelToTier(t.current_level)
  return getBuildingUrl(assetKey, `bldg_${plot.id}_${assetKey}_t${tier}.png`)
}

export default function BuildingSprite({
  plot, assetKey, townships, templeData,
  isHovered, onHoverStart, onHoverEnd, onBuildingClick, onBuildingFocus,
  staggerIndex,
}) {
  const imgRef = useRef(null)
  const src = getBuildingAssetUrl(plot, assetKey, townships, templeData)
  if (!src) return null

  let filterStyle = 'none'
  let templeScale = 1

  if (plot.templeType) {
    const owned = (templeData?.owned || []).find(t => t.temple_type === plot.templeType)
    if (owned) {
      const cfg = TEMPLE_CONFIG[plot.templeType]
      if (cfg) {
        const lvl = Math.min(25, Math.max(1, owned.upgrade_level || 1))
        templeScale = cfg.min + (cfg.max - cfg.min) * (lvl - 1) / 24
        templeScale *= (TEMPLE_SIZE_MULTIPLIER[plot.templeType] ?? 1)
        const glowPx = Math.max(4, Math.round(lvl * 0.8))
        filterStyle = `drop-shadow(0 0 ${glowPx}px ${cfg.glow})`
      }
    }
  }

  if (isHovered) {
    filterStyle = filterStyle === 'none'
      ? 'brightness(1.22)'
      : `${filterStyle} brightness(1.22)`
  }

  const heightPct = getBuildingBaseHeight(plot, townships) * templeScale
  const ariaLabel = getBuildingAriaLabel(plot, assetKey, townships, templeData)
  const footOffsetPx = plot.footOffsetPx?.[assetKey] ?? 0

  function handleMouseEnter() {
    if (!onHoverStart) return
    const rect = imgRef.current?.getBoundingClientRect()
    onHoverStart(plot.id, rect)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onBuildingClick?.(plot.id)
    }
  }

  function handleFocus() {
    onBuildingFocus?.(plot.id)
  }

  function handleError() {
    if (imgRef.current) imgRef.current.style.visibility = 'hidden'
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt=""
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      draggable={false}
      decoding="async"
      data-plot-id={plot.id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onHoverEnd}
      onClick={() => onBuildingClick?.(plot.id)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onError={handleError}
      style={{
        position: 'absolute',
        left: `${plot.x * 100}%`,
        bottom: `calc(${plot.bottomPct * 100}% - ${footOffsetPx}px)`,
        height: `${heightPct}%`,
        width: 'auto',
        transform: 'translateX(-50%)',
        transformOrigin: 'bottom center',
        filter: filterStyle,
        transition: 'filter 0.12s ease',
        userSelect: 'none',
        cursor: 'pointer',
        display: 'block',
        zIndex: plot.templeType ? 11 : 10,
        animation: staggerIndex != null
          ? `tw-bldg-popin 0.4s ease-out ${(staggerIndex * 0.06).toFixed(2)}s both`
          : undefined,
        outline: 'none',
      }}
    />
  )
}

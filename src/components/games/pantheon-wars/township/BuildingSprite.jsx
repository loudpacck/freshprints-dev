import { useRef } from 'react'
import {
  TEMPLE_CONFIG,
  getBuildingUrl,
  getTempleUrl,
  levelToTier,
  getTownhallTier,
  getBuildingAriaLabel,
} from './townshipConfig'

const BASE_HEIGHT_PCT = 28

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

  const heightPct = BASE_HEIGHT_PCT * plot.scale * templeScale
  const ariaLabel = getBuildingAriaLabel(plot, assetKey, townships, templeData)

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
        bottom: `${plot.bottomPct * 100}%`,
        height: `${heightPct}%`,
        width: 'auto',
        transform: 'translateX(-50%)',
        transformOrigin: 'bottom center',
        filter: filterStyle,
        transition: 'filter 0.12s ease',
        userSelect: 'none',
        cursor: 'pointer',
        display: 'block',
        zIndex: 6,
        animation: staggerIndex != null
          ? `tw-bldg-popin 0.4s ease-out ${(staggerIndex * 0.06).toFixed(2)}s both`
          : undefined,
        outline: 'none',
      }}
    />
  )
}

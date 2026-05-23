import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import { useSound } from '@/sound/useSound'

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_COLOR = {
  common:    '#A0A0B8',
  uncommon:  '#22C55E',
  rare:      '#8BBECC',
  epic:      '#A78BFA',
  legendary: '#F5D88B',
}

const SLOT_GLYPH = {
  weapon:     '⚔',
  armor:      '◈',
  artifact:   '✦',
  mount:      '◎',
  companion:  '◆',
  consumable: '⚗',
}

const FACTION_COLOR = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }

const STAT_DEFS = [
  { key: 'attack_bonus',  label: 'ATK',   color: '#F97316', pct: false },
  { key: 'defense_bonus', label: 'DEF',   color: '#22C55E', pct: false },
  { key: 'agility_bonus', label: 'AGI',   color: '#A78BFA', pct: false },
  { key: 'crit_chance',   label: 'CRIT',  color: '#F5D88B', pct: true  },
  { key: 'block_chance',  label: 'BLOCK', color: '#8AB8D4', pct: true  },
  { key: 'dodge_chance',  label: 'DODGE', color: '#4FD1C5', pct: true  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

const EFFECT_LABELS = {
  restore_health_pct: (v) => `Restores ${v}% of your max health`,
  restore_energy_pct: (v) => `Restores ${v}% of your max energy`,
  restore_health:     (v) => v >= 9000 ? 'Fully restores health' : `Restores ${v} HP`,
  restore_full:       ()  => 'Fully restores health and energy',
  realloc_stats:      ()  => 'Resets all allocated stat points',
}

function getEffectLabel(effect, value) {
  const fn = EFFECT_LABELS[effect]
  if (!fn) return effect ?? 'Use to consume'
  return fn(value)
}

function hexRgb(hex) {
  if (!hex || hex[0] !== '#') return '240,240,248'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}

// ─── Gear Comparison ──────────────────────────────────────────────────────────

function getVisibleStats(shopItem, equippedItem) {
  return STAT_DEFS.filter(s => {
    const a = shopItem[s.key] ?? 0
    const b = equippedItem ? (equippedItem[s.key] ?? 0) : 0
    return a > 0 || b > 0
  })
}

function StatColumn({ item, visibleStats, label, labelColor, slotName }) {
  return (
    <div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: labelColor, marginBottom: 6,
      }}>
        {label}
      </div>
      {item ? (
        <>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13, letterSpacing: '0.04em',
            color: RARITY_COLOR[item.rarity] ?? '#F0F0F8',
            marginBottom: 6, lineHeight: 1.2,
          }}>
            {item.name}
          </div>
          {visibleStats.map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.4)' }}>
                {s.label}
              </span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                color: (item[s.key] ?? 0) > 0 ? s.color : 'rgba(240,240,248,0.18)',
              }}>
                {item[s.key] ?? 0}{s.pct ? '%' : ''}
              </span>
            </div>
          ))}
        </>
      ) : (
        <>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(240,240,248,0.2)', marginBottom: 4,
          }}>
            {slotName}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, color: 'rgba(240,240,248,0.28)',
            fontStyle: 'italic', marginBottom: 6,
          }}>
            Nothing equipped
          </div>
          {visibleStats.map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.4)' }}>
                {s.label}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.18)' }}>
                0{s.pct ? '%' : ''}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function DiffRow({ shopItem, equippedItem, visibleStats }) {
  const chips = visibleStats.map(s => {
    const shopVal = shopItem[s.key] ?? 0
    const eqVal   = equippedItem ? (equippedItem[s.key] ?? 0) : 0
    const delta   = shopVal - eqVal
    const sign    = delta > 0 ? '+' : ''
    const color   = delta > 0 ? '#22C55E' : delta < 0 ? '#F87171' : 'rgba(240,240,248,0.35)'
    const bg      = delta > 0 ? 'rgba(34,197,94,0.08)' : delta < 0 ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.04)'
    const bdr     = delta > 0 ? 'rgba(34,197,94,0.2)'  : delta < 0 ? 'rgba(248,113,113,0.2)'  : 'rgba(255,255,255,0.1)'
    return (
      <span key={s.key} style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9, letterSpacing: '0.04em', color,
        background: bg, border: `1px solid ${bdr}`,
        borderRadius: 3, padding: '2px 6px', whiteSpace: 'nowrap',
      }}>
        {s.label} {sign}{delta}{s.pct ? '%' : ''}
      </span>
    )
  })

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      paddingTop: 10,
      display: 'flex', flexWrap: 'wrap', gap: 5,
    }}>
      {chips}
    </div>
  )
}

function ComparisonPanelContent({ shopItem, equippedItem }) {
  const visibleStats = getVisibleStats(shopItem, equippedItem)
  if (visibleStats.length === 0) return null

  return (
    <>
      <div style={{
        fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
        fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(201,169,97,0.6)',
        marginBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 8,
      }}>
        ⚔ COMPARE
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0 10px',
        marginBottom: 12,
      }}>
        <StatColumn
          item={shopItem}
          visibleStats={visibleStats}
          label="This Item"
          labelColor="#22D3EE"
          slotName={shopItem.slot}
        />
        <div style={{ background: 'rgba(255,255,255,0.07)', alignSelf: 'stretch' }} />
        <StatColumn
          item={equippedItem}
          visibleStats={visibleStats}
          label="Equipped"
          labelColor="rgba(240,240,248,0.35)"
          slotName={shopItem.slot}
        />
      </div>
      <DiffRow shopItem={shopItem} equippedItem={equippedItem} visibleStats={visibleStats} />
    </>
  )
}

// Desktop: fixed-position floating panel
function ComparisonPanel({ shopItem, equippedItem, pos }) {
  return (
    <div style={{
      position: 'fixed',
      top: pos.top, left: pos.left,
      width: 280, zIndex: 50,
      background: 'rgba(8,5,14,0.97)',
      border: '1px solid rgba(201,169,97,0.25)',
      borderRadius: 10, padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,169,97,0.06)',
      pointerEvents: 'none',
    }}>
      <ComparisonPanelContent shopItem={shopItem} equippedItem={equippedItem} />
    </div>
  )
}

// Mobile: inline expansion below the card
function MobileComparison({ shopItem, equippedItem }) {
  return (
    <div style={{
      marginTop: 8,
      background: 'rgba(8,5,14,0.97)',
      border: '1px solid rgba(201,169,97,0.2)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <ComparisonPanelContent shopItem={shopItem} equippedItem={equippedItem} />
    </div>
  )
}

// ─── ShopItem ─────────────────────────────────────────────────────────────────

function ShopItem({ item, player, currency, onBuy, buying, dailyLimitReached, equippedBySlot, isMobile, expandedItemId, onToggleExpand }) {
  const wrapperRef       = useRef(null)
  const [hovered,          setHovered]          = useState(false)
  const [panelPos,         setPanelPos]         = useState({ top: 0, left: 0 })
  const [showBadgeTooltip, setShowBadgeTooltip] = useState(false)

  const isEquipment  = item.slot !== 'consumable'
  const isExpanded   = expandedItemId === item.id
  const equippedItem = isEquipment ? (equippedBySlot?.[item.slot] ?? null) : null

  const rarityColor   = RARITY_COLOR[item.rarity] ?? '#F0F0F8'
  const rgb           = hexRgb(rarityColor)
  const factionColor  = item.faction_exclusive ? (FACTION_COLOR[item.faction_exclusive] ?? '#F0F0F8') : null
  const factionRgb    = factionColor ? hexRgb(factionColor) : null

  const isDiscounted  = currency === 'drachma' && item.effective_price != null && item.effective_price !== item.buy_price
  const price         = currency === 'drachma'
    ? (isDiscounted ? item.effective_price : item.buy_price)
    : item.glory_price
  const balance       = currency === 'drachma' ? player.drachma : player.glory
  const priceLabel    = currency === 'drachma' ? `${fmt(price)} ₯` : `${price} ★`
  const priceColor    = currency === 'drachma' ? '#C9A961' : '#FBBF24'

  const levelLocked   = player.level < item.level_required
  const factionLocked = !!item.faction_exclusive && item.faction_exclusive !== player.faction
  const locked        = levelLocked || factionLocked
  const cantAfford    = balance < price

  function getButtonLabel() {
    if (buying)           return '···'
    if (dailyLimitReached) return 'DAILY LIMIT'
    if (factionLocked)    return `${item.faction_exclusive.toUpperCase()} ONLY`
    if (levelLocked)      return `LV ${item.level_required}+`
    if (cantAfford)       return 'FUNDS'
    return 'BUY'
  }

  function handleMouseEnter() {
    if (isMobile || !isEquipment) return
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (rect) {
      const pw = 284
      const flipped = rect.right + pw + 16 > window.innerWidth
      setPanelPos({
        top:  Math.min(rect.top, window.innerHeight - 320),
        left: flipped ? rect.left - pw - 12 : rect.right + 12,
      })
    }
    setHovered(true)
  }

  function handleMouseLeave() {
    setHovered(false)
    setShowBadgeTooltip(false)
  }

  function handleWrapperClick(e) {
    if (!isMobile || !isEquipment) return
    e.stopPropagation()
    onToggleExpand(item.id)
  }

  const cardFilter  = factionLocked ? 'saturate(0.3)' : 'none'
  const cardOpacity = locked ? 0.45 : dailyLimitReached ? 0.6 : 1

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleWrapperClick}
    >
      {/* Faction corner badge — outside the card filter so it stays vivid when item is dimmed */}
      {item.faction_exclusive && (
        <div
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}
          onMouseEnter={e => { e.stopPropagation(); setShowBadgeTooltip(true) }}
          onMouseLeave={e => { e.stopPropagation(); setShowBadgeTooltip(false) }}
          onClick={e => { e.stopPropagation(); setShowBadgeTooltip(v => !v) }}
        >
          <span style={{
            display: 'block',
            fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
            fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: factionColor,
            background: `rgba(${factionRgb}, 0.22)`,
            border: `1px solid ${factionColor}`,
            borderRadius: 3, padding: '2px 7px',
            whiteSpace: 'nowrap',
            boxShadow: factionLocked ? `0 0 8px rgba(${factionRgb}, 0.35)` : 'none',
            cursor: 'default',
          }}>
            {item.faction_exclusive.toUpperCase()}
          </span>
          {showBadgeTooltip && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: 'rgba(8,5,14,0.97)',
              border: `1px solid ${factionColor}`,
              borderRadius: 5, padding: '5px 9px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, letterSpacing: '0.05em',
              color: factionColor,
              whiteSpace: 'nowrap',
              zIndex: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}>
              Requires {cap(item.faction_exclusive)} allegiance
            </div>
          )}
        </div>
      )}

      {/* Card body — faction filter applied here, not to the badge */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: cardOpacity, y: 0 }}
        style={{
          filter: cardFilter,
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, padding: '16px',
          display: 'flex', gap: 14, alignItems: 'flex-start',
          position: 'relative', overflow: 'hidden',
          cursor: isMobile && isEquipment ? 'pointer' : 'default',
        }}
      >
        {/* Rarity accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 3, height: '100%',
          background: locked ? 'rgba(255,255,255,0.1)' : rarityColor,
          borderRadius: '10px 0 0 10px',
          opacity: locked ? 0.4 : 0.6,
        }} />

        {/* Slot glyph */}
        <div style={{
          flexShrink: 0, width: 38, height: 38, borderRadius: 8,
          background: `rgba(${rgb}, 0.08)`,
          border: `1px solid rgba(${rgb}, 0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, marginLeft: 8,
        }}>
          {SLOT_GLYPH[item.slot]}
        </div>

        {/* Item info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 19, letterSpacing: '0.05em', color: '#F0F0F8', lineHeight: 1,
            }}>
              {item.name}
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: rarityColor,
              background: `rgba(${rgb}, 0.12)`,
              border: `1px solid rgba(${rgb}, 0.3)`,
              borderRadius: 3, padding: '2px 6px',
            }}>
              {item.rarity}
            </span>
          </div>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, color: 'rgba(240,240,248,0.4)',
            margin: '0 0 7px', lineHeight: 1.4,
          }}>
            {item.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
            {item.slot === 'consumable' ? (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#22D3EE' }}>
                {getEffectLabel(item.consumable_effect, item.consumable_value)}
              </span>
            ) : (
              <>
                {item.attack_bonus  > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#F97316' }}>+{item.attack_bonus} ATK</span>}
                {item.defense_bonus > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#22C55E' }}>+{item.defense_bonus} DEF</span>}
                {item.agility_bonus > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#A78BFA' }}>+{item.agility_bonus} AGI</span>}
                {item.crit_chance   > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#F5D88B' }}>+{item.crit_chance}% CRIT</span>}
                {item.block_chance  > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#8AB8D4' }}>+{item.block_chance}% BLOCK</span>}
                {item.dodge_chance  > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#4FD1C5' }}>+{item.dodge_chance}% DODGE</span>}
              </>
            )}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.25)' }}>
              Level {item.level_required}+
            </span>
          </div>

          {/* Lock hint */}
          {levelLocked && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#F87171', marginTop: 6, marginBottom: 0,
            }}>
              // REQUIRES LEVEL {item.level_required}
            </p>
          )}
          {factionLocked && !levelLocked && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: factionColor, marginTop: 6, marginBottom: 0,
              opacity: 0.7,
            }}>
              // {item.faction_exclusive.toUpperCase()} ONLY
            </p>
          )}

          {/* Mobile compare hint */}
          {isMobile && isEquipment && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8, letterSpacing: '0.06em',
              color: 'rgba(240,240,248,0.2)',
              marginTop: 5, marginBottom: 0,
            }}>
              {isExpanded ? '▲ tap to collapse' : '▼ tap to compare'}
            </p>
          )}
        </div>

        {/* Buy button column — stop click propagation on mobile so tap doesn't toggle compare */}
        <div
          style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}
          onClick={e => isMobile && isEquipment && e.stopPropagation()}
        >
          {isDiscounted && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#22C55E', background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 3, padding: '2px 5px', whiteSpace: 'nowrap',
            }}>
              BROKER −10%
            </span>
          )}
          {isDiscounted && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, letterSpacing: '0.02em',
              color: 'rgba(240,240,248,0.25)',
              textDecoration: 'line-through',
              lineHeight: 1,
            }}>
              {fmt(item.buy_price)} ₯
            </span>
          )}
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20, letterSpacing: '0.04em',
            color: locked || cantAfford ? 'rgba(240,240,248,0.2)' : priceColor,
            lineHeight: 1,
          }}>
            {priceLabel}
          </span>
          <button
            onClick={() => !locked && !cantAfford && !dailyLimitReached && !buying && onBuy(item.id)}
            disabled={locked || cantAfford || dailyLimitReached || buying}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: locked || cantAfford || dailyLimitReached ? 'rgba(240,240,248,0.18)' : priceColor,
              background: 'transparent',
              border: `1px solid ${locked || cantAfford || dailyLimitReached ? 'rgba(255,255,255,0.07)' : `rgba(${hexRgb(priceColor)}, 0.4)`}`,
              borderRadius: 5, padding: '6px 12px',
              cursor: locked || cantAfford || dailyLimitReached || buying ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', transition: 'opacity 120ms',
            }}
          >
            {getButtonLabel()}
          </button>
        </div>
      </motion.div>

      {/* Desktop: floating comparison panel (fixed, pointer-events: none) */}
      {hovered && !isMobile && isEquipment && (
        <ComparisonPanel shopItem={item} equippedItem={equippedItem} pos={panelPos} />
      )}

      {/* Mobile: inline animated comparison below the card */}
      {isMobile && isEquipment && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="cmp"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <MobileComparison shopItem={item} equippedItem={equippedItem} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, color, sound, onDone }) {
  const { play } = useSound()
  useEffect(() => {
    if (sound) play(sound)
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 88px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 70,
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${color}`,
        borderRadius: 6, padding: '11px 22px',
        fontFamily: "var(--pw-font-mono, 'IBM Plex Mono', monospace)", fontSize: 12, color,
        whiteSpace: 'nowrap',
        boxShadow: `var(--glow-gold, 0 0 16px rgba(201,169,97,0.45)), 0 4px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {message}
    </motion.div>
  )
}

// ─── Daily Limit Countdown ────────────────────────────────────────────────────

function DailyLimitDisplay({ dailyLimits, energyPurchasesToday }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!dailyLimits?.resets_at) return null

  const resetMs      = new Date(dailyLimits.resets_at).getTime()
  const remainingMs  = Math.max(0, resetMs - now)
  const hours        = Math.floor(remainingMs / 3600000)
  const minutes      = Math.floor((remainingMs % 3600000) / 60000)
  const seconds      = Math.floor((remainingMs % 60000) / 1000)
  const formatted    = `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`

  const energyPurchases = energyPurchasesToday ?? dailyLimits.energy_potion_purchases_today ?? 0
  const energyUses      = dailyLimits.energy_potion_uses_today ?? 0
  const healthUses      = dailyLimits.health_potion_uses_today ?? 0
  const drPurchases     = dailyLimits.divine_restoration_purchases_today ?? 0

  const maxEnergyPurchases = dailyLimits.max_energy_purchases ?? dailyLimits.max_purchases ?? 5
  const maxEnergyUses      = dailyLimits.max_energy_uses ?? dailyLimits.max_uses ?? 10
  const maxHealthUses      = dailyLimits.max_health_uses ?? 10
  const maxDrPurchases     = dailyLimits.max_divine_restoration_purchases ?? 1

  const atEnergyPurchaseLimit = energyPurchases >= maxEnergyPurchases
  const atEnergyUseLimit      = energyUses      >= maxEnergyUses
  const atHealthUseLimit      = healthUses      >= maxHealthUses
  const atDrLimit             = drPurchases     >= maxDrPurchases

  const rowStyle = (atLimit) => ({
    color: atLimit ? '#F87171' : 'rgba(240,240,248,0.45)',
    marginBottom: 2,
  })

  return (
    <div style={{
      marginTop: 8,
      padding: '8px 12px',
      background: 'rgba(255,165,0,0.06)',
      border: '1px solid rgba(255,165,0,0.2)',
      borderRadius: 6,
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
    }}>
      <div style={rowStyle(atEnergyPurchaseLimit || atEnergyUseLimit)}>
        ENERGY POTIONS — {energyPurchases}/{maxEnergyPurchases} bought · {energyUses}/{maxEnergyUses} used
      </div>
      <div style={rowStyle(atHealthUseLimit)}>
        HEALTH POTIONS — {healthUses}/{maxHealthUses} used
      </div>
      <div style={rowStyle(atDrLimit)}>
        DIVINE RESTORATION — {drPurchases}/{maxDrPurchases} purchased today{atDrLimit ? ' (limit reached)' : ''}
      </div>
      <div style={{ marginTop: 4, color: '#FFB347', fontSize: 9 }}>
        Resets in {remainingMs > 0 ? formatted : 'next refresh'}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
}

export default function Shop() {
  const { user, loading: authLoading, refresh: refreshContext } = usePantheonWars()
  const navigate = useNavigate()
  const { play } = useSound()
  const isMobile = useIsMobile()

  const [rotationItems,           setRotationItems]           = useState([])
  const [alwaysAvailable,         setAlwaysAvailable]         = useState([])
  const [gloryRotationItems,      setGloryRotationItems]      = useState([])
  const [gloryAlwaysAvailable,    setGloryAlwaysAvailable]    = useState([])
  const [equippedBySlot,          setEquippedBySlot]          = useState({})
  const [player,                  setPlayer]                  = useState(null)
  const [loading,                 setLoading]                 = useState(true)
  const [error,                   setError]                   = useState(null)
  const [tab,                     setTab]                     = useState('drachma')
  const [buying,                  setBuying]                  = useState(null)
  const [toast,                   setToast]                   = useState(null)
  const [rotationExpiresAt,       setRotationExpiresAt]       = useState(null)
  const [gloryRotationExpiresAt,  setGloryRotationExpiresAt]  = useState(null)
  const [rotationSeed,            setRotationSeed]            = useState(null)
  const [countdown,               setCountdown]               = useState(null)
  const [gloryCountdown,          setGloryCountdown]          = useState(null)
  const [energyPurchasesToday,    setEnergyPurchasesToday]    = useState(0)
  const [dailyLimits,             setDailyLimits]             = useState(null)
  const [expandedItemId,          setExpandedItemId]          = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  const fetchShop = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=shop')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load shop.'); return }
      const data = await res.json()
      setRotationItems(data.rotation_items ?? [])
      setAlwaysAvailable(data.always_available ?? [])
      setGloryRotationItems(data.glory_rotation_items ?? [])
      setGloryAlwaysAvailable(data.glory_always_available ?? [])
      setEquippedBySlot(data.equipped_by_slot ?? {})
      setPlayer(data.player)
      setEnergyPurchasesToday(data.player?.energy_potion_purchases_today ?? 0)
      if (data.daily_limits)              setDailyLimits(data.daily_limits)
      if (data.rotation_expires_at)       setRotationExpiresAt(data.rotation_expires_at)
      if (data.glory_rotation_expires_at) setGloryRotationExpiresAt(data.glory_rotation_expires_at)
      if (data.rotation_seed != null)     setRotationSeed(data.rotation_seed)
    } catch { setError('Network error.') }
    finally   { setLoading(false) }
  }, [navigate])

  useEffect(() => { fetchShop() }, [fetchShop])

  // Drachma countdown
  useEffect(() => {
    if (!rotationExpiresAt) return
    function tick() {
      const ms = rotationExpiresAt - Date.now()
      if (ms <= 0) { setCountdown('00:00:00'); fetchShop(); return }
      const total = Math.floor(ms / 1000)
      const h = Math.floor(total / 3600).toString().padStart(2, '0')
      const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0')
      const s = (total % 60).toString().padStart(2, '0')
      setCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [rotationExpiresAt, fetchShop])

  // Glory countdown
  useEffect(() => {
    if (!gloryRotationExpiresAt) return
    function tick() {
      const ms = gloryRotationExpiresAt - Date.now()
      if (ms <= 0) { setGloryCountdown('00:00:00'); fetchShop(); return }
      const total = Math.floor(ms / 1000)
      const h = Math.floor(total / 3600).toString().padStart(2, '0')
      const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0')
      const s = (total % 60).toString().padStart(2, '0')
      setGloryCountdown(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [gloryRotationExpiresAt, fetchShop])

  function handleToggleExpand(id) {
    setExpandedItemId(prev => prev === id ? null : id)
  }

  async function handleBuy(item_id) {
    setBuying(item_id)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, currency: tab, rotation_seed: rotationSeed }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'rotation_expired') {
          setToast({ message: 'Shop just refreshed — loading new items', color: '#C9A961', sound: 'toast_notification' })
          fetchShop()
        } else if (data.error === 'item_not_in_rotation') {
          setToast({ message: 'This item is no longer available — the shop has refreshed.', color: '#F87171', sound: 'toast_notification' })
          fetchShop()
        } else if (data.error === 'daily_purchase_limit_reached') {
          setToast({ message: 'Daily limit reached — energy potions reset at midnight UTC', color: '#F87171', sound: 'toast_notification' })
        } else if (data.error === 'insufficient_funds' || data.error === 'not_enough_drachma' || data.error === 'not_enough_glory') {
          play('insufficient_funds')
          setToast({ message: data.error || 'Insufficient funds', color: '#F87171' })
        } else {
          setToast({ message: data.error || 'Purchase failed', color: '#F87171', sound: 'toast_notification' })
        }
        return
      }
      setPlayer(prev => ({ ...prev, drachma: data.new_drachma, glory: data.new_glory }))
      // Increment energy potion purchase counter locally
      const boughtItem = alwaysAvailable.find(i => i.id === item_id)
      if (boughtItem?.consumable_effect === 'restore_energy_pct') {
        setEnergyPurchasesToday(prev => Math.min(5, prev + 1))
      }
      // If equipment was purchased, refresh equipped slots
      if (data.purchased?.slot !== 'consumable') {
        fetchShop()
      }
      setToast({ message: `${data.purchased.name} acquired`, color: RARITY_COLOR[data.purchased.rarity] ?? '#C9A961' })
      play('purchase')
      refreshContext()
    } finally { setBuying(null) }
  }

  // Common props passed to every ShopItem
  const itemProps = {
    player,
    equippedBySlot,
    isMobile,
    expandedItemId,
    onToggleExpand: handleToggleExpand,
  }

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast.message} color={toast.color} sound={toast.sound} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Tap-outside-to-close on mobile */}
      <PWPageShell
        title="SHOP"
        rightSlot={<PWBackButton />}
        backgroundVariant="shop"
        onClick={() => isMobile && setExpandedItemId(null)}
      >

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton h={56} />
              <Skeleton h={40} />
              {[0,1,2,3,4].map(i => <Skeleton key={i} h={110} />)}
            </div>
          )}

          {!loading && error && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F87171', textAlign: 'center', marginTop: 48 }}>
              // {error}
            </p>
          )}

          {!loading && !error && player && (
            <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>

              {/* Balance */}
              <motion.div
                variants={fadeUp}
                style={{
                  display: 'flex', gap: 16, flexWrap: 'wrap',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '14px 18px',
                  marginBottom: 18, alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)' }}>
                    Drachma
                  </span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.04em', color: '#C9A961', lineHeight: 1 }}>
                    {fmt(player.drachma)} ₯
                  </span>
                </div>
                <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)' }}>
                    Glory
                  </span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.04em', color: '#FBBF24', lineHeight: 1 }}>
                    {fmt(player.glory)} ★
                  </span>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.25)' }}>
                  Lv {player.level} · {player.faction}
                </div>
              </motion.div>

              {/* Tab switcher */}
              <motion.div variants={fadeUp} style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
                {[
                  { key: 'drachma', label: '₯ DRACHMA SHOP', count: rotationItems.length },
                  { key: 'glory',   label: '★ GLORY SHOP',   count: gloryRotationItems.length + gloryAlwaysAvailable.length },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      flex: 1, padding: '11px 16px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: tab === t.key ? '#F0F0F8' : 'rgba(240,240,248,0.35)',
                      background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: `1px solid ${tab === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    {t.label}
                    <span style={{ marginLeft: 6, color: 'rgba(240,240,248,0.28)', fontSize: 9 }}>
                      ({t.count})
                    </span>
                  </button>
                ))}
              </motion.div>

              {/* Drachma countdown */}
              {tab === 'drachma' && countdown && (
                <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 18, padding: '12px 0', borderBottom: '1px solid rgba(201,169,97,0.12)' }}>
                  <div style={{ fontFamily: "var(--pw-font-display, 'Cinzel', serif)", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(201,169,97,0.55)', marginBottom: 5 }}>
                    TODAY'S OFFERING
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: 'rgba(240,240,248,0.4)' }}>
                    Next refresh in{' '}
                    <span style={{ color: '#C9A961', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
                  </div>
                </motion.div>
              )}

              {/* Glory countdown */}
              {tab === 'glory' && gloryCountdown && (
                <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 18, padding: '12px 0', borderBottom: '1px solid rgba(251,191,36,0.12)' }}>
                  <div style={{ fontFamily: "var(--pw-font-display, 'Cinzel', serif)", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.55)', marginBottom: 5 }}>
                    TODAY'S GLORY OFFERINGS
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: 'rgba(240,240,248,0.4)' }}>
                    Next refresh in{' '}
                    <span style={{ color: '#FBBF24', fontVariantNumeric: 'tabular-nums' }}>{gloryCountdown}</span>
                  </div>
                </motion.div>
              )}

              {/* Item lists */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {tab === 'drachma' && (
                    <>
                      {rotationItems.length === 0 && alwaysAvailable.length === 0 && (
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.25)', textAlign: 'center', marginTop: 40 }}>
                          // No items available.
                        </p>
                      )}
                      {rotationItems.map(item => (
                        <ShopItem
                          key={item.id}
                          item={item}
                          currency="drachma"
                          onBuy={handleBuy}
                          buying={buying === item.id}
                          {...itemProps}
                        />
                      ))}
                      {alwaysAvailable.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 18, borderTop: '1px solid rgba(34,211,238,0.12)' }}>
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.45)', margin: 0 }}>
                              ⚗ POTIONS — ALWAYS AVAILABLE
                            </p>
                            <DailyLimitDisplay
                              dailyLimits={dailyLimits}
                              energyPurchasesToday={energyPurchasesToday}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {alwaysAvailable.map(item => (
                              <ShopItem
                                key={item.id}
                                item={item}
                                currency="drachma"
                                onBuy={handleBuy}
                                buying={buying === item.id}
                                dailyLimitReached={item.consumable_effect === 'restore_energy_pct' && energyPurchasesToday >= 5}
                                {...itemProps}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {tab === 'glory' && (
                    <>
                      {gloryRotationItems.length === 0 && gloryAlwaysAvailable.length === 0 && (
                        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.25)', textAlign: 'center', marginTop: 40 }}>
                          // No items available.
                        </p>
                      )}
                      {gloryRotationItems.map(item => (
                        <ShopItem
                          key={item.id}
                          item={item}
                          currency="glory"
                          onBuy={handleBuy}
                          buying={buying === item.id}
                          {...itemProps}
                        />
                      ))}
                      {gloryAlwaysAvailable.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 18, borderTop: '1px solid rgba(251,191,36,0.12)' }}>
                          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,191,36,0.45)', marginBottom: 12 }}>
                            ⚗ ALWAYS AVAILABLE
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {gloryAlwaysAvailable.map(item => (
                              <ShopItem
                                key={item.id}
                                item={item}
                                currency="glory"
                                onBuy={handleBuy}
                                buying={buying === item.id}
                                dailyLimitReached={
                                  item.consumable_effect === 'restore_full' &&
                                  (dailyLimits?.divine_restoration_purchases_today ?? 0) >= (dailyLimits?.max_divine_restoration_purchases ?? 1)
                                }
                                {...itemProps}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

            </motion.div>
          )}
      </PWPageShell>
    </>
  )
}

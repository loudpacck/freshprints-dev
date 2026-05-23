import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PWPageShell from '../../../components/games/pantheon-wars/PWPageShell'
import PWBackButton from '../../../components/games/pantheon-wars/PWBackButton'
import { usePantheonWars } from '../../../contexts/PantheonWarsContext'
import { useSound } from '../../../sound/useSound'

// ─── Utilities ────────────────────────────────────────────────────────────────

function getTownshipName(data, upgradeType) {
  return data?.townships?.find(t => t.type === upgradeType)?.name ?? upgradeType
}

function errorMessage(json) {
  return json?.error || json?.message || 'Something went wrong'
}

function getBonusUnit(bonusType) {
  if (bonusType === 'flat_attack' || bonusType === 'flat_defense') return ''
  return '%'
}

function getBonusLabel(bonusType) {
  const labels = {
    energy_regen_pct:     'Energy Regen',
    health_regen_pct:     'Health Regen',
    xp_pct:               'XP Gain',
    drachma_pct:          'Drachma & Temple Income',
    adventure_reward_pct: 'Adventure Rewards',
    flat_attack:          'Attack',
    flat_defense:         'Defense',
  }
  return labels[bonusType] || bonusType
}

function formatDuration(seconds) {
  const s = Number(seconds) || 0
  if (s < 60) return `${s}s`
  const minutes = Math.floor(s / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  if (hours < 24) return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remHr = hours % 24
  return remHr > 0 ? `${days}d ${remHr}h` : `${days}d`
}

function formatDrachma(n) {
  const num = Number(n) || 0
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`
  return num.toString()
}

function formatHoursMinutes(isoStr) {
  const ms = Math.max(0, new Date(isoStr).getTime() - Date.now())
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// ─── Craftsmanship constants ──────────────────────────────────────────────────

const CRAFT_RARITY_COLOR = {
  common:    '#B0B0B0',
  uncommon:  '#4ADE80',
  rare:      '#60A5FA',
  epic:      '#C084FC',
  legendary: '#FACC15',
}

const CRAFT_SLOT_EMOJI = {
  weapon:    '⚔',
  armor:     '🛡',
  artifact:  '✨',
  mount:     '◎',
  companion: '◆',
}

// ─── Text styles ──────────────────────────────────────────────────────────────

const loreStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: 16,
  fontStyle: 'italic',
  color: 'var(--color-text-secondary)',
  lineHeight: 1.5,
  marginBottom: 8,
  marginTop: 0,
}

const descStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  color: 'var(--color-text-secondary)',
  lineHeight: 1.5,
  marginBottom: 10,
  marginTop: 0,
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function BonusValue({ value, unit, type }) {
  const label = getBonusLabel(type)
  const numValue = Number(value) || 0
  const formattedValue = unit === '%' ? `+${numValue.toFixed(1)}%` : `+${Math.floor(numValue)}`
  return (
    <span style={{ color: '#FFB347', fontFamily: "'Cinzel', serif", fontWeight: 600 }}>
      {formattedValue} {label}
    </span>
  )
}

function Card({ style, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10,
      padding: '18px 20px',
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHeader({ name, levelBadge }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 15,
        letterSpacing: '0.08em',
        color: '#EDE3CC',
        fontWeight: 600,
      }}>
        {name}
      </span>
      {levelBadge && (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.12em',
          color: '#C9A961',
          background: 'rgba(201,169,97,0.1)',
          border: '1px solid rgba(201,169,97,0.3)',
          borderRadius: 4,
          padding: '3px 8px',
          whiteSpace: 'nowrap',
        }}>
          {levelBadge}
        </span>
      )}
    </div>
  )
}

function BenefitChip({ children, style }) {
  return (
    <div style={{
      display: 'inline-block',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 11,
      padding: '5px 10px',
      background: 'rgba(255,179,71,0.08)',
      border: '1px solid rgba(255,179,71,0.25)',
      borderRadius: 5,
      marginBottom: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

function LockedBadge({ level }) {
  return (
    <div style={{
      marginTop: 14,
      padding: '12px 14px',
      background: 'rgba(120, 100, 80, 0.15)',
      border: '1px solid rgba(180, 150, 100, 0.35)',
      borderRadius: 6,
      textAlign: 'center',
      fontFamily: "'Cinzel', serif",
      fontSize: 13,
      letterSpacing: 2,
      color: 'rgba(220, 200, 160, 0.9)',
    }}>
      🔒 UNLOCKS AT LEVEL {level}
    </div>
  )
}

function ActionRow({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 8 }}>
      {children}
    </div>
  )
}

function BonusRow({ children }) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 12,
      marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

function ActionButton({ onClick, disabled, label }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.04 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: disabled ? 'rgba(201,169,97,0.45)' : '#C9A961',
        background: 'transparent',
        border: `1px solid ${disabled ? 'rgba(201,169,97,0.2)' : 'rgba(201,169,97,0.45)'}`,
        borderRadius: 6,
        padding: '9px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'color 150ms, border-color 150ms',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </motion.button>
  )
}

function ClaimButton({ onClick, disabled }) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.04 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
      animate={!disabled ? {
        boxShadow: [
          '0 0 8px rgba(255,179,71,0.35)',
          '0 0 18px rgba(255,179,71,0.65)',
          '0 0 8px rgba(255,179,71,0.35)',
        ],
      } : {}}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: disabled ? 'rgba(201,169,97,0.45)' : '#0F0A0D',
        background: disabled ? 'transparent' : 'linear-gradient(135deg, #FFB347, #C9A961)',
        border: `1px solid ${disabled ? 'rgba(201,169,97,0.2)' : 'transparent'}`,
        borderRadius: 6,
        padding: '10px 22px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {disabled ? 'CLAIMING...' : '⚒ CLAIM'}
    </motion.button>
  )
}

function CostDisplay({ cost }) {
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--color-text-secondary, rgba(240,240,248,0.55))' }}>
      {formatDrachma(cost)} ₯
    </span>
  )
}

function UpgradeInfo({ cost, seconds }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--color-text-secondary, rgba(240,240,248,0.55))' }}>
        {formatDrachma(cost)} ₯
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--color-text-muted, rgba(240,240,248,0.32))' }}>
        {formatDuration(seconds)}
      </span>
    </div>
  )
}

function MaxLevelPill() {
  return (
    <div style={{
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #C9A961, #FFB347)',
      color: '#0F0A0D',
      borderRadius: 6,
      fontFamily: "'Cinzel', serif",
      fontSize: 14,
      letterSpacing: 3,
      textAlign: 'center',
      marginTop: 10,
    }}>
      ⚜ MAX LEVEL ⚜
    </div>
  )
}

function ProgressBar({ pct }) {
  return (
    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
      <motion.div
        style={{ height: '100%', background: 'linear-gradient(90deg, #C9A961, #FFB347)', borderRadius: 3 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
}

function UpgradingRow({ targetLevel, remainingSeconds, progressPct }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#FFB347' }}>
          UPGRADING TO LVL {targetLevel}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--color-text-secondary, rgba(240,240,248,0.55))' }}>
          {formatDuration(remainingSeconds)} remaining
        </span>
      </div>
      <ProgressBar pct={progressPct} />
    </div>
  )
}

// ─── Craftsmanship Claim Modal ────────────────────────────────────────────────

function CraftsmanshipClaimModal({ claimResult, onClose, onViewInventory }) {
  const item = claimResult.granted_item
  const rarity = item?.rarity ?? claimResult.rolled_rarity
  const rarityColor = CRAFT_RARITY_COLOR[rarity] ?? '#B0B0B0'
  const slotEmoji = CRAFT_SLOT_EMOJI[item?.slot] ?? '✦'
  const [nextCycleLabel, setNextCycleLabel] = useState('')

  useEffect(() => {
    if (!claimResult.next_cycle_completes_at) return
    function tick() {
      setNextCycleLabel(formatHoursMinutes(claimResult.next_cycle_completes_at))
    }
    tick()
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [claimResult.next_cycle_completes_at])

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(4,2,10,0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 380,
          background: 'linear-gradient(180deg, #14101A, #0A0710)',
          border: `1px solid rgba(201,169,97,0.4)`,
          borderRadius: 14,
          padding: '28px 24px 24px',
          boxShadow: '0 0 40px rgba(201,169,97,0.2), 0 8px 40px rgba(0,0,0,0.8)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #FFB347, #C9A961, #FFB347, transparent)',
        }} />

        {/* Title */}
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 16,
          letterSpacing: '0.12em',
          color: '#EDE3CC',
          fontWeight: 700,
          marginBottom: 4,
        }}>
          FORGED IN THE DIVINE FIRE
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'rgba(201,169,97,0.5)',
          marginBottom: 24,
        }}>
          Craft cycle complete
        </div>

        {/* Item reveal */}
        {item ? (
          <>
            {/* Slot emoji */}
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ fontSize: 52, lineHeight: 1, marginBottom: 16, filter: `drop-shadow(0 0 12px ${rarityColor}66)` }}
            >
              {slotEmoji}
            </motion.div>

            {/* Item name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 20,
                letterSpacing: '0.06em',
                color: rarityColor,
                fontWeight: 700,
                marginBottom: 8,
                textShadow: `0 0 16px ${rarityColor}55`,
              }}
            >
              {item.name}
            </motion.div>

            {/* Rarity badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              style={{ marginBottom: 16 }}
            >
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: rarityColor,
                background: `${rarityColor}18`,
                border: `1px solid ${rarityColor}44`,
                borderRadius: 4,
                padding: '3px 10px',
              }}>
                {rarity}
              </span>
            </motion.div>

            {/* Stats */}
            {(item.attack_bonus > 0 || item.defense_bonus > 0 || item.agility_bonus > 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                style={{
                  display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
                  marginBottom: 14,
                }}
              >
                {item.attack_bonus  > 0 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F97316' }}>+{item.attack_bonus} ATK</span>
                )}
                {item.defense_bonus > 0 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#22C55E' }}>+{item.defense_bonus} DEF</span>
                )}
                {item.agility_bonus > 0 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#A78BFA' }}>+{item.agility_bonus} AGI</span>
                )}
              </motion.div>
            )}

            {/* Level requirement */}
            {item.level_required > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.3 }}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: 'rgba(240,240,248,0.3)',
                  marginBottom: 20,
                }}
              >
                Requires level {item.level_required}
              </motion.div>
            )}
          </>
        ) : (
          /* No item edge case */
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 13,
            color: 'rgba(240,240,248,0.4)',
            fontStyle: 'italic',
            marginBottom: 20,
          }}>
            The forge yields nothing this cycle — the gods were not generous.
          </div>
        )}

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}
        >
          <button
            onClick={onClose}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, letterSpacing: '0.1em',
              color: '#C9A961',
              background: 'transparent',
              border: '1px solid rgba(201,169,97,0.4)',
              borderRadius: 6, padding: '9px 18px',
              cursor: 'pointer',
            }}
          >
            ADD TO INVENTORY
          </button>
          <button
            onClick={onViewInventory}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, letterSpacing: '0.1em',
              color: 'rgba(240,240,248,0.7)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6, padding: '9px 18px',
              cursor: 'pointer',
            }}
          >
            VIEW IN INVENTORY
          </button>
        </motion.div>

        {/* Next cycle info */}
        {nextCycleLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: 'rgba(240,240,248,0.25)',
              letterSpacing: '0.05em',
            }}
          >
            Next cycle begins in {nextCycleLabel}
          </motion.div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ h = 14, w = '100%', r = 4 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r, marginBottom: 8 }} />
}

function SkeletonView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '18px 20px',
        }}>
          <SkeletonLine h={16} w={160} />
          <SkeletonLine h={12} w="90%" />
          <SkeletonLine h={12} w="70%" />
        </div>
      ))}
    </div>
  )
}

// ─── Intro card ───────────────────────────────────────────────────────────────

function IntroCard() {
  return (
    <div style={{
      padding: '16px 18px',
      background: 'linear-gradient(135deg, rgba(120,160,100,0.10), rgba(40,60,30,0.18))',
      border: '1px solid rgba(120,160,100,0.35)',
      borderRadius: 10,
      marginBottom: 18,
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#A8C97A', letterSpacing: 3, marginBottom: 6 }}>
        🏛 YOUR TOWNSHIP
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-secondary, rgba(240,240,248,0.55))', lineHeight: 1.5 }}>
        Build the institutions of your mythological domain. Each profession you establish grants a permanent bonus, growing stronger with every level you invest in it. Upgrades take real time — return later to find your township stronger than when you left.
      </div>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <p style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: 'rgba(240,240,248,0.28)',
      marginBottom: 14,
      marginTop: 0,
    }}>
      // {children}
    </p>
  )
}

// ─── Township card ────────────────────────────────────────────────────────────

function TownshipCard({ township: t, onEstablish, onUpgrade, onClaim, busy }) {
  const bonusUnit = getBonusUnit(t.bonus_type)
  const isCraftsmanship = t.type === 'craftsmanship'

  // Derive craft cycle state for craftsmanship cards
  const craftCycleStatus = isCraftsmanship && t.craft_cycle
    ? (t.craft_cycle.status === 'ready' || new Date(t.craft_cycle.completes_at).getTime() <= Date.now()
       ? 'ready'
       : 'active')
    : null

  // STATE 1: LOCKED
  if (!t.is_unlocked) {
    return (
      <Card style={{ opacity: 0.55, filter: 'grayscale(0.3)' }}>
        <CardHeader name={t.name} levelBadge={null} />
        <p style={loreStyle}>{t.lore}</p>
        <p style={descStyle}>{t.description}</p>
        <BenefitChip>
          At Level 1: <BonusValue value={t.bonus_per_level} unit={bonusUnit} type={t.bonus_type} />
        </BenefitChip>
        <BenefitChip style={{ opacity: 0.7, marginTop: 4 }}>
          At Level 100: <BonusValue value={t.bonus_at_max} unit={bonusUnit} type={t.bonus_type} />
        </BenefitChip>
        <LockedBadge level={t.level_required} />
      </Card>
    )
  }

  // STATE 2: AVAILABLE (unlocked, not yet established)
  if (!t.is_owned) {
    return (
      <Card>
        <CardHeader name={t.name} levelBadge={null} />
        <p style={loreStyle}>{t.lore}</p>
        <p style={descStyle}>{t.description}</p>
        <BenefitChip>
          Unlocks: <BonusValue value={t.bonus_per_level} unit={bonusUnit} type={t.bonus_type} />
        </BenefitChip>
        <ActionRow>
          <CostDisplay cost={t.initial_cost} />
          <ActionButton
            onClick={onEstablish}
            disabled={busy}
            label={busy ? 'ESTABLISHING...' : (t.establish_label ? t.establish_label.toUpperCase() : 'ESTABLISH')}
          />
        </ActionRow>
      </Card>
    )
  }

  // STATE 3: UPGRADING (active township upgrade timer)
  if (t.is_upgrading) {
    const remainingSeconds = Math.max(0, Math.floor((new Date(t.upgrade_completes_at).getTime() - Date.now()) / 1000))
    const totalSeconds = Math.floor((new Date(t.upgrade_completes_at).getTime() - new Date(t.upgrade_started_at).getTime()) / 1000)
    const progressPct = totalSeconds > 0 ? (1 - remainingSeconds / totalSeconds) * 100 : 100
    return (
      <Card>
        <CardHeader
          name={t.name}
          levelBadge={`LVL ${t.current_level} / ${t.max_level}`}
        />
        <p style={descStyle}>
          Current: <BonusValue value={t.current_bonus} unit={bonusUnit} type={t.bonus_type} />
        </p>
        <UpgradingRow
          targetLevel={t.upgrading_to_level}
          remainingSeconds={remainingSeconds}
          progressPct={progressPct}
        />
      </Card>
    )
  }

  // STATE 4: READY_TO_CLAIM (craftsmanship, cycle ready)
  if (isCraftsmanship && craftCycleStatus === 'ready') {
    return (
      <Card style={{ borderColor: 'rgba(255,179,71,0.25)' }}>
        <CardHeader
          name={t.name}
          levelBadge={`LVL ${t.current_level} / ${t.max_level}`}
        />
        <p style={{ ...descStyle, marginBottom: 6 }}>
          Current: <BonusValue value={t.current_bonus} unit={bonusUnit} type={t.bonus_type} />
        </p>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: '#FFB347',
          letterSpacing: '0.08em',
          marginBottom: 14,
        }}>
          ✦ Item ready to claim
        </div>
        <ActionRow>
          {/* De-emphasized upgrade option */}
          {t.current_level < t.max_level && (
            <button
              onClick={onUpgrade}
              disabled={busy}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, letterSpacing: '0.08em',
                color: 'rgba(201,169,97,0.35)',
                background: 'transparent', border: 'none',
                cursor: busy ? 'not-allowed' : 'pointer',
                padding: 0,
              }}
            >
              Upgrade available →
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <ClaimButton onClick={onClaim} disabled={busy} />
          </div>
        </ActionRow>
      </Card>
    )
  }

  // STATE 5: CRAFTING (craftsmanship, cycle in progress)
  if (isCraftsmanship && craftCycleStatus === 'active') {
    const cycleRemainingSeconds = Math.max(0, Math.floor((new Date(t.craft_cycle.completes_at).getTime() - Date.now()) / 1000))
    return (
      <Card>
        <CardHeader
          name={t.name}
          levelBadge={`LVL ${t.current_level} / ${t.max_level}`}
        />
        <p style={{ ...descStyle, marginBottom: 6 }}>
          Current: <BonusValue value={t.current_bonus} unit={bonusUnit} type={t.bonus_type} />
        </p>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.4)', letterSpacing: '0.06em' }}>
              Forge in progress...
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#C9A961', letterSpacing: '0.04em' }}>
              {formatDuration(cycleRemainingSeconds)}
            </span>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.08em' }}>
            NEXT CYCLE
          </div>
        </div>
        {/* De-emphasized upgrade */}
        {t.current_level < t.max_level && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
            <ActionRow>
              <UpgradeInfo cost={t.upgrade_cost} seconds={t.upgrade_seconds} />
              <ActionButton
                onClick={onUpgrade}
                disabled={busy}
                label={busy ? 'UPGRADING...' : 'UPGRADE FORGE'}
              />
            </ActionRow>
          </div>
        )}
        {t.current_level >= t.max_level && <MaxLevelPill />}
      </Card>
    )
  }

  // STATE 6: ESTABLISHED (owned, no active timer, non-craftsmanship or no cycle)
  const isMaxLevel = t.current_level >= t.max_level
  return (
    <Card>
      <CardHeader
        name={t.name}
        levelBadge={`LVL ${t.current_level} / ${t.max_level}`}
      />
      <p style={descStyle}>{t.description}</p>
      <BonusRow>
        <div>
          Current: <BonusValue value={t.current_bonus} unit={bonusUnit} type={t.bonus_type} />
        </div>
        {!isMaxLevel && (
          <div style={{ color: 'var(--color-text-secondary, rgba(240,240,248,0.55))' }}>
            Next: <BonusValue value={t.next_bonus} unit={bonusUnit} type={t.bonus_type} />
          </div>
        )}
      </BonusRow>
      {isMaxLevel ? (
        <MaxLevelPill />
      ) : (
        <ActionRow>
          <UpgradeInfo cost={t.upgrade_cost} seconds={t.upgrade_seconds} />
          <ActionButton
            onClick={onUpgrade}
            disabled={busy}
            label={busy ? 'UPGRADING...' : 'UPGRADE'}
          />
        </ActionRow>
      )}
    </Card>
  )
}

// ─── Township toast ───────────────────────────────────────────────────────────

function TownshipToast({ toast, onClose }) {
  const { play } = useSound()
  useEffect(() => {
    if (toast.type === 'error') play('toast_notification')
    const t = setTimeout(onClose, 3400)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  let borderColor = 'rgba(201,169,97,0.5)'
  let heading = ''
  let sub = ''

  if (toast.type === 'established') {
    heading = `${toast.name} ESTABLISHED`
    sub = 'Your township grows stronger.'
    borderColor = 'rgba(168,201,122,0.6)'
  } else if (toast.type === 'craft_started') {
    heading = 'DIVINE FORGE ESTABLISHED'
    sub = `Forge cycle begins — your first item arrives in ${toast.hours}h`
    borderColor = 'rgba(255,179,71,0.6)'
  } else if (toast.type === 'upgrade_started') {
    heading = `${toast.name} UPGRADING`
    const eta = toast.completes_at
      ? formatDuration(Math.max(0, Math.floor((new Date(toast.completes_at).getTime() - Date.now()) / 1000)))
      : ''
    sub = eta ? `Completes in ${eta}` : 'Check back later.'
    borderColor = 'rgba(201,169,97,0.5)'
  } else if (toast.type === 'upgrade_complete') {
    heading = `${toast.name} REACHED LVL ${toast.new_level}`
    sub = 'Your township grows stronger.'
    borderColor = 'rgba(201,169,97,0.7)'
  } else if (toast.type === 'error') {
    heading = 'ERROR'
    sub = toast.message || 'Something went wrong'
    borderColor = 'rgba(248,113,113,0.6)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 88px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(12px)',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        padding: '12px 22px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: '0 0 18px rgba(201,169,97,0.3), 0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.1em', color: toast.type === 'error' ? '#F87171' : '#C9A961' }}>
        🏛 {heading}
      </span>
      {sub && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.55)' }}>
          {sub}
        </span>
      )}
    </motion.div>
  )
}

// ─── Township page ────────────────────────────────────────────────────────────

export default function Township() {
  const { refresh: refreshContext } = usePantheonWars()
  const { play } = useSound()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState(null)
  const [claimModal, setClaimModal] = useState(null)

  const [, _force] = useState(0)
  const forceUpdate = useCallback(() => _force(n => n + 1), [])
  const tickRef = useRef(0)

  const fetchTownship = useCallback(async () => {
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=township')
      const json = await res.json()
      if (res.ok) {
        setData(json)
        if (json.pendingTownshipUpgrades?.upgrades?.length) {
          const u = json.pendingTownshipUpgrades.upgrades[0]
          setToast({ type: 'upgrade_complete', name: u.name, new_level: u.new_level })
          play('upgrade_complete')
          refreshContext()
        }
      }
    } finally {
      setLoading(false)
    }
  }, [refreshContext, play])

  useEffect(() => {
    fetchTownship()
  }, [fetchTownship])

  // Live countdown ticker — covers both upgrading timers and active craft cycles
  useEffect(() => {
    const needsTick = data?.townships?.some(t =>
      t.is_upgrading ||
      (t.type === 'craftsmanship' && t.craft_cycle?.status === 'active' &&
       new Date(t.craft_cycle.completes_at).getTime() > Date.now())
    )
    if (!needsTick) return
    const id = setInterval(() => { tickRef.current += 1; forceUpdate() }, 1000)
    return () => clearInterval(id)
  }, [data, forceUpdate])

  // Auto-poll every 30s for completed upgrades / cycles
  useEffect(() => {
    const id = setInterval(fetchTownship, 30000)
    return () => clearInterval(id)
  }, [fetchTownship])

  async function handleEstablish(upgradeType) {
    setBusy(upgradeType)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=township_establish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgrade_type: upgradeType }),
      })
      const json = await res.json()
      if (res.ok) {
        if (upgradeType === 'craftsmanship' && json.first_cycle_completes_at) {
          const ms = Math.max(0, new Date(json.first_cycle_completes_at).getTime() - Date.now())
          const hours = Math.max(1, Math.round(ms / 3600000))
          setToast({ type: 'craft_started', hours })
        } else {
          setToast({ type: 'established', name: getTownshipName(data, upgradeType) })
        }
        play('township_establish')
        refreshContext()
        await fetchTownship()
      } else {
        setToast({ type: 'error', message: errorMessage(json) })
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleUpgrade(upgradeType) {
    setBusy(upgradeType)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=township_upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgrade_type: upgradeType }),
      })
      const json = await res.json()
      if (res.ok) {
        setToast({ type: 'upgrade_started', name: getTownshipName(data, upgradeType), completes_at: json.upgrade_completes_at })
        refreshContext()
        await fetchTownship()
      } else {
        setToast({ type: 'error', message: errorMessage(json) })
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleClaim() {
    setBusy('craftsmanship')
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=craftsmanship_claim', {
        method: 'POST',
      })
      const json = await res.json()
      if (res.ok) {
        play('success')
        setClaimModal(json)
        refreshContext()
        await fetchTownship()
      } else {
        setToast({ type: 'error', message: errorMessage(json) })
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <PWPageShell title="TOWNSHIP" rightSlot={<PWBackButton />} backgroundVariant="township">
      {loading ? <SkeletonView /> : (
        <>
          <IntroCard />
          <SectionHeader>YOUR INSTITUTIONS</SectionHeader>
          {data?.townships?.map(t => (
            <TownshipCard
              key={t.type}
              township={t}
              onEstablish={() => handleEstablish(t.type)}
              onUpgrade={() => handleUpgrade(t.type)}
              onClaim={handleClaim}
              busy={busy === t.type}
            />
          ))}
        </>
      )}
      <AnimatePresence>
        {toast && (
          <TownshipToast
            key={toast.type + (toast.name || '') + (toast.new_level || '')}
            toast={toast}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {claimModal && (
          <CraftsmanshipClaimModal
            key="claim-modal"
            claimResult={claimModal}
            onClose={() => setClaimModal(null)}
            onViewInventory={() => { setClaimModal(null); navigate('/games/pantheon-wars/inventory') }}
          />
        )}
      </AnimatePresence>
    </PWPageShell>
  )
}

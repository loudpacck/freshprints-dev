import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const SLOTS = ['weapon', 'armor', 'artifact', 'mount', 'companion']
const FILTER_TABS = ['ALL', ...SLOTS.map(s => s.toUpperCase()), 'CONSUMABLE']

const SLOT_TYPE_COLOR = {
  weapon:     '#F97316',
  armor:      '#22C55E',
  artifact:   '#8B5CF6',
  mount:      '#0EA5E9',
  companion:  '#F472B6',
  consumable: '#22D3EE',
}

const BONUS_CHIPS = [
  { key: 'attack_bonus',   label: 'ATK',    color: '#F97316' },
  { key: 'defense_bonus',  label: 'DEF',    color: '#22C55E' },
  { key: 'agility_bonus',  label: 'AGI',    color: '#A78BFA' },
  { key: 'crit_chance',    label: 'CRIT%',  color: '#F5D88B' },
  { key: 'block_chance',   label: 'BLOCK%', color: '#8AB8D4' },
  { key: 'dodge_chance',   label: 'DODGE%', color: '#4FD1C5' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EquipSlot({ slot, item }) {
  const color = item ? (RARITY_COLOR[item.rarity] ?? '#F0F0F8') : 'rgba(240,240,248,0.15)'
  return (
    <div style={{
      background: item ? `rgba(${hexRgb(color)}, 0.06)` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${item ? `rgba(${hexRgb(color)}, 0.3)` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      padding: '12px 10px',
      textAlign: 'center',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 18, marginBottom: 4, lineHeight: 1 }}>{SLOT_GLYPH[slot]}</div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 8,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(240,240,248,0.28)',
        marginBottom: 5,
      }}>
        {slot}
      </div>
      {item ? (
        <>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: color,
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px', justifyContent: 'center' }}>
            {BONUS_CHIPS.filter(b => (item[b.key] || 0) > 0).slice(0, 3).map(b => (
              <span key={b.key} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: b.color }}>
                +{item[b.key]}{b.label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          color: 'rgba(240,240,248,0.18)',
          letterSpacing: '0.08em',
        }}>
          Empty
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, onEquip, onUnequip, onSell, onConsume, busy }) {
  const rarityColor = RARITY_COLOR[item.rarity] ?? '#F0F0F8'
  const rgb = hexRgb(rarityColor)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: item.equipped ? `rgba(${rgb}, 0.05)` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${item.equipped ? `rgba(${rgb}, 0.3)` : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        transition: 'background 200ms, border-color 200ms',
      }}
    >
      {/* Left: slot glyph */}
      <div style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: 8,
        background: item.equipped ? `rgba(${rgb}, 0.15)` : 'rgba(255,255,255,0.05)',
        border: `1px solid rgba(${rgb}, ${item.equipped ? 0.35 : 0.15})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
      }}>
        {SLOT_GLYPH[item.slot]}
      </div>

      {/* Center: item info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: '0.05em',
            color: '#F0F0F8',
            lineHeight: 1,
          }}>
            {item.name}
          </span>
          {/* TYPE badge */}
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SLOT_TYPE_COLOR[item.slot] ?? '#F0F0F8',
            background: `rgba(${hexRgb(SLOT_TYPE_COLOR[item.slot] ?? '#F0F0F8')}, 0.1)`,
            border: `1px solid rgba(${hexRgb(SLOT_TYPE_COLOR[item.slot] ?? '#F0F0F8')}, 0.28)`,
            borderRadius: 3,
            padding: '2px 6px',
          }}>
            {item.slot.toUpperCase()}
          </span>
          {/* RARITY badge */}
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: rarityColor,
            background: `rgba(${rgb}, 0.12)`,
            border: `1px solid rgba(${rgb}, 0.3)`,
            borderRadius: 3,
            padding: '2px 6px',
          }}>
            {item.rarity}
          </span>
          {item.equipped && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#22C55E',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 3,
              padding: '2px 6px',
            }}>
              EQUIPPED
            </span>
          )}
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'rgba(240,240,248,0.42)',
          margin: '0 0 7px',
          lineHeight: 1.45,
        }}>
          {item.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
          {item.slot === 'consumable' ? (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#22D3EE' }}>
              {item.consumable_effect === 'realloc_stats' ? 'Resets all stat allocations' : item.consumable_effect ?? 'Use to consume'}
            </span>
          ) : (
            BONUS_CHIPS.map(b => (item[b.key] || 0) > 0 ? (
              <span key={b.key} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: b.color }}>
                +{item[b.key]} {b.label}
              </span>
            ) : null)
          )}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.25)' }}>
            Sell: {fmt(item.sell_price)}₯
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {item.slot === 'consumable' ? (
          <ActionBtn
            label="USE"
            color="#22D3EE"
            onClick={() => onConsume(item.inventory_id)}
            disabled={busy}
          />
        ) : item.equipped ? (
          <ActionBtn
            label="UNEQUIP"
            color="#F97316"
            onClick={() => onUnequip(item.inventory_id)}
            disabled={busy}
          />
        ) : (
          <ActionBtn
            label="EQUIP"
            color="#C9A961"
            onClick={() => onEquip(item.inventory_id)}
            disabled={busy}
          />
        )}
        <ActionBtn
          label="SELL"
          color={item.equipped ? 'rgba(240,240,248,0.18)' : 'rgba(240,240,248,0.35)'}
          onClick={() => !item.equipped && onSell(item.inventory_id, item.name, item.sell_price)}
          disabled={busy || item.equipped}
          title={item.equipped ? 'Unequip before selling' : undefined}
        />
      </div>
    </motion.div>
  )
}

function ActionBtn({ label, color, onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: disabled ? 'rgba(240,240,248,0.2)' : color,
        background: 'transparent',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.07)' : color}`,
        borderRadius: 5,
        padding: '5px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'opacity 120ms',
      }}
    >
      {label}
    </button>
  )
}

function SellModal({ item, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0C0C14',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
          padding: '28px 24px',
          maxWidth: 360,
          width: '100%',
        }}
      >
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(240,240,248,0.3)',
          marginBottom: 10,
        }}>// CONFIRM SALE</p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: '#F0F0F8',
          marginBottom: 6,
        }}>
          Sell <strong>{item.name}</strong>?
        </p>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          color: '#C9A961',
          marginBottom: 24,
        }}>
          +{fmt(item.price)} ₯
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px',
              background: 'rgba(201,169,97,0.1)',
              border: '1px solid rgba(201,169,97,0.4)',
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#C9A961',
              cursor: 'pointer',
            }}
          >
            SELL
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.38)',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Toast({ message, color, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
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
        borderRadius: 6,
        padding: '11px 22px',
        fontFamily: "var(--pw-font-mono, 'IBM Plex Mono', monospace)",
        fontSize: 12,
        color,
        whiteSpace: 'nowrap',
        boxShadow: `var(--glow-gold, 0 0 16px rgba(201,169,97,0.45)), 0 4px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {message}
    </motion.div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function hexRgb(hex) {
  if (!hex || hex[0] !== '#') return '240,240,248'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
}

export default function Inventory() {
  const { user, loading: authLoading, refresh: refreshContext } = usePantheonWars()
  const navigate = useNavigate()
  const { play } = useSound()

  const [inventory,  setInventory]  = useState([])
  const [bonuses,    setBonuses]    = useState({ attack: 0, defense: 0 })
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [filter,     setFilter]     = useState('ALL')
  const [busy,       setBusy]       = useState(false)
  const [toast,      setToast]      = useState(null)
  const [sellModal,  setSellModal]  = useState(null) // { inventory_id, name, price }

  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  const fetchInventory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=inventory')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load inventory.'); return }
      const data = await res.json()
      setInventory(data.inventory)
      setBonuses(data.equipment_bonuses)
      setStats(data.stats)
    } catch { setError('Network error.') }
    finally   { setLoading(false) }
  }, [navigate])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  async function handleEquip(inventory_id) {
    setBusy(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to equip', color: '#F87171' }); return }
      setInventory(data.inventory)
      setBonuses(data.equipment_bonuses)
      setToast({ message: 'Item equipped', color: '#C9A961' })
      play('click')
    } finally { setBusy(false) }
  }

  async function handleUnequip(inventory_id) {
    setBusy(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=unequip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to unequip', color: '#F87171' }); return }
      setInventory(data.inventory)
      setBonuses(data.equipment_bonuses)
      setToast({ message: 'Item unequipped', color: '#F97316' })
    } finally { setBusy(false) }
  }

  function handleSellClick(inventory_id, name, price) {
    setSellModal({ inventory_id, name, price })
  }

  async function handleSellConfirm() {
    const { inventory_id } = sellModal
    setSellModal(null)
    setBusy(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Sell failed', color: '#F87171' }); return }
      setInventory(prev => prev.filter(i => i.inventory_id !== inventory_id))
      if (stats) setStats(prev => ({ ...prev, drachma: data.new_drachma }))
      setToast({ message: `Sold for ${fmt(data.sell_price)}₯`, color: '#C9A961' })
      play('purchase')
      refreshContext()
    } finally { setBusy(false) }
  }

  async function handleConsume(inventory_id) {
    setBusy(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msgs = {
          already_full_health: 'Already at full HP.',
          already_full:        'Already at full HP and Energy.',
          not_consumable:      'Item is not a consumable.',
        }
        setToast({ message: msgs[data.error] || data.error || 'Failed to use item', color: '#F87171' })
        return
      }
      setInventory(prev => prev.filter(i => i.inventory_id !== inventory_id))
      if (data.consumed.effect === 'realloc_stats') {
        if (data.stats) setStats(data.stats)
        const n = data.consumed.points_refunded ?? 0
        setToast({ message: `Stats reset — ${n} point${n !== 1 ? 's' : ''} refunded`, color: '#A78BFA' })
      } else if ((data.consumed.health_restored || 0) > 0 || (data.consumed.energy_restored || 0) > 0) {
        const parts = []
        if (data.consumed.health_restored > 0) parts.push(`+${data.consumed.health_restored} HP`)
        if (data.consumed.energy_restored  > 0) parts.push(`+${data.consumed.energy_restored} Energy`)
        setToast({ message: `Used ${data.consumed.name} — ${parts.join(', ')}`, color: '#22D3EE' })
      } else {
        setToast({ message: `Used ${data.consumed.name}`, color: '#22D3EE' })
      }
      play('success')
      refreshContext()
    } finally { setBusy(false) }
  }

  // Build equipped item map for slots display
  const equippedBySlot = {}
  for (const item of inventory) {
    if (item.equipped) equippedBySlot[item.slot] = item
  }

  // Filter list (ALL excludes consumables — they show in their own section)
  const equipmentItems  = inventory.filter(i => i.slot !== 'consumable')
  const consumableItems = inventory.filter(i => i.slot === 'consumable')
  const filtered = filter === 'ALL'
    ? equipmentItems
    : filter === 'CONSUMABLE'
      ? consumableItems
      : inventory.filter(i => i.slot === filter.toLowerCase())

  return (
    <>
      <style>{`
        @media (max-width: 520px) {
          .pw-slot-grid { grid-template-columns: repeat(3,1fr) !important; }
          .pw-bonus-row { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      {/* Sell confirmation modal */}
      <AnimatePresence>
        {sellModal && (
          <SellModal
            item={sellModal}
            onConfirm={handleSellConfirm}
            onCancel={() => setSellModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            color={toast.color}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <PWPageShell title="INVENTORY" rightSlot={<PWBackButton />} backgroundVariant="inventory">

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                {SLOTS.map(s => <Skeleton key={s} h={90} />)}
              </div>
              <Skeleton h={48} />
              {[0,1,2,3].map(i => <Skeleton key={i} h={90} />)}
            </div>
          )}

          {!loading && error && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F87171', textAlign: 'center', marginTop: 48 }}>
              // {error}
            </p>
          )}

          {!loading && !error && (
            <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>

              {/* Equipment bonuses summary */}
              {BONUS_CHIPS.some(b => (bonuses[b.key.replace('_bonus', '')] || bonuses[b.key] || 0) > 0) && (
                <motion.div
                  variants={fadeUp}
                  className="pw-bonus-row"
                  style={{
                    display: 'flex', gap: 12, marginBottom: 18,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '12px 16px',
                    alignItems: 'center', flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)' }}>
                    Equipped bonuses
                  </span>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {bonuses.attack > 0 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F97316' }}>+{bonuses.attack} ATK</span>
                    )}
                    {bonuses.defense > 0 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#22C55E' }}>+{bonuses.defense} DEF</span>
                    )}
                    {bonuses.agility > 0 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#A78BFA' }}>+{bonuses.agility} AGI</span>
                    )}
                    {bonuses.crit_chance > 0 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F5D88B' }}>+{bonuses.crit_chance}% CRIT</span>
                    )}
                    {bonuses.block_chance > 0 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#8AB8D4' }}>+{bonuses.block_chance}% BLOCK</span>
                    )}
                    {bonuses.dodge_chance > 0 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#4FD1C5' }}>+{bonuses.dodge_chance}% DODGE</span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Equipment slots grid */}
              <motion.div
                variants={fadeUp}
                className="pw-slot-grid"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 22 }}
              >
                {SLOTS.map(slot => (
                  <EquipSlot key={slot} slot={slot} item={equippedBySlot[slot] ?? null} />
                ))}
              </motion.div>

              {/* Filter pills */}
              <motion.div
                variants={fadeUp}
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}
              >
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: filter === tab ? '#F0F0F8' : 'rgba(240,240,248,0.35)',
                      background: filter === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: `1px solid ${filter === tab ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {SLOT_GLYPH[tab.toLowerCase()] ?? ''} {tab}
                  </button>
                ))}
              </motion.div>

              {/* Item list */}
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      color: 'rgba(240,240,248,0.25)',
                      textAlign: 'center',
                      marginTop: 40,
                    }}
                  >
                    // No items in this slot. Complete quests to earn loot.
                  </motion.p>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {filtered.map(item => (
                      <ItemCard
                        key={item.inventory_id}
                        item={item}
                        onEquip={handleEquip}
                        onUnequip={handleUnequip}
                        onSell={handleSellClick}
                        onConsume={handleConsume}
                        busy={busy}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {equipmentItems.length === 0 && consumableItems.length === 0 && !loading && (
                <motion.div
                  variants={fadeUp}
                  style={{
                    textAlign: 'center',
                    marginTop: 48,
                    padding: '32px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                  }}
                >
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.25)', marginBottom: 10 }}>
                    // VAULT EMPTY
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(240,240,248,0.38)', marginBottom: 16 }}>
                    Complete quests to earn loot drops, or visit the Shop to buy gear.
                  </p>
                  <Link
                    to="/games/pantheon-wars/shop"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#C9A961',
                      textDecoration: 'none',
                      border: '1px solid rgba(201,169,97,0.35)',
                      borderRadius: 6,
                      padding: '8px 16px',
                    }}
                  >
                    ₯ VISIT SHOP
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}
      </PWPageShell>
    </>
  )
}

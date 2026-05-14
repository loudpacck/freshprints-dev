import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_COLOR = {
  common:    '#A0A0B8',
  uncommon:  '#22C55E',
  rare:      '#00C8FF',
  epic:      '#A78BFA',
  legendary: '#F5C542',
}

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const SLOT_GLYPH = {
  weapon:    '⚔',
  armor:     '◈',
  artifact:  '✦',
  mount:     '◎',
  companion: '◆',
}

const FACTION_COLOR = { olympians: '#F5C542', aesir: '#78C5F0', annunaki: '#CF4444' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShopItem({ item, player, currency, onBuy, buying }) {
  const rarityColor = RARITY_COLOR[item.rarity] ?? '#F0F0F8'
  const rgb         = hexRgb(rarityColor)
  const price       = currency === 'drachma' ? item.buy_price : item.glory_price
  const balance     = currency === 'drachma' ? player.drachma : player.glory
  const priceLabel  = currency === 'drachma' ? `${fmt(price)} ₯` : `${price} ★`
  const priceColor  = currency === 'drachma' ? '#F5C542' : '#FBBF24'

  const levelLocked   = player.level < item.level_required
  const factionLocked = item.faction_exclusive && item.faction_exclusive !== player.faction
  const cantAfford    = balance < price
  const locked        = levelLocked || factionLocked

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: locked ? 0.45 : 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${locked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        padding: '16px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rarity accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: 3, height: '100%',
        background: locked ? 'rgba(255,255,255,0.1)' : rarityColor,
        borderRadius: '10px 0 0 10px',
        opacity: locked ? 0.4 : 0.6,
      }} />

      {/* Slot glyph */}
      <div style={{
        flexShrink: 0,
        width: 38, height: 38,
        borderRadius: 8,
        background: `rgba(${rgb}, 0.08)`,
        border: `1px solid rgba(${rgb}, 0.2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
        marginLeft: 8,
      }}>
        {SLOT_GLYPH[item.slot]}
      </div>

      {/* Info */}
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
          {item.faction_exclusive && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: FACTION_COLOR[item.faction_exclusive] ?? '#F0F0F8',
              background: `rgba(${hexRgb(FACTION_COLOR[item.faction_exclusive] ?? '#F0F0F8')}, 0.1)`,
              border: `1px solid rgba(${hexRgb(FACTION_COLOR[item.faction_exclusive] ?? '#F0F0F8')}, 0.3)`,
              borderRadius: 3, padding: '2px 6px',
            }}>
              {item.faction_exclusive}
            </span>
          )}
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: 'rgba(240,240,248,0.4)',
          margin: '0 0 7px', lineHeight: 1.4,
        }}>
          {item.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
          {item.attack_bonus > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#F97316' }}>
              +{item.attack_bonus} ATK
            </span>
          )}
          {item.defense_bonus > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#22C55E' }}>
              +{item.defense_bonus} DEF
            </span>
          )}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.25)' }}>
            Level {item.level_required}+
          </span>
        </div>

        {/* Lock reason */}
        {(levelLocked || factionLocked) && (
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#F87171', marginTop: 6, marginBottom: 0,
          }}>
            {levelLocked ? `// REQUIRES LEVEL ${item.level_required}` : `// ${item.faction_exclusive?.toUpperCase()} ONLY`}
          </p>
        )}
      </div>

      {/* Buy button */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 20, letterSpacing: '0.04em',
          color: locked || cantAfford ? 'rgba(240,240,248,0.2)' : priceColor,
          lineHeight: 1,
        }}>
          {priceLabel}
        </span>
        <button
          onClick={() => !locked && !cantAfford && !buying && onBuy(item.id)}
          disabled={locked || cantAfford || buying}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: locked || cantAfford ? 'rgba(240,240,248,0.18)' : priceColor,
            background: 'transparent',
            border: `1px solid ${locked || cantAfford ? 'rgba(255,255,255,0.07)' : `rgba(${hexRgb(priceColor)}, 0.4)`}`,
            borderRadius: 5, padding: '6px 12px',
            cursor: locked || cantAfford || buying ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', transition: 'opacity 120ms',
          }}
        >
          {buying ? '···' : (cantAfford && !locked) ? 'FUNDS' : 'BUY'}
        </button>
      </div>
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
        position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
        zIndex: 70,
        background: 'rgba(7,7,13,0.93)', backdropFilter: 'blur(12px)',
        border: `1px solid ${color}55`, borderRadius: 10,
        padding: '11px 22px',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color,
        whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {message}
    </motion.div>
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

  const [drachmaItems, setDrachmaItems] = useState([])
  const [gloryItems,   setGloryItems]   = useState([])
  const [player,       setPlayer]       = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [tab,          setTab]          = useState('drachma')  // 'drachma' | 'glory'
  const [buying,       setBuying]       = useState(null)       // item_id being purchased
  const [toast,        setToast]        = useState(null)

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
      setDrachmaItems(data.drachma_items)
      setGloryItems(data.glory_items)
      setPlayer(data.player)
    } catch { setError('Network error.') }
    finally   { setLoading(false) }
  }, [navigate])

  useEffect(() => { fetchShop() }, [fetchShop])

  async function handleBuy(item_id) {
    setBuying(item_id)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, currency: tab }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Purchase failed', color: '#F87171' })
        return
      }
      // Update local balances
      setPlayer(prev => ({
        ...prev,
        drachma: data.new_drachma,
        glory:   data.new_glory,
      }))
      setToast({ message: `${data.purchased.name} acquired`, color: RARITY_COLOR[data.purchased.rarity] ?? '#00C8FF' })
      refreshContext()
    } finally { setBuying(null) }
  }

  const items       = tab === 'drachma' ? drachmaItems : gloryItems
  const currLabel   = tab === 'drachma' ? '₯' : '★'
  const balance     = player ? (tab === 'drachma' ? player.drachma : player.glory) : 0
  const balColor    = tab === 'drachma' ? '#F5C542' : '#FBBF24'

  return (
    <>
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <AnimatePresence>
        {toast && <Toast message={toast.message} color={toast.color} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          background: '#07070D',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(245,197,66,0.07) 0%, transparent 55%)',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif", color: '#F0F0F8',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 20px',
          background: 'rgba(7,7,13,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚔</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.1em' }}>
              PANTHEON WARS
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.3)', marginLeft: 4,
            }}>
              / SHOP
            </span>
          </div>
          <Link
            to="/games/pantheon-wars"
            style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.38)', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            ← Command Center
          </Link>
        </header>

        {/* ── Main ──────────────────────────────────────────────────── */}
        <main style={{ flex: 1, maxWidth: 700, width: '100%', margin: '0 auto', padding: '24px 20px 64px' }}>

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

              {/* Balance display */}
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
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.04em', color: '#F5C542', lineHeight: 1 }}>
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
              <motion.div
                variants={fadeUp}
                style={{ display: 'flex', gap: 8, marginBottom: 22 }}
              >
                {[
                  { key: 'drachma', label: '₯ DRACHMA SHOP', count: drachmaItems.length },
                  { key: 'glory',   label: '★ GLORY SHOP',   count: gloryItems.length },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: tab === t.key ? '#F0F0F8' : 'rgba(240,240,248,0.35)',
                      background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: `1px solid ${tab === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {t.label}
                    <span style={{ marginLeft: 6, color: 'rgba(240,240,248,0.28)', fontSize: 9 }}>
                      ({t.count})
                    </span>
                  </button>
                ))}
              </motion.div>

              {/* Item list */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {items.map(item => (
                    <ShopItem
                      key={item.id}
                      item={item}
                      player={player}
                      currency={tab}
                      onBuy={handleBuy}
                      buying={buying === item.id}
                    />
                  ))}

                  {items.length === 0 && (
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11, color: 'rgba(240,240,248,0.25)',
                      textAlign: 'center', marginTop: 40,
                    }}>
                      // No items available.
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

            </motion.div>
          )}
        </main>
      </motion.div>
    </>
  )
}

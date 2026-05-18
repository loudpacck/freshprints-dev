import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import { useSound } from '@/sound/useSound'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

function fmtDuration(secs) {
  if (secs < 3600) return `${Math.round(secs / 60)}m`
  if (secs % 3600 === 0) return `${secs / 3600}h`
  return `${Math.floor(secs / 3600)}h ${Math.round((secs % 3600) / 60)}m`
}

function fmtCountdown(secs) {
  if (secs == null || secs < 0) return '--:--:--'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function useCountdown(targetMs) {
  const [secsLeft, setSecsLeft] = useState(null)
  useEffect(() => {
    if (!targetMs) { setSecsLeft(null); return }
    const compute = () => Math.max(0, Math.floor((targetMs - Date.now()) / 1000))
    setSecsLeft(compute())
    const id = setInterval(() => setSecsLeft(compute()), 1000)
    return () => clearInterval(id)
  }, [targetMs])
  return secsLeft
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BonusTag({ label, color }) {
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 4,
      padding: '2px 7px',
    }}>
      {label}
    </span>
  )
}

function ActiveAdventureCard({ adventure, onAbandon, onClaim, abandoning, claiming }) {
  const secsLeft = useCountdown(adventure.completes_at ? new Date(adventure.completes_at).getTime() : null)
  const duration = adventure.duration_seconds
  const elapsed  = secsLeft != null ? duration - secsLeft : 0
  const pct      = duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 100)) : 0
  const ready    = secsLeft != null && secsLeft <= 0

  return (
    <div style={{
      background: ready ? 'rgba(210,150,80,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${ready ? 'rgba(210,150,80,0.35)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 10,
      padding: '18px 20px',
      marginBottom: 28,
      transition: 'background 400ms, border-color 400ms',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: ready ? 'rgba(210,150,80,0.8)' : 'rgba(240,240,248,0.32)',
            marginBottom: 5,
          }}>
            {ready ? '◉ COMPLETE — CLAIM REWARDS' : '◉ ADVENTURE IN PROGRESS'}
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 22,
            letterSpacing: '0.06em',
            color: '#F0F0F8',
            margin: 0,
            lineHeight: 1,
          }}>
            {adventure.name}
          </h2>
        </div>

        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: ready ? 20 : 16,
          fontWeight: 700,
          color: ready ? '#D29650' : 'rgba(240,240,248,0.55)',
          letterSpacing: '0.04em',
          flexShrink: 0,
          transition: 'font-size 300ms, color 300ms',
        }}>
          {fmtCountdown(secsLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: ready ? '#D29650' : 'rgba(210,150,80,0.55)', borderRadius: 3 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {ready ? (
          <motion.button
            whileHover={!claiming ? { scale: 1.03 } : {}}
            whileTap={!claiming ? { scale: 0.97 } : {}}
            onClick={onClaim}
            disabled={claiming}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: claiming ? 'rgba(240,240,248,0.3)' : '#D29650',
              background: claiming ? 'transparent' : 'rgba(210,150,80,0.1)',
              border: `1px solid ${claiming ? 'rgba(255,255,255,0.08)' : 'rgba(210,150,80,0.4)'}`,
              borderRadius: 6,
              padding: '9px 20px',
              cursor: claiming ? 'not-allowed' : 'pointer',
              flex: 1,
              transition: 'all 150ms',
            }}
          >
            {claiming ? '···' : '⚑ CLAIM REWARDS'}
          </motion.button>
        ) : (
          <motion.button
            whileHover={!abandoning ? { scale: 1.03 } : {}}
            whileTap={!abandoning ? { scale: 0.97 } : {}}
            onClick={onAbandon}
            disabled={abandoning}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: abandoning ? 'rgba(240,240,248,0.2)' : 'rgba(240,90,90,0.7)',
              background: 'transparent',
              border: `1px solid ${abandoning ? 'rgba(255,255,255,0.06)' : 'rgba(240,90,90,0.2)'}`,
              borderRadius: 6,
              padding: '8px 16px',
              cursor: abandoning ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
            }}
          >
            {abandoning ? '···' : 'ABANDON'}
          </motion.button>
        )}
      </div>
    </div>
  )
}

function AdventureCard({ adv, stats, user, onStart, starting, hasActive }) {
  const status = adv.player_status  // 'available' | 'active' | 'completed' | 'abandoned'
  const canStart = (
    status === 'available' &&
    !hasActive &&
    stats &&
    stats.level >= adv.level_required &&
    stats.energy >= adv.energy_cost
  )
  const isStarting = starting === adv.id
  const isActive   = status === 'active'

  let disableReason = null
  if (status === 'completed')  disableReason = 'COMPLETED'
  else if (status === 'abandoned') disableReason = 'ABANDONED'
  else if (isActive)           disableReason = 'ACTIVE'
  else if (hasActive)          disableReason = 'BUSY'
  else if (stats && stats.level < adv.level_required) disableReason = `LVL ${adv.level_required}`
  else if (stats && stats.energy < adv.energy_cost)   disableReason = 'NO ENERGY'

  const locked = !!disableReason && !isStarting

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: isActive ? 'rgba(210,150,80,0.04)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? 'rgba(210,150,80,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        padding: '16px',
        opacity: locked && !isActive ? 0.72 : 1,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            letterSpacing: '0.06em',
            color: '#F0F0F8',
            margin: '0 0 5px',
            lineHeight: 1,
          }}>
            {adv.name}
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'rgba(240,240,248,0.42)',
            margin: '0 0 10px',
            lineHeight: 1.5,
          }}>
            {adv.description}
          </p>

          {/* Reward strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', marginBottom: 8 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#C9A961' }}>
              ⏱ {fmtDuration(adv.duration_seconds)}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#C9A961' }}>
              ⚡ {adv.energy_cost}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#A78BFA' }}>
              +{fmt(adv.xp_reward)} XP
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#C9A961' }}>
              +{fmt(adv.drachma_base)}{adv.drachma_range > 0 ? `–${fmt(adv.drachma_base + adv.drachma_range)}` : ''} ₯
            </span>
            {adv.loot_chance > 0 && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#22C55E' }}>
                ~{adv.loot_chance}% loot [{adv.min_loot_rarity}+]
              </span>
            )}
          </div>

          {/* Global + per-adventure bonus tags */}
          {(() => {
            const chips = []
            if (user?.faction === 'olympians') chips.push(<BonusTag key="oly" label="+10% XP" color="#E8D080" />)
            if (user?.faction === 'annunaki')  chips.push(<BonusTag key="ann" label="+5% ₯" color="#C25E3C" />)
            if (user?.class   === 'broker')    chips.push(<BonusTag key="brk" label="+10% ₯" color="#C9A961" />)
            if (adv.faction_bonus) chips.push(
              <BonusTag
                key="qf"
                label={`${adv.faction_bonus} +${adv.faction_bonus_type === 'guaranteed_loot' ? 'guaranteed loot' : adv.faction_bonus_value + '% ' + adv.faction_bonus_type.replace('_', ' ')}`}
                color={adv.faction_bonus === 'olympians' ? '#E8D080' : adv.faction_bonus === 'aesir' ? '#8AB8D4' : '#C25E3C'}
              />
            )
            if (adv.class_bonus) chips.push(
              <BonusTag
                key="qc"
                label={`${adv.class_bonus} +${adv.class_bonus_type === 'loot_upgrade' ? 'loot upgrade' : adv.class_bonus_value + '% ' + adv.class_bonus_type.replace('_', ' ')}`}
                color="#9B8AC4"
              />
            )
            if (chips.length === 0) return null
            return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{chips}</div>
          })()}
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0 }}>
          {disableReason ? (
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.25)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6,
              padding: '8px 12px',
              whiteSpace: 'nowrap',
            }}>
              {disableReason}
            </div>
          ) : (
            <motion.button
              whileHover={!isStarting ? { scale: 1.04 } : {}}
              whileTap={!isStarting ? { scale: 0.97 } : {}}
              onClick={() => !isStarting && onStart(adv.id)}
              disabled={isStarting}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isStarting ? 'rgba(240,240,248,0.3)' : '#D29650',
                background: 'transparent',
                border: `1px solid ${isStarting ? 'rgba(255,255,255,0.08)' : 'rgba(210,150,80,0.4)'}`,
                borderRadius: 6,
                padding: '8px 14px',
                cursor: isStarting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 150ms, border-color 150ms',
                opacity: isStarting ? 0.6 : 1,
              }}
            >
              {isStarting ? '···' : 'BEGIN'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function AbandonModal({ adventureName, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-elevated, #14101A)',
          border: '1px solid rgba(240,90,90,0.3)',
          borderRadius: 10,
          padding: '24px 28px',
          maxWidth: 360,
          width: '100%',
        }}
      >
        <h3 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22,
          letterSpacing: '0.06em',
          color: '#F0F0F8',
          margin: '0 0 10px',
        }}>
          Abandon Adventure?
        </h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          color: 'rgba(240,240,248,0.5)',
          margin: '0 0 20px',
          lineHeight: 1.6,
        }}>
          You will lose all progress on <strong style={{ color: 'rgba(240,240,248,0.8)' }}>{adventureName}</strong>. Energy spent is not refunded. This adventure will be locked for the rest of this rotation.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.5)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '9px 0',
              cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: loading ? 'rgba(240,240,248,0.2)' : '#F87171',
              background: 'rgba(240,90,90,0.08)',
              border: `1px solid ${loading ? 'rgba(255,255,255,0.06)' : 'rgba(240,90,90,0.3)'}`,
              borderRadius: 6,
              padding: '9px 0',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '···' : 'ABANDON'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AdventureRewardToast({ reward, onDone }) {
  const { play } = useSound()
  useEffect(() => {
    play('adventureComplete')
    const t = setTimeout(onDone, 4200)
    return () => clearTimeout(t)
  }, [onDone, play])
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 52px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 61,
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(16px)',
        border: '2px solid rgba(210,150,80,0.5)',
        borderRadius: 6,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        whiteSpace: 'nowrap',
        boxShadow: '0 0 20px rgba(210,150,80,0.35), 0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', color: 'rgba(210,150,80,0.7)', textTransform: 'uppercase' }}>
        ⚑ {reward.adventure_name}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#9B8AC4' }}>
        +{fmt(reward.xp)} XP
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#C9A961' }}>
        +{fmt(reward.drachma)} ₯
      </span>
      {reward.loot && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#22C55E' }}>
          ◆ {reward.loot.name}
          <span style={{ color: 'rgba(95,184,87,0.6)', fontSize: 10, marginLeft: 5 }}>
            [{reward.loot.rarity}]
          </span>
        </span>
      )}
      {reward.levelsGained > 0 && (
        <span style={{ fontFamily: "var(--pw-font-display, 'Cinzel', serif)", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: '#D4A437' }}>
          ★ LEVEL UP!
        </span>
      )}
    </motion.div>
  )
}

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

// ─── Adventures page ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
}

export default function Adventures() {
  const { user, loading: authLoading, refresh: refreshContext } = usePantheonWars()
  const navigate = useNavigate()
  const { play } = useSound()

  const [adventures,        setAdventures]        = useState([])
  const [activeAdventure,   setActiveAdventure]   = useState(null)
  const [rotationExpiresAt, setRotationExpiresAt] = useState(null)
  const [stats,             setStats]             = useState(null)
  const [loading,           setLoading]           = useState(true)
  const [error,             setError]             = useState(null)
  const [starting,          setStarting]          = useState(null)  // adventure_id
  const [claiming,          setClaiming]          = useState(false)
  const [abandoning,        setAbandoning]        = useState(false)
  const [confirmAbandon,    setConfirmAbandon]    = useState(false)
  const [toast,             setToast]             = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  const fetchAdventures = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=adventures')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load adventures.'); return }
      const data = await res.json()
      setAdventures(data.adventures ?? [])
      setActiveAdventure(data.active_adventure ?? null)
      if (data.rotation_expires_at) setRotationExpiresAt(data.rotation_expires_at)
      setStats(data.stats)
      if (data.pendingAdventureRewards) setToast(data.pendingAdventureRewards)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { fetchAdventures() }, [fetchAdventures])

  async function handleStart(adventureId) {
    setStarting(adventureId)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=adventures_start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adventure_id: adventureId }),
      })
      const data = await res.json()
      if (!res.ok) return
      if (data.pendingAdventureRewards) setToast(data.pendingAdventureRewards)
      play('select')
      await fetchAdventures()
      refreshContext()
    } finally {
      setStarting(null)
    }
  }

  async function handleAbandon() {
    if (!activeAdventure) return
    setAbandoning(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=adventures_abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_adventure_id: activeAdventure.player_adventure_id }),
      })
      const data = await res.json()
      if (!res.ok) return
      if (data.pendingAdventureRewards) setToast(data.pendingAdventureRewards)
      setConfirmAbandon(false)
      play('toggle')
      await fetchAdventures()
    } finally {
      setAbandoning(false)
    }
  }

  async function handleClaim() {
    setClaiming(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=adventures_claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) return
      const rewards = data.rewards ?? data.pendingAdventureRewards
      if (rewards) setToast(rewards)
      await fetchAdventures()
      refreshContext()
    } finally {
      setClaiming(false)
    }
  }

  const rotationSecsLeft = useCountdown(rotationExpiresAt)

  // Auto-refresh when rotation expires
  const rotExpRef = useRef(rotationExpiresAt)
  useEffect(() => { rotExpRef.current = rotationExpiresAt }, [rotationExpiresAt])
  useEffect(() => {
    if (!rotationExpiresAt) return
    const msLeft = rotationExpiresAt - Date.now()
    if (msLeft <= 0) { fetchAdventures(); return }
    const id = setTimeout(fetchAdventures, msLeft)
    return () => clearTimeout(id)
  }, [rotationExpiresAt, fetchAdventures])

  const hasActive = !!activeAdventure

  return (
    <>
      <AnimatePresence>
        {toast && (
          <AdventureRewardToast
            reward={toast}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAbandon && activeAdventure && (
          <AbandonModal
            adventureName={activeAdventure.name}
            onConfirm={handleAbandon}
            onCancel={() => setConfirmAbandon(false)}
            loading={abandoning}
          />
        )}
      </AnimatePresence>

      <PWPageShell title="ADVENTURES" rightSlot={<PWBackButton />} backgroundVariant="adventures">

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Skeleton h={130} />
            <Skeleton h={22} w={200} />
            {[0,1,2].map(i => <Skeleton key={i} h={140} />)}
          </div>
        )}

        {!loading && error && (
          <p style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: '#F87171',
            textAlign: 'center',
            marginTop: 48,
          }}>
            // {error}
          </p>
        )}

        {!loading && !error && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {/* Active adventure */}
            {activeAdventure && (
              <motion.div variants={fadeUp}>
                <ActiveAdventureCard
                  adventure={activeAdventure}
                  onAbandon={() => setConfirmAbandon(true)}
                  onClaim={handleClaim}
                  abandoning={abandoning}
                  claiming={claiming}
                />
              </motion.div>
            )}

            {/* Rotation header */}
            <motion.div variants={fadeUp} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                letterSpacing: '0.08em',
                color: 'rgba(240,240,248,0.65)',
              }}>
                Available Adventures
              </span>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.08em',
                color: 'rgba(240,240,248,0.28)',
              }}>
                Next refresh: {fmtCountdown(rotationSecsLeft)}
              </span>
            </motion.div>

            {/* Adventure cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {adventures.map(adv => (
                <motion.div key={adv.id} variants={fadeUp}>
                  <AdventureCard
                    adv={adv}
                    stats={stats}
                    user={user}
                    onStart={handleStart}
                    starting={starting}
                    hasActive={hasActive}
                  />
                </motion.div>
              ))}

              {adventures.length === 0 && (
                <motion.p
                  variants={fadeUp}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: 'rgba(240,240,248,0.32)',
                    textAlign: 'center',
                    marginTop: 48,
                  }}
                >
                  // No adventures available at your current level.
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </PWPageShell>
    </>
  )
}

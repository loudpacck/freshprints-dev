import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import { useSound } from '@/sound/useSound'
import { musicManager } from '@/sound/MusicManager'

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }
const FACTION_LABEL = { olympians: 'Olympians', aesir: 'Aesir', annunaki: 'Annunaki' }
const CLASS_LABEL   = { warden: 'Warden', oracle: 'Oracle', slayer: 'Slayer', broker: 'Broker' }

const ATTACK_COLOR     = '#F97316'
const DEFENSE_COLOR    = '#22C55E'
const AGILITY_COLOR    = '#A78BFA'
const ENERGY_COLOR     = '#C9A961'
const HEALTH_COLOR     = '#EF4444'
const VIOLET           = '#8B5CF6'
const COALITION_COLOR  = '#A78BFA'
const COMPACT_COLOR    = '#FB923C'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function xpNeeded(level) {
  return Math.max(1, Math.floor(100 * Math.pow(level, 1.5)))
}

function hexRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function calcPwr(stats, equipBonuses) {
  return Math.floor(
    stats.attack + stats.defense +
    (equipBonuses?.attack  || 0) + (equipBonuses?.defense || 0) +
    stats.level * 2
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 4,
      padding: '3px 8px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function BonusLine({ icon, text, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontSize: 11, lineHeight: 1, minWidth: 14, textAlign: 'center' }}>{icon}</span>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.06em',
        color: color,
        opacity: 0.85,
      }}>
        {text}
      </span>
    </div>
  )
}

function AllocToast({ toast, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  const isError = toast.type === 'error'
  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 88px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(7,7,13,0.93)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isError ? 'rgba(248,113,113,0.4)' : 'rgba(34,197,94,0.4)'}`,
        borderRadius: 10,
        padding: '11px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {isError ? (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#F87171' }}>
          // {toast.message}
        </span>
      ) : toast.message ? (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#22C55E' }}>
          {toast.message}
        </span>
      ) : (
        <>
          {toast.attack > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: ATTACK_COLOR }}>
              +{toast.attack} ATK
            </span>
          )}
          {toast.defense > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: DEFENSE_COLOR }}>
              +{toast.defense} DEF
            </span>
          )}
          {toast.agility > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: AGILITY_COLOR }}>
              +{toast.agility} AGI
            </span>
          )}
          {toast.energy_max > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: ENERGY_COLOR }}>
              +{toast.energy_max} E.MAX
            </span>
          )}
          {toast.health_max > 0 && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: HEALTH_COLOR }}>
              +{toast.health_max} HP.MAX
            </span>
          )}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.45)' }}>
            ALLOCATED
          </span>
        </>
      )}
    </motion.div>
  )
}

function StatAllocCard({ label, desc, color, current, pending, onIncrement, onDecrement, canAdd, style }) {
  const rgb = hexRgb(color)
  const isActive = pending > 0

  return (
    <div style={{
      background: isActive ? `rgba(${rgb}, 0.06)` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isActive ? `rgba(${rgb}, 0.35)` : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12,
      padding: '20px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'background 200ms, border-color 200ms, box-shadow 200ms',
      boxShadow: isActive ? `0 0 24px rgba(${rgb}, 0.12)` : 'none',
      ...style,
    }}>
      {/* Stat label + description */}
      <div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: color,
          opacity: 0.8,
        }}>
          {label}
        </div>
        {desc && (
          <span style={{
            fontFamily: "var(--pw-font-body, 'DM Sans', sans-serif)",
            fontSize: 10,
            color: 'var(--color-text-muted, rgba(240,240,248,0.4))',
            lineHeight: 1.3,
            display: 'block',
            marginTop: 4,
          }}>
            {desc}
          </span>
        )}
      </div>

      {/* Current value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 44,
          letterSpacing: '0.04em',
          color: color,
          lineHeight: 1,
        }}>
          {current}
        </span>
        {pending > 0 && (
          <motion.span
            key={pending}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 14,
              letterSpacing: '0.06em',
              color: color,
              opacity: 0.7,
            }}
          >
            +{pending}
          </motion.span>
        )}
      </div>

      {/* After-allocation preview */}
      {pending > 0 && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `rgba(${rgb}, 0.55)`,
        }}>
          → {current + pending} after allocation
        </div>
      )}

      {/* +/- buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onDecrement}
          disabled={pending === 0}
          style={{
            flex: 1,
            padding: '9px 0',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 18,
            lineHeight: 1,
            background: 'transparent',
            border: `1px solid ${pending > 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 7,
            color: pending > 0 ? 'rgba(240,240,248,0.7)' : 'rgba(240,240,248,0.15)',
            cursor: pending > 0 ? 'pointer' : 'not-allowed',
            transition: 'border-color 150ms, color 150ms',
          }}
          onMouseEnter={e => {
            if (pending > 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
          }}
          onMouseLeave={e => {
            if (pending > 0) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
          }}
        >
          −
        </button>
        <button
          onClick={onIncrement}
          disabled={!canAdd}
          style={{
            flex: 1,
            padding: '9px 0',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 18,
            lineHeight: 1,
            background: canAdd ? `rgba(${rgb}, 0.1)` : 'transparent',
            border: `1px solid ${canAdd ? `rgba(${rgb}, 0.45)` : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 7,
            color: canAdd ? color : 'rgba(240,240,248,0.15)',
            cursor: canAdd ? 'pointer' : 'not-allowed',
            transition: 'background 150ms, border-color 150ms, color 150ms',
          }}
          onMouseEnter={e => {
            if (canAdd) e.currentTarget.style.background = `rgba(${rgb}, 0.18)`
          }}
          onMouseLeave={e => {
            if (canAdd) e.currentTarget.style.background = `rgba(${rgb}, 0.1)`
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Free reset confirmation modal ────────────────────────────────────────────

function ResetModal({ onConfirm, onCancel, isConfirming }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(7,7,13,0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'rgba(14,14,22,0.98)',
          border: '1px solid rgba(248,113,113,0.35)',
          borderRadius: 14,
          padding: '28px 28px 24px',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(248,113,113,0.65)',
          marginBottom: 12,
        }}>
          // STAT RESET
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 26,
          letterSpacing: '0.08em',
          color: '#F0F0F8',
          lineHeight: 1,
          marginBottom: 14,
        }}>
          RESET ALL STAT POINTS?
        </div>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: 'rgba(240,240,248,0.5)',
          lineHeight: 1.55,
          margin: '0 0 22px',
        }}>
          All allocated stats will revert to their baseline values and every spent point will be returned to your pool. This one-time free reset cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={isConfirming}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.5)',
              cursor: isConfirming ? 'not-allowed' : 'pointer',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            style={{
              flex: 2,
              padding: '12px 0',
              background: isConfirming ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.15)',
              border: '1px solid rgba(248,113,113,0.5)',
              borderRadius: 8,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              letterSpacing: '0.1em',
              color: isConfirming ? 'rgba(248,113,113,0.5)' : '#F87171',
              cursor: isConfirming ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
          >
            {isConfirming ? 'RESETTING...' : 'CONFIRM RESET'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Alignment chooser — plays alignment song on mount, stops on unmount ──────

function AlignmentChooser({ onChoose, isChoosing }) {
  useEffect(() => {
    musicManager.play('/sounds/pantheon_wars/alignmentChoose.mp3', { volume: 0.3 })
    return () => musicManager.stop()
  }, [])

  return (
    <div>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: 'rgba(240,240,248,0.38)',
        marginBottom: 16,
        lineHeight: 1.55,
      }}>
        Choose your allegiance. This decision is permanent and determines your PvP pool and future quest chains.
      </p>
      <div className="pw-align-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { id: 'coalition', icon: '⚜', label: 'PANTHEON COALITION', color: '#A78BFA', border: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.1)' },
          { id: 'compact',   icon: '⚡', label: 'MORTAL COMPACT',     color: '#FB923C', border: 'rgba(251,146,60,0.3)',  bg: 'rgba(251,146,60,0.1)'  },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => { musicManager.stop(); onChoose(opt.id) }}
            disabled={isChoosing}
            style={{
              padding: '18px 12px',
              background: isChoosing ? 'transparent' : opt.bg,
              border: `1px solid ${opt.border}`,
              borderRadius: 10,
              cursor: isChoosing ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'background 150ms',
              opacity: isChoosing ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!isChoosing) e.currentTarget.style.background = opt.bg.replace('0.1', '0.2') }}
            onMouseLeave={e => { if (!isChoosing) e.currentTarget.style.background = opt.bg }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 14,
              letterSpacing: '0.08em',
              color: opt.color,
            }}>
              {opt.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function Profile() {
  const { user, stats: ctxStats, equipBonuses, loading, refresh } = usePantheonWars()
  const navigate = useNavigate()
  const { play } = useSound()

  // Local stats so we can update instantly on allocation success
  const [displayStats, setDisplayStats] = useState(null)
  useEffect(() => { if (ctxStats) setDisplayStats(ctxStats) }, [ctxStats])

  const [pendingAttack,     setPendingAttack]     = useState(0)
  const [pendingDefense,    setPendingDefense]    = useState(0)
  const [pendingAgility,    setPendingAgility]    = useState(0)
  const [pendingEnergyMax,  setPendingEnergyMax]  = useState(0)
  const [pendingHealthMax,  setPendingHealthMax]  = useState(0)
  const [isSubmitting,      setIsSubmitting]      = useState(false)
  const [isChoosing,        setIsChoosing]        = useState(false)
  const [showResetModal,    setShowResetModal]    = useState(false)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const [toast,             setToast]             = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [loading, user, navigate])

  const stats = displayStats
  const availablePoints = stats ? stats.stat_points - pendingAttack - pendingDefense - pendingAgility - pendingEnergyMax - pendingHealthMax : 0
  const totalPending    = pendingAttack + pendingDefense + pendingAgility + pendingEnergyMax + pendingHealthMax
  const canAddMore      = availablePoints > 0

  async function handleAllocate() {
    if (totalPending === 0 || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=allocate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          attack:     pendingAttack,
          defense:    pendingDefense,
          agility:    pendingAgility,
          energy_max: pendingEnergyMax,
          health_max: pendingHealthMax,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Allocation failed' })
        return
      }

      // Instant UI update from response
      setDisplayStats(prev => ({
        ...prev,
        attack:      data.newStats.attack,
        defense:     data.newStats.defense,
        agility:     data.newStats.agility,
        energy_max:  data.newStats.energy_max,
        health_max:  data.newStats.health_max,
        energy:      data.newStats.energy,
        health:      data.newStats.health,
        stat_points: data.newStats.stat_points,
      }))
      setToast({
        type:       'success',
        attack:     pendingAttack,
        defense:    pendingDefense,
        agility:    pendingAgility,
        energy_max: pendingEnergyMax,
        health_max: pendingHealthMax,
      })
      play('success')
      setPendingAttack(0)
      setPendingDefense(0)
      setPendingAgility(0)
      setPendingEnergyMax(0)
      setPendingHealthMax(0)
      refresh()
    } catch {
      setToast({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleChooseAlignment(alignment) {
    if (isChoosing) return
    setIsChoosing(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=alignment_choose', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ alignment }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', message: data.error || 'Failed to set alignment' })
        return
      }
      const label = alignment === 'coalition' ? 'COALITION' : 'COMPACT'
      setToast({ type: 'success', attack: 0, defense: 0, message: `ALIGNMENT PLEDGED — ${label}` })
      refresh()
    } catch {
      setToast({ type: 'error', message: 'Network error. Try again.' })
    } finally {
      setIsChoosing(false)
    }
  }

  async function handleFreeReset() {
    if (isConfirmingReset) return
    setIsConfirmingReset(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=stat_reset_free', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error === 'free_reset_already_used'
          ? 'Free reset already used'
          : (data.error || 'Reset failed')
        setToast({ type: 'error', message: msg })
        setShowResetModal(false)
        return
      }
      setDisplayStats(data.stats)
      setPendingAttack(0)
      setPendingDefense(0)
      setPendingAgility(0)
      setPendingEnergyMax(0)
      setPendingHealthMax(0)
      setShowResetModal(false)
      setToast({ type: 'success', message: `Stats reset — ${data.points_refunded} point${data.points_refunded !== 1 ? 's' : ''} refunded` })
      play('success')
      refresh()
    } catch {
      setToast({ type: 'error', message: 'Network error. Try again.' })
    } finally {
      setIsConfirmingReset(false)
    }
  }

  const factionColor = user ? (FACTION_COLOR[user.faction] ?? '#F0F0F8') : '#F0F0F8'
  const xpMax = stats ? xpNeeded(stats.level) : 100
  const xpPct = stats ? Math.min(100, Math.round((stats.xp / xpMax) * 100)) : 0

  return (
    <>
      <style>{`
        @media (max-width: 799px) {
          .pw-alloc-grid  { grid-template-columns: 1fr 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .pw-alloc-grid  { grid-template-columns: 1fr 1fr !important; }
          .pw-align-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 380px) {
          .pw-alloc-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <AllocToast toast={toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* Free reset confirmation modal */}
      <AnimatePresence>
        {showResetModal && (
          <ResetModal
            onConfirm={handleFreeReset}
            onCancel={() => setShowResetModal(false)}
            isConfirming={isConfirmingReset}
          />
        )}
      </AnimatePresence>

      <PWPageShell title="PROFILE" rightSlot={<PWBackButton />} backgroundVariant="profile">

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
              <Skeleton h={12} w={100} />
              <Skeleton h={40} w={220} />
              <Skeleton h={60} />
              <Skeleton h={90} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Skeleton h={160} />
                <Skeleton h={160} />
              </div>
              <Skeleton h={56} />
            </div>
          )}

          {/* Content */}
          {!loading && user && stats && (
            <motion.div variants={stagger} initial="hidden" animate="visible">

              {/* A — Page title */}
              <motion.section variants={fadeUp} style={{ marginBottom: 28 }}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.3)',
                  marginBottom: 10,
                }}>
                  // PROFILE
                </p>
                <h1 style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(34px, 10vw, 52px)',
                  letterSpacing: '0.07em',
                  color: '#F0F0F8',
                  margin: '0 0 10px',
                  lineHeight: 1,
                }}>
                  STAT ALLOCATION
                </h1>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: 'rgba(240,240,248,0.38)',
                  margin: 0,
                  maxWidth: 460,
                  lineHeight: 1.55,
                }}>
                  Spend the points you've earned. Allocations are permanent — choose based on your class and playstyle.
                </p>
              </motion.section>

              {/* B — Identity block */}
              <motion.section
                variants={fadeUp}
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <Badge
                    label={FACTION_LABEL[user.faction] ?? user.faction}
                    color={factionColor}
                    bg={`rgba(${hexRgb(factionColor)},0.12)`}
                    border={`rgba(${hexRgb(factionColor)},0.38)`}
                  />
                  <Badge
                    label={CLASS_LABEL[user.class] ?? user.class}
                    color="#C9A961"
                    bg="rgba(201,169,97,0.1)"
                    border="rgba(201,169,97,0.32)"
                  />
                  {user.alignment && (
                    <Badge
                      label={user.alignment === 'coalition' ? 'Coalition' : 'Compact'}
                      color={user.alignment === 'coalition' ? '#A78BFA' : '#FB923C'}
                      bg={user.alignment === 'coalition' ? 'rgba(167,139,250,0.1)' : 'rgba(251,146,60,0.1)'}
                      border={user.alignment === 'coalition' ? 'rgba(167,139,250,0.32)' : 'rgba(251,146,60,0.32)'}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 24,
                    letterSpacing: '0.06em',
                    color: '#F0F0F8',
                    lineHeight: 1,
                  }}>
                    {user.username}
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: VIOLET,
                    textTransform: 'uppercase',
                  }}>
                    Lv {stats.level}
                  </span>
                </div>
                {/* Compact XP bar */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                  }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(240,240,248,0.28)',
                    }}>
                      XP
                    </span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      color: 'rgba(240,240,248,0.38)',
                    }}>
                      {xpPct}% to level {stats.level + 1}
                    </span>
                  </div>
                  <div style={{
                    height: 4,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${xpPct}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, #7C3AED, #A78BFA)`,
                      borderRadius: 2,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              </motion.section>

              {/* B.5 — Power Rating tile */}
              {equipBonuses && (
                <motion.section
                  variants={fadeUp}
                  style={{
                    background: 'rgba(201,169,97,0.05)',
                    border: '1px solid rgba(201,169,97,0.18)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(201,169,97,0.65)',
                      marginBottom: 5,
                    }}>
                      POWER RATING
                    </p>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 40,
                      letterSpacing: '0.04em',
                      color: '#C9A961',
                      lineHeight: 1,
                    }}>
                      {calcPwr(stats, equipBonuses)}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(240,240,248,0.2)',
                    maxWidth: 200,
                    textAlign: 'right',
                    lineHeight: 1.6,
                  }}>
                    ATK + DEF<br />+ Equipment<br />+ Level × 2
                  </div>
                </motion.section>
              )}

              {/* C — Available points counter */}
              <motion.section
                variants={fadeUp}
                style={{
                  background: stats.stat_points > 0
                    ? 'rgba(139,92,246,0.08)'
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${stats.stat_points > 0 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <p style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: stats.stat_points > 0 ? `rgba(167,139,250,0.65)` : 'rgba(240,240,248,0.25)',
                    marginBottom: 6,
                  }}>
                    POINTS AVAILABLE
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 40,
                      letterSpacing: '0.04em',
                      color: stats.stat_points > 0 ? '#A78BFA' : 'rgba(240,240,248,0.2)',
                      lineHeight: 1,
                    }}>
                      {stats.stat_points}
                    </span>
                    {totalPending > 0 && (
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        color: 'rgba(167,139,250,0.55)',
                      }}>
                        − {totalPending} pending
                      </span>
                    )}
                  </div>
                </div>
                {stats.stat_points === 0 && (
                  <p style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: 'rgba(240,240,248,0.22)',
                    textTransform: 'uppercase',
                    maxWidth: 220,
                    textAlign: 'right',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    Complete quests and level up to earn more points
                  </p>
                )}
              </motion.section>

              {/* D — Allocation form */}
              <motion.section variants={fadeUp} style={{ marginBottom: 16 }}>
                <div
                  className="pw-alloc-grid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}
                >
                  <StatAllocCard
                    label="Attack"
                    desc="Increases damage dealt in combat. Slayers get +1 per level."
                    color={ATTACK_COLOR}
                    current={stats.attack}
                    pending={pendingAttack}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingAttack(p => p + 1)}
                    onDecrement={() => setPendingAttack(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Defense"
                    desc="Reduces damage taken in combat. Wardens get +1 per level."
                    color={DEFENSE_COLOR}
                    current={stats.defense}
                    pending={pendingDefense}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingDefense(p => p + 1)}
                    onDecrement={() => setPendingDefense(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Agility"
                    desc="Increases dodge and counter-attack chance. Aesir start with +2."
                    color={AGILITY_COLOR}
                    current={stats.agility || 0}
                    pending={pendingAgility}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingAgility(p => p + 1)}
                    onDecrement={() => setPendingAgility(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Energy Max"
                    desc="Sets your maximum energy for quests. Oracles get +1 per level."
                    color={ENERGY_COLOR}
                    current={stats.energy_max}
                    pending={pendingEnergyMax}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingEnergyMax(p => p + 1)}
                    onDecrement={() => setPendingEnergyMax(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Health Max"
                    desc="Sets your maximum health for combat. Restored on level-up."
                    color={HEALTH_COLOR}
                    current={stats.health_max}
                    pending={pendingHealthMax}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingHealthMax(p => p + 1)}
                    onDecrement={() => setPendingHealthMax(p => Math.max(0, p - 1))}
                  />
                </div>
              </motion.section>

              {/* E — Summary row (only when something is pending) */}
              <AnimatePresence>
                {totalPending > 0 && (
                  <motion.section
                    key="summary"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px 16px',
                      alignItems: 'center',
                    }}>
                      {pendingAttack > 0 && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 11,
                          color: ATTACK_COLOR,
                          letterSpacing: '0.06em',
                        }}>
                          +{pendingAttack} Attack
                        </span>
                      )}
                      {pendingDefense > 0 && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 11,
                          color: DEFENSE_COLOR,
                          letterSpacing: '0.06em',
                        }}>
                          +{pendingDefense} Defense
                        </span>
                      )}
                      {pendingAgility > 0 && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 11,
                          color: AGILITY_COLOR,
                          letterSpacing: '0.06em',
                        }}>
                          +{pendingAgility} Agility
                        </span>
                      )}
                      {pendingEnergyMax > 0 && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 11,
                          color: ENERGY_COLOR,
                          letterSpacing: '0.06em',
                        }}>
                          +{pendingEnergyMax} Energy Max
                        </span>
                      )}
                      {pendingHealthMax > 0 && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 11,
                          color: HEALTH_COLOR,
                          letterSpacing: '0.06em',
                        }}>
                          +{pendingHealthMax} Health Max
                        </span>
                      )}
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        color: 'rgba(240,240,248,0.28)',
                        letterSpacing: '0.06em',
                        marginLeft: 'auto',
                      }}>
                        {availablePoints} point{availablePoints !== 1 ? 's' : ''} remaining
                      </span>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* F — Action buttons */}
              <motion.section variants={fadeUp} style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleAllocate}
                  disabled={totalPending === 0 || isSubmitting}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: totalPending === 0 || isSubmitting
                      ? 'rgba(201,169,97,0.22)'
                      : 'linear-gradient(135deg, #C9A961 0%, #A07840 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 20,
                    letterSpacing: '0.1em',
                    color: totalPending === 0 || isSubmitting ? 'rgba(7,7,13,0.35)' : '#07070D',
                    cursor: totalPending === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'opacity 150ms',
                  }}
                >
                  {isSubmitting ? 'ALLOCATING...' : 'CONFIRM ALLOCATION'}
                </button>
                {totalPending > 0 && (
                  <button
                    onClick={() => { setPendingAttack(0); setPendingDefense(0); setPendingAgility(0); setPendingEnergyMax(0); setPendingHealthMax(0) }}
                    disabled={isSubmitting}
                    style={{
                      padding: '14px 18px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(240,240,248,0.38)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'border-color 150ms, color 150ms',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!isSubmitting) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'
                        e.currentTarget.style.color = 'rgba(240,240,248,0.7)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.color = 'rgba(240,240,248,0.38)'
                    }}
                  >
                    RESET
                  </button>
                )}
              </motion.section>

              {/* F.5 — Free stat reset offer */}
              {stats.stat_reset_available && (
                <motion.section
                  variants={fadeUp}
                  style={{
                    marginTop: 20,
                    background: 'rgba(248,113,113,0.05)',
                    border: '1px solid rgba(248,113,113,0.25)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(248,113,113,0.6)',
                      marginBottom: 5,
                    }}>
                      ONE-TIME OFFER
                    </div>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 18,
                      letterSpacing: '0.07em',
                      color: '#F87171',
                      lineHeight: 1,
                      marginBottom: 4,
                    }}>
                      FREE STAT RESET AVAILABLE
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      color: 'rgba(240,240,248,0.35)',
                      lineHeight: 1.45,
                    }}>
                      Reverts all stats to baseline and refunds every spent point. Cannot be undone.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowResetModal(true)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.4)',
                      borderRadius: 8,
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 16,
                      letterSpacing: '0.1em',
                      color: '#F87171',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)' }}
                  >
                    RESET STATS
                  </button>
                </motion.section>
              )}

              {/* G — Your Bonuses section */}
              <motion.section variants={fadeUp} style={{ marginTop: 32 }}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.3)',
                  marginBottom: 14,
                }}>
                  // YOUR BONUSES
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}>
                  {/* Faction bonuses */}
                  <div style={{
                    background: `rgba(${hexRgb(factionColor)},0.05)`,
                    border: `1px solid rgba(${hexRgb(factionColor)},0.18)`,
                    borderRadius: 12,
                    padding: '16px 18px',
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: factionColor,
                      opacity: 0.7,
                      marginBottom: 12,
                    }}>
                      FACTION BONUSES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {user.faction === 'olympians' && (<>
                        <BonusLine icon="⚡" text="+10% XP from quests" color={factionColor} />
                        <BonusLine icon="⚡" text="+10% XP from adventures" color={factionColor} />
                      </>)}
                      {user.faction === 'aesir' && (<>
                        <BonusLine icon="⚡" text="+2 starting agility" color={factionColor} />
                        <BonusLine icon="⚡" text="+5% ATK in PvP" color={factionColor} />
                      </>)}
                      {user.faction === 'annunaki' && (
                        <BonusLine icon="⚡" text="+5% temple income" color={factionColor} />
                      )}
                    </div>
                  </div>

                  {/* Class bonuses */}
                  <div style={{
                    background: 'rgba(201,169,97,0.05)',
                    border: '1px solid rgba(201,169,97,0.18)',
                    borderRadius: 12,
                    padding: '16px 18px',
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#C9A961',
                      opacity: 0.7,
                      marginBottom: 12,
                    }}>
                      CLASS BONUSES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {user.class === 'warden' && (<>
                        <BonusLine icon="🛡" text="+5 starting defense" color="#C9A961" />
                        <BonusLine icon="🛡" text="+1 DEF per level" color="#C9A961" />
                        <BonusLine icon="🛡" text="+10% DEF in PvP" color="#C9A961" />
                      </>)}
                      {user.class === 'oracle' && (<>
                        <BonusLine icon="🔮" text="+5 starting energy max" color="#C9A961" />
                        <BonusLine icon="🔮" text="+1 energy max per level" color="#C9A961" />
                      </>)}
                      {user.class === 'slayer' && (<>
                        <BonusLine icon="⚔" text="+5 starting attack" color="#C9A961" />
                        <BonusLine icon="⚔" text="+1 ATK per level" color="#C9A961" />
                        <BonusLine icon="⚔" text="+10% ATK in PvP" color="#C9A961" />
                      </>)}
                      {user.class === 'broker' && (<>
                        <BonusLine icon="💰" text="+250 starting drachma" color="#C9A961" />
                        <BonusLine icon="💰" text="-10% drachma shop prices" color="#C9A961" />
                        <BonusLine icon="💰" text="+20% temple income" color="#C9A961" />
                      </>)}
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* H — Alignment section */}
              <motion.section variants={fadeUp} style={{ marginTop: 32, marginBottom: 32 }}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.3)',
                  marginBottom: 14,
                }}>
                  // ALIGNMENT
                </p>

                {/* Already aligned */}
                {user.alignment && (
                  <div style={{
                    background: user.alignment === 'coalition'
                      ? 'rgba(167,139,250,0.06)' : 'rgba(251,146,60,0.06)',
                    border: `1px solid ${user.alignment === 'coalition'
                      ? 'rgba(167,139,250,0.25)' : 'rgba(251,146,60,0.25)'}`,
                    borderRadius: 12,
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>
                      {user.alignment === 'coalition' ? '⚜' : '⚡'}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 20,
                        letterSpacing: '0.08em',
                        color: user.alignment === 'coalition' ? COALITION_COLOR : COMPACT_COLOR,
                        lineHeight: 1,
                        marginBottom: 4,
                      }}>
                        {user.alignment === 'coalition' ? 'PANTHEON COALITION' : 'MORTAL COMPACT'}
                      </div>
                      <div style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        color: 'rgba(240,240,248,0.3)',
                      }}>
                        Alignment is permanent
                      </div>
                    </div>
                  </div>
                )}

                {/* Level too low */}
                {!user.alignment && stats.level < 10 && (
                  <div style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 22, lineHeight: 1, opacity: 0.3 }}>⚔</span>
                    <div>
                      <div style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(240,240,248,0.3)',
                        marginBottom: 4,
                      }}>
                        Alignment unlocked at Level 10
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        color: 'rgba(240,240,248,0.22)',
                      }}>
                        You are level {stats.level} — {10 - stats.level} more level{10 - stats.level !== 1 ? 's' : ''} to go.
                      </div>
                    </div>
                  </div>
                )}

                {/* Chooser — level >= 10 and not yet aligned */}
                {!user.alignment && stats.level >= 10 && (
                  <AlignmentChooser onChoose={handleChooseAlignment} isChoosing={isChoosing} />
                )}
              </motion.section>

            </motion.div>
          )}
      </PWPageShell>
    </>
  )
}

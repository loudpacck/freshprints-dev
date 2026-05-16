import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWHubLink from '@/components/games/pantheon-wars/PWHubLink'

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#F5C542', aesir: '#78C5F0', annunaki: '#CF4444' }
const FACTION_LABEL = { olympians: 'Olympians', aesir: 'Aesir', annunaki: 'Annunaki' }
const CLASS_LABEL   = { warden: 'Warden', oracle: 'Oracle', slayer: 'Slayer', broker: 'Broker' }

const ATTACK_COLOR     = '#F97316'
const DEFENSE_COLOR    = '#22C55E'
const ENERGY_COLOR     = '#00C8FF'
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

function StatAllocCard({ label, color, current, pending, onIncrement, onDecrement, canAdd, style }) {
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
      {/* Stat label */}
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
  const { user, stats: ctxStats, loading, refresh } = usePantheonWars()
  const navigate = useNavigate()

  // Local stats so we can update instantly on allocation success
  const [displayStats, setDisplayStats] = useState(null)
  useEffect(() => { if (ctxStats) setDisplayStats(ctxStats) }, [ctxStats])

  const [pendingAttack,     setPendingAttack]     = useState(0)
  const [pendingDefense,    setPendingDefense]    = useState(0)
  const [pendingEnergyMax,  setPendingEnergyMax]  = useState(0)
  const [pendingHealthMax,  setPendingHealthMax]  = useState(0)
  const [isSubmitting,      setIsSubmitting]      = useState(false)
  const [isChoosing,        setIsChoosing]        = useState(false)
  const [toast,             setToast]             = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [loading, user, navigate])

  const stats = displayStats
  const availablePoints = stats ? stats.stat_points - pendingAttack - pendingDefense - pendingEnergyMax - pendingHealthMax : 0
  const totalPending    = pendingAttack + pendingDefense + pendingEnergyMax + pendingHealthMax
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
        energy_max:  data.newStats.energy_max,
        health_max:  data.newStats.health_max,
        energy:      data.newStats.energy,
        health:      data.newStats.health,
        stat_points: data.newStats.stat_points,
      }))
      setToast({
        type: 'success',
        attack:     pendingAttack,
        defense:    pendingDefense,
        energy_max: pendingEnergyMax,
        health_max: pendingHealthMax,
      })
      setPendingAttack(0)
      setPendingDefense(0)
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

  const factionColor = user ? (FACTION_COLOR[user.faction] ?? '#F0F0F8') : '#F0F0F8'
  const xpMax = stats ? xpNeeded(stats.level) : 100
  const xpPct = stats ? Math.min(100, Math.round((stats.xp / xpMax) * 100)) : 0

  return (
    <>
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          background: '#07070D',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.09) 0%, transparent 55%)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
          color: '#F0F0F8',
        }}
      >
        {/* ── Sticky Header ──────────────────────────────────────────── */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 20px',
          background: 'rgba(7,7,13,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>⚔</span>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              letterSpacing: '0.1em',
              color: '#F0F0F8',
            }}>
              PANTHEON WARS
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.3)',
              marginLeft: 4,
            }}>
              / PROFILE
            </span>
          </div>
          <PWBackButton />
        </header>

        <PWHubLink />

        {/* ── Main ───────────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '28px 20px 72px',
        }}>

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
                    color="#00C8FF"
                    bg="rgba(0,200,255,0.1)"
                    border="rgba(0,200,255,0.32)"
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
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}
                >
                  <StatAllocCard
                    label="Attack"
                    color={ATTACK_COLOR}
                    current={stats.attack}
                    pending={pendingAttack}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingAttack(p => p + 1)}
                    onDecrement={() => setPendingAttack(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Defense"
                    color={DEFENSE_COLOR}
                    current={stats.defense}
                    pending={pendingDefense}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingDefense(p => p + 1)}
                    onDecrement={() => setPendingDefense(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Energy Max"
                    color={ENERGY_COLOR}
                    current={stats.energy_max}
                    pending={pendingEnergyMax}
                    canAdd={canAddMore}
                    onIncrement={() => setPendingEnergyMax(p => p + 1)}
                    onDecrement={() => setPendingEnergyMax(p => Math.max(0, p - 1))}
                  />
                  <StatAllocCard
                    label="Health Max"
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
                      ? 'rgba(245,197,66,0.22)'
                      : 'linear-gradient(135deg, #F5C542 0%, #E8943A 100%)',
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
                    onClick={() => { setPendingAttack(0); setPendingDefense(0); setPendingEnergyMax(0); setPendingHealthMax(0) }}
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

              {/* G — Alignment section */}
              <motion.section variants={fadeUp} style={{ marginTop: 32 }}>
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
                        { id: 'coalition', icon: '⚜', label: 'PANTHEON COALITION', color: COALITION_COLOR, border: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.1)' },
                        { id: 'compact',   icon: '⚡', label: 'MORTAL COMPACT',     color: COMPACT_COLOR,   border: 'rgba(251,146,60,0.3)',  bg: 'rgba(251,146,60,0.1)'  },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleChooseAlignment(opt.id)}
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
                )}
              </motion.section>

            </motion.div>
          )}
        </main>
      </motion.div>
    </>
  )
}

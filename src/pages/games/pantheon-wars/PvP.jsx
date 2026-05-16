import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWHubLink from '@/components/games/pantheon-wars/PWHubLink'

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#F5C542', aesir: '#78C5F0', annunaki: '#CF4444' }
const FACTION_LABEL = { olympians: 'Olympians', aesir: 'Aesir', annunaki: 'Annunaki' }
const CLASS_LABEL   = { warden: 'Warden', oracle: 'Oracle', slayer: 'Slayer', broker: 'Broker' }

const COALITION_COLOR = '#A78BFA'
const COMPACT_COLOR   = '#FB923C'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

function hexRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function alignmentLabel(alignment) {
  if (alignment === 'coalition') return 'Coalition'
  if (alignment === 'compact')   return 'Compact'
  return 'Unaligned'
}

function alignmentColor(alignment) {
  if (alignment === 'coalition') return COALITION_COLOR
  if (alignment === 'compact')   return COMPACT_COLOR
  return 'rgba(240,240,248,0.3)'
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

function MiniHealthBar({ current, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4,
      }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)' }}>
          HP
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.55)' }}>
          {current} / {max}
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ─── Alignment Gate ───────────────────────────────────────────────────────────

function AlignmentGate({ onChoose, isSubmitting }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'rgba(240,240,248,0.3)',
        marginBottom: 12,
      }}>
        // CHOOSE YOUR ALIGNMENT
      </p>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(30px, 8vw, 48px)',
        letterSpacing: '0.07em',
        color: '#F0F0F8',
        margin: '0 0 8px',
        lineHeight: 1,
      }}>
        PLEDGE YOUR LOYALTY
      </h2>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: 'rgba(240,240,248,0.38)',
        marginBottom: 28,
        lineHeight: 1.55,
      }}>
        This decision is permanent. Your alignment determines who you can fight and which quest chains you unlock at higher tiers.
      </p>

      <div className="pw-align-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Coalition card */}
        <div style={{
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.25)',
          borderRadius: 14,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>⚜</div>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22,
              letterSpacing: '0.08em',
              color: COALITION_COLOR,
              marginBottom: 6,
            }}>
              PANTHEON COALITION
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(240,240,248,0.45)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              The divine order. Loyalists who uphold the ancient compact between gods and mortals. Disciplined, structured, and relentless.
            </p>
          </div>
          <button
            onClick={() => onChoose('coalition')}
            disabled={isSubmitting}
            style={{
              marginTop: 'auto',
              padding: '12px 0',
              background: isSubmitting ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.18)',
              border: '1px solid rgba(167,139,250,0.45)',
              borderRadius: 8,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 16,
              letterSpacing: '0.1em',
              color: isSubmitting ? 'rgba(167,139,250,0.4)' : COALITION_COLOR,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'rgba(167,139,250,0.28)' }}
            onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'rgba(167,139,250,0.18)' }}
          >
            PLEDGE COALITION
          </button>
        </div>

        {/* Compact card */}
        <div style={{
          background: 'rgba(251,146,60,0.06)',
          border: '1px solid rgba(251,146,60,0.25)',
          borderRadius: 14,
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ fontSize: 28, lineHeight: 1 }}>⚡</div>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 22,
              letterSpacing: '0.08em',
              color: COMPACT_COLOR,
              marginBottom: 6,
            }}>
              MORTAL COMPACT
            </div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(240,240,248,0.45)',
              lineHeight: 1.5,
              margin: 0,
            }}>
              The rebellion. Mortals who reject divine authority and seize power for themselves. Unpredictable, ruthless, and hungry for glory.
            </p>
          </div>
          <button
            onClick={() => onChoose('compact')}
            disabled={isSubmitting}
            style={{
              marginTop: 'auto',
              padding: '12px 0',
              background: isSubmitting ? 'rgba(251,146,60,0.15)' : 'rgba(251,146,60,0.18)',
              border: '1px solid rgba(251,146,60,0.45)',
              borderRadius: 8,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 16,
              letterSpacing: '0.1em',
              color: isSubmitting ? 'rgba(251,146,60,0.4)' : COMPACT_COLOR,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = 'rgba(251,146,60,0.28)' }}
            onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = 'rgba(251,146,60,0.18)' }}
          >
            PLEDGE COMPACT
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Target Card ──────────────────────────────────────────────────────────────

function PowerBadge({ targetPower, myPower }) {
  if (!targetPower || !myPower) return null
  const ratio = targetPower / myPower
  const color = ratio > 1.1 ? '#EF4444' : ratio < (1 / 1.1) ? '#22C55E' : 'rgba(240,240,248,0.45)'
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color,
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${color === 'rgba(240,240,248,0.45)' ? 'rgba(255,255,255,0.12)' : color.replace(')', ', 0.3)')}`,
      borderRadius: 4,
      padding: '2px 7px',
      whiteSpace: 'nowrap',
    }}>
      PWR {targetPower}
    </span>
  )
}

function TargetCard({ target, onAttack, isAttacking, myPowerRating }) {
  const factionColor = FACTION_COLOR[target.faction] ?? '#F0F0F8'
  const aColor = alignmentColor(target.alignment)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            letterSpacing: '0.06em',
            color: '#F0F0F8',
            lineHeight: 1,
            marginBottom: 5,
          }}>
            {target.username}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Badge
              label={FACTION_LABEL[target.faction] ?? target.faction}
              color={factionColor}
              bg={`rgba(${hexRgb(factionColor)},0.1)`}
              border={`rgba(${hexRgb(factionColor)},0.3)`}
            />
            <Badge
              label={CLASS_LABEL[target.class] ?? target.class}
              color="#00C8FF"
              bg="rgba(0,200,255,0.08)"
              border="rgba(0,200,255,0.25)"
            />
            <Badge
              label={alignmentLabel(target.alignment)}
              color={aColor}
              bg={`rgba(${hexRgb(aColor === 'rgba(240,240,248,0.3)' ? '#F0F0F8' : aColor)},0.08)`}
              border={`rgba(${hexRgb(aColor === 'rgba(240,240,248,0.3)' ? '#F0F0F8' : aColor)},0.25)`}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginTop: 2 }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            color: '#8B5CF6',
            whiteSpace: 'nowrap',
          }}>
            LVL {target.level}
          </span>
          <PowerBadge targetPower={target.power_rating} myPower={myPowerRating} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <MiniHealthBar current={target.health} max={target.health_max} color="#EF4444" />
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: 'rgba(240,240,248,0.45)',
          whiteSpace: 'nowrap',
        }}>
          ✦ {fmt(target.glory)} Glory
        </div>
      </div>

      {/* Attack button */}
      <button
        onClick={() => onAttack(target.user_id)}
        disabled={isAttacking}
        style={{
          width: '100%',
          padding: '10px 0',
          background: isAttacking
            ? 'rgba(239,68,68,0.1)'
            : 'linear-gradient(135deg, #EF4444, #DC2626)',
          border: 'none',
          borderRadius: 8,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 15,
          letterSpacing: '0.1em',
          color: isAttacking ? 'rgba(240,240,248,0.35)' : '#F0F0F8',
          cursor: isAttacking ? 'not-allowed' : 'pointer',
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => { if (!isAttacking) e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        {isAttacking ? 'ATTACKING...' : '⚔ ATTACK'}
      </button>
    </motion.div>
  )
}

// ─── Combat Modal ─────────────────────────────────────────────────────────────

function CombatModal({ result, onClose }) {
  const isWin = result.result === 'win'
  const titleColor = isWin ? '#22C55E' : '#EF4444'
  const borderColor = isWin ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(7,7,13,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#07070D',
          border: `1px solid ${borderColor}`,
          borderRadius: 16,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 'min(420px, 95vw)',
          boxShadow: `0 0 60px rgba(${isWin ? '34,197,94' : '239,68,68'},0.12)`,
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{isWin ? '⚔' : '🛡'}</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 40,
            letterSpacing: '0.1em',
            color: titleColor,
            lineHeight: 1,
          }}>
            {isWin ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(240,240,248,0.35)',
            marginTop: 6,
          }}>
            vs {result.defender.username}
          </div>
        </div>

        {/* Power comparison */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>
              YOUR POWER
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.06em', color: '#F97316', lineHeight: 1 }}>
              {result.attacker_power}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>
              THEIR POWER
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.06em', color: '#22C55E', lineHeight: 1 }}>
              {result.defender_power}
            </div>
          </div>
        </div>

        {/* Rewards/losses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {isWin && result.xp_earned > 0 && (
            <ResultRow label="XP EARNED" value={`+${fmt(result.xp_earned)}`} color="#8B5CF6" />
          )}
          {isWin && result.drachma_transferred > 0 && (
            <ResultRow label="DRACHMA RAIDED" value={`+₯${fmt(result.drachma_transferred)}`} color="#F5C542" />
          )}
          {isWin && result.glory_earned > 0 && (
            <ResultRow label="GLORY EARNED" value={`+${result.glory_earned}`} color="#FBBF24" />
          )}
          <ResultRow
            label="YOUR HP LOST"
            value={`-${result.attacker_health_lost}`}
            color="#EF4444"
          />
          {isWin && result.defender_health_lost > 0 && (
            <ResultRow
              label="THEIR HP LOST"
              value={`-${result.defender_health_lost}`}
              color="rgba(240,240,248,0.4)"
            />
          )}
        </div>

        {/* Level up callout */}
        {result.levelsGained > 0 && (
          <div style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#A78BFA',
            }}>
              ⬆ LEVEL UP × {result.levelsGained}!
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 0',
              background: isWin ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${isWin ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 8,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 15,
              letterSpacing: '0.1em',
              color: isWin ? '#22C55E' : '#F87171',
              cursor: 'pointer',
            }}
          >
            ATTACK AGAIN
          </button>
          <Link
            to="/games/pantheon-wars/pvp/log"
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 15,
              letterSpacing: '0.1em',
              color: 'rgba(240,240,248,0.45)',
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            VIEW LOG
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ResultRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(240,240,248,0.35)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 12,
        color,
        fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function PvPToast({ toast, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const isError = toast.type === 'error'
  const isAlignment = toast.type === 'alignment'
  const color = isError ? '#F87171' : isAlignment ? COALITION_COLOR : '#22C55E'
  const border = isError ? 'rgba(248,113,113,0.4)' : isAlignment ? 'rgba(167,139,250,0.4)' : 'rgba(34,197,94,0.4)'

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 88px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'rgba(7,7,13,0.93)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: '11px 20px',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color }}>
        {toast.message}
      </span>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function PvP() {
  const { user, stats: ctxStats, loading, refresh } = usePantheonWars()
  const navigate = useNavigate()

  const [targetsData,      setTargetsData]      = useState(null)
  const [isLoadingTargets, setIsLoadingTargets] = useState(true)
  const [attacking,        setAttacking]        = useState(null)
  const [combatResult,     setCombatResult]     = useState(null)
  const [isChoosing,       setIsChoosing]       = useState(false)
  const [toast,            setToast]            = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [loading, user, navigate])

  const fetchTargets = useCallback(async () => {
    if (!user) return
    setIsLoadingTargets(true)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=pvp_targets')
      if (!res.ok) return
      const data = await res.json()
      setTargetsData(data)
    } catch {
      // silent
    } finally {
      setIsLoadingTargets(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading && user) fetchTargets()
  }, [loading, user, fetchTargets])

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
      const label = alignment === 'coalition' ? 'PANTHEON COALITION' : 'MORTAL COMPACT'
      setToast({ type: 'alignment', message: `ALIGNMENT PLEDGED — ${label}` })
      refresh()
      fetchTargets()
    } catch {
      setToast({ type: 'error', message: 'Network error. Try again.' })
    } finally {
      setIsChoosing(false)
    }
  }

  async function handleAttack(targetUserId) {
    if (attacking) return
    setAttacking(targetUserId)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=pvp_attack', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ target_user_id: targetUserId }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msgs = {
          attacker_no_health:      'You have no health remaining. Wait for it to regenerate.',
          defender_no_health:      'Target has no health. Pick another target.',
          cooldown:                `Cooldown active — wait ${data.seconds_remaining}s before attacking this player again.`,
          requires_alignment:      'You must choose your alignment before attacking.',
          invalid_alignment_matchup: 'Invalid target — check alignment rules.',
          level_out_of_range:      'Target is out of your level range (±10).',
        }
        setToast({ type: 'error', message: msgs[data.error] || data.error || 'Attack failed.' })
        return
      }
      setCombatResult(data)
      refresh()
      fetchTargets()
    } catch {
      setToast({ type: 'error', message: 'Network error. Try again.' })
    } finally {
      setAttacking(null)
    }
  }

  const localStats = targetsData?.stats ?? ctxStats
  const factionColor = user ? (FACTION_COLOR[user.faction] ?? '#F0F0F8') : '#F0F0F8'

  return (
    <>
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }
        @media (max-width: 480px) {
          .pw-align-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && <PvPToast toast={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Combat modal */}
      <AnimatePresence>
        {combatResult && (
          <CombatModal result={combatResult} onClose={() => setCombatResult(null)} />
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
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.07) 0%, transparent 55%)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
          color: '#F0F0F8',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 20px',
          background: 'rgba(7,7,13,0.9)',
          backdropFilter: 'blur(12px)',
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
              / ARENA
            </span>
          </div>
          <PWBackButton />
        </header>

        <PWHubLink />

        {/* ── Main ────────────────────────────────────────────────── */}
        <main style={{ flex: 1, width: '100%', maxWidth: 640, margin: '0 auto', padding: '28px 20px 72px' }}>

          {/* Loading skeleton */}
          {(loading || (isLoadingTargets && !targetsData)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton h={12} w={120} />
              <Skeleton h={40} w={200} />
              <Skeleton h={80} />
              <Skeleton h={100} />
              <Skeleton h={100} />
            </div>
          )}

          {/* Content */}
          {!loading && user && localStats && (
            <>
              {/* Alignment gate */}
              {targetsData?.requires_alignment && !isLoadingTargets && (
                <AlignmentGate onChoose={handleChooseAlignment} isSubmitting={isChoosing} />
              )}

              {/* Arena */}
              {targetsData && !targetsData.requires_alignment && (
                <motion.div variants={stagger} initial="hidden" animate="visible">

                  {/* Player vitals card */}
                  <motion.section
                    variants={fadeUp}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '16px 18px',
                      marginBottom: 24,
                    }}
                  >
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: 'rgba(240,240,248,0.28)', marginBottom: 10,
                    }}>
                      // YOUR STATUS
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      <Badge
                        label={FACTION_LABEL[user.faction] ?? user.faction}
                        color={factionColor}
                        bg={`rgba(${hexRgb(factionColor)},0.12)`}
                        border={`rgba(${hexRgb(factionColor)},0.35)`}
                      />
                      {user.alignment && (
                        <Badge
                          label={alignmentLabel(user.alignment)}
                          color={alignmentColor(user.alignment)}
                          bg={`rgba(${hexRgb(user.alignment === 'coalition' ? COALITION_COLOR : COMPACT_COLOR)},0.1)`}
                          border={`rgba(${hexRgb(user.alignment === 'coalition' ? COALITION_COLOR : COMPACT_COLOR)},0.3)`}
                        />
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'center' }}>
                      <MiniHealthBar current={localStats.health} max={localStats.health_max} color="#EF4444" />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'rgba(240,240,248,0.3)', marginBottom: 3,
                        }}>
                          Glory
                        </div>
                        <div style={{
                          fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
                          letterSpacing: '0.04em', color: '#FBBF24', lineHeight: 1,
                        }}>
                          {fmt(localStats.glory)}
                        </div>
                      </div>
                    </div>
                    {localStats.health <= 0 && (
                      <p style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: '#F87171', marginTop: 10, marginBottom: 0,
                      }}>
                        ⚠ No health — you cannot attack. Regenerates 1 HP every 3 minutes.
                      </p>
                    )}
                  </motion.section>

                  {/* Targets section */}
                  <motion.section variants={fadeUp}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 14,
                    }}>
                      <p style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                        letterSpacing: '0.13em', textTransform: 'uppercase',
                        color: 'rgba(240,240,248,0.28)', margin: 0,
                      }}>
                        // POTENTIAL TARGETS
                      </p>
                      <button
                        onClick={fetchTargets}
                        disabled={isLoadingTargets}
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'rgba(240,240,248,0.35)', background: 'none',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                          padding: '4px 10px', cursor: 'pointer',
                          transition: 'border-color 120ms, color 120ms',
                          opacity: isLoadingTargets ? 0.4 : 1,
                        }}
                        onMouseEnter={e => { if (!isLoadingTargets) { e.currentTarget.style.color = 'rgba(240,240,248,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' } }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      >
                        ↻ REFRESH
                      </button>
                    </div>

                    {isLoadingTargets && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Skeleton h={120} />
                        <Skeleton h={120} />
                      </div>
                    )}

                    {!isLoadingTargets && targetsData.targets.length === 0 && (
                      <div style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12,
                        padding: '36px 20px',
                        textAlign: 'center',
                      }}>
                        <p style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'rgba(240,240,248,0.28)', margin: '0 0 8px',
                        }}>
                          // NO TARGETS FOUND
                        </p>
                        <p style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                          color: 'rgba(240,240,248,0.35)', margin: 0, lineHeight: 1.55,
                        }}>
                          {user.alignment
                            ? 'No attackable players within ±10 levels and the correct alignment. Check back as more players join.'
                            : 'No low-level targets available right now. Choose your alignment at level 10 to unlock the full target pool.'}
                        </p>
                      </div>
                    )}

                    {!isLoadingTargets && targetsData.targets.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {targetsData.targets.map(target => (
                          <TargetCard
                            key={target.user_id}
                            target={target}
                            onAttack={handleAttack}
                            isAttacking={attacking === target.user_id}
                            myPowerRating={targetsData.my_power_rating}
                          />
                        ))}
                      </div>
                    )}
                  </motion.section>

                  {/* Combat log link */}
                  {!isLoadingTargets && (
                    <motion.div variants={fadeUp} style={{ marginTop: 28 }}>
                      <Link
                        to="/games/pantheon-wars/pvp/log"
                        style={{
                          display: 'block', textAlign: 'center',
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          color: 'rgba(240,240,248,0.28)', textDecoration: 'none',
                          transition: 'color 150ms',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.6)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.28)' }}
                      >
                        View Combat History →
                      </Link>
                    </motion.div>
                  )}

                </motion.div>
              )}
            </>
          )}
        </main>
      </motion.div>
    </>
  )
}

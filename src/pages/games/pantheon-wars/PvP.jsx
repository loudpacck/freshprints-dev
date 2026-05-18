import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  useEffect(() => {
    musicManager.play('/sounds/pantheon_wars/alignmentChoose.mp3', { volume: 0.3 })
    return () => musicManager.stop()
  }, [])

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
            onClick={() => { musicManager.stop(); onChoose('coalition') }}
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
            onClick={() => { musicManager.stop(); onChoose('compact') }}
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

function TargetCard({ target, onAttack, isAttacking, myPowerRating, myStats }) {
  const factionColor = FACTION_COLOR[target.faction] ?? '#F0F0F8'
  const aColor = alignmentColor(target.alignment)

  const energyCost   = myStats ? Math.max(1, Math.ceil(myStats.level / 10)) : 1
  const noEnergy     = myStats && myStats.energy < energyCost
  const tooInjured   = myStats && myStats.health <= 1
  const btnDisabled  = isAttacking || noEnergy || tooInjured

  const btnLabel = isAttacking
    ? 'ATTACKING...'
    : noEnergy
      ? `NOT ENOUGH ENERGY (need ${energyCost}⚡)`
      : tooInjured
        ? 'TOO INJURED — HEAL FIRST'
        : `⚔ ATTACK (${energyCost}⚡)`

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
              color="#C9A961"
              bg="rgba(201,169,97,0.08)"
              border="rgba(201,169,97,0.25)"
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
        onClick={() => !btnDisabled && onAttack(target.user_id)}
        disabled={btnDisabled}
        style={{
          width: '100%',
          padding: '10px 0',
          background: btnDisabled
            ? 'rgba(239,68,68,0.07)'
            : 'linear-gradient(135deg, #EF4444, #DC2626)',
          border: btnDisabled ? '1px solid rgba(239,68,68,0.15)' : 'none',
          borderRadius: 8,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 14,
          letterSpacing: '0.08em',
          color: btnDisabled ? 'rgba(240,240,248,0.28)' : '#F0F0F8',
          cursor: btnDisabled ? 'not-allowed' : 'pointer',
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => { if (!btnDisabled) e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        {btnLabel}
      </button>
    </motion.div>
  )
}

// ─── Combat Modal ─────────────────────────────────────────────────────────────

const ROUND_TICK = 1500 // ms per round

function getCallout(round) {
  const a = round.attacker_action
  const d = round.defender_action
  if (a?.type === 'crit')   return { text: 'CRIT!',    color: '#F5D88B' }
  if (a?.type === 'miss')   return { text: 'MISS',     color: 'rgba(240,240,248,0.35)' }
  if (d?.type === 'counter') return { text: 'COUNTER!', color: '#EF4444' }
  if (d?.dodged)            return { text: 'DODGED',   color: '#4FD1C5' }
  if (d?.blocked)           return { text: 'BLOCKED',  color: '#8AB8D4' }
  if (d?.type === 'crit')   return { text: 'CRIT!',    color: '#F5D88B' }
  return null
}

function ResultRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

function CombatModal({ result, onClose, play }) {
  const rounds = Array.isArray(result.rounds) ? result.rounds : []
  const hasRounds = rounds.length > 0

  // Compute initial HP from final + total lost
  const finalAttHp = hasRounds ? rounds[rounds.length - 1].attacker_hp_after : 0
  const finalDefHp = hasRounds ? rounds[rounds.length - 1].defender_hp_after : 0
  const initAttHp  = finalAttHp + (result.attacker_health_lost || 0)
  const initDefHp  = finalDefHp + (result.defender_health_lost || 0)

  const [phase,    setPhase]    = useState(hasRounds ? 'animating' : 'result')
  const [roundIdx, setRoundIdx] = useState(0)
  const [attHp,    setAttHp]    = useState(initAttHp)
  const [defHp,    setDefHp]    = useState(initDefHp)
  const [callout,  setCallout]  = useState(null)
  const timerRef = useRef(null)

  // Advance rounds
  useEffect(() => {
    if (phase !== 'animating' || !hasRounds) return
    const r = rounds[roundIdx]
    setAttHp(r.attacker_hp_after)
    setDefHp(r.defender_hp_after)
    const c = getCallout(r)
    setCallout(c)
    // play crit sound
    if (c?.text === 'CRIT!') play('success')

    timerRef.current = setTimeout(() => {
      if (roundIdx < rounds.length - 1) {
        setRoundIdx(i => i + 1)
      } else {
        setPhase('result')
      }
    }, ROUND_TICK)

    return () => clearTimeout(timerRef.current)
  }, [phase, roundIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  function skipToResult() {
    clearTimeout(timerRef.current)
    setPhase('result')
  }

  const combatResult = result.result
  const isWin  = combatResult === 'win'
  const isDraw = combatResult === 'draw'
  const titleText  = isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'
  const titleColor = isWin ? '#5FB857' : isDraw ? '#C9A961' : '#B8443A'
  const borderColor = isWin ? 'rgba(95,184,87,0.6)' : isDraw ? 'rgba(201,169,97,0.5)' : 'rgba(184,68,58,0.6)'
  const glowColor   = isWin ? '0 0 24px rgba(95,184,87,0.35)' : isDraw ? '0 0 20px rgba(201,169,97,0.25)' : '0 0 24px rgba(184,68,58,0.35)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={phase === 'result' ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(10,7,16,0.9)',
        backdropFilter: 'blur(10px)',
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
          background: 'linear-gradient(180deg, #14101A 0%, #0A0710 100%)',
          border: `2px solid ${borderColor}`,
          borderRadius: 8,
          padding: '24px 22px',
          width: '100%',
          maxWidth: 'min(440px, 95vw)',
          boxShadow: `${glowColor}, 0 8px 48px rgba(0,0,0,0.7)`,
        }}
      >
        {/* ── ANIMATION PHASE ── */}
        {phase === 'animating' && (
          <>
            {/* Round indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(240,240,248,0.4)',
              }}>
                ROUND {roundIdx + 1} / {rounds.length}
              </span>
              <button
                onClick={skipToResult}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.35)', background: 'none',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
                  padding: '4px 10px', cursor: 'pointer',
                }}
              >
                SKIP →
              </button>
            </div>

            {/* Combatant labels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 3 }}>
                  YOU
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.04em', color: '#22C55E', lineHeight: 1 }}>
                  {attHp}
                </div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.06em', color: 'rgba(240,240,248,0.2)', textAlign: 'center' }}>
                VS
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 3 }}>
                  {result.defender.username}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.04em', color: '#EF4444', lineHeight: 1 }}>
                  {defHp}
                </div>
              </div>
            </div>

            {/* HP bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {/* Attacker bar */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${initAttHp > 0 ? Math.max(0, (attHp / initAttHp) * 100) : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #166534, #22C55E)',
                  borderRadius: 4,
                  transition: `width ${ROUND_TICK * 0.55}ms ease`,
                }} />
              </div>
              {/* Defender bar */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${initDefHp > 0 ? Math.max(0, (defHp / initDefHp) * 100) : 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #7f1d1d, #EF4444)',
                  borderRadius: 4,
                  transition: `width ${ROUND_TICK * 0.55}ms ease`,
                }} />
              </div>
            </div>

            {/* Callout */}
            <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {callout && (
                  <motion.span
                    key={`${roundIdx}-${callout.text}`}
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 28,
                      letterSpacing: '0.1em',
                      color: callout.color,
                      textShadow: `0 0 16px ${callout.color}`,
                    }}
                  >
                    {callout.text}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === 'result' && (
          <>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 44,
                letterSpacing: '0.1em',
                color: titleColor,
                lineHeight: 1,
                textShadow: `0 0 24px ${titleColor}`,
              }}>
                {titleText}
              </div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'rgba(240,240,248,0.35)', marginTop: 6,
              }}>
                vs {result.defender.username}
              </div>
            </div>

            {/* Power comparison */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 6, padding: '12px 16px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
              marginBottom: 14,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>
                  ATK DEALT
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#F97316', lineHeight: 1 }}>
                  {result.attacker_power}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', marginBottom: 4 }}>
                  DEF DEALT
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#22C55E', lineHeight: 1 }}>
                  {result.defender_power}
                </div>
              </div>
            </div>

            {/* Rewards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {result.energy_cost != null && (
                <ResultRow label="ENERGY SPENT" value={`-${result.energy_cost}⚡`} color="rgba(34,211,238,0.7)" />
              )}
              {(isWin || isDraw) && result.xp_earned > 0 && (
                <ResultRow label="XP EARNED" value={`+${fmt(result.xp_earned)}`} color="#9B8AC4" />
              )}
              {isWin && result.glory_earned > 0 && (
                <ResultRow label="GLORY EARNED" value={`+${result.glory_earned}`} color="#D4A437" />
              )}
              {isDraw && (
                <ResultRow label="RESULT" value="DRAW — no glory transfer" color="#C9A961" />
              )}
              {!isWin && !isDraw && (
                <ResultRow label="GLORY DEFENDED" value="+1" color="#D4A437" />
              )}
              <ResultRow label="YOUR HP LOST" value={`-${result.attacker_health_lost}`} color="#B8443A" />
              {result.defender_health_lost > 0 && (
                <ResultRow label="THEIR HP LOST" value={`-${result.defender_health_lost}`} color="rgba(240,240,248,0.35)" />
              )}
            </div>

            {/* Level up */}
            {result.levelsGained > 0 && (
              <div style={{
                background: 'rgba(212,164,55,0.1)', border: '1px solid rgba(212,164,55,0.4)',
                borderRadius: 6, padding: '10px 14px', marginBottom: 14, textAlign: 'center',
              }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.1em', color: '#D4A437' }}>
                  ★ LEVEL UP × {result.levelsGained}!
                </span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px 0',
                  background: isWin ? 'rgba(95,184,87,0.12)' : isDraw ? 'rgba(201,169,97,0.1)' : 'rgba(184,68,58,0.1)',
                  border: `1px solid ${isWin ? 'rgba(95,184,87,0.4)' : isDraw ? 'rgba(201,169,97,0.35)' : 'rgba(184,68,58,0.35)'}`,
                  borderRadius: 6,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
                  letterSpacing: '0.1em', color: titleColor, cursor: 'pointer',
                }}
              >
                ATTACK AGAIN
              </button>
              <Link
                to="/games/pantheon-wars/pvp/log"
                style={{
                  flex: 1, padding: '12px 0',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 16,
                  letterSpacing: '0.1em', color: 'rgba(240,240,248,0.45)',
                  textAlign: 'center', textDecoration: 'none', display: 'block',
                }}
              >
                VIEW LOG
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
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
  const color  = isError ? 'var(--color-danger, #B8443A)' : isAlignment ? '#DEC580' : 'var(--color-success, #5FB857)'
  const borderColor = isError ? 'rgba(184,68,58,0.5)' : isAlignment ? 'rgba(222,197,128,0.4)' : 'rgba(95,184,87,0.4)'

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 88px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 60,
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(16px)',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        padding: '11px 20px',
        whiteSpace: 'nowrap',
        boxShadow: '0 0 16px rgba(201,169,97,0.35), 0 4px 24px rgba(0,0,0,0.6)',
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
  const { play } = useSound()

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
          not_enough_energy:       `Not enough energy. This attack costs ${data.energy_required ?? '?'}⚡.`,
          attacker_no_health:      'You have no health remaining. Wait for regen or use a health potion.',
          defender_no_health:      'Target has no health. Pick another target.',
          requires_alignment:      'You must choose your alignment before attacking.',
          invalid_alignment_matchup: 'Invalid target — check alignment rules.',
          level_out_of_range:      'Target is out of your level range (±10).',
        }
        setToast({ type: 'error', message: msgs[data.error] || data.error || 'Attack failed.' })
        return
      }
      setCombatResult(data)
      // Sound plays after animation completes (ROUND_TICK * rounds + buffer)
      const rounds = Array.isArray(data.rounds) ? data.rounds : []
      const delay  = rounds.length > 0 ? rounds.length * ROUND_TICK + 400 : 0
      setTimeout(() => play(data.result === 'win' ? 'combatWin' : 'combatLose'), delay)
      if (data.levelsGained > 0) setTimeout(() => play('levelUp'), delay + 800)
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
      {/* Toast */}
      <AnimatePresence>
        {toast && <PvPToast toast={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Combat modal */}
      <AnimatePresence>
        {combatResult && (
          <CombatModal result={combatResult} onClose={() => setCombatResult(null)} play={play} />
        )}
      </AnimatePresence>

      <PWPageShell title="ARENA" rightSlot={<PWBackButton />} backgroundVariant="arena">

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
                    {targetsData.my_power_rating != null && (
                      <div style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: 'rgba(240,240,248,0.3)',
                        }}>
                          YOUR POWER
                        </span>
                        <span style={{
                          fontFamily: "'Bebas Neue', sans-serif", fontSize: 24,
                          letterSpacing: '0.04em', color: '#C9A961', lineHeight: 1,
                        }}>
                          {targetsData.my_power_rating}
                        </span>
                      </div>
                    )}
                    {targetsData.computed_bonuses && (
                      <div style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexWrap: 'wrap', gap: '4px 14px',
                      }}>
                        {[
                          { label: 'CRIT',  value: targetsData.computed_bonuses.crit,    color: '#F5D88B', suffix: '%' },
                          { label: 'BLOCK', value: targetsData.computed_bonuses.block,   color: '#8AB8D4', suffix: '%' },
                          { label: 'DODGE', value: targetsData.computed_bonuses.dodge,   color: '#4FD1C5', suffix: '%' },
                          { label: 'AGI',   value: targetsData.computed_bonuses.agility, color: '#A78BFA', suffix: ''  },
                        ].map(({ label, value, color, suffix }) => (
                          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.28)' }}>
                              {label}
                            </span>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color }}>
                              {value}{suffix}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {localStats.health <= 1 && (
                      <p style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: '#F87171', marginTop: 10, marginBottom: 0,
                      }}>
                        ⚠ Critically injured — heal before attacking. Use a potion or wait for HP regen.
                      </p>
                    )}
                    {localStats.health > 1 && localStats.health < localStats.health_max * 0.25 && (
                      <p style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: '#F59E0B', marginTop: 10, marginBottom: 0,
                      }}>
                        ⚠ Low HP — combat losses could be dangerous. Consider using a health potion.
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
                            myStats={localStats}
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
      </PWPageShell>
    </>
  )
}

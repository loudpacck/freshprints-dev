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

  // Per-target cooldown countdown
  const [cooldownSecs, setCooldownSecs] = useState(target.cooldown_seconds_remaining || 0)
  useEffect(() => {
    if (!target.cooldown_active) { setCooldownSecs(0); return }
    setCooldownSecs(target.cooldown_seconds_remaining)
    const id = setInterval(() => {
      setCooldownSecs(prev => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [target.cooldown_active, target.cooldown_seconds_remaining])

  const onCooldown   = cooldownSecs > 0
  const energyCost   = myStats ? Math.max(1, Math.ceil(myStats.level / 10)) : 1
  const noEnergy     = myStats && myStats.energy < energyCost
  const tooInjured   = myStats && myStats.health <= 1
  const btnDisabled  = isAttacking || noEnergy || tooInjured || onCooldown

  const cdMm = String(Math.floor(cooldownSecs / 60)).padStart(2, '0')
  const cdSs = String(cooldownSecs % 60).padStart(2, '0')

  const btnLabel = isAttacking
    ? 'ATTACKING...'
    : onCooldown
      ? `COOLDOWN ${cdMm}:${cdSs}`
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
            ? onCooldown
              ? 'rgba(111,92,50,0.18)'
              : 'rgba(239,68,68,0.07)'
            : 'linear-gradient(135deg, #EF4444, #DC2626)',
          border: btnDisabled
            ? onCooldown
              ? '1px solid rgba(111,92,50,0.4)'
              : '1px solid rgba(239,68,68,0.15)'
            : 'none',
          borderRadius: 8,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 14,
          letterSpacing: '0.08em',
          color: btnDisabled
            ? onCooldown ? '#6F5C32' : 'rgba(240,240,248,0.28)'
            : '#F0F0F8',
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

// ─── Regen helpers (mirrored from Dashboard) ──────────────────────────────────

function useRegenCountdown(regenInterval, lastUpdated, current, max, onTick) {
  const [secsLeft, setSecsLeft] = useState(null)
  const onTickRef = useRef(onTick)
  const firedRef  = useRef(false)
  useEffect(() => { onTickRef.current = onTick }, [onTick])
  useEffect(() => {
    if (!regenInterval || !lastUpdated) { setSecsLeft(null); return }
    if (current >= max) { setSecsLeft(null); return }
    firedRef.current = false
    function compute() {
      const elapsed = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000)
      const nextTick = (Math.floor(elapsed / regenInterval) + 1) * regenInterval
      return Math.max(0, nextTick - elapsed)
    }
    setSecsLeft(compute())
    const id = setInterval(() => {
      const s = compute()
      setSecsLeft(s)
      if (s <= 0 && !firedRef.current) { firedRef.current = true; onTickRef.current?.() }
    }, 1000)
    return () => clearInterval(id)
  }, [regenInterval, lastUpdated, current, max])
  return secsLeft
}

function fmtSecs(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function MiniEnergyBar({ current, max, regenInterval, lastUpdated, onTick }) {
  const pct     = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const secsLeft = useRegenCountdown(regenInterval, lastUpdated, current, max, onTick)
  const countdown = current >= max ? 'MAX' : secsLeft === null ? '—' : `Next +1 in ${fmtSecs(secsLeft)}`
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)' }}>
          ENERGY
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.55)' }}>
          {current} / {max}
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#C9A961', borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
      {regenInterval && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.07em', color: 'rgba(240,240,248,0.25)', marginTop: 4, textAlign: 'right' }}>
          {countdown}
        </div>
      )}
    </div>
  )
}

// ─── Combat Modal ─────────────────────────────────────────────────────────────

const TIMING = {
  ROUND_ANNOUNCE:   600,  // "ROUND N" hold
  ATTACKER_STRIKE:  800,  // attacker action
  DAMAGE_FLOAT:     600,  // damage number rises
  DEFENDER_RESPOND: 800,  // defender action
  ROUND_PAUSE:      500,  // breath between rounds
}
// Total per-round ≈ 3300ms; 5 rounds ≈ 16.5s

function getAttackerCallout(action) {
  if (!action) return null
  if (action.type === 'crit') return { text: 'CRIT!', color: '#F5D88B' }
  if (action.type === 'miss') return { text: 'MISS',  color: 'rgba(240,240,248,0.35)' }
  return null
}

function getDefenderCallout(action) {
  if (!action) return null
  if (action.type === 'counter') return { text: 'COUNTER!', color: '#EF4444' }
  if (action.dodged)             return { text: 'DODGED',   color: '#4FD1C5' }
  if (action.blocked)            return { text: 'BLOCKED',  color: '#8AB8D4' }
  if (action.type === 'crit')    return { text: 'CRIT!',    color: '#F5D88B' }
  return null
}

function getAttackerCommentary(round, attackerName, defenderName) {
  const a = round.attacker_action
  if (!a) return null
  if (a.type === 'miss')              return `${defenderName} sidesteps the strike.`
  if (a.type === 'crit' && a.blocked) return `${defenderName} braces — but the blow shatters through!`
  if (a.type === 'crit')              return `${attackerName} lands a devastating blow!`
  if (a.blocked)                      return `${defenderName} braces and absorbs the hit.`
  return `${attackerName} strikes for ${a.damage}.`
}

function getDefenderCommentary(round, attackerName, defenderName) {
  const d = round.defender_action
  if (!d) return null
  if (d.type === 'counter')           return `${defenderName} counters the dodge!`
  if (d.type === 'miss' || d.dodged)  return `${attackerName} dodges the retaliation.`
  if (d.type === 'crit' && d.blocked) return `${attackerName} deflects — but the critical strike cuts through!`
  if (d.blocked)                      return `${attackerName} deflects the blow.`
  if (d.type === 'crit')              return `${defenderName} strikes back with a critical hit!`
  return `${defenderName} strikes back for ${d.damage}.`
}

function FloatingDamage({ damage, isCrit, side }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        [side === 'defender' ? 'right' : 'left']: '25%',
        top: '30%',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: isCrit ? 30 : 22,
        letterSpacing: '0.06em',
        color: isCrit ? '#F5D88B' : '#EDE3CC',
        textShadow: isCrit ? '0 0 16px rgba(245,216,139,0.8)' : 'none',
        pointerEvents: 'none',
        zIndex: 10,
        lineHeight: 1,
      }}
    >
      -{damage}{isCrit ? ' CRIT!' : ''}
    </motion.div>
  )
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
  const rounds    = Array.isArray(result.rounds) ? result.rounds : []
  const hasRounds = rounds.length > 0
  const attName   = 'YOU'
  const defName   = result.defender.username

  // Attacker starts at real pre-combat HP (backtracked from final + lost)
  const finalAttHp = hasRounds ? rounds[rounds.length - 1].attacker_hp_after : 0
  const initAttHp  = finalAttHp + (result.attacker_health_lost || 0)
  // Defender always starts at 100 HP in the visualization (Part C2)
  const initDefHp  = 100

  const [phase,         setPhase]         = useState(hasRounds ? 'animating' : 'result')
  const [currentRound,  setCurrentRound]  = useState(1)
  const [attHp,         setAttHp]         = useState(initAttHp)
  const [defHp,         setDefHp]         = useState(initDefHp)
  const [callout,       setCallout]       = useState(null)
  const [commentaryText, setCommentaryText] = useState(hasRounds ? 'Combat begins...' : null)
  const [floatingDamage, setFloatingDamage] = useState(null)
  const [hpShake,       setHpShake]       = useState({ att: false, def: false })
  const timerRefs = useRef([])

  function addTimer(fn, delay) {
    const id = setTimeout(fn, delay)
    timerRefs.current.push(id)
  }

  function cancelAllTimers() {
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []
  }

  function skipToResult() {
    cancelAllTimers()
    setPhase('result')
  }

  function playRound(idx) {
    const r        = rounds[idx]
    const isLast   = idx === rounds.length - 1
    const prevDefHp = idx === 0 ? initDefHp : rounds[idx - 1].defender_hp_after
    const prevAttHp = idx === 0 ? initAttHp : rounds[idx - 1].attacker_hp_after

    setCurrentRound(idx + 1)
    setCallout(null)
    setFloatingDamage(null)

    addTimer(() => {
      // Attacker strikes
      setCallout(getAttackerCallout(r.attacker_action))
      setCommentaryText(getAttackerCommentary(r, attName, defName))
      if (r.attacker_action?.type === 'crit') play('success')

      addTimer(() => {
        // Attacker damage floats + HP bar updates
        if (r.attacker_action && r.attacker_action.type !== 'miss') {
          const dmg = r.attacker_action.damage
          setFloatingDamage({ side: 'defender', damage: dmg, isCrit: r.attacker_action.type === 'crit' })
          setDefHp(r.defender_hp_after)
          if ((prevDefHp - r.defender_hp_after) / Math.max(initDefHp, 1) > 0.20) {
            setHpShake(prev => ({ ...prev, def: true }))
            addTimer(() => setHpShake(prev => ({ ...prev, def: false })), 300)
          }
        }

        addTimer(() => {
          // Defender responds
          setFloatingDamage(null)
          if (r.defender_action) {
            setCallout(getDefenderCallout(r.defender_action))
            setCommentaryText(getDefenderCommentary(r, attName, defName))
            if (r.defender_action.type === 'crit') play('success')
          }

          addTimer(() => {
            // Defender damage floats + HP bar updates
            if (r.defender_action && r.defender_action.type !== 'miss' && r.defender_action.damage > 0) {
              const dmg = r.defender_action.damage
              setFloatingDamage({ side: 'attacker', damage: dmg, isCrit: r.defender_action.type === 'crit' })
              setAttHp(r.attacker_hp_after)
              if ((prevAttHp - r.attacker_hp_after) / Math.max(initAttHp, 1) > 0.20) {
                setHpShake(prev => ({ ...prev, att: true }))
                addTimer(() => setHpShake(prev => ({ ...prev, att: false })), 300)
              }
            }

            addTimer(() => {
              setFloatingDamage(null)
              setCallout(null)

              addTimer(() => {
                if (!isLast) {
                  playRound(idx + 1)
                } else {
                  setPhase('result')
                }
              }, TIMING.ROUND_PAUSE)
            }, TIMING.DEFENDER_RESPOND)
          }, TIMING.DAMAGE_FLOAT)
        }, TIMING.DAMAGE_FLOAT)
      }, TIMING.ATTACKER_STRIKE)
    }, TIMING.ROUND_ANNOUNCE)
  }

  useEffect(() => {
    if (!hasRounds) return
    addTimer(() => playRound(0), TIMING.ROUND_ANNOUNCE)
    return () => cancelAllTimers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const combatResult = result.result
  const isWin  = combatResult === 'win'
  const isDraw = combatResult === 'draw'
  const titleText   = isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'
  const titleColor  = isWin ? '#5FB857' : isDraw ? '#C9A961' : '#B8443A'
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
            {/* Round indicator + skip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(240,240,248,0.4)',
              }}>
                ROUND {currentRound} / {rounds.length}
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
                  {attName}
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
                  {defName}
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.04em', color: '#EF4444', lineHeight: 1 }}>
                  {defHp}
                </div>
              </div>
            </div>

            {/* HP bars — position relative so floating damage numbers can anchor here */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {/* Attacker bar */}
              <motion.div
                animate={hpShake.att ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${initAttHp > 0 ? Math.max(0, (attHp / initAttHp) * 100) : 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #166534, #22C55E)',
                    borderRadius: 4,
                    transition: `width ${TIMING.ATTACKER_STRIKE * 0.6}ms ease`,
                  }} />
                </div>
              </motion.div>
              {/* Defender bar */}
              <motion.div
                animate={hpShake.def ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(0, (defHp / initDefHp) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #7f1d1d, #EF4444)',
                    borderRadius: 4,
                    transition: `width ${TIMING.ATTACKER_STRIKE * 0.6}ms ease`,
                  }} />
                </div>
              </motion.div>
              {/* Floating damage */}
              <AnimatePresence>
                {floatingDamage && (
                  <FloatingDamage
                    key={`${currentRound}-${floatingDamage.side}-${floatingDamage.damage}`}
                    damage={floatingDamage.damage}
                    isCrit={floatingDamage.isCrit}
                    side={floatingDamage.side}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Defender "always fresh" note */}
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.07em', color: 'rgba(240,240,248,0.22)', textAlign: 'right', marginBottom: 10 }}>
              ⚔ Defender's HP is always fresh
            </div>

            {/* Commentary */}
            <div style={{ minHeight: 22, marginBottom: 6 }}>
              <AnimatePresence mode="wait">
                {commentaryText && (
                  <motion.p
                    key={commentaryText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: 'rgba(240,240,248,0.45)',
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    {commentaryText}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Callout */}
            <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {callout && (
                  <motion.span
                    key={`${currentRound}-${callout.text}`}
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 30,
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
                vs {defName}
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
              {isWin && (result.final_glory ?? result.glory_earned) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.35)' }}>
                    GLORY EARNED
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#D4A437' }}>
                    +{result.final_glory ?? result.glory_earned}
                    {result.final_glory > result.glory_earned && (
                      <span style={{ color: '#FFB347', fontSize: 9, marginLeft: 5 }}>(+10% Compact)</span>
                    )}
                  </span>
                </div>
              )}
              {isDraw && (
                <ResultRow label="RESULT" value="DRAW — no glory transfer" color="#C9A961" />
              )}
              {!isWin && !isDraw && (
                <ResultRow label="GLORY DEFENDED" value="+1" color="#D4A437" />
              )}
              {!isWin && !isDraw && result.consolation_glory > 0 && (
                <ResultRow label="GLORY EARNED (COMPACT)" value={`+${result.consolation_glory}`} color="#C25E3C" />
              )}
              <ResultRow label="YOUR HP LOST" value={`-${result.attacker_health_lost}`} color="#B8443A" />
              {isWin && result.health_restored > 0 && (
                <ResultRow label="HEALTH RESTORED" value={`+${result.health_restored}`} color="#22C55E" />
              )}
              {result.defender_health_lost > 0 && (
                <ResultRow label="DMG DEALT" value={`${result.defender_health_lost}`} color="rgba(240,240,248,0.35)" />
              )}
            </div>

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
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(16px)',
        border: `2px solid ${borderColor}`,
        borderRadius: 6,
        padding: '11px 20px',
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
          not_enough_energy:         `Not enough energy. This attack costs ${data.energy_required ?? '?'}⚡.`,
          attacker_no_health:        'You have no health remaining. Wait for regen or use a health potion.',
          defender_no_health:        'Target has no health. Pick another target.',
          requires_alignment:        'You must choose your alignment before attacking.',
          invalid_alignment_matchup: 'Invalid target — check alignment rules.',
          level_out_of_range:        'Target is out of your level range.',
          level_gap_too_large:       data.message || 'You cannot attack players significantly below your level.',
          cooldown_active:           `Attack on cooldown. Try again in ${data.seconds_remaining ?? '?'}s.`,
        }
        setToast({ type: 'error', message: msgs[data.error] || data.error || 'Attack failed.' })
        return
      }
      setCombatResult(data)
      // Sound delay matches new sub-tick animation (~3300ms/round)
      const rounds = Array.isArray(data.rounds) ? data.rounds : []
      const delay  = rounds.length > 0 ? rounds.length * (TIMING.ROUND_ANNOUNCE + TIMING.ATTACKER_STRIKE + TIMING.DAMAGE_FLOAT * 2 + TIMING.DEFENDER_RESPOND + TIMING.ROUND_PAUSE) + 400 : 0
      setTimeout(() => play(data.result === 'win' ? 'combatWin' : 'combatLose'), delay)
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <MiniHealthBar current={localStats.health} max={localStats.health_max} color="#EF4444" />
                        <MiniEnergyBar
                          current={localStats.energy}
                          max={localStats.energy_max}
                          regenInterval={300}
                          lastUpdated={localStats.energy_regen_base ?? localStats.last_updated}
                          onTick={() => {}}
                        />
                      </div>
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
                    {user && (user.faction === 'aesir' || user.class === 'slayer') && (
                      <div style={{
                        marginTop: 10,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', flexWrap: 'wrap', gap: 5,
                      }}>
                        {user.faction === 'aesir' && (
                          <span style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#8AB8D4', background: 'rgba(138,184,212,0.1)',
                            border: '1px solid rgba(138,184,212,0.3)',
                            borderRadius: 4, padding: '2px 7px',
                          }}>
                            AESIR +5% ATK
                          </span>
                        )}
                        {user.class === 'slayer' && (
                          <span style={{
                            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: '#F97316', background: 'rgba(249,115,22,0.1)',
                            border: '1px solid rgba(249,115,22,0.3)',
                            borderRadius: 4, padding: '2px 7px',
                          }}>
                            SLAYER +10% ATK
                          </span>
                        )}
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

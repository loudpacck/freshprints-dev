import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

// ─── Color constants ──────────────────────────────────────────────────────────

const TITAN_CRIMSON  = '#B43C50'
const TITAN_DEEP     = 'rgba(180,60,80,0.15)'
const TITAN_BORDER   = 'rgba(180,60,80,0.45)'
const GOLD           = '#C9A961'
const GOLD_BRIGHT    = '#EDE3CC'
const RARITY_COLOR   = {
  common: '#9CA3AF', uncommon: '#22C55E', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMs(ms) {
  const s   = Math.max(0, Math.floor(ms / 1000))
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function fmtNum(n) { return Number(n || 0).toLocaleString() }

function useCountdown(targetIso) {
  const [display, setDisplay] = useState('--:--')
  useEffect(() => {
    if (!targetIso) { setDisplay('—'); return }
    function compute() {
      setDisplay(fmtMs(new Date(targetIso).getTime() - Date.now()))
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [targetIso])
  return display
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ h = 16, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

function SkeletonView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skel h={48} r={10} />
      <Skel h={120} r={10} />
      <Skel h={56} r={10} />
    </div>
  )
}

// ─── Titan Header ─────────────────────────────────────────────────────────────

function TitanHeader({ titan }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: GOLD,
        marginBottom: 4,
      }}>
        {titan.difficulty?.toUpperCase()} TITAN · {titan.pantheon?.toUpperCase()}
      </div>
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: 'clamp(22px, 6vw, 32px)',
        color: GOLD_BRIGHT,
        lineHeight: 1.1,
        marginBottom: 6,
      }}>
        {titan.name}
      </div>
    </div>
  )
}

// ─── Titan HP Bar ─────────────────────────────────────────────────────────────

function TitanHpBar({ currentHp, maxHp }) {
  const pct = maxHp > 0 ? Math.min(100, (currentHp / maxHp) * 100) : 0
  const color = pct > 50 ? TITAN_CRIMSON : pct > 25 ? '#E07030' : '#EF4444'

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(240,240,248,0.38)', textTransform: 'uppercase' }}>
          TITAN HP
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'rgba(240,240,248,0.7)' }}>
          {fmtNum(Math.max(0, currentHp))}
          <span style={{ color: 'rgba(240,240,248,0.3)', fontSize: 10 }}> / {fmtNum(maxHp)}</span>
        </span>
      </div>
      <div style={{ height: 18, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${TITAN_CRIMSON})`,
            borderRadius: 4,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.08em',
          color: 'rgba(240,240,248,0.6)',
          pointerEvents: 'none',
        }}>
          {pct.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

// ─── Round Events Display ─────────────────────────────────────────────────────

function RoundEventsDisplay({ round, titanName }) {
  if (!round) return null
  const attacks = round.attacks || []
  const titanAttack = round.titan_attack

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={round.round}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 12,
          maxHeight: 180,
          overflowY: 'auto',
        }}
      >
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(240,240,248,0.32)', textTransform: 'uppercase', marginBottom: 8 }}>
          ROUND {round.round} EVENTS
        </div>

        {attacks.filter(a => a.damage_dealt > 0).map((atk, i) => (
          <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.75)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            {atk.is_crit && <span style={{ color: '#F59E0B', fontSize: 9 }}>★ CRIT</span>}
            <span style={{ color: GOLD_BRIGHT }}>{atk.username}</span>
            <span style={{ color: 'rgba(240,240,248,0.4)' }}>strikes for</span>
            <span style={{ color: '#F97316' }}>{fmtNum(atk.damage_dealt)}</span>
          </div>
        ))}

        {titanAttack && titanAttack.damage > 0 && (
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(240,240,248,0.6)',
          }}>
            {titanAttack.type === 'ragnarok_aoe' ? (
              <span style={{ color: '#EF4444' }}>
                ☉ {titanName} unleashes RAGNAROK FLAME on ALL PLAYERS
              </span>
            ) : (
              <>
                <span style={{ color: TITAN_CRIMSON }}>{titanName}</span>
                <span style={{ color: 'rgba(240,240,248,0.4)' }}> strikes </span>
                <span style={{ color: GOLD_BRIGHT }}>{titanAttack.target_username}</span>
                <span style={{ color: 'rgba(240,240,248,0.4)' }}> for </span>
                <span style={{ color: '#EF4444' }}>{fmtNum(titanAttack.damage)}</span>
              </>
            )}
          </div>
        )}

        {attacks.every(a => a.attack_type === 'time_warp') && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#A78BFA', fontStyle: 'italic' }}>
            ◌ Time dilation — all actions suspended
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Participant List ──────────────────────────────────────────────────────────

function ParticipantList({ fightLog, currentRoundIdx }) {
  const rounds = fightLog?.rounds || []

  // Build username map and cumulative damage up to current round
  const usernameMap = {}
  const damageByPlayer = {}
  for (let i = 0; i <= currentRoundIdx && i < rounds.length; i++) {
    for (const atk of rounds[i].attacks || []) {
      usernameMap[atk.user_id] = atk.username
      damageByPlayer[atk.user_id] = (damageByPlayer[atk.user_id] || 0) + atk.damage_dealt
    }
  }

  const currentRound = rounds[currentRoundIdx]
  const hpMap = currentRound?.player_hp_after || {}
  const startingHpMap = rounds[0]?.player_hp_after || {}

  const sorted = Object.entries(hpMap)
    .map(([uid, hp]) => ({
      user_id: uid,
      username: usernameMap[uid] || uid.slice(0, 8),
      hp: Number(hp),
      maxHp: Number(startingHpMap[uid] || hp),
      damage: damageByPlayer[uid] || 0,
    }))
    .sort((a, b) => b.damage - a.damage)

  if (sorted.length === 0) return null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 12,
    }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(240,240,248,0.28)', textTransform: 'uppercase', marginBottom: 8 }}>
        WARRIORS — {sorted.length} fighting
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.slice(0, 8).map((p, i) => {
          const hpPct = p.maxHp > 0 ? Math.min(100, (p.hp / p.maxHp) * 100) : 0
          const isTop = i < 3
          return (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isTop && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: GOLD, width: 12, flexShrink: 0 }}>{i + 1}</span>}
              {!isTop && <span style={{ width: 12, flexShrink: 0 }} />}
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: isTop ? GOLD_BRIGHT : 'rgba(240,240,248,0.55)',
                width: 90,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {p.username}
              </span>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${hpPct}%`,
                  background: hpPct > 50 ? '#22C55E' : hpPct > 25 ? '#F59E0B' : '#EF4444',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#F97316', width: 56, textAlign: 'right', flexShrink: 0 }}>
                {fmtNum(p.damage)} dmg
              </span>
            </div>
          )
        })}
        {sorted.length > 8 && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.25)', textAlign: 'center' }}>
            +{sorted.length - 8} more warriors
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Fight Visualizer ─────────────────────────────────────────────────────────

function FightVisualizer({ event, serverTime, fetchedAtMs }) {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0)
  const rounds = event.fight_log?.rounds || []
  const titan  = event.fight_log?.titan || event.titan

  const fightStartMs   = new Date(event.fight_starts_at).getTime()
  const totalDurationMs = event.fight_duration_seconds * 1000

  useEffect(() => {
    function computeRound() {
      const effectiveServerMs = new Date(serverTime).getTime() + (Date.now() - fetchedAtMs)
      const elapsedMs = effectiveServerMs - fightStartMs
      const pct = Math.min(1, Math.max(0, elapsedMs / totalDurationMs))
      const idx = Math.min(rounds.length - 1, Math.floor(pct * rounds.length))
      setCurrentRoundIdx(idx)
    }
    computeRound()
    const id = setInterval(computeRound, 500)
    return () => clearInterval(id)
  }, [serverTime, fetchedAtMs, fightStartMs, totalDurationMs, rounds.length])

  const currentRound = rounds[currentRoundIdx]
  const titanHp = currentRound?.titan_hp_after ?? event.titan_starting_hp
  const overallPct = rounds.length > 0 ? ((currentRoundIdx + 1) / rounds.length) * 100 : 0

  return (
    <div>
      <TitanHeader titan={event.titan} />
      <TitanHpBar currentHp={titanHp} maxHp={event.titan_starting_hp} />

      <div style={{ textAlign: 'center', margin: '10px 0 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: GOLD, letterSpacing: '0.12em' }}>
        ROUND {currentRoundIdx + 1} / {rounds.length}
      </div>

      <RoundEventsDisplay round={currentRound} titanName={titan?.name || 'The Titan'} />
      <ParticipantList fightLog={event.fight_log} currentRoundIdx={currentRoundIdx} />

      {/* Fight progress */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
        <motion.div
          animate={{ width: `${overallPct}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${TITAN_CRIMSON}, #F59E0B)`, borderRadius: 2 }}
        />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.25)', textAlign: 'right', marginTop: 4 }}>
        {overallPct.toFixed(0)}% through the battle
      </div>
    </div>
  )
}

// ─── Queue Countdown ──────────────────────────────────────────────────────────

function QueueCountdown({ queueClosesAt }) {
  const display = useCountdown(queueClosesAt)
  return (
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(240,240,248,0.32)', textTransform: 'uppercase', marginBottom: 4 }}>
        QUEUE CLOSES IN
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, color: GOLD, letterSpacing: '0.08em' }}>
        {display}
      </div>
    </div>
  )
}

// ─── Queue View ───────────────────────────────────────────────────────────────

function QueueView({ event, playerJoined, onJoin, joining, error }) {
  return (
    <div>
      <div style={{
        padding: '22px 20px',
        background: `linear-gradient(135deg, ${TITAN_DEEP}, rgba(40,20,30,0.5))`,
        border: `1px solid ${TITAN_BORDER}`,
        borderRadius: 10,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.07, color: GOLD_BRIGHT, pointerEvents: 'none', lineHeight: 1 }}>
          ☉
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase', marginBottom: 8 }}>
            {event.titan.difficulty?.toUpperCase()} TITAN · {event.titan.pantheon?.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 7vw, 32px)', color: GOLD_BRIGHT, marginBottom: 8, lineHeight: 1.1 }}>
            {event.titan.name}
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 14,
            fontStyle: 'italic',
            color: 'rgba(240,240,248,0.55)',
            marginBottom: 16,
            lineHeight: 1.6,
          }}>
            {event.titan.lore}
          </div>

          <div style={{
            padding: '12px 14px',
            background: 'rgba(0,0,0,0.35)',
            borderLeft: `2px solid ${GOLD}`,
            borderRadius: 4,
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
              ABILITY: {event.titan.ability_name?.toUpperCase()}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(240,240,248,0.55)', lineHeight: 1.5 }}>
              {event.titan.ability_description}
            </div>
          </div>
        </div>
      </div>

      <QueueCountdown queueClosesAt={event.queue_closes_at} />

      <div style={{ textAlign: 'center', marginBottom: 16, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.35)', letterSpacing: '0.1em' }}>
        {event.participant_count} WARRIOR{event.participant_count !== 1 ? 'S' : ''} IN THE QUEUE
      </div>

      {playerJoined ? (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          fontFamily: "'Cinzel', serif",
          fontSize: 16,
          color: GOLD,
          letterSpacing: '0.12em',
          border: `1px solid ${GOLD}66`,
          borderRadius: 6,
          background: 'rgba(201,169,97,0.06)',
        }}>
          ⚔ YOU ARE QUEUED ⚔
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onJoin}
          disabled={joining}
          style={{
            width: '100%',
            padding: '16px',
            fontFamily: "'Cinzel', serif",
            fontSize: 16,
            color: '#0F0A0D',
            background: `linear-gradient(135deg, #C25E3C, #A03020)`,
            border: 'none',
            borderRadius: 6,
            cursor: joining ? 'wait' : 'pointer',
            letterSpacing: '0.12em',
            opacity: joining ? 0.6 : 1,
            boxShadow: joining ? 'none' : '0 4px 18px rgba(180,60,80,0.35)',
          }}
        >
          {joining ? 'JOINING...' : 'JOIN THE QUEUE'}
        </motion.button>
      )}

      {error && (
        <div style={{ color: '#F87171', marginTop: 10, fontSize: 12, textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Battle Begun View ────────────────────────────────────────────────────────

function BattleBegunView({ event }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚔</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(22px, 7vw, 30px)', color: TITAN_CRIMSON, letterSpacing: '0.08em', marginBottom: 10, textShadow: `0 0 24px ${TITAN_CRIMSON}55` }}>
        THE BATTLE HAS BEGUN
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: 'rgba(237,227,204,0.5)', marginBottom: 6 }}>
        {event.titan.name}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(240,240,248,0.35)', marginBottom: 28 }}>
        Be ready next time, warrior.
      </div>
      {event.fight_ends_at && (
        <div>
          <NextEventCountdown targetIso={event.fight_ends_at} label="THIS FIGHT ENDS IN" />
        </div>
      )}
    </div>
  )
}

function NextEventCountdown({ targetIso, label }) {
  const display = useCountdown(targetIso)
  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, color: 'rgba(201,169,97,0.6)', letterSpacing: '0.08em' }}>
        {display}
      </div>
    </div>
  )
}

// ─── No Event View ────────────────────────────────────────────────────────────

function NoEventView() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.5 }}>☽</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(20px, 6vw, 26px)', color: GOLD_BRIGHT, marginBottom: 10, letterSpacing: '0.06em' }}>
        The Realm Rests
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: 'italic', color: 'rgba(240,240,248,0.38)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 28px' }}>
        No Titan threatens the realm at this moment. The next event will be announced soon.
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.1em' }}>
        CHECK BACK SOON
      </div>
    </div>
  )
}

// ─── Unclaimed Reward Card ────────────────────────────────────────────────────

function UnclaimedRewardCard({ reward, onClaim, claiming }) {
  const resultColor  = reward.event_result === 'victory' ? '#22C55E' : '#F87171'
  const resultLabel  = reward.event_result === 'victory' ? 'VICTORY' : 'DEFEAT'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: 20,
        padding: '18px 18px',
        background: 'rgba(201,169,97,0.08)',
        border: `1px solid ${GOLD}66`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>
        ★ REWARDS AWAIT
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: GOLD_BRIGHT, marginBottom: 4 }}>
        {reward.titan_name}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: resultColor, letterSpacing: '0.1em' }}>
          {resultLabel}
        </span>
        {reward.contribution_rank && reward.contribution_rank <= 3 && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: GOLD, letterSpacing: '0.1em' }}>
            TOP CONTRIBUTOR #{reward.contribution_rank}
          </span>
        )}
        {reward.damage_dealt > 0 && (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(240,240,248,0.4)', letterSpacing: '0.08em' }}>
            {fmtNum(reward.damage_dealt)} damage dealt
          </span>
        )}
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClaim}
        disabled={claiming}
        style={{
          width: '100%',
          padding: '12px',
          fontFamily: "'Cinzel', serif",
          fontSize: 14,
          color: '#0F0A0D',
          background: `linear-gradient(135deg, ${GOLD}, #B08840)`,
          border: 'none',
          borderRadius: 6,
          cursor: claiming ? 'wait' : 'pointer',
          letterSpacing: '0.1em',
          opacity: claiming ? 0.6 : 1,
        }}
      >
        {claiming ? 'CLAIMING...' : 'CLAIM REWARDS'}
      </motion.button>
    </motion.div>
  )
}

// ─── Claim Result Modal ───────────────────────────────────────────────────────

function ClaimResultModal({ result, onClose }) {
  const isVictory = result.result === 'victory'
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
  const fadeUp  = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(5,3,10,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--pw-bg-card, #1A1020)',
          border: `1px solid ${isVictory ? GOLD + '66' : 'rgba(239,68,68,0.35)'}`,
          borderRadius: 12,
          padding: '28px 24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>{isVictory ? '⚔' : '☽'}</div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 24,
            letterSpacing: '0.1em',
            color: isVictory ? GOLD_BRIGHT : '#F87171',
            marginBottom: 4,
          }}>
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </div>
          {result.reward_tier === 'top' && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: GOLD, letterSpacing: '0.18em' }}>
              ★ TOP CONTRIBUTOR
            </div>
          )}
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.xp > 0 && (
            <motion.div variants={fadeUp} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.55)', letterSpacing: '0.1em' }}>EXPERIENCE</span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#A78BFA', letterSpacing: '0.06em' }}>+{fmtNum(result.xp)} XP</span>
            </motion.div>
          )}

          {result.drachma > 0 && (
            <motion.div variants={fadeUp} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.2)', borderRadius: 6,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(240,240,248,0.55)', letterSpacing: '0.1em' }}>DRACHMA</span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: GOLD, letterSpacing: '0.06em' }}>+{fmtNum(result.drachma)} ₯</span>
            </motion.div>
          )}

          {result.potion && (
            <motion.div variants={fadeUp} style={{
              padding: '10px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                POTION RECEIVED
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(240,240,248,0.8)' }}>{result.potion.name}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: RARITY_COLOR[result.potion.rarity] || '#9CA3AF', letterSpacing: '0.08em' }}>
                  {result.potion.rarity?.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )}

          {result.loot && (
            <motion.div variants={fadeUp} style={{
              padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: `1px solid ${RARITY_COLOR[result.loot.rarity] || '#9CA3AF'}44`, borderRadius: 6,
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                LOOT RECEIVED
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: GOLD_BRIGHT }}>{result.loot.name}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: RARITY_COLOR[result.loot.rarity] || '#9CA3AF', letterSpacing: '0.08em' }}>
                  {result.loot.rarity?.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )}

          {result.levelsGained > 0 && (
            <motion.div variants={fadeUp} style={{
              textAlign: 'center', padding: '12px 14px',
              background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 6,
            }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: '#A78BFA', letterSpacing: '0.1em', marginBottom: 2 }}>
                ⚡ LEVEL UP! ×{result.levelsGained}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(167,139,250,0.6)' }}>
                +{result.levelsGained * 5} stat points available
              </div>
            </motion.div>
          )}
        </motion.div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '12px',
            fontFamily: "'Cinzel', serif",
            fontSize: 13,
            color: 'rgba(240,240,248,0.6)',
            background: 'none',
            border: '1px solid rgba(240,240,248,0.12)',
            borderRadius: 6,
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          CLOSE
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const backSlot = (
  <PWBackButton to="/games/pantheon-wars" label="COMMAND CENTER" />
)

export default function Titan() {
  const { refresh: refreshContext } = usePantheonWars()
  const [statusData, setStatusData]   = useState(null)
  const [fetchedAtMs, setFetchedAtMs] = useState(Date.now())
  const [loading, setLoading]         = useState(true)
  const [joining, setJoining]         = useState(false)
  const [claiming, setClaiming]       = useState(false)
  const [claimResult, setClaimResult] = useState(null)
  const [error, setError]             = useState(null)
  const pollRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=titan_status')
      const data = await res.json()
      if (res.ok) {
        setStatusData(data)
        setFetchedAtMs(Date.now())
      }
    } catch (e) {
      console.error('titan_status error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchStatus() }, [fetchStatus])

  // Adaptive polling based on event status
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    const status = statusData?.current_event?.status
    const intervalMs = status === 'active' ? 1500 : status === 'queue' ? 60000 : 30000
    pollRef.current = setInterval(fetchStatus, intervalMs)
    return () => clearInterval(pollRef.current)
  }, [statusData?.current_event?.status, fetchStatus])

  async function handleJoin() {
    setJoining(true)
    setError(null)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=titan_join', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) setError(data.message || data.error || 'Failed to join')
      await fetchStatus()
    } catch {
      setError('Request failed')
    } finally {
      setJoining(false)
    }
  }

  async function handleClaim(eventId) {
    setClaiming(true)
    try {
      const res  = await fetch('/api/games/pantheon-wars/game?action=titan_claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      const data = await res.json()
      if (res.ok) {
        setClaimResult(data)
        refreshContext()
      }
      await fetchStatus()
    } finally {
      setClaiming(false)
    }
  }

  const event          = statusData?.current_event
  const unclaimed      = statusData?.unclaimed_reward
  const playerJoined   = !!event?.player_participation

  return (
    <PWPageShell title="TITAN" backgroundVariant="titan" rightSlot={backSlot}>
      {loading ? (
        <SkeletonView />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          {/* Unclaimed reward — always shown first if present */}
          <AnimatePresence>
            {unclaimed && (
              <UnclaimedRewardCard
                reward={unclaimed}
                onClaim={() => handleClaim(unclaimed.event_id)}
                claiming={claiming}
              />
            )}
          </AnimatePresence>

          {/* Queue open */}
          {event?.status === 'queue' && (
            <QueueView
              event={event}
              playerJoined={playerJoined}
              onJoin={handleJoin}
              joining={joining}
              error={error}
            />
          )}

          {/* Active fight — participant visualizer */}
          {event?.status === 'active' && playerJoined && (
            <FightVisualizer
              event={event}
              serverTime={statusData.server_time}
              fetchedAtMs={fetchedAtMs}
            />
          )}

          {/* Active fight — spectator view */}
          {event?.status === 'active' && !playerJoined && (
            <BattleBegunView event={event} />
          )}

          {/* No current event */}
          {!event && !unclaimed && <NoEventView />}
        </motion.div>
      )}

      {/* Claim result modal */}
      <AnimatePresence>
        {claimResult && (
          <ClaimResultModal result={claimResult} onClose={() => setClaimResult(null)} />
        )}
      </AnimatePresence>
    </PWPageShell>
  )
}

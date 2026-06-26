import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const MONO   = "'IBM Plex Mono', monospace"
const CINZEL = "'Cinzel', serif"
const GOLD   = '#C9A961'

const ATTACK_TYPE_STYLE = {
  crit:    { color: '#FCD34D', label: 'CRIT'    },
  hit:     { color: 'rgba(240,240,248,0.65)', label: 'HIT' },
  miss:    { color: 'rgba(240,240,248,0.25)', label: 'MISS'    },
  dodged:  { color: 'rgba(240,240,248,0.25)', label: 'DODGED'  },
  blocked: { color: 'rgba(240,240,248,0.25)', label: 'BLOCKED' },
}

function RoundRow({ r }) {
  const atk = r.my_attack
  // Field name confirmed from backend: titan_action (the dungeon engine reuses the titan fight engine)
  const ta  = r.titan_action
  const typeStyle  = atk ? (ATTACK_TYPE_STYLE[atk.attack_type] || ATTACK_TYPE_STYLE.hit) : null
  const isFatigued = atk?.is_fatigued

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '36px 1fr 1fr 44px 44px',
      gap: 4, padding: '5px 8px',
      alignItems: 'center',
      background: isFatigued ? 'rgba(239,68,68,0.05)' : 'transparent',
      borderRadius: 4, marginBottom: 1,
      borderLeft: isFatigued ? '2px solid rgba(239,68,68,0.35)' : '2px solid transparent',
    }}>
      {/* Round number */}
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.06em' }}>
        {r.round}
      </div>

      {/* My attack */}
      <div>
        {!atk ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>—</span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: typeStyle?.color }}>
            ⚔ {atk.damage_dealt > 0 ? atk.damage_dealt.toLocaleString() : '0'}
            {' '}<span style={{ fontSize: 8, opacity: 0.8 }}>{typeStyle?.label}</span>
            {atk.is_crit && <span style={{ fontSize: 8, color: '#FCD34D', marginLeft: 4 }}>★</span>}
            {isFatigued && <span style={{ fontSize: 8, color: '#EF4444', marginLeft: 4 }}>⚡✗</span>}
          </span>
        )}
      </div>

      {/* Enemy action (field: titan_action — reuses titan combat engine) */}
      <div>
        {!ta ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>—</span>
        ) : !ta.targeted_me ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>🛡 —</span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#F87171' }}>
            🗡 -{ta.damage_received?.toLocaleString() ?? '?'}
          </span>
        )}
      </div>

      {/* HP after — field: my_hp_after */}
      <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: r.my_hp_after <= 1 ? '#EF4444' : 'rgba(240,240,248,0.55)' }}>
        ❤ {r.my_hp_after}
      </div>

      {/* Energy after — field: my_energy_after */}
      <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: r.my_energy_after === 0 ? '#EF4444' : 'rgba(240,240,248,0.4)' }}>
        ⚡ {r.my_energy_after ?? '—'}
      </div>
    </div>
  )
}

// Props:
//   runId          — the dungeon run ID
//   userId         — target player's user_id (UUID)
//   username       — display name
//   encounterIndex — 0-based array index into fight_log.encounters[] (NOT the stored encounter_index value)
//   subFight       — 1-indexed sub-fight number
//   onClose        — close callback
export default function DungeonPlayerLogModal({ runId, userId, username, encounterIndex, subFight, onClose }) {
  const [rounds, setRounds]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setRounds(null)
    fetch(
      `/api/games/pantheon-wars/game?action=dungeon_player_log` +
      `&run_id=${runId}&user_id=${userId}` +
      `&encounter_index=${encounterIndex}&sub_fight=${subFight}`
    )
      .then(r => r.json())
      .then(d => { setRounds(d.rounds || []) })
      .catch(() => { setRounds([]) })
      .finally(() => setLoading(false))
  }, [runId, userId, encounterIndex, subFight])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(5,3,10,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22 }}
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--pw-bg-card, #1A1020)',
          border: '1px solid rgba(201,169,97,0.25)',
          borderRadius: 10, maxHeight: '82vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: CINZEL, fontSize: 15, color: GOLD, letterSpacing: '0.1em' }}>
              {username}'s COMBAT LOG
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.1em', marginTop: 2 }}>
              Encounter {encounterIndex + 1} · Enemy {subFight}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.4)', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Column headers */}
        {!loading && rounds && rounds.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 1fr 44px 44px',
            gap: 4, padding: '6px 8px 2px',
            fontFamily: MONO, fontSize: 8, color: 'rgba(240,240,248,0.22)', letterSpacing: '0.1em',
            flexShrink: 0,
          }}>
            <div>RD</div>
            <div>MY ATTACK</div>
            <div>ENEMY HIT</div>
            <div style={{ textAlign: 'right' }}>HP</div>
            <div style={{ textAlign: 'right' }}>⚡</div>
          </div>
        )}

        {/* Round list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 8px 16px' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.1em' }}>
              LOADING…
            </div>
          ) : !rounds || rounds.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.3)', lineHeight: 1.8 }}>
              No detailed combat log available for this run.
            </div>
          ) : (
            rounds.map(r => <RoundRow key={r.round} r={r} />)
          )}
        </div>

        {/* Legend */}
        {rounds && rounds.length > 0 && (
          <div style={{
            padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0,
          }}>
            {[
              { color: '#FCD34D', label: 'Crit' },
              { color: '#EF4444', label: 'Fatigued' },
              { color: 'rgba(240,240,248,0.25)', label: 'Miss/dodged' },
            ].map(({ color, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                <span style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.06em' }}>{label}</span>
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

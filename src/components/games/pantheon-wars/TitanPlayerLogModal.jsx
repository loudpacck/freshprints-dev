import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MONO   = "'IBM Plex Mono', monospace"
const DM     = "'DM Sans', sans-serif"
const BEBAS  = "'Bebas Neue', sans-serif"
const CINZEL = "'Cinzel', serif"

const GOLD = '#C9A961'

const ATTACK_TYPE_STYLE = {
  crit:      { color: '#FCD34D', label: 'CRIT'     },
  hit:       { color: 'rgba(240,240,248,0.65)', label: 'HIT' },
  time_warp: { color: '#A78BFA', label: 'FROZEN'   },
  miss:      { color: 'rgba(240,240,248,0.25)', label: 'MISS'     },
  dodged:    { color: 'rgba(240,240,248,0.25)', label: 'DODGED'   },
  blocked:   { color: 'rgba(240,240,248,0.25)', label: 'BLOCKED'  },
}

function RoundRow({ r }) {
  const atk  = r.my_attack
  const ta   = r.titan_action
  const typeStyle = atk ? (ATTACK_TYPE_STYLE[atk.attack_type] || ATTACK_TYPE_STYLE.hit) : null

  const isAoe     = ta?.type === 'ragnarok_aoe'
  const isFatigued = atk?.is_fatigued

  const rowBg = atk?.attack_type === 'time_warp' ? 'rgba(139,92,246,0.06)'
    : isFatigued ? 'rgba(239,68,68,0.05)'
    : 'transparent'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '36px 1fr 1fr 44px 44px',
      gap: 4,
      padding: '5px 8px',
      alignItems: 'center',
      background: rowBg,
      borderRadius: 4,
      marginBottom: 1,
      borderLeft: atk?.attack_type === 'time_warp' ? '2px solid rgba(139,92,246,0.5)'
        : isFatigued ? '2px solid rgba(239,68,68,0.35)'
        : '2px solid transparent',
    }}>
      {/* Round number */}
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.06em' }}>
        {r.round}
      </div>

      {/* My attack */}
      <div>
        {!atk ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>—</span>
        ) : atk.attack_type === 'time_warp' ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: '#A78BFA', letterSpacing: '0.08em' }}>⏳ CHRONAL FREEZE</span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: typeStyle?.color }}>
            ⚔ {atk.damage_dealt > 0 ? atk.damage_dealt.toLocaleString() : '0'}
            {' '}
            <span style={{ fontSize: 8, opacity: 0.8 }}>{typeStyle?.label}</span>
            {isFatigued && <span style={{ fontSize: 8, color: '#EF4444', marginLeft: 4 }}>⚡✗</span>}
          </span>
        )}
      </div>

      {/* Titan action */}
      <div>
        {!ta ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>—</span>
        ) : !ta.targeted_me ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.2)' }}>🛡 —</span>
        ) : isAoe ? (
          <span style={{ fontFamily: MONO, fontSize: 9, color: '#EF4444', letterSpacing: '0.05em' }}>
            🔥 AOE {ta.damage_received?.toLocaleString()}
          </span>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 10, color: '#F87171' }}>
            🗡 -{ta.damage_received?.toLocaleString()}
          </span>
        )}
      </div>

      {/* HP after */}
      <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: r.my_hp_after <= 1 ? '#EF4444' : 'rgba(240,240,248,0.55)' }}>
        ❤ {r.my_hp_after}
      </div>

      {/* Energy after */}
      <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 10, color: r.my_energy_after === 0 ? '#EF4444' : 'rgba(240,240,248,0.4)' }}>
        ⚡ {r.my_energy_after ?? '—'}
      </div>
    </div>
  )
}

export default function TitanPlayerLogModal({ eventId, userId, username, onClose }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/games/pantheon-wars/game?action=titan_player_log&event_id=${eventId}&user_id=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [eventId, userId])

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
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(5,3,10,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.22 }}
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--pw-bg-card, #1A1020)',
          border: '1px solid rgba(201,169,97,0.25)',
          borderRadius: 10,
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: CINZEL, fontSize: 15, color: GOLD, letterSpacing: '0.1em' }}>
              {username}'s COMBAT LOG
            </div>
            {data && (
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(240,240,248,0.3)', letterSpacing: '0.1em', marginTop: 2 }}>
                {data.titan_name} · {data.rounds.length} round{data.rounds.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.4)',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Column headers */}
        {!loading && data && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 1fr 44px 44px',
            gap: 4,
            padding: '6px 8px 2px',
            fontFamily: MONO, fontSize: 8,
            color: 'rgba(240,240,248,0.22)',
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}>
            <div>RD</div>
            <div>MY ATTACK</div>
            <div>TITAN HIT</div>
            <div style={{ textAlign: 'right' }}>HP</div>
            <div style={{ textAlign: 'right' }}>⚡</div>
          </div>
        )}

        {/* Round list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 8px 16px' }}>
          {loading ? (
            <div style={{
              padding: 32, textAlign: 'center',
              fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.25)', letterSpacing: '0.1em',
            }}>
              LOADING…
            </div>
          ) : !data ? (
            <div style={{
              padding: 24, textAlign: 'center',
              fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.25)',
            }}>
              Combat data unavailable.
            </div>
          ) : data.rounds.length === 0 ? (
            <div style={{
              padding: 24, textAlign: 'center',
              fontFamily: MONO, fontSize: 11, color: 'rgba(240,240,248,0.25)',
            }}>
              No rounds found for this warrior.
            </div>
          ) : (
            data.rounds.map(r => <RoundRow key={r.round} r={r} />)
          )}
        </div>

        {/* Legend */}
        {data && (
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: 12, flexWrap: 'wrap',
            flexShrink: 0,
          }}>
            {[
              { color: '#FCD34D', label: 'Crit' },
              { color: '#A78BFA', label: 'Chronal freeze' },
              { color: '#EF4444', label: 'AOE / fatigued' },
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

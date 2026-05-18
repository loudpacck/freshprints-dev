import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }

function fmt(n) { return Number(n).toLocaleString() }

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

function actionLabel(action) {
  if (!action) return '—'
  const t = action.type?.toUpperCase() ?? '?'
  const mods = []
  if (action.blocked) mods.push('BLK')
  if (action.dodged)  mods.push('DGD')
  const modStr = mods.length ? ` (${mods.join('/')})` : ''
  return `${t}${modStr}`
}

function CombatEntry({ entry }) {
  const isAttacker = entry.perspective === 'attacker'
  const isDraw     = entry.result === 'draw'

  // Did the viewing player WIN? Draws are neutral.
  const playerWon  = isDraw ? false : (isAttacker ? entry.result === 'win' : entry.result === 'loss')

  const outcomeColor  = isDraw ? '#C9A961' : playerWon ? '#22C55E' : '#EF4444'
  const outcomeLabel  = isDraw ? 'DRAW'    : playerWon ? 'VICTORY' : 'DEFEAT'
  const borderColor   = isDraw
    ? 'rgba(201,169,97,0.12)'
    : playerWon ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'

  const oppFactionColor = FACTION_COLOR[entry.opponent_faction] ?? '#F0F0F8'

  const rounds = Array.isArray(entry.rounds) ? entry.rounds : null
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
    }}>
      {/* Perspective icon + outcome */}
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 44 }}>
        <div style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>
          {isAttacker ? '⚔' : '🛡'}
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: outcomeColor,
        }}>
          {outcomeLabel}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: opponent + time */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 6, gap: 8,
        }}>
          <div>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.08em', color: 'rgba(240,240,248,0.38)',
            }}>
              {isAttacker ? 'vs ' : 'from '}
            </span>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 15,
              letterSpacing: '0.06em', color: '#F0F0F8',
            }}>
              {entry.opponent_username || '[deleted]'}
            </span>
            {entry.opponent_faction && (
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: oppFactionColor, marginLeft: 6,
              }}>
                {entry.opponent_faction}
              </span>
            )}
          </div>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
            color: 'rgba(240,240,248,0.25)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {timeAgo(entry.created_at)}
          </span>
        </div>

        {/* Power comparison */}
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
          color: 'rgba(240,240,248,0.35)', marginBottom: 8, letterSpacing: '0.06em',
        }}>
          PWR {entry.attacker_power} vs {entry.defender_power}
        </div>

        {/* Rewards / losses */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: rounds ? 8 : 0 }}>
          {isAttacker && entry.result === 'win' && (
            <>
              {entry.xp_earned > 0 && <StatChip label="XP" value={`+${fmt(entry.xp_earned)}`} color="#8B5CF6" />}
              {entry.glory_earned > 0 && <StatChip label="Glory" value={`+${entry.glory_earned}`} color="#FBBF24" />}
              <StatChip label="HP" value={`-${entry.attacker_health_lost}`} color="#EF4444" />
            </>
          )}
          {isAttacker && entry.result === 'loss' && (
            <StatChip label="HP" value={`-${entry.attacker_health_lost}`} color="#EF4444" />
          )}
          {isAttacker && isDraw && entry.xp_earned > 0 && (
            <StatChip label="XP" value={`+${fmt(entry.xp_earned)}`} color="#8B5CF6" />
          )}
          {!isAttacker && entry.result === 'win' && (
            <StatChip label="HP" value={`-${entry.defender_health_lost}`} color="#EF4444" />
          )}
          {!isAttacker && (entry.result === 'loss' || isDraw) && (
            <StatChip label="Glory" value="+1" color="#FBBF24" />
          )}
        </div>

        {/* Rounds expand/collapse — only for entries with rounds data */}
        {rounds && (
          <>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 9,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(240,240,248,0.35)', background: 'none',
                border: '1px solid rgba(255,255,255,0.09)', borderRadius: 4,
                padding: '4px 10px', cursor: 'pointer',
                transition: 'color 120ms, border-color 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
            >
              {expanded ? '▴' : '▾'} ROUNDS ({rounds.length})
            </button>

            {expanded && (
              <div style={{ marginTop: 10, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>
                  <thead>
                    <tr>
                      {['Rnd', 'Your Action', 'Dmg', 'Their Action', 'Dmg', 'Your HP', 'Their HP'].map(h => (
                        <th key={h} style={{ textAlign: 'left', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', paddingBottom: 5, paddingRight: 10, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((r, i) => {
                      const a = r.attacker_action
                      const d = r.defender_action
                      const aCrit = a?.type === 'crit'
                      const dCrit = d?.type === 'crit'
                      return (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '4px 10px 4px 0', color: 'rgba(240,240,248,0.35)' }}>{r.round}</td>
                          <td style={{ padding: '4px 10px 4px 0', color: aCrit ? '#F5D88B' : a?.type === 'miss' ? 'rgba(240,240,248,0.28)' : '#F97316', whiteSpace: 'nowrap' }}>
                            {actionLabel(a)}
                          </td>
                          <td style={{ padding: '4px 10px 4px 0', color: '#F97316' }}>{a?.damage ?? 0}</td>
                          <td style={{ padding: '4px 10px 4px 0', color: dCrit ? '#F5D88B' : d?.type === 'miss' ? 'rgba(240,240,248,0.28)' : d?.type === 'counter' ? '#EF4444' : '#22C55E', whiteSpace: 'nowrap' }}>
                            {actionLabel(d)}
                          </td>
                          <td style={{ padding: '4px 10px 4px 0', color: '#22C55E' }}>{d?.damage ?? 0}</td>
                          <td style={{ padding: '4px 10px 4px 0', color: 'rgba(240,240,248,0.55)' }}>{r.attacker_hp_after}</td>
                          <td style={{ padding: '4px 0 4px 0',  color: 'rgba(240,240,248,0.55)' }}>{r.defender_hp_after}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10,
      color,
      letterSpacing: '0.06em',
    }}>
      {label} {value}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export default function PvPLog() {
  const { user, loading } = usePantheonWars()
  const navigate = useNavigate()

  const [log,        setLog]        = useState(null)
  const [isLoading, setIsLoading]  = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [loading, user, navigate])

  useEffect(() => {
    if (loading || !user) return
    setIsLoading(true)
    fetch('/api/games/pantheon-wars/game?action=pvp_log')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => { setLog(data.log); setFetchError(null) })
      .catch(() => setFetchError('Failed to load combat log.'))
      .finally(() => setIsLoading(false))
  }, [loading, user])

  const arenaLink = (
    <Link
      to="/games/pantheon-wars/pvp"
      style={{
        fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-accent-gold-dim)',
        borderRadius: 4,
        padding: '6px 14px',
        transition: 'color 180ms, border-color 180ms, box-shadow 180ms',
        display: 'inline-block',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--color-accent-gold-bright)'
        e.currentTarget.style.borderColor = 'var(--color-accent-gold)'
        e.currentTarget.style.boxShadow = 'var(--glow-gold)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--color-text-muted)'
        e.currentTarget.style.borderColor = 'var(--color-accent-gold-dim)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      ← Arena
    </Link>
  )

  return (
    <PWPageShell title="COMBAT LOG" rightSlot={arenaLink} backgroundVariant="pvplog">

          {/* Loading skeleton */}
          {(loading || isLoading) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton h={12} w={100} />
              <Skeleton h={36} w={200} />
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0,1,2,3,4].map(i => <Skeleton key={i} h={88} />)}
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && !isLoading && fetchError && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
              color: '#F87171', textAlign: 'center', marginTop: 48,
            }}>
              // {fetchError}
            </p>
          )}

          {/* Content */}
          {!loading && !isLoading && !fetchError && log && (
            <motion.div variants={stagger} initial="hidden" animate="visible">

              <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.3)', marginBottom: 10,
                }}>
                  // COMBAT LOG
                </p>
                <h1 style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(32px, 9vw, 48px)',
                  letterSpacing: '0.07em', color: '#F0F0F8',
                  margin: 0, lineHeight: 1,
                }}>
                  BATTLE HISTORY
                </h1>
              </motion.div>

              {log.length === 0 ? (
                <motion.div
                  variants={fadeUp}
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 12,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(240,240,248,0.28)', margin: '0 0 8px',
                  }}>
                    // NO COMBAT HISTORY
                  </p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: 'rgba(240,240,248,0.35)', margin: 0,
                  }}>
                    No combat history yet. Head to the Arena to start fighting.
                  </p>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {log.map(entry => (
                    <motion.div key={entry.id} variants={fadeUp}>
                      <CombatEntry entry={entry} />
                    </motion.div>
                  ))}
                </div>
              )}

            </motion.div>
          )}
    </PWPageShell>
  )
}

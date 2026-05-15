import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#F5C542', aesir: '#78C5F0', annunaki: '#CF4444' }

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

function CombatEntry({ entry }) {
  // perspective: 'attacker' | 'defender'
  // result is from attacker POV — if defender, flip the outcome display
  const isAttacker = entry.perspective === 'attacker'

  // Did the viewing player WIN?
  const playerWon = isAttacker ? entry.result === 'win' : entry.result === 'loss'

  const outcomeColor  = playerWon ? '#22C55E' : '#EF4444'
  const outcomeLabel  = playerWon ? 'VICTORY' : 'DEFEAT'
  const oppFactionColor = FACTION_COLOR[entry.opponent_faction] ?? '#F0F0F8'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${playerWon ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'}`,
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
          {isAttacker && entry.result === 'win' && (
            <>
              {entry.xp_earned > 0 && (
                <StatChip label="XP" value={`+${fmt(entry.xp_earned)}`} color="#8B5CF6" />
              )}
              {entry.drachma_transferred > 0 && (
                <StatChip label="₯" value={`+${fmt(entry.drachma_transferred)}`} color="#F5C542" />
              )}
              {entry.glory_earned > 0 && (
                <StatChip label="Glory" value={`+${entry.glory_earned}`} color="#FBBF24" />
              )}
              <StatChip label="HP" value={`-${entry.attacker_health_lost}`} color="#EF4444" />
            </>
          )}
          {isAttacker && entry.result === 'loss' && (
            <StatChip label="HP" value={`-${entry.attacker_health_lost}`} color="#EF4444" />
          )}
          {!isAttacker && entry.result === 'win' && (
            // Attacker won = we (defender) lost drachma + HP
            <>
              {entry.drachma_transferred > 0 && (
                <StatChip label="₯ lost" value={`-${fmt(entry.drachma_transferred)}`} color="#EF4444" />
              )}
              <StatChip label="HP" value={`-${entry.defender_health_lost}`} color="#EF4444" />
            </>
          )}
          {!isAttacker && entry.result === 'loss' && (
            // Attacker lost = we (defender) successfully defended, gained 1 glory
            <StatChip label="Glory" value="+1" color="#FBBF24" />
          )}
        </div>
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

  return (
    <>
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          background: '#07070D',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05) 0%, transparent 55%)',
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
              / COMBAT LOG
            </span>
          </div>
          <Link
            to="/games/pantheon-wars/pvp"
            style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.38)', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 12px',
              transition: 'color 120ms, border-color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,248,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            ← Arena
          </Link>
        </header>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main style={{ flex: 1, width: '100%', maxWidth: 640, margin: '0 auto', padding: '28px 20px 72px' }}>

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
        </main>
      </motion.div>
    </>
  )
}

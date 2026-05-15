import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#F5C542', aesir: '#78C5F0', annunaki: '#CF4444' }
const FACTION_LABEL = { olympians: 'Olympians', aesir: 'Aesir', annunaki: 'Annunaki' }
const CLASS_LABEL   = { warden: 'Warden', oracle: 'Oracle', slayer: 'Slayer', broker: 'Broker' }

const NAV_ITEMS = [
  { label: 'QUESTS',      glyph: '⚔',  path: '/games/pantheon-wars/quests'      },
  { label: 'INVENTORY',   glyph: '◈',  path: '/games/pantheon-wars/inventory'                   },
  { label: 'SHOP',        glyph: '₯',  path: '/games/pantheon-wars/shop'                         },
  { label: 'TEMPLES',     glyph: '⬟',  path: '/games/pantheon-wars/temples'      },
  { label: 'ARENA',       glyph: '⚡',  path: '/games/pantheon-wars/pvp',         comingSoon: true },
  { label: 'LEADERBOARD', glyph: '★',  path: '/games/pantheon-wars/leaderboard'                  },
  { label: 'PROFILE',     glyph: '◎',  path: '/games/pantheon-wars/profile'      },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function xpNeeded(level) {
  return Math.max(1, Math.floor(100 * Math.pow(level, 1.5)))
}

function fmt(n) {
  return Number(n).toLocaleString()
}

function hexRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function StatBar({ label, current, max, color, delay = 0 }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 9,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          color: 'rgba(240,240,248,0.7)',
        }}>
          {fmt(current)}
          <span style={{ color: 'rgba(240,240,248,0.3)', fontSize: 10 }}> / {fmt(max)}</span>
        </span>
      </div>
      <div style={{
        height: 6,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay }}
          style={{ height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  )
}

function StatCard({ glyph, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '14px 10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, marginBottom: 5, lineHeight: 1 }}>{glyph}</div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 24,
        letterSpacing: '0.04em',
        color,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(240,240,248,0.32)',
      }}>
        {label}
      </div>
    </div>
  )
}

function NavButton({ item }) {
  if (item.comingSoon) {
    return (
      <div
        title="Coming soon — temples, PvP, inventory, and crew systems shipping in the next phase"
        style={{ position: 'relative', opacity: 0.45, cursor: 'not-allowed' }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '16px 8px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{item.glyph}</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: '0.08em',
            color: '#F0F0F8',
            lineHeight: 1,
          }}>
            {item.label}
          </div>
        </div>
        <div style={{
          position: 'absolute',
          top: 5,
          right: 5,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 7,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(240,240,248,0.6)',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 3,
          padding: '2px 4px',
          lineHeight: 1,
        }}>
          SOON
        </div>
      </div>
    )
  }

  return (
    <Link to={item.path} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.97 }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '16px 8px 14px',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 6, lineHeight: 1 }}>{item.glyph}</div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 13,
          letterSpacing: '0.08em',
          color: '#F0F0F8',
          lineHeight: 1,
        }}>
          {item.label}
        </div>
      </motion.div>
    </Link>
  )
}

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

// ─── Dashboard (inner — uses context) ────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function Dashboard() {
  const { user, stats, loading, error, logout } = usePantheonWars()
  const navigate = useNavigate()

  // null = loading, false = failed (render nothing), { total, count } = loaded
  const [templeIncome, setTempleIncome] = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [loading, user, navigate])

  useEffect(() => {
    if (loading || !user) return
    fetch('/api/games/pantheon-wars/game?action=temples')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setTempleIncome({ total: data.total_income_per_hour, count: data.owned.length })
        else setTempleIncome(false)
      })
      .catch(() => setTempleIncome(false))
  }, [loading, user])

  async function handleLogout() {
    await logout()
    navigate('/home')
  }

  const factionColor = user ? (FACTION_COLOR[user.faction] ?? '#F0F0F8') : '#F0F0F8'
  const xpMax = stats ? xpNeeded(stats.level) : 100
  const xpPct = stats ? Math.min(100, Math.round((stats.xp / xpMax) * 100)) : 0

  return (
    <>
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }
        @media (max-width: 480px) {
          .pw-resources { flex-direction: column !important; }
          .pw-statgrid  { grid-template-columns: repeat(2,1fr) !important; }
          .pw-navgrid   { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (min-width: 481px) and (max-width: 639px) {
          .pw-navgrid { grid-template-columns: repeat(4,1fr) !important; }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
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
            {user && (
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(240,240,248,0.3)',
                marginLeft: 4,
              }}>
                / COMMAND CENTER
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.38)',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'color 120ms, border-color 120ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'rgba(240,240,248,0.8)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(240,240,248,0.38)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            Logout
          </button>
        </header>

        {/* ── Main ───────────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '28px 20px 64px',
        }}>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton h={14} w={120} />
              <Skeleton h={38} w={200} />
              <Skeleton h={70} />
              <div style={{ display: 'flex', gap: 12 }}>
                <Skeleton h={76} />
                <Skeleton h={76} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[0,1,2,3].map(i => <Skeleton key={i} h={82} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 8 }}>
                {NAV_ITEMS.map(i => <Skeleton key={i.label} h={72} />)}
              </div>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <p style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: '#F87171',
              textAlign: 'center',
              marginTop: 48,
            }}>
              // {error}
            </p>
          )}

          {/* Dashboard */}
          {!loading && !error && user && stats && (
            <motion.div variants={stagger} initial="hidden" animate="visible">

              {/* ── Player identity ──────────────────────────── */}
              <motion.section variants={fadeUp} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
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
                      label={user.alignment === 'coalition' ? 'Pantheon Coalition' : 'Mortal Compact'}
                      color={user.alignment === 'coalition' ? '#A78BFA' : '#FB923C'}
                      bg={user.alignment === 'coalition' ? 'rgba(167,139,250,0.1)' : 'rgba(251,146,60,0.1)'}
                      border={user.alignment === 'coalition' ? 'rgba(167,139,250,0.32)' : 'rgba(251,146,60,0.32)'}
                    />
                  )}
                </div>
                <h1 style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(30px, 8vw, 48px)',
                  letterSpacing: '0.07em',
                  color: '#F0F0F8',
                  margin: 0,
                  lineHeight: 1,
                }}>
                  {user.username}
                </h1>
              </motion.section>

              {/* ── Level + XP bar ───────────────────────────── */}
              <motion.section
                variants={fadeUp}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '16px',
                  marginBottom: 12,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.13em',
                      textTransform: 'uppercase',
                      color: 'rgba(240,240,248,0.38)',
                    }}>
                      Level
                    </span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 30,
                      letterSpacing: '0.04em',
                      color: '#8B5CF6',
                      lineHeight: 1,
                    }}>
                      {stats.level}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: 'rgba(240,240,248,0.55)',
                  }}>
                    {fmt(stats.xp)}
                    <span style={{ color: 'rgba(240,240,248,0.28)', fontSize: 10 }}> / {fmt(xpMax)} XP</span>
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1.0, ease: 'easeOut', delay: 0.15 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  color: 'rgba(240,240,248,0.25)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: 'right',
                  marginTop: 6,
                  marginBottom: 0,
                }}>
                  {xpPct}% to level {stats.level + 1}
                </p>
              </motion.section>

              {/* ── Energy + Health bars ─────────────────────── */}
              <motion.div
                variants={fadeUp}
                className="pw-resources"
                style={{ display: 'flex', gap: 12, marginBottom: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <StatBar
                    label="Energy"
                    current={stats.energy}
                    max={stats.energy_max}
                    color="#00C8FF"
                    delay={0.2}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <StatBar
                    label="Health"
                    current={stats.health}
                    max={stats.health_max}
                    color="#EF4444"
                    delay={0.32}
                  />
                </div>
              </motion.div>

              {/* ── Stat grid ────────────────────────────────── */}
              <motion.div
                variants={fadeUp}
                className="pw-statgrid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <StatCard glyph="₯" label="Drachma" value={fmt(stats.drachma)} color="#F5C542" />
                <StatCard glyph="✦" label="Glory"   value={fmt(stats.glory)}   color="#FBBF24" />
                <StatCard glyph="⚔" label="Attack"  value={stats.attack}       color="#F97316" />
                <StatCard glyph="◈" label="Defense" value={stats.defense}      color="#22C55E" />
              </motion.div>

              {/* ── Temple income card ───────────────────────── */}
              {templeIncome !== false && (
                <motion.div variants={fadeUp} style={{ marginBottom: 12 }}>
                  <Link to="/games/pantheon-wars/temples" style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: 'rgba(167,139,250,0.06)',
                        border: '1px solid rgba(167,139,250,0.18)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      {templeIncome === null ? (
                        <Skeleton h={14} w={160} />
                      ) : (
                        <>
                          <div>
                            <div style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10,
                              letterSpacing: '0.13em',
                              textTransform: 'uppercase',
                              color: 'rgba(167,139,250,0.7)',
                              marginBottom: 4,
                            }}>
                              TEMPLE INCOME
                            </div>
                            <div style={{
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: 22,
                              letterSpacing: '0.04em',
                              color: '#A78BFA',
                              lineHeight: 1,
                            }}>
                              {fmt(templeIncome.total)} ₯/hr
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 10,
                              letterSpacing: '0.09em',
                              color: 'rgba(167,139,250,0.5)',
                              marginBottom: 4,
                            }}>
                              {templeIncome.count === 0
                                ? 'Build your first temple →'
                                : `${templeIncome.count} temple${templeIncome.count !== 1 ? 's' : ''}`}
                            </div>
                            <div style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 9,
                              letterSpacing: '0.09em',
                              color: 'rgba(167,139,250,0.35)',
                            }}>
                              VIEW →
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              )}

              {/* ── Stat points alert ────────────────────────── */}
              {stats.stat_points > 0 && (
                <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                  <Link to="/games/pantheon-wars/profile" style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        background: 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.4)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 11,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#A78BFA',
                      }}>
                        ⚡&nbsp; {stats.stat_points} stat {stats.stat_points === 1 ? 'point' : 'points'} available
                      </span>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.09em',
                        color: 'rgba(167,139,250,0.55)',
                      }}>
                        ALLOCATE →
                      </span>
                    </motion.div>
                  </Link>
                </motion.div>
              )}

              {/* ── Navigation grid ──────────────────────────── */}
              <motion.section variants={fadeUp}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.28)',
                  marginBottom: 14,
                }}>
                  // Navigate
                </p>
                <div
                  className="pw-navgrid"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}
                >
                  {NAV_ITEMS.map(item => (
                    <NavButton key={item.label} item={item} />
                  ))}
                </div>
              </motion.section>

            </motion.div>
          )}
        </main>
      </motion.div>
    </>
  )
}


import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }
const FACTION_LABEL = { olympians: 'Olympians', aesir: 'Aesir', annunaki: 'Annunaki' }
const CLASS_LABEL   = { warden: 'Warden', oracle: 'Oracle', slayer: 'Slayer', broker: 'Broker' }

const NAV_ITEMS = [
  { label: 'QUESTS',      glyph: '⚔',  path: '/games/pantheon-wars/quests'      },
  { label: 'ADVENTURES',  glyph: '⚑',  path: '/games/pantheon-wars/adventures'  },
  { label: 'INVENTORY',   glyph: '◈',  path: '/games/pantheon-wars/inventory'                   },
  { label: 'SHOP',        glyph: '₯',  path: '/games/pantheon-wars/shop'                         },
  { label: 'TEMPLES',     glyph: '⬟',  path: '/games/pantheon-wars/temples'      },
  { label: 'ARENA',       glyph: '⚡',  path: '/games/pantheon-wars/pvp'          },
  { label: 'LEADERBOARD', glyph: '★',  path: '/games/pantheon-wars/leaderboard'                  },
  { label: 'PROFILE',     glyph: '◎',  path: '/games/pantheon-wars/profile'      },
]

// ─── Titan tile helpers ───────────────────────────────────────────────────────

function fmtTitanCountdown(targetIso) {
  const ms  = new Date(targetIso).getTime() - Date.now()
  const s   = Math.max(0, Math.floor(ms / 1000))
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function TitanCountdown({ event }) {
  const [display, setDisplay] = useState('—')
  const [label, setLabel]     = useState('')

  useEffect(() => {
    if (!event) { setLabel(''); setDisplay('—'); return }
    function compute() {
      if (event.status === 'queue' && event.queue_closes_at) {
        setLabel('QUEUE CLOSES IN')
        setDisplay(fmtTitanCountdown(event.queue_closes_at))
      } else if (event.status === 'active' && event.fight_ends_at) {
        setLabel('FIGHT ENDS IN')
        setDisplay(fmtTitanCountdown(event.fight_ends_at))
      } else {
        setLabel('')
        setDisplay('—')
      }
    }
    compute()
    const id = setInterval(compute, 1000)
    return () => clearInterval(id)
  }, [event?.status, event?.queue_closes_at, event?.fight_ends_at])

  if (!label) return null
  return (
    <div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: 'rgba(240,240,248,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, color: '#C9A961', letterSpacing: '0.06em', lineHeight: 1 }}>
        {display}
      </div>
    </div>
  )
}

function SkeletonTile() {
  return <div className="pw-skel" style={{ height: 90, borderRadius: 10, marginBottom: 18 }} />
}

function TitanFeaturedTile() {
  const [titanStatus, setTitanStatus] = useState(null)
  const [tileLoading, setTileLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/games/pantheon-wars/game?action=titan_status')
      .then(r => r.json())
      .then(data => { setTitanStatus(data); setTileLoading(false) })
      .catch(() => setTileLoading(false))
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/games/pantheon-wars/game?action=titan_status')
        .then(r => r.json())
        .then(data => setTitanStatus(data))
        .catch(() => {})
    }, 60000)
    return () => clearInterval(id)
  }, [])

  if (tileLoading) return <SkeletonTile />

  const event = titanStatus?.current_event

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate('/games/pantheon-wars/titan')}
      style={{
        cursor: 'pointer',
        marginBottom: 18,
        padding: '18px 18px',
        background: 'linear-gradient(135deg, rgba(180,60,80,0.11), rgba(60,20,30,0.22))',
        border: '1px solid rgba(180,60,80,0.38)',
        borderRadius: 10,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -8, right: -8, opacity: 0.09, fontSize: 70, lineHeight: 1, color: '#EDE3CC', pointerEvents: 'none' }}>
        ☉
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#C9A961', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 5 }}>
          ☉ TITAN EVENT
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: '#EDE3CC', marginBottom: 3, lineHeight: 1.1 }}>
          {event?.titan?.name || 'Awaiting the next Titan...'}
        </div>
        {event?.titan && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.35)', letterSpacing: '0.1em', marginBottom: 8 }}>
            {event.titan.difficulty?.toUpperCase()} · {event.titan.pantheon?.toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
          <TitanCountdown event={event} />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(240,240,248,0.28)', letterSpacing: '0.09em', textAlign: 'right' }}>
            {event ? `${event.participant_count ?? 0} in queue` : ''}
            <div style={{ color: 'rgba(180,60,80,0.7)', marginTop: 2 }}>ENTER →</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

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
      const nowMs = Date.now()
      const lastMs = new Date(lastUpdated).getTime()
      const elapsed = Math.floor((nowMs - lastMs) / 1000)
      const nextTick = (Math.floor(elapsed / regenInterval) + 1) * regenInterval
      return Math.max(0, nextTick - elapsed)
    }

    setSecsLeft(compute())
    const id = setInterval(() => {
      const s = compute()
      setSecsLeft(s)
      if (s <= 0 && !firedRef.current) {
        firedRef.current = true
        onTickRef.current?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [regenInterval, lastUpdated, current, max])

  return secsLeft
}

function fmtSecs(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function StatBar({ label, current, max, color, delay = 0, regenInterval, lastUpdated, onTick }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
  const secsLeft = useRegenCountdown(regenInterval, lastUpdated, current, max, onTick)

  let countdownText = null
  if (regenInterval) {
    if (current >= max) {
      countdownText = 'MAX'
    } else if (secsLeft === null) {
      countdownText = '—'
    } else {
      countdownText = `Next +1 in ${fmtSecs(secsLeft)}`
    }
  }

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
      {countdownText && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.07em',
          color: 'rgba(240,240,248,0.28)',
          marginTop: 6,
          textAlign: 'right',
        }}>
          {countdownText}
        </div>
      )}
    </div>
  )
}

function StatCard({ glyph, label, value, color, subtext }) {
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
      {subtext && (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8,
          letterSpacing: '0.08em',
          color: 'rgba(240,240,248,0.2)',
          marginTop: 3,
        }}>
          {subtext}
        </div>
      )}
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
  const { user, stats, loading, error, logout, refresh } = usePantheonWars()
  const navigate = useNavigate()

  // null = loading, false = failed (render nothing), { total, count } = loaded
  const [templeIncome, setTempleIncome] = useState(null)
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem('pw-onboarding-dismissed') === '1'
  )

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

  function dismissOnboarding() {
    localStorage.setItem('pw-onboarding-dismissed', '1')
    setOnboardingDismissed(true)
  }

  async function handleLogout() {
    await logout()
    navigate('/home')
  }

  const factionColor = user ? (FACTION_COLOR[user.faction] ?? '#F0F0F8') : '#F0F0F8'
  const xpMax = stats ? xpNeeded(stats.level) : 100
  const xpPct = stats ? Math.min(100, Math.round((stats.xp / xpMax) * 100)) : 0

  const logoutSlot = (
    <button
      onClick={handleLogout}
      style={{
        fontFamily: "var(--pw-font-display, 'Cinzel', serif)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-accent-gold-dim)',
        borderRadius: 4,
        padding: '6px 14px',
        cursor: 'pointer',
        transition: 'color 180ms, border-color 180ms, box-shadow 180ms',
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
      Logout
    </button>
  )

  return (
    <PWPageShell
      title="COMMAND CENTER"
      backgroundVariant="dashboard"
      rightSlot={logoutSlot}
    >

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
                    color="#C9A961"
                    bg="rgba(201,169,97,0.1)"
                    border="rgba(201,169,97,0.32)"
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

              {/* ── Onboarding banner ────────────────────────── */}
              {!onboardingDismissed && stats.xp === 0 && stats.drachma === 500 && (
                <motion.div
                  variants={fadeUp}
                  style={{
                    background: 'rgba(201,169,97,0.07)',
                    border: '1px solid rgba(201,169,97,0.22)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    marginBottom: 14,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>⚔</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#C9A961',
                      margin: '0 0 4px',
                    }}>
                      New here? Start with Quests
                    </p>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: 'rgba(240,240,248,0.6)',
                      margin: 0,
                      lineHeight: 1.55,
                    }}>
                      Complete quests to earn XP, Drachma, and loot. Use the QUESTS button below to begin your rise.
                    </p>
                  </div>
                  <button
                    onClick={dismissOnboarding}
                    aria-label="Dismiss"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(240,240,248,0.3)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: '0 2px',
                      flexShrink: 0,
                      transition: 'color 120ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,240,248,0.75)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,240,248,0.3)'}
                  >
                    ✕
                  </button>
                </motion.div>
              )}

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
                    color="#C9A961"
                    delay={0.2}
                    regenInterval={300}
                    lastUpdated={stats.energy_regen_base ?? stats.last_updated}
                    onTick={refresh}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <StatBar
                    label="Health"
                    current={stats.health}
                    max={stats.health_max}
                    color="#EF4444"
                    delay={0.32}
                    regenInterval={180}
                    lastUpdated={stats.health_regen_base ?? stats.last_updated}
                    onTick={refresh}
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
                <StatCard glyph="₯" label="Drachma" value={fmt(stats.drachma)} color="#C9A961" />
                <StatCard glyph="✦" label="Glory"   value={fmt(stats.glory)}   color="#FBBF24"
                  subtext={stats.glory_lifetime > 0 ? `Lifetime: ${fmt(stats.glory_lifetime)}` : undefined}
                />
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

              {/* ── Titan featured tile ─────────────────────── */}
              <motion.section variants={fadeUp}>
                <TitanFeaturedTile />
              </motion.section>

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
    </PWPageShell>
  )
}


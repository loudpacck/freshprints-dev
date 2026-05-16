import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'

// ─── Constants ────────────────────────────────────────────────────────────────

const FACTION_COLOR = { olympians: '#E8D080', aesir: '#8AB8D4', annunaki: '#C25E3C' }
const FACTION_LABEL = { olympians: 'Olympians', aesir: 'Aesir', annunaki: 'Annunaki' }
const CLASS_LABEL   = { warden: 'Warden', oracle: 'Oracle', slayer: 'Slayer', broker: 'Broker' }

const TYPES = [
  { key: 'level',   label: 'LEVEL',   glyph: '◎', unit: '' },
  { key: 'glory',   label: 'GLORY',   glyph: '★', unit: '' },
  { key: 'drachma', label: 'DRACHMA', glyph: '₯', unit: '₯' },
  { key: 'mastery', label: 'MASTERY', glyph: '◆', unit: '' },
]

const FACTIONS = [
  { key: 'all',       label: 'ALL'       },
  { key: 'olympians', label: 'OLYMPIANS' },
  { key: 'aesir',     label: 'AESIR'     },
  { key: 'annunaki',  label: 'ANNUNAKI'  },
]

const MEDAL = ['🥇', '🥈', '🥉']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

function hexRgb(hex) {
  if (!hex || hex[0] !== '#') return '240,240,248'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankRow({ entry, type }) {
  const fColor  = FACTION_COLOR[entry.faction] ?? '#F0F0F8'
  const fRgb    = hexRgb(fColor)
  const unit    = TYPES.find(t => t.key === type)?.unit ?? ''
  const isMedal = entry.rank <= 3

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: entry.is_self
          ? `rgba(${fRgb}, 0.06)`
          : isMedal ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${entry.is_self ? `rgba(${fRgb}, 0.28)` : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8,
        transition: 'background 200ms',
      }}
    >
      {/* Rank */}
      <div style={{
        flexShrink: 0, width: 32, textAlign: 'center',
        fontFamily: isMedal ? "'Bebas Neue', sans-serif" : "'IBM Plex Mono', monospace",
        fontSize: isMedal ? 20 : 12,
        color: isMedal ? '#F0F0F8' : 'rgba(240,240,248,0.28)',
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}>
        {entry.rank <= 3 ? MEDAL[entry.rank - 1] : `#${entry.rank}`}
      </div>

      {/* Username + badges */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: '0.05em',
            color: entry.is_self ? fColor : '#F0F0F8',
            lineHeight: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entry.username}
            {entry.is_self && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', marginLeft: 6, color: `rgba(${fRgb}, 0.7)` }}>
                (you)
              </span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: fColor,
            background: `rgba(${fRgb}, 0.1)`,
            border: `1px solid rgba(${fRgb}, 0.25)`,
            borderRadius: 3, padding: '2px 6px',
          }}>
            {FACTION_LABEL[entry.faction] ?? entry.faction}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#C9A961',
            background: 'rgba(201,169,97,0.08)',
            border: '1px solid rgba(201,169,97,0.2)',
            borderRadius: 3, padding: '2px 6px',
          }}>
            {CLASS_LABEL[entry.class] ?? entry.class}
          </span>
        </div>
      </div>

      {/* Value */}
      <div style={{
        flexShrink: 0,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 22, letterSpacing: '0.04em',
        color: entry.is_self ? fColor : '#F0F0F8',
        lineHeight: 1,
        textAlign: 'right',
      }}>
        {fmt(entry.value)}{unit && ` ${unit}`}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
}

export default function Leaderboard() {
  const { user, loading: authLoading } = usePantheonWars()
  const navigate = useNavigate()

  const [entries,   setEntries]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [type,      setType]      = useState('level')
  const [faction,   setFaction]   = useState('all')
  const [yourRank,  setYourRank]  = useState(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/games/pantheon-wars/game?action=leaderboard&type=${type}&faction=${faction}`)
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load leaderboard.'); return }
      const data = await res.json()
      setEntries(data.entries)
      setYourRank(data.your_rank ?? null)
    } catch { setError('Network error.') }
    finally   { setLoading(false) }
  }, [type, faction, navigate])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const activeType = TYPES.find(t => t.key === type)

  return (
    <>
      <style>{`
        @media (max-width: 480px) {
          .pw-lb-type-tabs { gap: 6px !important; }
          .pw-lb-type-tabs button { padding: 7px 8px !important; font-size: 9px !important; }
          .pw-lb-faction-tabs button { padding: 5px 8px !important; }
        }
      `}</style>

      <PWPageShell title="LEADERBOARD" rightSlot={<PWBackButton />} backgroundVariant="leaderboard">

          {/* Type tabs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pw-lb-type-tabs"
            style={{ display: 'flex', gap: 8, marginBottom: 12 }}
          >
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase',
                  color: type === t.key ? '#F0F0F8' : 'rgba(240,240,248,0.35)',
                  background: type === t.key ? 'rgba(255,255,255,0.09)' : 'transparent',
                  border: `1px solid ${type === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 150ms',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.glyph} {t.label}
              </button>
            ))}
          </motion.div>

          {/* Faction filter */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="pw-lb-faction-tabs"
            style={{ display: 'flex', gap: 7, marginBottom: 24, flexWrap: 'wrap' }}
          >
            {FACTIONS.map(f => {
              const fColor = f.key !== 'all' ? (FACTION_COLOR[f.key] ?? '#F0F0F8') : 'rgba(240,240,248,0.6)'
              const active = faction === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFaction(f.key)}
                  style={{
                    padding: '5px 12px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: active ? fColor : 'rgba(240,240,248,0.3)',
                    background: active ? `rgba(${hexRgb(fColor)}, 0.08)` : 'transparent',
                    border: `1px solid ${active ? `rgba(${hexRgb(fColor)}, 0.3)` : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 5, cursor: 'pointer', transition: 'all 150ms',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </motion.div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0,1,2,3,4,5,6,7].map(i => <Skeleton key={i} h={68} r={8} />)}
            </div>
          )}

          {!loading && error && (
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F87171', textAlign: 'center', marginTop: 48 }}>
              // {error}
            </p>
          )}

          {/* Entries */}
          {!loading && !error && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${type}-${faction}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {entries.length === 0 ? (
                  <div style={{
                    textAlign: 'center', marginTop: 48,
                    padding: '32px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                  }}>
                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: 'rgba(240,240,248,0.25)', marginBottom: 8,
                    }}>
                      // NO ENTRIES YET
                    </p>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13, color: 'rgba(240,240,248,0.35)',
                    }}>
                      Be the first to claim a rank.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Column header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '6px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: 8,
                    }}>
                      <div style={{ width: 32, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.22)' }}>
                        RANK
                      </div>
                      <div style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.22)' }}>
                        PLAYER
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.22)' }}>
                        {activeType?.label ?? type.toUpperCase()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {entries.map(entry => (
                        <RankRow key={`${entry.rank}-${entry.username}`} entry={entry} type={type} />
                      ))}
                    </div>

                    <p style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 9, letterSpacing: '0.08em',
                      color: 'rgba(240,240,248,0.18)',
                      textAlign: 'center', marginTop: 20,
                    }}>
                      // TOP {entries.length} OF ALL TIME
                    </p>

                    {/* Your rank (only shown when not in top 100) */}
                    {yourRank !== null && !entries.some(e => e.is_self) && (
                      <div style={{
                        marginTop: 16,
                        padding: '12px 16px',
                        background: 'rgba(139,92,246,0.06)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: 8,
                        textAlign: 'center',
                      }}>
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'rgba(167,139,250,0.7)',
                        }}>
                          Your rank: #{fmt(yourRank)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
      </PWPageShell>
    </>
  )
}

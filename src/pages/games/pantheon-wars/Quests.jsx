import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_META = [
  { tier: 1, label: 'MORTAL ERRANDS',      range: 'Level 1–9'   },
  { tier: 2, label: 'FACTION WARFARE',     range: 'Level 10–24' },
  { tier: 3, label: 'DIVINE CONFLICT',     range: 'Level 25–49' },
  { tier: 4, label: 'MYTHIC CAMPAIGNS',    range: 'Level 50–74' },
  { tier: 5, label: 'ENDGAME / ASCENSION', range: 'Level 75–100' },
]

const TIER_COLOR = {
  1: '#78C5F0',
  2: '#F5C542',
  3: '#A78BFA',
  4: '#F97316',
  5: '#EF4444',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

function masteryPct(completions, target) {
  return target > 0 ? Math.min(100, Math.round((completions / target) * 100)) : 0
}

function masteryLabel(completions, target) {
  const pct = masteryPct(completions, target)
  if (pct >= 100) return { text: 'MASTERED', color: '#FBBF24' }
  if (pct >= 75)  return { text: 'GOLD',     color: '#F5C542' }
  if (pct >= 50)  return { text: 'SILVER',   color: '#A0A0B8' }
  if (pct >= 25)  return { text: 'BRONZE',   color: '#CD7F32' }
  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

function EnergyBar({ energy, energyMax }) {
  const pct = energyMax > 0 ? Math.min(100, Math.round((energy / energyMax) * 100)) : 0
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: '#00C8FF',
        }}>
          ⚡ Energy
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          color: 'rgba(240,240,248,0.7)',
        }}>
          {energy}
          <span style={{ color: 'rgba(240,240,248,0.3)', fontSize: 10 }}> / {energyMax}</span>
        </span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: '#00C8FF', borderRadius: 3 }}
        />
      </div>
    </div>
  )
}

function MasteryBar({ completions, target, tierColor }) {
  const pct = masteryPct(completions, target)
  const badge = masteryLabel(completions, target)
  const milestones = [25, 50, 75, 100]

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(240,240,248,0.28)',
        }}>
          Mastery {completions}/{target}
        </span>
        {badge && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: badge.color,
          }}>
            ◆ {badge.text}
          </span>
        )}
      </div>
      <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'visible' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            height: '100%',
            background: pct >= 100 ? '#FBBF24' : tierColor,
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
        {milestones.map(m => (
          <div key={m} style={{
            position: 'absolute',
            top: -2,
            left: `${m}%`,
            width: 1,
            height: 8,
            background: 'rgba(255,255,255,0.2)',
            transform: 'translateX(-50%)',
          }} />
        ))}
      </div>
    </div>
  )
}

function QuestCard({ quest, stats, onComplete, completing }) {
  const canAfford = stats.energy >= quest.energy_cost
  const tierColor = TIER_COLOR[quest.tier] ?? '#F0F0F8'
  const isCompleting = completing === quest.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCompleting ? 'rgba(0,200,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 10,
        padding: '16px',
        transition: 'border-color 200ms',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Left: name + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            letterSpacing: '0.06em',
            color: '#F0F0F8',
            margin: '0 0 5px',
            lineHeight: 1,
          }}>
            {quest.name}
          </h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'rgba(240,240,248,0.45)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {quest.description}
          </p>

          {/* Reward strip */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px 14px',
            marginTop: 10,
          }}>
            <span className="pw-reward-chip" style={{ color: '#00C8FF' }}>
              ⚡ {quest.energy_cost}
            </span>
            <span className="pw-reward-chip" style={{ color: '#A78BFA' }}>
              +{fmt(quest.xp_reward)} XP
            </span>
            <span className="pw-reward-chip" style={{ color: '#F5C542' }}>
              +{fmt(quest.drachma_base)}
              {quest.drachma_range > 0 ? `–${fmt(quest.drachma_base + quest.drachma_range)}` : ''} ₯
            </span>
            {quest.loot_chance > 0 && (
              <span className="pw-reward-chip" style={{ color: '#22C55E' }}>
                ~{quest.loot_chance}% loot
              </span>
            )}
          </div>

          <MasteryBar
            completions={quest.completions}
            target={quest.mastery_target}
            tierColor={tierColor}
          />
        </div>

        {/* Right: action button */}
        <div style={{ flexShrink: 0 }}>
          <motion.button
            whileHover={canAfford && !isCompleting ? { scale: 1.04 } : {}}
            whileTap={canAfford && !isCompleting ? { scale: 0.97 } : {}}
            onClick={() => canAfford && !isCompleting && onComplete(quest.id)}
            disabled={!canAfford || isCompleting}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:   canAfford ? '#00C8FF' : 'rgba(240,240,248,0.2)',
              background: 'transparent',
              border: `1px solid ${canAfford ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6,
              padding: '8px 14px',
              cursor: canAfford && !isCompleting ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              transition: 'color 150ms, border-color 150ms',
              opacity: isCompleting ? 0.6 : 1,
            }}
          >
            {isCompleting ? '···' : 'UNDERTAKE'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function RewardToast({ reward, level, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'rgba(7,7,13,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,200,255,0.35)',
        borderRadius: 10,
        padding: '12px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#A78BFA' }}>
        +{fmt(reward.xp)} XP
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#F5C542' }}>
        +{fmt(reward.drachma)} ₯
      </span>
      {reward.loot && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#22C55E' }}>
          LOOT ◆
        </span>
      )}
      {level > 0 && (
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: '0.06em', color: '#FBBF24' }}>
          ⭐ LEVEL UP!
        </span>
      )}
    </motion.div>
  )
}

// ─── Quests page ──────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
}

export default function Quests() {
  const { user, loading: authLoading, refresh: refreshContext } = usePantheonWars()
  const navigate = useNavigate()

  const [quests,    setQuests]    = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [completing, setCompleting] = useState(null)  // quest id being completed
  const [toast,     setToast]     = useState(null)    // { reward, levelsGained }

  // Track completions locally to avoid re-fetching the whole list
  const completionsRef = useRef({})

  useEffect(() => {
    if (!authLoading && !user) navigate('/games/pantheon-wars/login', { replace: true })
  }, [authLoading, user, navigate])

  const fetchQuests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=quests')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load quests.'); return }
      const data = await res.json()
      setQuests(data.quests)
      setStats(data.stats)
      // Seed completions ref
      const map = {}
      for (const q of data.quests) map[q.id] = q.completions
      completionsRef.current = map
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => { fetchQuests() }, [fetchQuests])

  async function handleComplete(questId) {
    setCompleting(questId)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quest_id: questId }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Inline error — just re-enable button
        return
      }

      // Update stats in place
      setStats(data.stats)

      // Update completions for this quest in the list
      setQuests(prev => prev.map(q =>
        q.id === questId ? { ...q, completions: data.completions } : q
      ))

      // Show reward toast
      setToast({ reward: data.rewards, levelsGained: data.levelsGained })

      // Sync global context in background (updates dashboard energy/XP)
      refreshContext()
    } finally {
      setCompleting(null)
    }
  }

  // Group quests by tier
  const byTier = {}
  for (const q of quests) {
    if (!byTier[q.tier]) byTier[q.tier] = []
    byTier[q.tier].push(q)
  }
  const activeTiers = TIER_META.filter(t => byTier[t.tier]?.length > 0)

  return (
    <>
      <style>{`
        @keyframes pw-pulse { 0%,100%{opacity:1} 50%{opacity:0.38} }
        .pw-skel { background:rgba(255,255,255,0.07); animation:pw-pulse 1.6s ease-in-out infinite; }
        .pw-reward-chip {
          fontFamily: "'IBM Plex Mono', monospace";
          font-size: 11px;
          letter-spacing: 0.06em;
        }
      `}</style>

      {/* Reward toast */}
      <AnimatePresence>
        {toast && (
          <RewardToast
            reward={toast.reward}
            level={toast.levelsGained}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          minHeight: '100vh',
          background: '#07070D',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(245,197,66,0.07) 0%, transparent 55%)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'DM Sans', sans-serif",
          color: '#F0F0F8',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
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
            <span style={{ fontSize: 14 }}>⚔</span>
            <span style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              letterSpacing: '0.1em',
            }}>
              PANTHEON WARS
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.3)',
              marginLeft: 4,
            }}>
              / QUEST BOARD
            </span>
          </div>
          <Link
            to="/games/pantheon-wars"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.38)',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '6px 12px',
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
            ← Command Center
          </Link>
        </header>

        {/* ── Main ────────────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: 680,
          margin: '0 auto',
          padding: '28px 20px 64px',
        }}>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton h={54} />
              <Skeleton h={22} w={160} />
              {[0,1,2].map(i => <Skeleton key={i} h={120} />)}
            </div>
          )}

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

          {!loading && !error && stats && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            >
              {/* Energy bar */}
              <motion.div variants={fadeUp}>
                <EnergyBar energy={stats.energy} energyMax={stats.energy_max} />
              </motion.div>

              {/* Tier sections */}
              {activeTiers.map(({ tier, label, range }) => {
                const tierColor = TIER_COLOR[tier]
                const tierQuests = byTier[tier]
                return (
                  <motion.section key={tier} variants={fadeUp} style={{ marginBottom: 36 }}>
                    {/* Tier header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 10,
                      marginBottom: 14,
                      paddingBottom: 10,
                      borderBottom: `1px solid rgba(255,255,255,0.06)`,
                    }}>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 22,
                        letterSpacing: '0.08em',
                        color: tierColor,
                        lineHeight: 1,
                      }}>
                        TIER {tier} — {label}
                      </span>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(240,240,248,0.28)',
                      }}>
                        {range}
                      </span>
                    </div>

                    {/* Quest list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {tierQuests.map(quest => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          stats={stats}
                          onComplete={handleComplete}
                          completing={completing}
                        />
                      ))}
                    </div>
                  </motion.section>
                )
              })}

              {quests.length === 0 && (
                <motion.p
                  variants={fadeUp}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: 'rgba(240,240,248,0.32)',
                    textAlign: 'center',
                    marginTop: 48,
                  }}
                >
                  // No quests available at your current level.
                </motion.p>
              )}
            </motion.div>
          )}
        </main>
      </motion.div>
    </>
  )
}

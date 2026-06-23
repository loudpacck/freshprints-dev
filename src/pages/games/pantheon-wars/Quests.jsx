import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import { useSound } from '@/sound/useSound'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_META = [
  { tier: 1, label: 'MORTAL ERRANDS',      range: 'Level 1–9'   },
  { tier: 2, label: 'FACTION WARFARE',     range: 'Level 10–24' },
  { tier: 3, label: 'DIVINE CONFLICT',     range: 'Level 25–49' },
  { tier: 4, label: 'MYTHIC CAMPAIGNS',    range: 'Level 50–74' },
  { tier: 5, label: 'ENDGAME / ASCENSION', range: 'Level 75–100' },
  { tier: 6, label: 'MYTHIC ASCENSION',    range: 'Level 80+'   },
]

const TIER_COLOR = {
  1: '#8AB8D4',
  2: '#C9A961',
  3: '#A78BFA',
  4: '#F97316',
  5: '#EF4444',
  6: '#FBBF24',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

function fmtCountdown(secs) {
  if (secs == null || secs < 0) return '--:--:--'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function useRotationCountdown(expiresAtMs, onExpired) {
  const [secsLeft, setSecsLeft] = useState(null)
  const cbRef = useRef(onExpired)
  useEffect(() => { cbRef.current = onExpired }, [onExpired])
  useEffect(() => {
    if (!expiresAtMs) { setSecsLeft(null); return }
    const compute = () => Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
    setSecsLeft(compute())
    const id = setInterval(() => {
      const s = compute()
      setSecsLeft(s)
      if (s <= 0) { cbRef.current?.(); clearInterval(id) }
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAtMs])
  return secsLeft
}

function masteryPct(completions, target) {
  return target > 0 ? Math.min(100, Math.round((completions / target) * 100)) : 0
}

function masteryLabel(completions, target) {
  const pct = masteryPct(completions, target)
  if (pct >= 100) return { text: 'MASTERED', color: '#FBBF24' }
  if (pct >= 75)  return { text: 'GOLD',     color: '#C9A961' }
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
          color: '#C9A961',
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
          style={{ height: '100%', background: '#C9A961', borderRadius: 3 }}
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

function BonusTag({ label, color }) {
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 4, padding: '2px 7px',
    }}>
      {label}
    </span>
  )
}

function QuestCard({ quest, stats, user, onComplete, completing }) {
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
        border: `1px solid ${isCompleting ? 'rgba(201,169,97,0.25)' : 'rgba(255,255,255,0.07)'}`,
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
            <span className="pw-reward-chip" style={{ color: '#C9A961' }}>
              ⚡ {quest.energy_cost}
            </span>
            <span className="pw-reward-chip" style={{ color: '#A78BFA' }}>
              +{fmt(quest.xp_reward)} XP
            </span>
            <span className="pw-reward-chip" style={{ color: '#C9A961' }}>
              +{fmt(quest.drachma_base)}
              {quest.drachma_range > 0 ? `–${fmt(quest.drachma_base + quest.drachma_range)}` : ''} ₯
            </span>
            {quest.loot_chance > 0 && (
              <span className="pw-reward-chip" style={{ color: '#22C55E' }}>
                ~{quest.loot_chance}% loot
              </span>
            )}
          </div>

          {/* Bonus chips */}
          {user && (() => {
            const chips = []
            if (user.faction === 'olympians') chips.push(<BonusTag key="oly" label="+10% XP" color="#E8D080" />)
            if (user.faction === 'annunaki')  chips.push(<BonusTag key="ann" label="+5% ₯" color="#C25E3C" />)
            if (user.class   === 'broker')    chips.push(<BonusTag key="brk" label="+10% ₯" color="#C9A961" />)
            if (quest.faction_bonus && user.faction === quest.faction_bonus) {
              const t = quest.faction_bonus_type; const v = quest.faction_bonus_value
              chips.push(<BonusTag key="qf" label={`${t === 'xp' ? '+' + v + '% XP' : t === 'drachma' ? '+' + v + '% ₯' : t === 'loot_chance' ? '+' + v + '% LOOT' : t === 'guaranteed_loot' ? '★ LOOT' : '+' + v + '% ' + t.toUpperCase()}`} color="#E8D080" />)
            }
            if (quest.class_bonus && user.class === quest.class_bonus) {
              const t = quest.class_bonus_type; const v = quest.class_bonus_value
              chips.push(<BonusTag key="qc" label={`${t === 'xp' ? '+' + v + '% XP' : t === 'drachma' ? '+' + v + '% ₯' : t === 'loot_chance' ? '+' + v + '% LOOT' : '+' + v + '% ' + t.toUpperCase()}`} color="#C9A961" />)
            }
            if (chips.length === 0) return null
            return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>{chips}</div>
          })()}

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
              color:   canAfford ? '#C9A961' : 'rgba(240,240,248,0.2)',
              background: 'transparent',
              border: `1px solid ${canAfford ? 'rgba(201,169,97,0.4)' : 'rgba(255,255,255,0.08)'}`,
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
  }, [onDone]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 88px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        maxWidth: 'calc(100vw - 32px)',
        width: 'max-content',
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(16px)',
        border: '2px solid var(--color-accent-gold-dim, #6F5C32)',
        borderRadius: 6,
        padding: '12px 22px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 18,
        boxShadow: '0 0 16px rgba(201,169,97,0.45), 0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#9B8AC4' }}>
        +{fmt(reward.xp)} XP
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--color-accent-gold-bright, #F5D88B)' }}>
        +{fmt(reward.drachma)} ₯
      </span>
      {reward.loot && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--color-success, #5FB857)' }}>
          ◆ {reward.loot.name}
          <span style={{ color: 'rgba(95,184,87,0.6)', fontSize: 10, marginLeft: 5 }}>
            [{reward.loot.rarity}]
          </span>
        </span>
      )}
      {reward.bonuses_applied?.length > 0 && (
        <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {reward.bonuses_applied.filter(b => b.source !== 'quest_faction' && b.source !== 'quest_class').map((b, i) => (
            <span key={i} style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: b.source === 'olympians' ? '#E8D080' : b.source === 'annunaki' ? '#C25E3C' : '#C9A961',
              background: b.source === 'olympians' ? 'rgba(232,208,128,0.12)' : b.source === 'annunaki' ? 'rgba(194,94,60,0.12)' : 'rgba(201,169,97,0.12)',
              border: `1px solid ${b.source === 'olympians' ? 'rgba(232,208,128,0.3)' : b.source === 'annunaki' ? 'rgba(194,94,60,0.3)' : 'rgba(201,169,97,0.3)'}`,
              borderRadius: 3, padding: '1px 5px',
            }}>
              {b.source === 'olympians' ? '+10% XP' : b.source === 'annunaki' ? '+5% ₯' : '+10% ₯'}
            </span>
          ))}
        </span>
      )}
      {level > 0 && (
        <span style={{ fontFamily: "var(--pw-font-display, 'Cinzel', serif)", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-warning, #D4A437)' }}>
          ★ LEVEL UP!
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
  const { user, loading: authLoading, refresh: refreshContext, addPendingReward } = usePantheonWars()
  const navigate = useNavigate()
  const { play } = useSound()

  const [quests,    setQuests]    = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [completing,       setCompleting]       = useState(null)
  const [toast,            setToast]            = useState(null)
  const [rotationExpiresAt, setRotationExpiresAt] = useState(null)

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
      if (data.rotation_expires_at) setRotationExpiresAt(data.rotation_expires_at)
      if (data.pendingAdventureRewards) addPendingReward(data.pendingAdventureRewards)
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
    play('quest_accept')
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

      setToast({ reward: data.rewards, levelsGained: data.levelsGained })
      if (data.pendingAdventureRewards) addPendingReward(data.pendingAdventureRewards)

      // SFX
      play('questComplete')
      if (data.rewards?.loot) {
        const lootSound = ['rare', 'epic', 'legendary'].includes(data.rewards.loot.rarity) ? 'rare_loot' : 'loot_drop'
        setTimeout(() => play(lootSound), 300)
      }
      if (data.levelsGained > 0) setTimeout(() => play('levelUp'), 600)

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

  const rotationSecsLeft = useRotationCountdown(rotationExpiresAt, fetchQuests)

  return (
    <>
      <AnimatePresence>
        {toast && (
          <RewardToast
            reward={toast.reward}
            level={toast.levelsGained}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <PWPageShell title="QUEST BOARD" rightSlot={<PWBackButton />} backgroundVariant="quests">

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
              {/* Rotation countdown */}
              <motion.div variants={fadeUp} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 6,
              }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.1em', color: 'rgba(240,240,248,0.28)', textTransform: 'uppercase' }}>
                  Showing 5 of {quests.length + '+'} quests
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: '0.08em', color: 'rgba(240,240,248,0.32)' }}>
                  Next refresh: {fmtCountdown(rotationSecsLeft)}
                </span>
              </motion.div>

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
                          user={user}
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
      </PWPageShell>
    </>
  )
}

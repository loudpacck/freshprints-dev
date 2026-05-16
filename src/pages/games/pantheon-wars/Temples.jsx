import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { usePantheonWars } from '@/contexts/PantheonWarsContext'
import PWBackButton from '@/components/games/pantheon-wars/PWBackButton'
import PWPageShell from '@/components/games/pantheon-wars/PWPageShell'
import { useSound } from '@/sound/useSound'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return Number(n).toLocaleString() }

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ h = 20, w = '100%', r = 6 }) {
  return <div className="pw-skel" style={{ height: h, width: w, borderRadius: r }} />
}

function TempleToast({ data, onDone }) {
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
        top: 'calc(env(safe-area-inset-top, 0px) + 88px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: 'linear-gradient(180deg, var(--color-bg-elevated, #14101A), var(--color-bg-base, #0A0710))',
        backdropFilter: 'blur(12px)',
        border: '2px solid var(--color-accent-gold-dim, #6F5C32)',
        borderRadius: 6,
        padding: '12px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        whiteSpace: 'nowrap',
        boxShadow: 'var(--glow-gold, 0 0 16px rgba(201,169,97,0.45)), 0 4px 24px rgba(0,0,0,0.6)',
      }}
    >
      <span style={{ fontFamily: "var(--pw-font-display, 'Cinzel', serif)", fontSize: 13, letterSpacing: '0.1em', color: 'var(--color-accent-gold, #C9A961)' }}>
        {data.type === 'buy' ? 'TEMPLE ACQUIRED' : 'UPGRADED'}
      </span>
      <span style={{ fontFamily: "var(--pw-font-mono, 'IBM Plex Mono', monospace)", fontSize: 12, color: 'var(--color-text-primary, #EDE3CC)' }}>
        {data.name}
      </span>
      {data.type === 'buy' && (
        <span style={{ fontFamily: "var(--pw-font-mono, 'IBM Plex Mono', monospace)", fontSize: 12, color: 'var(--color-danger, #B8443A)' }}>
          -{fmt(data.cost)} ₯
        </span>
      )}
      {data.type === 'upgrade' && (
        <>
          <span style={{ fontFamily: "var(--pw-font-mono, 'IBM Plex Mono', monospace)", fontSize: 12, color: 'var(--color-text-secondary, #A89B7E)' }}>
            → LVL {data.newLevel}
          </span>
          <span style={{ fontFamily: "var(--pw-font-mono, 'IBM Plex Mono', monospace)", fontSize: 12, color: 'var(--color-success, #5FB857)' }}>
            +{fmt(data.incomeDelta)} ₯/hr
          </span>
        </>
      )}
    </motion.div>
  )
}

function TotalIncomeCard({ totalIncome, ownedCount, drachma }) {
  return (
    <Link to="/games/pantheon-wars/temples" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
      <div style={{
        background: 'rgba(167,139,250,0.06)',
        border: '1px solid rgba(167,139,250,0.2)',
        borderRadius: 10,
        padding: '18px 20px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'rgba(167,139,250,0.7)',
          }}>
            TEMPLE INCOME
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.08em',
            color: 'rgba(240,240,248,0.3)',
          }}>
            {ownedCount} temple{ownedCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 36,
          letterSpacing: '0.04em',
          color: '#A78BFA',
          lineHeight: 1,
          marginBottom: 6,
        }}>
          {fmt(totalIncome)} ₯/hr
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: 'rgba(240,240,248,0.35)',
          letterSpacing: '0.06em',
        }}>
          Balance: {fmt(drachma)} ₯
        </div>
      </div>
    </Link>
  )
}

function OwnedTempleCard({ temple, onUpgrade, isUpgrading }) {
  const incomeDelta = Math.round(temple.income_per_hour * 0.25) // GDD: +25% per level, where income_per_hour is base

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 16,
            letterSpacing: '0.06em',
            color: '#F0F0F8',
          }}>
            {temple.name}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: temple.upgrade_level >= 10 ? '#FBBF24' : '#A78BFA',
            background: temple.upgrade_level >= 10 ? 'rgba(251,191,36,0.1)' : 'rgba(167,139,250,0.1)',
            border: `1px solid ${temple.upgrade_level >= 10 ? 'rgba(251,191,36,0.3)' : 'rgba(167,139,250,0.3)'}`,
            borderRadius: 4,
            padding: '2px 6px',
            whiteSpace: 'nowrap',
          }}>
            {temple.upgrade_level >= 10 ? 'MAX' : `LVL ${temple.upgrade_level}`}
          </span>
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          color: '#22C55E',
          letterSpacing: '0.05em',
        }}>
          {fmt(temple.current_income_per_hour)} ₯/hr
        </div>
      </div>

      {temple.upgrade_level >= 10 ? (
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#FBBF24',
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          whiteSpace: 'nowrap',
        }}>
          MAX
        </div>
      ) : (
        <motion.button
          whileHover={temple.can_upgrade && !isUpgrading ? { scale: 1.04 } : {}}
          whileTap={temple.can_upgrade && !isUpgrading ? { scale: 0.97 } : {}}
          onClick={() => temple.can_upgrade && !isUpgrading && onUpgrade(temple.id)}
          disabled={!temple.can_upgrade || isUpgrading}
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: temple.can_upgrade ? '#A78BFA' : 'rgba(240,240,248,0.2)',
            background: 'transparent',
            border: `1px solid ${temple.can_upgrade ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6,
            padding: '8px 12px',
            cursor: temple.can_upgrade && !isUpgrading ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            transition: 'color 150ms, border-color 150ms',
            opacity: isUpgrading ? 0.6 : 1,
          }}
        >
          {isUpgrading ? '···' : `${fmt(temple.upgrade_cost)} ₯`}
        </motion.button>
      )}
    </div>
  )
}

function CatalogTempleCard({ temple, onBuy, isBuying }) {
  const canInteract = temple.canBuy && !isBuying

  let buttonLabel = `${fmt(temple.base_cost)} ₯`
  let buttonColor = '#C9A961'
  let borderColor = 'rgba(201,169,97,0.4)'
  if (temple.reason === 'level') {
    buttonLabel = `REQUIRES LVL ${temple.level_required}`
    buttonColor = 'rgba(240,240,248,0.2)'
    borderColor = 'rgba(255,255,255,0.08)'
  } else if (temple.reason === 'drachma') {
    buttonLabel = 'NEED MORE ₯'
    buttonColor = 'rgba(240,240,248,0.2)'
    borderColor = 'rgba(255,255,255,0.08)'
  }
  if (isBuying) buttonLabel = '···'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      opacity: temple.reason === 'level' ? 0.55 : 1,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 16,
            letterSpacing: '0.06em',
            color: '#F0F0F8',
          }}>
            {temple.name}
          </span>
          {temple.level_required > 1 && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(240,240,248,0.4)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
            }}>
              LVL {temple.level_required}+
            </span>
          )}
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          color: '#22C55E',
          letterSpacing: '0.05em',
        }}>
          {fmt(temple.income_per_hour)} ₯/hr
        </div>
      </div>

      <motion.button
        whileHover={canInteract ? { scale: 1.04 } : {}}
        whileTap={canInteract ? { scale: 0.97 } : {}}
        onClick={() => canInteract && onBuy(temple.type)}
        disabled={!canInteract}
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: buttonColor,
          background: 'transparent',
          border: `1px solid ${borderColor}`,
          borderRadius: 6,
          padding: '8px 12px',
          cursor: canInteract ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
          transition: 'color 150ms, border-color 150ms',
          opacity: isBuying ? 0.6 : 1,
        }}
      >
        {buttonLabel}
      </motion.button>
    </div>
  )
}

// ─── Temples page ─────────────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function Temples() {
  const { user, loading: authLoading, refresh: refreshContext } = usePantheonWars()
  const { play } = useSound()
  const navigate = useNavigate()

  const [catalog,     setCatalog]     = useState([])
  const [owned,       setOwned]       = useState([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [playerStats, setPlayerStats] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [buying,      setBuying]      = useState(null)   // temple_type being bought
  const [upgrading,   setUpgrading]   = useState(null)   // player_temple_id being upgraded
  const [toast,       setToast]       = useState(null)

  const fetchTemples = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=temples')
      if (res.status === 401) { navigate('/games/pantheon-wars/login', { replace: true }); return }
      if (!res.ok) { setError('Failed to load temples.'); return }
      const data = await res.json()
      setCatalog(data.catalog)
      setOwned(data.owned)
      setTotalIncome(data.total_income_per_hour)
      setPlayerStats(data.stats)
    } catch {
      setError('Network error. Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!authLoading && !user) { navigate('/games/pantheon-wars/login', { replace: true }); return }
    if (!authLoading) fetchTemples()
  }, [authLoading, user, navigate, fetchTemples])

  async function handleBuy(templeType) {
    setBuying(templeType)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=temples_buy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ temple_type: templeType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Purchase failed.')
        return
      }
      const templeEntry = catalog.find(c => c.type === templeType)
      setToast({
        type: 'buy',
        name: templeEntry?.name ?? templeType,
        cost: templeEntry?.base_cost ?? 0,
      })
      play('purchase')
      await fetchTemples()
      refreshContext()
    } catch {
      setError('Network error.')
    } finally {
      setBuying(null)
    }
  }

  async function handleUpgrade(playerTempleId) {
    setUpgrading(playerTempleId)
    try {
      const res = await fetch('/api/games/pantheon-wars/game?action=temples_upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ player_temple_id: playerTempleId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upgrade failed.')
        return
      }
      const temple = data.temple
      const prevTemple = owned.find(t => t.id === playerTempleId)
      const prevIncome = prevTemple?.current_income_per_hour ?? 0
      setToast({
        type:       'upgrade',
        name:       temple.name,
        newLevel:   temple.upgrade_level,
        incomeDelta: temple.current_income_per_hour - prevIncome,
      })
      play('templeUpgrade')
      await fetchTemples()
      refreshContext()
    } catch {
      setError('Network error.')
    } finally {
      setUpgrading(null)
    }
  }

  return (
    <>
      <AnimatePresence>
        {toast && (
          <TempleToast data={toast} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>

      <PWPageShell title="TEMPLES" rightSlot={<PWBackButton />} backgroundVariant="temples">

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Skeleton h={90} />
              <Skeleton h={14} w={120} />
              <Skeleton h={70} />
              <Skeleton h={70} />
              <Skeleton h={14} w={120} style={{ marginTop: 8 }} />
              <Skeleton h={70} />
              <Skeleton h={70} />
              <Skeleton h={70} />
            </div>
          )}

          {/* Error */}
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

          {/* Content */}
          {!loading && !error && playerStats && (
            <motion.div variants={stagger} initial="hidden" animate="visible">

              {/* Total income card */}
              <motion.div variants={fadeUp}>
                <TotalIncomeCard
                  totalIncome={totalIncome}
                  ownedCount={owned.length}
                  drachma={playerStats.drachma}
                />
              </motion.div>

              {/* Owned temples */}
              {owned.length > 0 && (
                <motion.section variants={fadeUp} style={{ marginBottom: 32 }}>
                  <p style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    letterSpacing: '0.13em',
                    textTransform: 'uppercase',
                    color: 'rgba(240,240,248,0.28)',
                    marginBottom: 14,
                  }}>
                    // YOUR TEMPLES
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {owned.map(t => (
                      <OwnedTempleCard
                        key={t.id}
                        temple={t}
                        onUpgrade={handleUpgrade}
                        isUpgrading={upgrading === t.id}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Catalog */}
              <motion.section variants={fadeUp}>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: 'rgba(240,240,248,0.28)',
                  marginBottom: 14,
                }}>
                  // AVAILABLE
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {catalog.map(t => (
                    <CatalogTempleCard
                      key={t.type}
                      temple={t}
                      onBuy={handleBuy}
                      isBuying={buying === t.type}
                    />
                  ))}
                </div>
              </motion.section>

            </motion.div>
          )}
      </PWPageShell>
    </>
  )
}

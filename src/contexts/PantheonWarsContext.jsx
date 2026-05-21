import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AdventureRewardModal from '@/components/games/pantheon-wars/AdventureRewardModal'

const PantheonWarsContext = createContext(null)

export function PantheonWarsProvider({ children }) {
  const [user,          setUser]          = useState(null)
  const [stats,         setStats]         = useState(null)
  const [equipBonuses,  setEquipBonuses]  = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [pendingReward, setPendingReward] = useState(null)

  // Queue of unacknowledged rewards; show one at a time
  const pendingQueueRef = useRef([])

  function addPendingReward(reward) {
    if (!reward) return
    setPendingReward(prev => {
      if (prev) {
        // Already showing one — push to queue
        pendingQueueRef.current.push(reward)
        return prev
      }
      return reward
    })
  }

  function advanceQueue() {
    const next = pendingQueueRef.current.shift()
    setPendingReward(next ?? null)
  }

  async function acknowledgeReward(rewardId) {
    try {
      if (rewardId) {
        await fetch('/api/games/pantheon-wars/game?action=acknowledge_reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reward_id: rewardId }),
        })
      }
    } catch { /* best-effort */ }
    advanceQueue()
  }

  // Check for unacknowledged adventure rewards whenever user changes (login / reload)
  useEffect(() => {
    if (!user?.id) { setPendingReward(null); pendingQueueRef.current = []; return }
    fetch('/api/games/pantheon-wars/game?action=pending_rewards')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.pending_rewards?.length) return
        const [first, ...rest] = data.pending_rewards.filter(r => r.type === 'adventure')
        if (first) {
          pendingQueueRef.current = rest
          setPendingReward(first)
        }
      })
      .catch(() => {})
  }, [user?.id])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/games/pantheon-wars/auth?action=me')
      if (res.status === 401) {
        setUser(null)
        setStats(null)
        setEquipBonuses(null)
        return
      }
      if (!res.ok) {
        setError('Failed to load player data.')
        return
      }
      const data = await res.json()
      setUser(data.user)
      setStats(data.stats)
      setEquipBonuses(data.equipment_bonuses ?? { attack: 0, defense: 0 })
    } catch {
      setError('Network error. Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function logout() {
    try {
      await fetch('/api/games/pantheon-wars/auth?action=logout', { method: 'POST' })
    } finally {
      setUser(null)
      setStats(null)
    }
  }

  return (
    <PantheonWarsContext.Provider value={{
      user, stats, equipBonuses, loading, error,
      refresh, logout,
      addPendingReward,
      pendingReward,
    }}>
      {children}
      <AnimatePresence>
        {pendingReward && (
          <AdventureRewardModal
            key={pendingReward.id ?? pendingReward.adventure_name}
            reward={pendingReward}
            onClose={() => acknowledgeReward(pendingReward.id)}
          />
        )}
      </AnimatePresence>
    </PantheonWarsContext.Provider>
  )
}

export function usePantheonWars() {
  const ctx = useContext(PantheonWarsContext)
  if (!ctx) throw new Error('usePantheonWars must be used inside PantheonWarsProvider')
  return ctx
}

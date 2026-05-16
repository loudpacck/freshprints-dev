import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const PantheonWarsContext = createContext(null)

export function PantheonWarsProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [stats,       setStats]       = useState(null)
  const [equipBonuses, setEquipBonuses] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

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
    <PantheonWarsContext.Provider value={{ user, stats, equipBonuses, loading, error, refresh, logout }}>
      {children}
    </PantheonWarsContext.Provider>
  )
}

export function usePantheonWars() {
  const ctx = useContext(PantheonWarsContext)
  if (!ctx) throw new Error('usePantheonWars must be used inside PantheonWarsProvider')
  return ctx
}

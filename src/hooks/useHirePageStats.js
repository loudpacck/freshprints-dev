import { useEffect, useState } from 'react'
import { pantheonWarsStats as defaultStats, buildHireProjects, hireProjects as defaultHireProjects } from '@/data/hirePageData'

// Fetches live Pantheon Wars stats from the public admin read (no auth).
// Renders the static defaults immediately (no blank/zero flash), then swaps
// in the fetched numbers in place if the request succeeds. Any failure
// (network error, slow response, malformed payload) just keeps the defaults.
export function useHirePageStats() {
  const [stats, setStats] = useState(defaultStats)
  const [hireProjects, setHireProjects] = useState(defaultHireProjects)

  useEffect(() => {
    let cancelled = false

    fetch('/api/admin/overview?action=hire_stats')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data?.stats) return
        const s = data.stats
        const merged = {
          gamePageViews: Number.isFinite(s.gamePageViews) ? s.gamePageViews : defaultStats.gamePageViews,
          questsCompleted: Number.isFinite(s.questsCompleted) ? s.questsCompleted : defaultStats.questsCompleted,
          pvpFights: Number.isFinite(s.pvpFights) ? s.pvpFights : defaultStats.pvpFights,
          drachmaEconomy: Number.isFinite(s.drachmaEconomy) ? s.drachmaEconomy : defaultStats.drachmaEconomy,
          activePlayers: Number.isFinite(s.activePlayers) ? s.activePlayers : defaultStats.activePlayers,
        }
        setStats(merged)
        setHireProjects(buildHireProjects(merged))
      })
      .catch(() => {
        // network error / offline — keep defaults, never show blank or zero
      })

    return () => { cancelled = true }
  }, [])

  return { stats, hireProjects }
}

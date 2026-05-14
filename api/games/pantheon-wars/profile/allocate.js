import { sql } from '../../../../lib/db.js'
import { requireUser } from '../../../../lib/pwAuth.js'
import { regenPlayer } from '../../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { attack = 0, defense = 0 } = req.body || {}
  const a = Number(attack)
  const d = Number(defense)

  if (!Number.isInteger(a) || !Number.isInteger(d) || a < 0 || d < 0) {
    return res.status(400).json({ error: 'Invalid allocation values' })
  }
  const total = a + d
  if (total === 0) return res.status(400).json({ error: 'No points to allocate' })

  try {
    const rows = await sql`
      SELECT stat_points, attack, defense,
             energy, energy_max, health, health_max, last_updated
      FROM pw_player_stats
      WHERE user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player stats not found' })

    // Apply passive regen before validating (folds into the single write below)
    const stats = regenPlayer(rows[0])

    if (stats.stat_points < total) {
      return res.status(400).json({
        error: 'Insufficient stat points',
        available: stats.stat_points,
        requested: total,
      })
    }

    const newAttack     = stats.attack     + a
    const newDefense    = stats.defense    + d
    const newStatPoints = stats.stat_points - total

    await sql`
      UPDATE pw_player_stats SET
        attack       = ${newAttack},
        defense      = ${newDefense},
        stat_points  = ${newStatPoints},
        energy       = ${stats.energy},
        health       = ${stats.health},
        last_updated = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    return res.status(200).json({
      ok: true,
      allocated: { attack: a, defense: d },
      newStats: { attack: newAttack, defense: newDefense, stat_points: newStatPoints },
    })
  } catch (err) {
    console.error('[/api/games/pantheon-wars/profile/allocate]', err.message)
    return res.status(500).json({ error: 'Allocation failed' })
  }
})

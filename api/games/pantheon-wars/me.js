import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'
import { regenPlayer } from '../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rows = await sql`
      SELECT
        u.id, u.username, u.email, u.faction, u.class, u.alignment,
        u.created_at, u.last_login,
        s.level, s.xp, s.energy, s.energy_max, s.health, s.health_max,
        s.drachma, s.drachma_lifetime, s.glory, s.attack, s.defense,
        s.stat_points, s.last_updated
      FROM pw_users u
      JOIN pw_player_stats s ON s.user_id = u.id
      WHERE u.id = ${req.userId}
    `

    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const row = rows[0]
    let statsRaw = {
      level: row.level, xp: row.xp,
      energy: row.energy, energy_max: row.energy_max,
      health: row.health, health_max: row.health_max,
      drachma: row.drachma, drachma_lifetime: row.drachma_lifetime,
      glory: row.glory, attack: row.attack, defense: row.defense,
      stat_points: row.stat_points, last_updated: row.last_updated,
    }

    const statsRegen = regenPlayer(statsRaw)
    if (statsRegen.energy !== statsRaw.energy || statsRegen.health !== statsRaw.health) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${statsRegen.energy}, health = ${statsRegen.health},
            last_updated = ${statsRegen.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    const user = {
      id:         row.id,
      username:   row.username,
      email:      row.email,
      faction:    row.faction,
      class:      row.class,
      alignment:  row.alignment,
      created_at: row.created_at,
      last_login: row.last_login,
    }

    return res.status(200).json({ user, stats: statsRegen })
  } catch (err) {
    console.error('Me error:', err)
    return res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

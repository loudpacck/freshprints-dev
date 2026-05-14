import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'
import { regenPlayer } from '../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const statsRows = await sql`SELECT * FROM pw_player_stats WHERE user_id = ${req.userId}`
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    let stats = regenPlayer(statsRows[0])

    if (stats.energy !== statsRows[0].energy || stats.health !== statsRows[0].health) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${stats.energy}, health = ${stats.health}, last_updated = ${stats.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    const quests = await sql`
      SELECT
        q.id, q.name, q.description, q.tier, q.energy_cost,
        q.xp_reward, q.drachma_base, q.drachma_range,
        q.loot_chance, q.level_required, q.mastery_target,
        COALESCE(p.completions, 0) AS completions
      FROM pw_quests q
      LEFT JOIN pw_quest_progress p
        ON p.quest_id = q.id AND p.user_id = ${req.userId}
      WHERE q.level_required <= ${stats.level}
      ORDER BY q.tier, q.level_required, q.id
    `

    return res.status(200).json({ quests, stats })
  } catch (err) {
    console.error('Quests error:', err)
    return res.status(500).json({ error: 'Failed to fetch quests' })
  }
})

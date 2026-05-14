import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

const VALID_TYPES    = ['level', 'glory', 'drachma', 'mastery']
const VALID_FACTIONS = ['all', 'olympians', 'aesir', 'annunaki']

export default requireUser(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const type    = VALID_TYPES.includes(req.query.type)       ? req.query.type    : 'level'
  const faction = VALID_FACTIONS.includes(req.query.faction) ? req.query.faction : 'all'

  try {
    let entries

    if (type === 'mastery') {
      entries = faction === 'all'
        ? await sql`
            SELECT u.id, u.username, u.faction, u.class,
                   COALESCE(SUM(qp.completions), 0) AS value
            FROM pw_users u
            LEFT JOIN pw_quest_progress qp ON qp.user_id = u.id
            GROUP BY u.id, u.username, u.faction, u.class
            ORDER BY value DESC, u.username LIMIT 100`
        : await sql`
            SELECT u.id, u.username, u.faction, u.class,
                   COALESCE(SUM(qp.completions), 0) AS value
            FROM pw_users u
            LEFT JOIN pw_quest_progress qp ON qp.user_id = u.id
            WHERE u.faction = ${faction}
            GROUP BY u.id, u.username, u.faction, u.class
            ORDER BY value DESC, u.username LIMIT 100`

    } else if (type === 'glory') {
      entries = faction === 'all'
        ? await sql`
            SELECT u.id, u.username, u.faction, u.class, ps.glory AS value
            FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
            ORDER BY ps.glory DESC, ps.level DESC LIMIT 100`
        : await sql`
            SELECT u.id, u.username, u.faction, u.class, ps.glory AS value
            FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
            WHERE u.faction = ${faction}
            ORDER BY ps.glory DESC, ps.level DESC LIMIT 100`

    } else if (type === 'drachma') {
      entries = faction === 'all'
        ? await sql`
            SELECT u.id, u.username, u.faction, u.class, ps.drachma_lifetime AS value
            FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
            ORDER BY ps.drachma_lifetime DESC, ps.level DESC LIMIT 100`
        : await sql`
            SELECT u.id, u.username, u.faction, u.class, ps.drachma_lifetime AS value
            FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
            WHERE u.faction = ${faction}
            ORDER BY ps.drachma_lifetime DESC, ps.level DESC LIMIT 100`

    } else {
      // level (default)
      entries = faction === 'all'
        ? await sql`
            SELECT u.id, u.username, u.faction, u.class, ps.level AS value
            FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
            ORDER BY ps.level DESC, ps.xp DESC LIMIT 100`
        : await sql`
            SELECT u.id, u.username, u.faction, u.class, ps.level AS value
            FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
            WHERE u.faction = ${faction}
            ORDER BY ps.level DESC, ps.xp DESC LIMIT 100`
    }

    const ranked = entries.map((row, i) => ({
      rank:    i + 1,
      username: row.username,
      faction:  row.faction,
      class:    row.class,
      value:    Number(row.value),
      is_self:  row.id === req.userId,
    }))

    return res.status(200).json({ entries: ranked, type, faction })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

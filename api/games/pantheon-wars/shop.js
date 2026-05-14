import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'
import { regenPlayer } from '../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rows = await sql`
      SELECT ps.*, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    let stats = regenPlayer(rows[0])
    if (stats.energy !== rows[0].energy || stats.health !== rows[0].health) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${stats.energy}, health = ${stats.health}, last_updated = ${stats.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    // All items with a buy_price (drachma shop) or glory_price (glory shop)
    const items = await sql`
      SELECT id, name, description, slot, attack_bonus, defense_bonus,
             rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price
      FROM pw_items
      WHERE buy_price IS NOT NULL OR glory_price IS NOT NULL
      ORDER BY slot, level_required, rarity
    `

    const drachma_items = items.filter(i => i.buy_price !== null)
    const glory_items   = items.filter(i => i.glory_price !== null)

    return res.status(200).json({
      drachma_items,
      glory_items,
      player: {
        drachma: stats.drachma,
        glory:   stats.glory,
        level:   stats.level,
        faction: rows[0].faction,
      },
    })
  } catch (err) {
    console.error('Shop error:', err)
    return res.status(500).json({ error: 'Failed to fetch shop' })
  }
})

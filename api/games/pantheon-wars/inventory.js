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

    const inventory = await sql`
      SELECT
        inv.id AS inventory_id,
        inv.equipped,
        inv.acquired_at,
        i.id AS item_id,
        i.name,
        i.description,
        i.slot,
        i.attack_bonus,
        i.defense_bonus,
        i.rarity,
        i.level_required,
        i.faction_exclusive,
        i.sell_price
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.user_id = ${req.userId}
      ORDER BY i.slot, inv.equipped DESC, i.rarity DESC, i.level_required DESC
    `

    // Total bonuses from all equipped items
    const equipped = inventory.filter(r => r.equipped)
    const equipment_bonuses = {
      attack:  equipped.reduce((s, r) => s + r.attack_bonus,  0),
      defense: equipped.reduce((s, r) => s + r.defense_bonus, 0),
    }

    return res.status(200).json({ inventory, equipment_bonuses, stats })
  } catch (err) {
    console.error('Inventory error:', err)
    return res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

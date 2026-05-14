import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { inventory_id } = req.body ?? {}
  if (!inventory_id) return res.status(400).json({ error: 'inventory_id is required' })

  try {
    // Verify ownership + get item details
    const rows = await sql`
      SELECT inv.id, inv.equipped, i.slot, i.level_required, i.faction_exclusive
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.id = ${inventory_id} AND inv.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found in inventory' })

    const item = rows[0]
    if (item.equipped) return res.status(400).json({ error: 'Item is already equipped' })

    // Check level requirement
    const statsRows = await sql`SELECT level, faction FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id WHERE ps.user_id = ${req.userId}`
    const playerLevel = statsRows[0]?.level ?? 1
    const playerFaction = statsRows[0]?.faction ?? null

    if (playerLevel < item.level_required) {
      return res.status(400).json({ error: `Requires level ${item.level_required}` })
    }
    if (item.faction_exclusive && item.faction_exclusive !== playerFaction) {
      return res.status(400).json({ error: `This item is exclusive to the ${item.faction_exclusive} faction` })
    }

    // Unequip any currently equipped item in the same slot
    await sql`
      UPDATE pw_inventory
      SET equipped = false
      WHERE user_id = ${req.userId}
        AND equipped = true
        AND item_id IN (
          SELECT id FROM pw_items WHERE slot = ${item.slot}
        )
    `

    // Equip the requested item
    await sql`UPDATE pw_inventory SET equipped = true WHERE id = ${inventory_id}`

    // Return updated inventory + equipment bonuses
    const inventory = await sql`
      SELECT inv.id AS inventory_id, inv.equipped, inv.acquired_at,
             i.id AS item_id, i.name, i.description, i.slot,
             i.attack_bonus, i.defense_bonus, i.rarity,
             i.level_required, i.faction_exclusive, i.sell_price
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.user_id = ${req.userId}
      ORDER BY i.slot, inv.equipped DESC, i.rarity DESC, i.level_required DESC
    `
    const equippedItems = inventory.filter(r => r.equipped)
    const equipment_bonuses = {
      attack:  equippedItems.reduce((s, r) => s + r.attack_bonus,  0),
      defense: equippedItems.reduce((s, r) => s + r.defense_bonus, 0),
    }

    return res.status(200).json({ success: true, inventory, equipment_bonuses })
  } catch (err) {
    console.error('Equip error:', err)
    return res.status(500).json({ error: 'Failed to equip item' })
  }
})

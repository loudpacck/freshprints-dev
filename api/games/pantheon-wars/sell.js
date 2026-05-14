import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { inventory_id } = req.body ?? {}
  if (!inventory_id) return res.status(400).json({ error: 'inventory_id is required' })

  try {
    const rows = await sql`
      SELECT inv.id, inv.equipped, i.sell_price, i.name
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.id = ${inventory_id} AND inv.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found in inventory' })

    const item = rows[0]
    if (item.equipped) return res.status(400).json({ error: 'Unequip the item before selling' })

    // Delete from inventory and credit drachma
    await sql`DELETE FROM pw_inventory WHERE id = ${inventory_id}`
    const updated = await sql`
      UPDATE pw_player_stats
      SET drachma = drachma + ${item.sell_price}
      WHERE user_id = ${req.userId}
      RETURNING drachma
    `

    return res.status(200).json({
      success: true,
      sold_item: item.name,
      sell_price: item.sell_price,
      new_drachma: updated[0].drachma,
    })
  } catch (err) {
    console.error('Sell error:', err)
    return res.status(500).json({ error: 'Failed to sell item' })
  }
})

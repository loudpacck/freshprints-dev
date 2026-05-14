import { sql } from '../../../../lib/db.js'
import { requireUser } from '../../../../lib/pwAuth.js'

export const config = { runtime: 'nodejs' }

export default requireUser(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { item_id, currency } = req.body ?? {}
  if (!item_id) return res.status(400).json({ error: 'item_id is required' })
  if (!['drachma', 'glory'].includes(currency)) {
    return res.status(400).json({ error: 'currency must be "drachma" or "glory"' })
  }

  try {
    const itemRows = await sql`
      SELECT id, name, rarity, slot, level_required, faction_exclusive, buy_price, glory_price
      FROM pw_items WHERE id = ${item_id}
    `
    if (itemRows.length === 0) return res.status(404).json({ error: 'Item not found' })

    const item = itemRows[0]
    const price = currency === 'drachma' ? item.buy_price : item.glory_price
    if (price === null) {
      return res.status(400).json({ error: `This item is not available in the ${currency} shop` })
    }

    const playerRows = await sql`
      SELECT ps.level, ps.drachma, ps.glory, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (playerRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const player = playerRows[0]

    if (player.level < item.level_required) {
      return res.status(400).json({ error: `Requires level ${item.level_required}` })
    }
    if (item.faction_exclusive && item.faction_exclusive !== player.faction) {
      return res.status(400).json({ error: `This item is exclusive to the ${item.faction_exclusive} faction` })
    }

    const balance = currency === 'drachma' ? player.drachma : player.glory
    if (balance < price) {
      return res.status(400).json({ error: `Insufficient ${currency}` })
    }

    // Deduct cost
    if (currency === 'drachma') {
      await sql`UPDATE pw_player_stats SET drachma = drachma - ${price} WHERE user_id = ${req.userId}`
    } else {
      await sql`UPDATE pw_player_stats SET glory = glory - ${price} WHERE user_id = ${req.userId}`
    }

    // Add to inventory
    await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${item_id})`

    // Fetch updated balances
    const updated = await sql`SELECT drachma, glory FROM pw_player_stats WHERE user_id = ${req.userId}`

    return res.status(200).json({
      success: true,
      purchased: { id: item.id, name: item.name, rarity: item.rarity, slot: item.slot },
      new_drachma: updated[0].drachma,
      new_glory:   updated[0].glory,
    })
  } catch (err) {
    console.error('Shop buy error:', err)
    return res.status(500).json({ error: 'Purchase failed' })
  }
})

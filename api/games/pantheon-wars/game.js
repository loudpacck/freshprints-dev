import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'
import { regenPlayer, checkLevelUp } from '../../../lib/pwHelpers.js'

export const config = { runtime: 'nodejs' }

// ── Quests (GET) ──────────────────────────────────────────────────────────────

async function handleQuests(req, res) {
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
}

// ── Quest Complete (POST) ─────────────────────────────────────────────────────

async function handleComplete(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { quest_id } = req.body ?? {}
  if (!quest_id) return res.status(400).json({ error: 'quest_id is required' })

  try {
    const rows = await sql`
      SELECT
        u.faction, u.class,
        s.user_id, s.level, s.xp, s.energy, s.energy_max,
        s.health, s.health_max, s.drachma, s.drachma_lifetime,
        s.glory, s.attack, s.defense, s.stat_points, s.last_updated
      FROM pw_users u
      JOIN pw_player_stats s ON s.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const row = rows[0]
    const { faction } = row
    const playerClass = row.class

    let stats = regenPlayer(row)

    const questRows = await sql`SELECT * FROM pw_quests WHERE id = ${quest_id}`
    if (questRows.length === 0) return res.status(404).json({ error: 'Quest not found' })
    const quest = questRows[0]

    if (stats.level < quest.level_required) {
      return res.status(400).json({ error: `Requires level ${quest.level_required}` })
    }
    if (stats.energy < quest.energy_cost) {
      return res.status(400).json({ error: 'Not enough energy' })
    }

    stats = { ...stats, energy: stats.energy - quest.energy_cost }

    const drachmaRoll = quest.drachma_range > 0
      ? Math.floor(Math.random() * (quest.drachma_range + 1))
      : 0
    const baseDrachma = quest.drachma_base + drachmaRoll

    const xpMult      = faction === 'olympians' ? 1.05 : 1
    const drachmaMult = (faction === 'annunaki' ? 1.05 : 1) * (playerClass === 'broker' ? 1.1 : 1)

    const earnedXp      = Math.floor(quest.xp_reward * xpMult)
    const earnedDrachma = Math.floor(baseDrachma * drachmaMult)

    stats = {
      ...stats,
      xp:               stats.xp + earnedXp,
      drachma:          stats.drachma + earnedDrachma,
      drachma_lifetime: stats.drachma_lifetime + earnedDrachma,
    }

    const prevLevel = stats.level
    stats = checkLevelUp(stats)
    const levelsGained = stats.level - prevLevel

    let lootItem = null
    if (quest.loot_chance > 0 && Math.random() * 100 <= quest.loot_chance) {
      const lootRows = await sql`
        SELECT i.id, i.name, i.rarity, i.slot, ql.drop_weight
        FROM pw_quest_loot ql
        JOIN pw_items i ON i.id = ql.item_id
        WHERE ql.quest_id = ${quest_id}
      `
      if (lootRows.length > 0) {
        const totalWeight = lootRows.reduce((sum, r) => sum + r.drop_weight, 0)
        let roll = Math.random() * totalWeight
        let picked = lootRows[lootRows.length - 1]
        for (const row of lootRows) {
          roll -= row.drop_weight
          if (roll <= 0) { picked = row; break }
        }
        await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${picked.id})`
        lootItem = { id: picked.id, name: picked.name, rarity: picked.rarity, slot: picked.slot }
      }
    }

    const progRows = await sql`
      SELECT completions FROM pw_quest_progress
      WHERE user_id = ${req.userId} AND quest_id = ${quest_id}
    `
    const newCompletions = (progRows.length > 0 ? progRows[0].completions : 0) + 1

    await sql`
      UPDATE pw_player_stats SET
        energy           = ${stats.energy},
        health           = ${stats.health},
        xp               = ${stats.xp},
        level            = ${stats.level},
        drachma          = ${stats.drachma},
        drachma_lifetime = ${stats.drachma_lifetime},
        stat_points      = ${stats.stat_points},
        last_updated     = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    await sql`
      INSERT INTO pw_quest_progress (user_id, quest_id, completions)
      VALUES (${req.userId}, ${quest_id}, ${newCompletions})
      ON CONFLICT (user_id, quest_id) DO UPDATE SET completions = ${newCompletions}
    `

    return res.status(200).json({
      success:      true,
      rewards:      { xp: earnedXp, drachma: earnedDrachma, loot: lootItem },
      levelsGained,
      completions:  newCompletions,
      stats: {
        level:            stats.level,
        xp:               stats.xp,
        energy:           stats.energy,
        energy_max:       stats.energy_max,
        health:           stats.health,
        health_max:       stats.health_max,
        drachma:          stats.drachma,
        drachma_lifetime: stats.drachma_lifetime,
        glory:            stats.glory,
        attack:           stats.attack,
        defense:          stats.defense,
        stat_points:      stats.stat_points,
      },
    })
  } catch (err) {
    console.error('Quest complete error:', err)
    return res.status(500).json({ error: 'Failed to complete quest' })
  }
}

// ── Inventory (GET) ───────────────────────────────────────────────────────────

async function handleInventory(req, res) {
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
}

// ── Equip (POST) ──────────────────────────────────────────────────────────────

async function handleEquip(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { inventory_id } = req.body ?? {}
  if (!inventory_id) return res.status(400).json({ error: 'inventory_id is required' })

  try {
    const rows = await sql`
      SELECT inv.id, inv.equipped, i.slot, i.level_required, i.faction_exclusive
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.id = ${inventory_id} AND inv.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found in inventory' })

    const item = rows[0]
    if (item.equipped) return res.status(400).json({ error: 'Item is already equipped' })

    const statsRows = await sql`SELECT level, faction FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id WHERE ps.user_id = ${req.userId}`
    const playerLevel   = statsRows[0]?.level   ?? 1
    const playerFaction = statsRows[0]?.faction ?? null

    if (playerLevel < item.level_required) {
      return res.status(400).json({ error: `Requires level ${item.level_required}` })
    }
    if (item.faction_exclusive && item.faction_exclusive !== playerFaction) {
      return res.status(400).json({ error: `This item is exclusive to the ${item.faction_exclusive} faction` })
    }

    await sql`
      UPDATE pw_inventory
      SET equipped = false
      WHERE user_id = ${req.userId}
        AND equipped = true
        AND item_id IN (
          SELECT id FROM pw_items WHERE slot = ${item.slot}
        )
    `

    await sql`UPDATE pw_inventory SET equipped = true WHERE id = ${inventory_id}`

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
}

// ── Unequip (POST) ────────────────────────────────────────────────────────────

async function handleUnequip(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { inventory_id } = req.body ?? {}
  if (!inventory_id) return res.status(400).json({ error: 'inventory_id is required' })

  try {
    const rows = await sql`
      SELECT id, equipped FROM pw_inventory
      WHERE id = ${inventory_id} AND user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found in inventory' })
    if (!rows[0].equipped) return res.status(400).json({ error: 'Item is not equipped' })

    await sql`UPDATE pw_inventory SET equipped = false WHERE id = ${inventory_id}`

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
    console.error('Unequip error:', err)
    return res.status(500).json({ error: 'Failed to unequip item' })
  }
}

// ── Sell (POST) ───────────────────────────────────────────────────────────────

async function handleSell(req, res) {
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
}

// ── Shop (GET) ────────────────────────────────────────────────────────────────

async function handleShop(req, res) {
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
}

// ── Shop Buy (POST) ───────────────────────────────────────────────────────────

async function handleBuy(req, res) {
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

    if (currency === 'drachma') {
      await sql`UPDATE pw_player_stats SET drachma = drachma - ${price} WHERE user_id = ${req.userId}`
    } else {
      await sql`UPDATE pw_player_stats SET glory = glory - ${price} WHERE user_id = ${req.userId}`
    }

    await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${item_id})`

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
}

// ── Leaderboard (GET) ─────────────────────────────────────────────────────────

const VALID_TYPES    = ['level', 'glory', 'drachma', 'mastery']
const VALID_FACTIONS = ['all', 'olympians', 'aesir', 'annunaki']

async function handleLeaderboard(req, res) {
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
      rank:     i + 1,
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
}

// ── Allocate (POST) ───────────────────────────────────────────────────────────

async function handleAllocate(req, res) {
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
    console.error('[game?action=allocate]', err.message)
    return res.status(500).json({ error: 'Allocation failed' })
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default requireUser(async function handler(req, res) {
  const { action } = req.query
  if (action === 'quests')      return handleQuests(req, res)
  if (action === 'complete')    return handleComplete(req, res)
  if (action === 'inventory')   return handleInventory(req, res)
  if (action === 'equip')       return handleEquip(req, res)
  if (action === 'unequip')     return handleUnequip(req, res)
  if (action === 'sell')        return handleSell(req, res)
  if (action === 'shop')        return handleShop(req, res)
  if (action === 'buy')         return handleBuy(req, res)
  if (action === 'leaderboard') return handleLeaderboard(req, res)
  if (action === 'allocate')    return handleAllocate(req, res)
  return res.status(400).json({ error: 'Unknown action' })
})

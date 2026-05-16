import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'
import { regenPlayer, checkLevelUp, getEquipmentBonuses, calculateCombat, calculatePowerRating } from '../../../lib/pwHelpers.js'

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
        s.glory, s.glory_lifetime, s.attack, s.defense, s.stat_points, s.last_updated
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
        glory_lifetime   = ${stats.glory_lifetime},
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

    const equipment_bonuses = await getEquipmentBonuses(sql, req.userId)

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

    // If the requesting user isn't in the top 100, compute their approximate rank
    let yourRank = null
    if (req.userId && !ranked.some(r => r.is_self)) {
      try {
        if (type === 'mastery') {
          const myRows = await sql`SELECT COALESCE(SUM(completions),0) AS val FROM pw_quest_progress WHERE user_id = ${req.userId}`
          const mv = Number(myRows[0]?.val ?? 0)
          const aboveRows = faction === 'all'
            ? await sql`SELECT COUNT(*) AS cnt FROM (SELECT user_id, SUM(completions) AS total FROM pw_quest_progress GROUP BY user_id HAVING SUM(completions) > ${mv}) sub`
            : await sql`SELECT COUNT(*) AS cnt FROM (SELECT qp.user_id, SUM(qp.completions) AS total FROM pw_quest_progress qp JOIN pw_users u ON u.id = qp.user_id WHERE u.faction = ${faction} GROUP BY qp.user_id HAVING SUM(qp.completions) > ${mv}) sub`
          yourRank = Number(aboveRows[0]?.cnt ?? 0) + 1
        } else if (type === 'glory') {
          const myRows = await sql`SELECT glory AS val FROM pw_player_stats WHERE user_id = ${req.userId}`
          const mv = Number(myRows[0]?.val ?? 0)
          const aboveRows = faction === 'all'
            ? await sql`SELECT COUNT(*) AS cnt FROM pw_player_stats WHERE glory > ${mv}`
            : await sql`SELECT COUNT(*) AS cnt FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id WHERE ps.glory > ${mv} AND u.faction = ${faction}`
          yourRank = Number(aboveRows[0]?.cnt ?? 0) + 1
        } else if (type === 'drachma') {
          const myRows = await sql`SELECT drachma_lifetime AS val FROM pw_player_stats WHERE user_id = ${req.userId}`
          const mv = Number(myRows[0]?.val ?? 0)
          const aboveRows = faction === 'all'
            ? await sql`SELECT COUNT(*) AS cnt FROM pw_player_stats WHERE drachma_lifetime > ${mv}`
            : await sql`SELECT COUNT(*) AS cnt FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id WHERE ps.drachma_lifetime > ${mv} AND u.faction = ${faction}`
          yourRank = Number(aboveRows[0]?.cnt ?? 0) + 1
        } else {
          const myRows = await sql`SELECT level AS val FROM pw_player_stats WHERE user_id = ${req.userId}`
          const mv = Number(myRows[0]?.val ?? 0)
          const aboveRows = faction === 'all'
            ? await sql`SELECT COUNT(*) AS cnt FROM pw_player_stats WHERE level > ${mv}`
            : await sql`SELECT COUNT(*) AS cnt FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id WHERE ps.level > ${mv} AND u.faction = ${faction}`
          yourRank = Number(aboveRows[0]?.cnt ?? 0) + 1
        }
      } catch { /* non-critical */ }
    }

    return res.status(200).json({ entries: ranked, type, faction, your_rank: yourRank })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}

// ── Allocate (POST) ───────────────────────────────────────────────────────────

async function handleAllocate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { attack = 0, defense = 0, energy_max = 0, health_max = 0 } = req.body || {}
  const a = Number(attack)
  const d = Number(defense)
  const e = Number(energy_max)
  const h = Number(health_max)

  if (!Number.isInteger(a) || !Number.isInteger(d) || !Number.isInteger(e) || !Number.isInteger(h) ||
      a < 0 || d < 0 || e < 0 || h < 0) {
    return res.status(400).json({ error: 'Invalid allocation values' })
  }
  const total = a + d + e + h
  if (total === 0) return res.status(400).json({ error: 'No points to allocate' })

  try {
    const rows = await sql`
      SELECT stat_points, attack, defense, glory, glory_lifetime,
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
    const newEnergyMax  = stats.energy_max + e
    const newHealthMax  = stats.health_max + h
    const newStatPoints = stats.stat_points - total
    // When energy_max increases, top up current energy by same delta so the player isn't punished
    const newEnergy = Math.min(stats.energy + e, newEnergyMax)
    const newHealth = Math.min(stats.health + h, newHealthMax)

    await sql`
      UPDATE pw_player_stats SET
        attack         = ${newAttack},
        defense        = ${newDefense},
        energy_max     = ${newEnergyMax},
        health_max     = ${newHealthMax},
        stat_points    = ${newStatPoints},
        glory_lifetime = ${stats.glory_lifetime},
        energy         = ${newEnergy},
        health         = ${newHealth},
        last_updated   = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    return res.status(200).json({
      ok: true,
      allocated: { attack: a, defense: d, energy_max: e, health_max: h },
      newStats: {
        attack:      newAttack,
        defense:     newDefense,
        energy_max:  newEnergyMax,
        health_max:  newHealthMax,
        stat_points: newStatPoints,
        energy:      newEnergy,
        health:      newHealth,
      },
    })
  } catch (err) {
    console.error('[game?action=allocate]', err.message)
    return res.status(500).json({ error: 'Allocation failed' })
  }
}

// ── Temples helpers ───────────────────────────────────────────────────────────

async function fetchOwnedTemples(userId) {
  return sql`
    SELECT
      pt.id,
      pt.temple_type,
      pt.upgrade_level,
      pt.purchased_at,
      t.name,
      t.base_cost,
      t.income_per_hour,
      t.level_required
    FROM pw_player_temples pt
    JOIN pw_temples t ON t.type = pt.temple_type
    WHERE pt.user_id = ${userId}
    ORDER BY t.level_required ASC, pt.purchased_at ASC
  `
}

function shapeOwnedTemple(row, playerDrachma) {
  const currentIncome  = Math.round(row.income_per_hour * (1 + 0.25 * row.upgrade_level))
  const upgradeCost    = row.upgrade_level < 10 ? Math.floor(row.base_cost * 0.5) : null
  const canUpgrade     = row.upgrade_level < 10 && playerDrachma >= upgradeCost
  return {
    id:                     row.id,
    temple_type:            row.temple_type,
    name:                   row.name,
    upgrade_level:          row.upgrade_level,
    current_income_per_hour: currentIncome,
    upgrade_cost:           upgradeCost,
    can_upgrade:            canUpgrade,
  }
}

// ── Temples (GET) ─────────────────────────────────────────────────────────────

async function handleTemples(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const statsRows = await sql`SELECT * FROM pw_player_stats WHERE user_id = ${req.userId}`
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const playerLevel = statsRows[0].level

    const owned = await fetchOwnedTemples(req.userId)
    let stats = regenPlayer(statsRows[0], owned)

    if (
      stats.energy           !== statsRows[0].energy   ||
      stats.health           !== statsRows[0].health   ||
      stats.drachma          !== statsRows[0].drachma  ||
      stats.drachma_lifetime !== statsRows[0].drachma_lifetime
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy           = ${stats.energy},
            health           = ${stats.health},
            drachma          = ${stats.drachma},
            drachma_lifetime = ${stats.drachma_lifetime},
            glory_lifetime   = ${stats.glory_lifetime},
            last_updated     = ${stats.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    const catalogRows = await sql`
      SELECT type, name, base_cost, income_per_hour, level_required
      FROM pw_temples
      ORDER BY level_required ASC
    `

    const catalog = catalogRows.map(t => {
      const levelOk   = playerLevel >= t.level_required
      const fundsOk   = stats.drachma >= t.base_cost
      const canBuy    = levelOk && fundsOk
      const reason    = !canBuy ? (!levelOk ? 'level' : 'drachma') : null
      return { ...t, canBuy, reason }
    })

    const shapedOwned = owned.map(r => shapeOwnedTemple(r, stats.drachma))
    const totalIncome = shapedOwned.reduce((s, r) => s + r.current_income_per_hour, 0)

    return res.status(200).json({
      catalog,
      owned:                shapedOwned,
      total_income_per_hour: totalIncome,
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
    console.error('Temples error:', err)
    return res.status(500).json({ error: 'Failed to fetch temples' })
  }
}

// ── Temples Buy (POST) ────────────────────────────────────────────────────────

async function handleTemplesBuy(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { temple_type } = req.body ?? {}
  if (!temple_type) return res.status(400).json({ error: 'temple_type is required' })

  try {
    const templeRows = await sql`
      SELECT type, name, base_cost, income_per_hour, level_required
      FROM pw_temples WHERE type = ${temple_type}
    `
    if (templeRows.length === 0) return res.status(400).json({ error: 'invalid_temple' })
    const temple = templeRows[0]

    const statsRows = await sql`SELECT * FROM pw_player_stats WHERE user_id = ${req.userId}`
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const playerLevel = statsRows[0].level

    if (playerLevel < temple.level_required) {
      return res.status(400).json({ error: 'level_too_low', level_required: temple.level_required })
    }

    const owned = await fetchOwnedTemples(req.userId)
    let stats = regenPlayer(statsRows[0], owned)

    if (stats.drachma < temple.base_cost) {
      return res.status(400).json({ error: 'insufficient_drachma', cost: temple.base_cost })
    }

    stats = { ...stats, drachma: stats.drachma - temple.base_cost }

    await sql`
      UPDATE pw_player_stats
      SET drachma          = ${stats.drachma},
          drachma_lifetime = ${stats.drachma_lifetime},
          glory_lifetime   = ${stats.glory_lifetime},
          energy           = ${stats.energy},
          health           = ${stats.health},
          last_updated     = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    const newRows = await sql`
      INSERT INTO pw_player_temples (user_id, temple_type, upgrade_level)
      VALUES (${req.userId}, ${temple_type}, 0)
      RETURNING id, temple_type, upgrade_level, purchased_at
    `
    const newTemple = { ...newRows[0], ...temple }
    const shaped    = shapeOwnedTemple(newTemple, stats.drachma)

    return res.status(201).json({ stats, temple: shaped })
  } catch (err) {
    console.error('Temples buy error:', err)
    return res.status(500).json({ error: 'Purchase failed' })
  }
}

// ── Temples Upgrade (POST) ────────────────────────────────────────────────────

async function handleTemplesUpgrade(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { player_temple_id } = req.body ?? {}
  if (!player_temple_id) return res.status(400).json({ error: 'player_temple_id is required' })

  try {
    const ptRows = await sql`
      SELECT
        pt.id, pt.temple_type, pt.upgrade_level,
        t.name, t.base_cost, t.income_per_hour, t.level_required
      FROM pw_player_temples pt
      JOIN pw_temples t ON t.type = pt.temple_type
      WHERE pt.id = ${player_temple_id} AND pt.user_id = ${req.userId}
    `
    if (ptRows.length === 0) return res.status(404).json({ error: 'not_found' })
    const pt = ptRows[0]

    if (pt.upgrade_level >= 10) return res.status(400).json({ error: 'max_level' })

    const upgradeCost = Math.floor(pt.base_cost * 0.5)

    const statsRows = await sql`SELECT * FROM pw_player_stats WHERE user_id = ${req.userId}`
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const owned = await fetchOwnedTemples(req.userId)
    let stats = regenPlayer(statsRows[0], owned)

    if (stats.drachma < upgradeCost) {
      return res.status(400).json({ error: 'insufficient_drachma', cost: upgradeCost })
    }

    stats = { ...stats, drachma: stats.drachma - upgradeCost }

    await sql`
      UPDATE pw_player_stats
      SET drachma          = ${stats.drachma},
          drachma_lifetime = ${stats.drachma_lifetime},
          glory_lifetime   = ${stats.glory_lifetime},
          energy           = ${stats.energy},
          health           = ${stats.health},
          last_updated     = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    const updatedRows = await sql`
      UPDATE pw_player_temples
      SET upgrade_level = upgrade_level + 1
      WHERE id = ${player_temple_id}
      RETURNING id, temple_type, upgrade_level, purchased_at
    `
    const updatedPt = { ...updatedRows[0], ...pt, upgrade_level: updatedRows[0].upgrade_level }
    const shaped    = shapeOwnedTemple(updatedPt, stats.drachma)

    return res.status(200).json({ stats, temple: shaped })
  } catch (err) {
    console.error('Temples upgrade error:', err)
    return res.status(500).json({ error: 'Upgrade failed' })
  }
}

// ── Alignment Choose (POST) ───────────────────────────────────────────────────

async function handleAlignmentChoose(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { alignment } = req.body ?? {}

  try {
    const rows = await sql`
      SELECT u.alignment, ps.level, ps.energy, ps.energy_max, ps.health, ps.health_max,
             ps.drachma, ps.drachma_lifetime, ps.glory, ps.glory_lifetime,
             ps.xp, ps.attack, ps.defense, ps.stat_points, ps.last_updated
      FROM pw_users u
      JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })
    const row = rows[0]

    let stats = regenPlayer(row)

    if (stats.level < 10) return res.status(400).json({ error: 'level_too_low' })
    if (!['coalition', 'compact'].includes(alignment)) return res.status(400).json({ error: 'invalid_alignment' })
    if (row.alignment !== null) return res.status(400).json({ error: 'already_aligned' })

    await sql`UPDATE pw_users SET alignment = ${alignment} WHERE id = ${req.userId}`

    return res.status(200).json({
      alignment,
      stats: {
        level: stats.level, xp: stats.xp,
        energy: stats.energy, energy_max: stats.energy_max,
        health: stats.health, health_max: stats.health_max,
        drachma: stats.drachma, drachma_lifetime: stats.drachma_lifetime,
        glory: stats.glory, glory_lifetime: stats.glory_lifetime,
        attack: stats.attack, defense: stats.defense,
        stat_points: stats.stat_points,
      },
    })
  } catch (err) {
    console.error('Alignment choose error:', err)
    return res.status(500).json({ error: 'Failed to set alignment' })
  }
}

// ── PvP Targets (GET) ─────────────────────────────────────────────────────────

async function handlePvPTargets(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const userRows = await sql`
      SELECT u.alignment, ps.level, ps.energy, ps.energy_max, ps.health, ps.health_max,
             ps.drachma, ps.drachma_lifetime, ps.glory, ps.glory_lifetime,
             ps.xp, ps.attack, ps.defense, ps.stat_points, ps.last_updated
      FROM pw_users u
      JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (userRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const userRow = userRows[0]
    const ownedTemples = await fetchOwnedTemples(req.userId)
    let stats = regenPlayer(userRow, ownedTemples)
    const attAlignment = userRow.alignment

    // Unaligned at 10+ must choose alignment before attacking
    if (!attAlignment && stats.level >= 10) {
      return res.status(200).json({ targets: [], stats, requires_alignment: true })
    }

    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit)  || 20))
    const offset = Math.max(0, parseInt(req.query.offset) || 0)
    const minLevel = Math.max(1, stats.level - 10)
    const maxLevel = stats.level + 10

    let targets
    if (attAlignment === 'coalition') {
      targets = await sql`
        SELECT sub.user_id, sub.username, sub.faction, sub.class, sub.alignment,
               sub.level, sub.health, sub.health_max, sub.glory, sub.attack, sub.defense
        FROM (
          SELECT u.id AS user_id, u.username, u.faction, u.class, u.alignment,
                 ps.level, ps.health_max, ps.glory, ps.attack, ps.defense,
                 LEAST(ps.health_max, ps.health + FLOOR(EXTRACT(EPOCH FROM (NOW() - ps.last_updated)) / 180)::INT) AS health
          FROM pw_users u
          JOIN pw_player_stats ps ON ps.user_id = u.id
          WHERE u.id != ${req.userId}
            AND ps.level >= ${minLevel} AND ps.level <= ${maxLevel}
            AND (u.alignment = 'compact' OR ps.level < 10)
            AND NOT EXISTS (
              SELECT 1 FROM pw_combat_log cl
              WHERE cl.attacker_id = ${req.userId} AND cl.defender_id = u.id
                AND cl.created_at > NOW() - INTERVAL '5 minutes'
            )
        ) sub
        WHERE sub.health > 0
        ORDER BY sub.level DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (attAlignment === 'compact') {
      targets = await sql`
        SELECT sub.user_id, sub.username, sub.faction, sub.class, sub.alignment,
               sub.level, sub.health, sub.health_max, sub.glory, sub.attack, sub.defense
        FROM (
          SELECT u.id AS user_id, u.username, u.faction, u.class, u.alignment,
                 ps.level, ps.health_max, ps.glory, ps.attack, ps.defense,
                 LEAST(ps.health_max, ps.health + FLOOR(EXTRACT(EPOCH FROM (NOW() - ps.last_updated)) / 180)::INT) AS health
          FROM pw_users u
          JOIN pw_player_stats ps ON ps.user_id = u.id
          WHERE u.id != ${req.userId}
            AND ps.level >= ${minLevel} AND ps.level <= ${maxLevel}
            AND (u.alignment = 'coalition' OR ps.level < 10)
            AND NOT EXISTS (
              SELECT 1 FROM pw_combat_log cl
              WHERE cl.attacker_id = ${req.userId} AND cl.defender_id = u.id
                AND cl.created_at > NOW() - INTERVAL '5 minutes'
            )
        ) sub
        WHERE sub.health > 0
        ORDER BY sub.level DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Unaligned attacker (level < 10) — only level < 10 targets
      targets = await sql`
        SELECT sub.user_id, sub.username, sub.faction, sub.class, sub.alignment,
               sub.level, sub.health, sub.health_max, sub.glory, sub.attack, sub.defense
        FROM (
          SELECT u.id AS user_id, u.username, u.faction, u.class, u.alignment,
                 ps.level, ps.health_max, ps.glory, ps.attack, ps.defense,
                 LEAST(ps.health_max, ps.health + FLOOR(EXTRACT(EPOCH FROM (NOW() - ps.last_updated)) / 180)::INT) AS health
          FROM pw_users u
          JOIN pw_player_stats ps ON ps.user_id = u.id
          WHERE u.id != ${req.userId}
            AND ps.level >= ${minLevel} AND ps.level <= ${maxLevel}
            AND ps.level < 10
            AND NOT EXISTS (
              SELECT 1 FROM pw_combat_log cl
              WHERE cl.attacker_id = ${req.userId} AND cl.defender_id = u.id
                AND cl.created_at > NOW() - INTERVAL '5 minutes'
            )
        ) sub
        WHERE sub.health > 0
        ORDER BY sub.level DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Compute power ratings: attacker's own, then per target
    const attEquip = await getEquipmentBonuses(sql, req.userId)
    const myPowerRating = calculatePowerRating(stats, attEquip)

    const targetsWithPower = await Promise.all(targets.map(async t => {
      const equip = await getEquipmentBonuses(sql, t.user_id)
      return { ...t, power_rating: calculatePowerRating(t, equip) }
    }))

    return res.status(200).json({ targets: targetsWithPower, stats, my_power_rating: myPowerRating })
  } catch (err) {
    console.error('PvP targets error:', err)
    return res.status(500).json({ error: 'Failed to fetch targets' })
  }
}

// ── PvP Attack (POST) ─────────────────────────────────────────────────────────

async function handlePvPAttack(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { target_user_id } = req.body ?? {}
  if (!target_user_id) return res.status(400).json({ error: 'target_user_id is required' })

  if (target_user_id === req.userId) {
    return res.status(400).json({ error: 'cannot_attack_self' })
  }

  try {
    // Fetch attacker
    const attRows = await sql`
      SELECT u.id, u.faction, u.class, u.alignment,
             ps.level, ps.xp, ps.energy, ps.energy_max,
             ps.health, ps.health_max, ps.drachma, ps.drachma_lifetime,
             ps.glory, ps.glory_lifetime, ps.attack, ps.defense, ps.stat_points, ps.last_updated
      FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (attRows.length === 0) return res.status(404).json({ error: 'Attacker not found' })
    const attUser = { faction: attRows[0].faction, class: attRows[0].class, alignment: attRows[0].alignment }

    // Fetch defender
    const defRows = await sql`
      SELECT u.id, u.username, u.faction, u.class, u.alignment,
             ps.level, ps.xp, ps.energy, ps.energy_max,
             ps.health, ps.health_max, ps.drachma, ps.drachma_lifetime,
             ps.glory, ps.glory_lifetime, ps.attack, ps.defense, ps.stat_points, ps.last_updated
      FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${target_user_id}
    `
    if (defRows.length === 0) return res.status(404).json({ error: 'target_not_found' })
    const defUser = { username: defRows[0].username, faction: defRows[0].faction, class: defRows[0].class, alignment: defRows[0].alignment }

    const attLevel = attRows[0].level
    const defLevel = defRows[0].level

    // Alignment gate
    if (!attUser.alignment && attLevel >= 10) {
      return res.status(400).json({ error: 'requires_alignment' })
    }

    // Alignment matchup
    if (attUser.alignment) {
      const opposing = attUser.alignment === 'coalition' ? 'compact' : 'coalition'
      if (defUser.alignment !== opposing && defLevel >= 10) {
        return res.status(400).json({ error: 'invalid_alignment_matchup' })
      }
    } else {
      // Unaligned attacker (level < 10) can only hit level < 10 targets
      if (defLevel >= 10) {
        return res.status(400).json({ error: 'invalid_alignment_matchup' })
      }
    }

    // Level range
    if (Math.abs(attLevel - defLevel) > 10) {
      return res.status(400).json({ error: 'level_out_of_range' })
    }

    // Fetch temples + regen both players
    const [attTemples, defTemples] = await Promise.all([
      fetchOwnedTemples(req.userId),
      fetchOwnedTemples(target_user_id),
    ])
    let attStats = regenPlayer(attRows[0], attTemples)
    let defStats = regenPlayer(defRows[0], defTemples)

    // Health checks (after regen)
    if (attStats.health <= 0) return res.status(400).json({ error: 'attacker_no_health' })
    if (defStats.health <= 0) return res.status(400).json({ error: 'defender_no_health' })

    // Cooldown check
    const coolRows = await sql`
      SELECT created_at FROM pw_combat_log
      WHERE attacker_id = ${req.userId} AND defender_id = ${target_user_id}
        AND created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC LIMIT 1
    `
    if (coolRows.length > 0) {
      const expiresAt  = new Date(new Date(coolRows[0].created_at).getTime() + 5 * 60 * 1000)
      const secondsLeft = Math.max(0, Math.ceil((expiresAt - new Date()) / 1000))
      return res.status(400).json({ error: 'cooldown', seconds_remaining: secondsLeft })
    }

    // Equipment bonuses
    const [attEquip, defEquip] = await Promise.all([
      getEquipmentBonuses(sql, req.userId),
      getEquipmentBonuses(sql, target_user_id),
    ])

    // Combat
    const combat = calculateCombat({
      attacker:      { ...attUser, ...attStats },
      defender:      { ...defUser, ...defStats },
      attackerEquip: attEquip,
      defenderEquip: defEquip,
    })

    const actualDrachma = Math.min(combat.drachma_transferred, defStats.drachma)

    // Apply outcomes
    if (combat.result === 'win') {
      attStats = {
        ...attStats,
        xp:               attStats.xp + combat.xp_earned,
        drachma:          attStats.drachma + actualDrachma,
        drachma_lifetime: attStats.drachma_lifetime + actualDrachma,
        glory:            attStats.glory + combat.glory_earned,
        glory_lifetime:   attStats.glory_lifetime + combat.glory_earned,
        health:           Math.max(0, attStats.health - combat.attacker_health_lost),
      }
      defStats = {
        ...defStats,
        drachma: Math.max(0, defStats.drachma - actualDrachma),
        health:  Math.max(0, defStats.health - combat.defender_health_lost),
      }
    } else {
      attStats = {
        ...attStats,
        health: Math.max(0, attStats.health - combat.attacker_health_lost),
      }
      defStats = {
        ...defStats,
        glory:          defStats.glory + combat.defender_glory_earned,
        glory_lifetime: defStats.glory_lifetime + combat.defender_glory_earned,
      }
    }

    const prevLevel = attStats.level
    attStats = checkLevelUp(attStats)
    const levelsGained = attStats.level - prevLevel

    // Persist attacker
    await sql`
      UPDATE pw_player_stats SET
        xp               = ${attStats.xp},
        level            = ${attStats.level},
        energy           = ${attStats.energy},
        health           = ${attStats.health},
        health_max       = ${attStats.health_max},
        drachma          = ${attStats.drachma},
        drachma_lifetime = ${attStats.drachma_lifetime},
        glory            = ${attStats.glory},
        glory_lifetime   = ${attStats.glory_lifetime},
        stat_points      = ${attStats.stat_points},
        last_updated     = ${attStats.last_updated}
      WHERE user_id = ${req.userId}
    `

    // Persist defender
    await sql`
      UPDATE pw_player_stats SET
        health           = ${defStats.health},
        drachma          = ${defStats.drachma},
        glory            = ${defStats.glory},
        glory_lifetime   = ${defStats.glory_lifetime},
        drachma_lifetime = ${defStats.drachma_lifetime},
        last_updated     = ${defStats.last_updated}
      WHERE user_id = ${target_user_id}
    `

    // Log combat
    await sql`
      INSERT INTO pw_combat_log (
        attacker_id, defender_id, attacker_power, defender_power, result,
        xp_earned, drachma_transferred, glory_earned, attacker_health_lost, defender_health_lost
      ) VALUES (
        ${req.userId}, ${target_user_id},
        ${combat.attacker_power}, ${combat.defender_power}, ${combat.result},
        ${combat.xp_earned}, ${actualDrachma}, ${combat.glory_earned},
        ${combat.attacker_health_lost}, ${combat.defender_health_lost}
      )
    `

    return res.status(200).json({
      result:               combat.result,
      attacker_power:       combat.attacker_power,
      defender_power:       combat.defender_power,
      xp_earned:            combat.xp_earned,
      drachma_transferred:  actualDrachma,
      glory_earned:         combat.glory_earned,
      attacker_health_lost: combat.attacker_health_lost,
      defender_health_lost: combat.defender_health_lost,
      levelsGained,
      defender: {
        username:    defUser.username,
        faction:     defUser.faction,
        class:       defUser.class,
        health_lost: combat.defender_health_lost,
      },
      stats: {
        level:            attStats.level,
        xp:               attStats.xp,
        energy:           attStats.energy,
        energy_max:       attStats.energy_max,
        health:           attStats.health,
        health_max:       attStats.health_max,
        drachma:          attStats.drachma,
        drachma_lifetime: attStats.drachma_lifetime,
        glory:            attStats.glory,
        glory_lifetime:   attStats.glory_lifetime,
        attack:           attStats.attack,
        defense:          attStats.defense,
        stat_points:      attStats.stat_points,
      },
    })
  } catch (err) {
    console.error('PvP attack error:', err)
    return res.status(500).json({ error: 'Attack failed' })
  }
}

// ── PvP Log (GET) ─────────────────────────────────────────────────────────────

async function handlePvPLog(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const entries = await sql`
      SELECT
        cl.id, cl.created_at, cl.result,
        cl.attacker_power, cl.defender_power,
        cl.xp_earned, cl.drachma_transferred, cl.glory_earned,
        cl.attacker_health_lost, cl.defender_health_lost,
        cl.attacker_id, cl.defender_id,
        au.username AS attacker_username,
        au.faction  AS attacker_faction,
        du.username AS defender_username,
        du.faction  AS defender_faction
      FROM pw_combat_log cl
      LEFT JOIN pw_users au ON au.id = cl.attacker_id
      LEFT JOIN pw_users du ON du.id = cl.defender_id
      WHERE cl.attacker_id = ${req.userId} OR cl.defender_id = ${req.userId}
      ORDER BY cl.created_at DESC
      LIMIT 50
    `

    const log = entries.map(e => ({
      id:                   e.id,
      created_at:           e.created_at,
      perspective:          e.attacker_id === req.userId ? 'attacker' : 'defender',
      result:               e.result,
      opponent_username:    e.attacker_id === req.userId ? e.defender_username : e.attacker_username,
      opponent_faction:     e.attacker_id === req.userId ? e.defender_faction  : e.attacker_faction,
      attacker_power:       e.attacker_power,
      defender_power:       e.defender_power,
      xp_earned:            e.xp_earned,
      drachma_transferred:  e.drachma_transferred,
      glory_earned:         e.glory_earned,
      attacker_health_lost: e.attacker_health_lost,
      defender_health_lost: e.defender_health_lost,
    }))

    return res.status(200).json({ log })
  } catch (err) {
    console.error('PvP log error:', err)
    return res.status(500).json({ error: 'Failed to fetch combat log' })
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default requireUser(async function handler(req, res) {
  const { action } = req.query
  if (action === 'quests')            return handleQuests(req, res)
  if (action === 'complete')          return handleComplete(req, res)
  if (action === 'inventory')         return handleInventory(req, res)
  if (action === 'equip')             return handleEquip(req, res)
  if (action === 'unequip')           return handleUnequip(req, res)
  if (action === 'sell')              return handleSell(req, res)
  if (action === 'shop')              return handleShop(req, res)
  if (action === 'buy')               return handleBuy(req, res)
  if (action === 'leaderboard')       return handleLeaderboard(req, res)
  if (action === 'allocate')          return handleAllocate(req, res)
  if (action === 'temples')           return handleTemples(req, res)
  if (action === 'temples_buy')       return handleTemplesBuy(req, res)
  if (action === 'temples_upgrade')   return handleTemplesUpgrade(req, res)
  if (action === 'alignment_choose')  return handleAlignmentChoose(req, res)
  if (action === 'pvp_targets')       return handlePvPTargets(req, res)
  if (action === 'pvp_attack')        return handlePvPAttack(req, res)
  if (action === 'pvp_log')           return handlePvPLog(req, res)
  return res.status(400).json({ error: 'Unknown action' })
})

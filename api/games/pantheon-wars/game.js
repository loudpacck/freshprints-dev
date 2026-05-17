import { sql } from '../../../lib/db.js'
import { requireUser } from '../../../lib/pwAuth.js'
import {
  regenPlayer, checkLevelUp, getEquipmentBonuses, calculateCombat, calculatePowerRating,
  getShopRotationSeed, getShopRotationExpiry, pickRotatedItems, getDailyRotationPool,
  getQuestRotationSeed, getQuestRotationExpiry,
  getAdventureRotationSeed, getAdventureRotationExpiry,
  pickRotatedFromPool, checkAndCompleteAdventures,
} from '../../../lib/pwHelpers.js'

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

    const allEligible = await sql`
      SELECT
        q.id, q.name, q.description, q.tier, q.energy_cost,
        q.xp_reward, q.drachma_base, q.drachma_range,
        q.loot_chance, q.level_required, q.mastery_target,
        q.faction_bonus, q.faction_bonus_type, q.faction_bonus_value,
        q.class_bonus, q.class_bonus_type, q.class_bonus_value,
        COALESCE(p.completions, 0) AS completions
      FROM pw_quests q
      LEFT JOIN pw_quest_progress p
        ON p.quest_id = q.id AND p.user_id = ${req.userId}
      WHERE q.level_required <= ${stats.level}
      ORDER BY q.tier, q.level_required, q.id
    `

    const quests = pickRotatedFromPool(allEligible, getQuestRotationSeed(), 5)

    return res.status(200).json({
      quests,
      stats,
      rotation_expires_at: getQuestRotationExpiry(),
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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

    // Validate quest is in the current rotation (same ORDER BY as handleQuests)
    const eligibleRows = await sql`
      SELECT id FROM pw_quests
      WHERE level_required <= ${stats.level}
      ORDER BY tier, level_required, id
    `
    const rotatedSet = new Set(
      pickRotatedFromPool(eligibleRows, getQuestRotationSeed(), 5).map(r => r.id)
    )
    if (!rotatedSet.has(quest.id)) {
      return res.status(400).json({ error: 'quest_not_in_rotation' })
    }

    stats = { ...stats, energy: stats.energy - quest.energy_cost }

    const drachmaRoll = quest.drachma_range > 0
      ? Math.floor(Math.random() * (quest.drachma_range + 1))
      : 0
    const baseDrachma = quest.drachma_base + drachmaRoll

    // Global faction + class multipliers
    const xpMult      = faction === 'olympians' ? 1.05 : 1
    const drachmaMult = (faction === 'annunaki' ? 1.05 : 1) * (playerClass === 'broker' ? 1.1 : 1)

    let earnedXp      = Math.floor(quest.xp_reward * xpMult)
    let earnedDrachma = Math.floor(baseDrachma * drachmaMult)
    let effectiveLootChance = quest.loot_chance
    let lootUpgradeChance   = 0

    // Per-quest faction bonus
    if (quest.faction_bonus && faction === quest.faction_bonus) {
      const v = Number(quest.faction_bonus_value) || 0
      switch (quest.faction_bonus_type) {
        case 'xp':              earnedXp      = Math.floor(earnedXp * (1 + v / 100)); break
        case 'drachma':         earnedDrachma = Math.floor(earnedDrachma * (1 + v / 100)); break
        case 'loot_chance':     effectiveLootChance = Math.min(100, effectiveLootChance + v); break
        case 'loot_upgrade':    lootUpgradeChance   = Math.max(lootUpgradeChance, v); break
        case 'guaranteed_loot': effectiveLootChance = 100; break
      }
    }

    // Per-quest class bonus
    if (quest.class_bonus && playerClass === quest.class_bonus) {
      const v = Number(quest.class_bonus_value) || 0
      switch (quest.class_bonus_type) {
        case 'xp':              earnedXp      = Math.floor(earnedXp * (1 + v / 100)); break
        case 'drachma':         earnedDrachma = Math.floor(earnedDrachma * (1 + v / 100)); break
        case 'loot_chance':     effectiveLootChance = Math.min(100, effectiveLootChance + v); break
        case 'loot_upgrade':    lootUpgradeChance   = Math.max(lootUpgradeChance, v); break
        case 'guaranteed_loot': effectiveLootChance = 100; break
      }
    }

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
    if (effectiveLootChance > 0 && Math.random() * 100 <= effectiveLootChance) {
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
        for (const r of lootRows) {
          roll -= r.drop_weight
          if (roll <= 0) { picked = r; break }
        }
        // Loot upgrade: escalate rarity within this quest's loot table
        if (lootUpgradeChance > 0 && Math.random() * 100 <= lootUpgradeChance) {
          const RARITY_NUM = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }
          const pickedNum  = RARITY_NUM[picked.rarity] || 1
          const candidates = lootRows.filter(r => (RARITY_NUM[r.rarity] || 0) > pickedNum)
          if (candidates.length > 0) {
            picked = candidates[Math.floor(Math.random() * candidates.length)]
          }
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
        energy_max       = ${stats.energy_max},
        health           = ${stats.health},
        health_max       = ${stats.health_max},
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
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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

    return res.status(200).json({
      inventory,
      equipment_bonuses,
      stats,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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

    return res.status(200).json({
      success: true,
      inventory,
      equipment_bonuses,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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

    return res.status(200).json({
      success: true,
      inventory,
      equipment_bonuses,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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
      success:     true,
      sold_item:   item.name,
      sell_price:  item.sell_price,
      new_drachma: updated[0].drachma,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
  } catch (err) {
    console.error('Sell error:', err)
    return res.status(500).json({ error: 'Failed to sell item' })
  }
}

// ── Consume (POST) ────────────────────────────────────────────────────────────

async function handleConsume(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { inventory_id } = req.body ?? {}
  if (!inventory_id) return res.status(400).json({ error: 'inventory_id is required' })

  try {
    const rows = await sql`
      SELECT inv.id, i.slot, i.name, i.consumable_effect, i.consumable_value
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.id = ${inventory_id} AND inv.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Item not found in inventory' })
    const item = rows[0]
    if (item.slot !== 'consumable') return res.status(400).json({ error: 'not_consumable' })

    const statsRows = await sql`SELECT * FROM pw_player_stats WHERE user_id = ${req.userId}`
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })
    let stats = regenPlayer(statsRows[0])

    let healthRestored = 0
    let energyRestored = 0

    if (item.consumable_effect === 'restore_health') {
      if (stats.health >= stats.health_max) {
        return res.status(400).json({ error: 'already_full_health' })
      }
      const value = item.consumable_value >= 9000 ? stats.health_max : item.consumable_value
      healthRestored = Math.min(value, stats.health_max - stats.health)
      stats = { ...stats, health: stats.health + healthRestored }
    } else if (item.consumable_effect === 'restore_full') {
      if (stats.health >= stats.health_max && stats.energy >= stats.energy_max) {
        return res.status(400).json({ error: 'already_full' })
      }
      healthRestored = stats.health_max - stats.health
      energyRestored = stats.energy_max - stats.energy
      stats = { ...stats, health: stats.health_max, energy: stats.energy_max }
    } else {
      return res.status(400).json({ error: 'unknown_effect' })
    }

    await sql`DELETE FROM pw_inventory WHERE id = ${inventory_id}`
    await sql`
      UPDATE pw_player_stats SET
        health       = ${stats.health},
        energy       = ${stats.energy},
        last_updated = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    return res.status(200).json({
      success:  true,
      consumed: { name: item.name, health_restored: healthRestored, energy_restored: energyRestored },
      stats: {
        health:     stats.health,
        health_max: stats.health_max,
        energy:     stats.energy,
        energy_max: stats.energy_max,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
  } catch (err) {
    console.error('Consume error:', err)
    return res.status(500).json({ error: 'Failed to consume item' })
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
             rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price,
             consumable_effect, consumable_value
      FROM pw_items
      WHERE buy_price IS NOT NULL OR glory_price IS NOT NULL
      ORDER BY slot, level_required, rarity
    `

    const drachmaRotationPool = items.filter(i =>
      i.buy_price !== null &&
      i.level_required <= stats.level &&
      ['common', 'uncommon', 'rare'].includes(i.rarity) &&
      i.slot !== 'consumable'
    )
    const rotation_items   = pickRotatedItems(drachmaRotationPool, getShopRotationSeed(), 8)
    const always_available = items.filter(i =>
      i.slot === 'consumable' &&
      i.buy_price !== null &&
      i.level_required <= stats.level
    )
    const glory_items = items.filter(i => i.glory_price !== null)

    return res.status(200).json({
      rotation_items,
      always_available,
      glory_items,
      rotation_expires_at: getShopRotationExpiry(),
      player: {
        drachma: stats.drachma,
        glory:   stats.glory,
        level:   stats.level,
        faction: rows[0].faction,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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

    if (currency === 'drachma' && item.slot !== 'consumable') {
      const rotated = await getDailyRotationPool(sql, player.level)
      if (!rotated.some(r => r.id === item_id)) {
        return res.status(400).json({ error: 'item_not_in_rotation' })
      }
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
      success:     true,
      purchased:   { id: item.id, name: item.name, rarity: item.rarity, slot: item.slot },
      new_drachma: updated[0].drachma,
      new_glory:   updated[0].glory,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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

    return res.status(200).json({
      entries: ranked,
      type,
      faction,
      your_rank: yourRank,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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
        error:     'Insufficient stat points',
        available: stats.stat_points,
        requested: total,
      })
    }

    const newAttack     = stats.attack     + a
    const newDefense    = stats.defense    + d
    const newEnergyMax  = stats.energy_max + e
    const newHealthMax  = stats.health_max + h
    const newStatPoints = stats.stat_points - total
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
      ok:        true,
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
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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
    id:                      row.id,
    temple_type:             row.temple_type,
    name:                    row.name,
    upgrade_level:           row.upgrade_level,
    current_income_per_hour: currentIncome,
    upgrade_cost:            upgradeCost,
    can_upgrade:             canUpgrade,
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
      const levelOk = playerLevel >= t.level_required
      const fundsOk = stats.drachma >= t.base_cost
      const canBuy  = levelOk && fundsOk
      const reason  = !canBuy ? (!levelOk ? 'level' : 'drachma') : null
      return { ...t, canBuy, reason }
    })

    const shapedOwned = owned.map(r => shapeOwnedTemple(r, stats.drachma))
    const totalIncome = shapedOwned.reduce((s, r) => s + r.current_income_per_hour, 0)

    return res.status(200).json({
      catalog,
      owned:                 shapedOwned,
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
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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

    const dupRows = await sql`
      SELECT COUNT(*) AS cnt FROM pw_player_temples
      WHERE user_id = ${req.userId} AND temple_type = ${temple_type}
    `
    if (Number(dupRows[0].cnt) > 0) {
      return res.status(400).json({ error: 'already_owned', message: 'You already own this temple. Upgrade it instead.' })
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

    return res.status(201).json({
      stats,
      temple: shaped,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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

    return res.status(200).json({
      stats,
      temple: shaped,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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
        level:            stats.level,
        xp:               stats.xp,
        energy:           stats.energy,
        energy_max:       stats.energy_max,
        health:           stats.health,
        health_max:       stats.health_max,
        drachma:          stats.drachma,
        drachma_lifetime: stats.drachma_lifetime,
        glory:            stats.glory,
        glory_lifetime:   stats.glory_lifetime,
        attack:           stats.attack,
        defense:          stats.defense,
        stat_points:      stats.stat_points,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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

    if (!attAlignment && stats.level >= 10) {
      return res.status(200).json({
        targets:            [],
        stats,
        requires_alignment: true,
        pendingAdventureRewards: req.pendingAdventureRewards || null,
      })
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
        ) sub
        WHERE sub.health > 0
        ORDER BY sub.level DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
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
        ) sub
        WHERE sub.health > 0
        ORDER BY sub.level DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const attEquip = await getEquipmentBonuses(sql, req.userId)
    const myPowerRating = calculatePowerRating(stats, attEquip)

    const targetsWithPower = await Promise.all(targets.map(async t => {
      const equip = await getEquipmentBonuses(sql, t.user_id)
      return { ...t, power_rating: calculatePowerRating(t, equip) }
    }))

    return res.status(200).json({
      targets:         targetsWithPower,
      stats,
      my_power_rating: myPowerRating,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
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

    if (!attUser.alignment && attLevel >= 10) {
      return res.status(400).json({ error: 'requires_alignment' })
    }

    if (attUser.alignment) {
      const opposing = attUser.alignment === 'coalition' ? 'compact' : 'coalition'
      if (defUser.alignment !== opposing && defLevel >= 10) {
        return res.status(400).json({ error: 'invalid_alignment_matchup' })
      }
    } else {
      if (defLevel >= 10) {
        return res.status(400).json({ error: 'invalid_alignment_matchup' })
      }
    }

    if (Math.abs(attLevel - defLevel) > 10) {
      return res.status(400).json({ error: 'level_out_of_range' })
    }

    const [attTemples, defTemples] = await Promise.all([
      fetchOwnedTemples(req.userId),
      fetchOwnedTemples(target_user_id),
    ])
    let attStats = regenPlayer(attRows[0], attTemples)
    let defStats = regenPlayer(defRows[0], defTemples)

    const energyCost = Math.max(1, Math.ceil(attStats.level / 10))
    if (attStats.energy < energyCost) {
      return res.status(400).json({ error: 'not_enough_energy', energy_required: energyCost })
    }

    if (attStats.health <= 0) return res.status(400).json({ error: 'attacker_no_health' })
    if (defStats.health <= 0) return res.status(400).json({ error: 'defender_no_health' })

    attStats = { ...attStats, energy: attStats.energy - energyCost }

    const [attEquip, defEquip] = await Promise.all([
      getEquipmentBonuses(sql, req.userId),
      getEquipmentBonuses(sql, target_user_id),
    ])

    const combat = calculateCombat({
      attacker:      { ...attUser, ...attStats },
      defender:      { ...defUser, ...defStats },
      attackerEquip: attEquip,
      defenderEquip: defEquip,
    })

    if (combat.result === 'win') {
      attStats = {
        ...attStats,
        xp:             attStats.xp + combat.xp_earned,
        glory:          attStats.glory + combat.glory_earned,
        glory_lifetime: attStats.glory_lifetime + combat.glory_earned,
        health:         Math.max(1, attStats.health - combat.attacker_health_lost),
      }
      defStats = {
        ...defStats,
        health: Math.max(1, defStats.health - combat.defender_health_lost),
      }
    } else {
      attStats = {
        ...attStats,
        health: Math.max(1, attStats.health - combat.attacker_health_lost),
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

    await sql`
      UPDATE pw_player_stats SET
        xp               = ${attStats.xp},
        level            = ${attStats.level},
        energy           = ${attStats.energy},
        energy_max       = ${attStats.energy_max},
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

    await sql`
      UPDATE pw_player_stats SET
        health           = ${defStats.health},
        glory            = ${defStats.glory},
        glory_lifetime   = ${defStats.glory_lifetime},
        last_updated     = ${defStats.last_updated}
      WHERE user_id = ${target_user_id}
    `

    await sql`
      INSERT INTO pw_combat_log (
        attacker_id, defender_id, attacker_power, defender_power, result,
        xp_earned, drachma_transferred, glory_earned, attacker_health_lost, defender_health_lost
      ) VALUES (
        ${req.userId}, ${target_user_id},
        ${combat.attacker_power}, ${combat.defender_power}, ${combat.result},
        ${combat.xp_earned}, 0, ${combat.glory_earned},
        ${combat.attacker_health_lost}, ${combat.defender_health_lost}
      )
    `

    return res.status(200).json({
      result:               combat.result,
      attacker_power:       combat.attacker_power,
      defender_power:       combat.defender_power,
      xp_earned:            combat.xp_earned,
      drachma_transferred:  0,
      glory_earned:         combat.glory_earned,
      attacker_health_lost: combat.attacker_health_lost,
      defender_health_lost: combat.defender_health_lost,
      energy_cost:          energyCost,
      attacker_mitigation:  combat.attacker_mitigation,
      defender_mitigation:  combat.defender_mitigation,
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
      pendingAdventureRewards: req.pendingAdventureRewards || null,
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

    return res.status(200).json({
      log,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
  } catch (err) {
    console.error('PvP log error:', err)
    return res.status(500).json({ error: 'Failed to fetch combat log' })
  }
}

// ── Adventures (GET) ──────────────────────────────────────────────────────────

async function handleAdventures(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rows = await sql`
      SELECT
        u.faction, u.class AS player_class,
        ps.level, ps.xp, ps.energy, ps.energy_max,
        ps.health, ps.health_max, ps.drachma, ps.drachma_lifetime,
        ps.glory, ps.glory_lifetime, ps.attack, ps.defense, ps.stat_points, ps.last_updated
      FROM pw_users u
      JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const ownedTemples = await fetchOwnedTemples(req.userId)
    let stats = regenPlayer(rows[0], ownedTemples)

    if (
      stats.energy  !== rows[0].energy  ||
      stats.health  !== rows[0].health  ||
      stats.drachma !== rows[0].drachma
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy           = ${stats.energy},
            health           = ${stats.health},
            drachma          = ${stats.drachma},
            drachma_lifetime = ${stats.drachma_lifetime},
            last_updated     = ${stats.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    // Active adventure — auto-complete already ran in top-level handler
    const activeAdv = await sql`
      SELECT pa.id, pa.adventure_id, pa.started_at, pa.completes_at,
             a.name, a.description, a.duration_seconds
      FROM pw_player_adventures pa
      JOIN pw_adventures a ON a.id = pa.adventure_id
      WHERE pa.user_id = ${req.userId} AND pa.status = 'active'
      LIMIT 1
    `
    const active = activeAdv.length > 0 ? {
      player_adventure_id: activeAdv[0].id,
      adventure_id:        activeAdv[0].adventure_id,
      name:                activeAdv[0].name,
      description:         activeAdv[0].description,
      duration_seconds:    activeAdv[0].duration_seconds,
      started_at:          activeAdv[0].started_at,
      completes_at:        activeAdv[0].completes_at,
    } : null

    const rotSeed = getAdventureRotationSeed()

    const allAdventures = await sql`
      SELECT id, slug, name, description, duration_seconds, energy_cost, xp_reward,
             drachma_base, drachma_range, loot_chance, min_loot_rarity, level_required,
             faction_bonus, faction_bonus_type, faction_bonus_value,
             class_bonus, class_bonus_type, class_bonus_value
      FROM pw_adventures
      WHERE level_required <= ${stats.level}
      ORDER BY level_required, id
    `
    const rotated = pickRotatedFromPool(allAdventures, rotSeed, 3)

    // Adventures completed or abandoned this rotation
    const attemptedRows = await sql`
      SELECT adventure_id, status
      FROM pw_player_adventures
      WHERE user_id = ${req.userId}
        AND rotation_seed_at_start = ${rotSeed}
        AND status IN ('completed', 'abandoned')
    `
    const attemptedMap = new Map(attemptedRows.map(r => [r.adventure_id, r.status]))

    const adventures = rotated.map(adv => {
      if (active && active.adventure_id === adv.id) return { ...adv, player_status: 'active' }
      const prior = attemptedMap.get(adv.id)
      return { ...adv, player_status: prior ?? 'available' }
    })

    return res.status(200).json({
      adventures,
      active_adventure:    active,
      rotation_expires_at: getAdventureRotationExpiry(),
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
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
  } catch (err) {
    console.error('Adventures error:', err)
    return res.status(500).json({ error: 'Failed to fetch adventures' })
  }
}

// ── Adventures Start (POST) ───────────────────────────────────────────────────

async function handleAdventuresStart(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { adventure_id: rawId } = req.body ?? {}
  if (!rawId) return res.status(400).json({ error: 'adventure_id is required' })
  const adventure_id = Number(rawId)

  try {
    // One active adventure at a time
    const activeRows = await sql`
      SELECT id FROM pw_player_adventures
      WHERE user_id = ${req.userId} AND status = 'active'
      LIMIT 1
    `
    if (activeRows.length > 0) return res.status(400).json({ error: 'active_adventure_exists' })

    const advRows = await sql`SELECT * FROM pw_adventures WHERE id = ${adventure_id}`
    if (advRows.length === 0) return res.status(404).json({ error: 'Adventure not found' })
    const adv = advRows[0]

    const pRows = await sql`
      SELECT ps.level, ps.energy, ps.energy_max, ps.health, ps.health_max,
             ps.drachma, ps.drachma_lifetime, ps.last_updated
      FROM pw_player_stats ps
      WHERE ps.user_id = ${req.userId}
    `
    if (pRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const ownedTemples = await fetchOwnedTemples(req.userId)
    let stats = regenPlayer(pRows[0], ownedTemples)

    if (stats.level < adv.level_required) {
      return res.status(400).json({ error: 'level_too_low', level_required: adv.level_required })
    }
    if (stats.energy < adv.energy_cost) {
      return res.status(400).json({ error: 'not_enough_energy', energy_required: adv.energy_cost })
    }

    // Confirm adventure is in the current rotation
    const rotSeed = getAdventureRotationSeed()
    const eligibleIds = await sql`
      SELECT id FROM pw_adventures
      WHERE level_required <= ${stats.level}
      ORDER BY level_required, id
    `
    const rotated = pickRotatedFromPool(eligibleIds, rotSeed, 3)
    if (!rotated.some(r => r.id === adventure_id)) {
      return res.status(400).json({ error: 'adventure_not_in_rotation' })
    }

    // No repeat attempts this rotation
    const attempted = await sql`
      SELECT id FROM pw_player_adventures
      WHERE user_id = ${req.userId}
        AND adventure_id = ${adventure_id}
        AND rotation_seed_at_start = ${rotSeed}
        AND status IN ('completed', 'abandoned')
      LIMIT 1
    `
    if (attempted.length > 0) return res.status(400).json({ error: 'already_attempted_this_rotation' })

    stats = { ...stats, energy: stats.energy - adv.energy_cost }

    await sql`
      UPDATE pw_player_stats SET
        energy           = ${stats.energy},
        health           = ${stats.health},
        drachma          = ${stats.drachma},
        drachma_lifetime = ${stats.drachma_lifetime},
        last_updated     = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    const completesAt = new Date(Date.now() + adv.duration_seconds * 1000).toISOString()

    const inserted = await sql`
      INSERT INTO pw_player_adventures (user_id, adventure_id, completes_at, rotation_seed_at_start)
      VALUES (${req.userId}, ${adventure_id}, ${completesAt}, ${rotSeed})
      RETURNING id, started_at, completes_at
    `

    return res.status(200).json({
      success: true,
      adventure: {
        player_adventure_id: inserted[0].id,
        adventure_id:        adv.id,
        name:                adv.name,
        description:         adv.description,
        duration_seconds:    adv.duration_seconds,
        started_at:          inserted[0].started_at,
        completes_at:        inserted[0].completes_at,
      },
      stats: {
        energy:     stats.energy,
        energy_max: stats.energy_max,
        health:     stats.health,
        health_max: stats.health_max,
        drachma:    stats.drachma,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
  } catch (err) {
    console.error('Adventures start error:', err)
    return res.status(500).json({ error: 'Failed to start adventure' })
  }
}

// ── Adventures Abandon (POST) ─────────────────────────────────────────────────

async function handleAdventuresAbandon(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { player_adventure_id: rawId } = req.body ?? {}
  if (!rawId) return res.status(400).json({ error: 'player_adventure_id is required' })
  const player_adventure_id = Number(rawId)

  try {
    const rows = await sql`
      SELECT pa.id, pa.status, a.name
      FROM pw_player_adventures pa
      JOIN pw_adventures a ON a.id = pa.adventure_id
      WHERE pa.id = ${player_adventure_id} AND pa.user_id = ${req.userId}
      LIMIT 1
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Adventure not found' })
    if (rows[0].status !== 'active') return res.status(400).json({ error: 'adventure_not_active' })

    await sql`
      UPDATE pw_player_adventures SET status = 'abandoned'
      WHERE id = ${player_adventure_id}
    `

    return res.status(200).json({
      success:             true,
      abandoned_adventure: rows[0].name,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
    })
  } catch (err) {
    console.error('Adventures abandon error:', err)
    return res.status(500).json({ error: 'Failed to abandon adventure' })
  }
}

// ── Adventures Claim (POST) ───────────────────────────────────────────────────

async function handleAdventuresClaim(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Auto-complete already ran in the top-level handler.
    // If it fired, rewards are already in req.pendingAdventureRewards.
    if (req.pendingAdventureRewards) {
      return res.status(200).json({
        success: true,
        rewards: req.pendingAdventureRewards,
        pendingAdventureRewards: req.pendingAdventureRewards,
      })
    }

    // No auto-complete — check if an active adventure exists and is actually ready
    const readyRows = await sql`
      SELECT id, completes_at FROM pw_player_adventures
      WHERE user_id = ${req.userId} AND status = 'active'
      LIMIT 1
    `
    if (readyRows.length === 0) return res.status(400).json({ error: 'no_active_adventure' })
    if (new Date(readyRows[0].completes_at) > new Date()) {
      return res.status(400).json({ error: 'adventure_not_ready', completes_at: readyRows[0].completes_at })
    }

    // Edge case: adventure ready but auto-complete missed it — run manually
    const rewards = await checkAndCompleteAdventures(sql, req.userId)
    return res.status(200).json({
      success: true,
      rewards,
      pendingAdventureRewards: rewards,
    })
  } catch (err) {
    console.error('Adventures claim error:', err)
    return res.status(500).json({ error: 'Failed to claim adventure rewards' })
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export default requireUser(async function handler(req, res) {
  const { action } = req.query

  // Auto-complete any expired adventure before processing any action
  req.pendingAdventureRewards = null
  try { req.pendingAdventureRewards = await checkAndCompleteAdventures(sql, req.userId) } catch {}

  if (action === 'quests')             return handleQuests(req, res)
  if (action === 'complete')           return handleComplete(req, res)
  if (action === 'inventory')          return handleInventory(req, res)
  if (action === 'equip')              return handleEquip(req, res)
  if (action === 'unequip')            return handleUnequip(req, res)
  if (action === 'sell')               return handleSell(req, res)
  if (action === 'consume')            return handleConsume(req, res)
  if (action === 'shop')               return handleShop(req, res)
  if (action === 'buy')                return handleBuy(req, res)
  if (action === 'leaderboard')        return handleLeaderboard(req, res)
  if (action === 'allocate')           return handleAllocate(req, res)
  if (action === 'temples')            return handleTemples(req, res)
  if (action === 'temples_buy')        return handleTemplesBuy(req, res)
  if (action === 'temples_upgrade')    return handleTemplesUpgrade(req, res)
  if (action === 'alignment_choose')   return handleAlignmentChoose(req, res)
  if (action === 'pvp_targets')        return handlePvPTargets(req, res)
  if (action === 'pvp_attack')         return handlePvPAttack(req, res)
  if (action === 'pvp_log')            return handlePvPLog(req, res)
  if (action === 'adventures')         return handleAdventures(req, res)
  if (action === 'adventures_start')   return handleAdventuresStart(req, res)
  if (action === 'adventures_abandon') return handleAdventuresAbandon(req, res)
  if (action === 'adventures_claim')   return handleAdventuresClaim(req, res)
  return res.status(400).json({ error: 'Unknown action' })
})

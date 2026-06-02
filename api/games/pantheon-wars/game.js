import { sql } from '../../../lib/db.js'
import { requireUser, requireUserWithModCheck } from '../../../lib/pwAuth.js'
import { requireAdmin } from '../../../lib/auth.js'
import {
  regenPlayer, checkLevelUp, getEquipmentBonuses,
  simulateCombat,
  calculatePowerRating,
  getRaceClassCombatBonuses,
  getShopRotationSeed, getShopRotationExpiry, pickRotatedItems, getDailyRotationPool,
  getGloryRotationSeed, getGloryRotationExpiry, getGloryRotationPool,
  getQuestRotationSeed, getQuestRotationExpiry,
  getAdventureRotationSeed, getAdventureRotationExpiry,
  pickRotatedFromPool, checkAndCompleteAdventures, checkAndCompleteUpgrades,
  checkAndInsertTempleIncomeReward,
  computeResetBaselines, calculateTitanRewards,
  getPlayerTownships, aggregateTownshipBonuses,
  computeXpReward, computeDrachmaReward,
  getTownshipBonusValue, getTownshipUpgradeCost, getTownshipUpgradeSeconds,
  rollTitanLootRarity,
  processExpiredTitanEvents,
  checkAndCompleteCrafts, getCraftCycleSeconds, rollCraftRarity,
  checkChatRateLimit,
  getUserAllianceMembership, requireAllianceRank,
  recalculateAlliancePower, computeAlliancePowerBreakdown, getAlliancePerks,
  RARITY_VALUE,
} from '../../../lib/pwHelpers.js'
import { getPusherServer } from '../../../lib/pwPusher.js'
import { isProfane } from '../../../lib/profanityFilter.js'

export const config = { runtime: 'nodejs' }

// ── Quests (GET) ──────────────────────────────────────────────────────────────

async function handleQuests(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const statsRows = await sql`
      SELECT ps.*, u.class, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })
    const templeRows = await fetchOwnedTemples(req.userId)
    const questsTownships = await getPlayerTownships(sql, req.userId)
    const questsTownshipBonuses = aggregateTownshipBonuses(questsTownships)

    let stats = regenPlayer(statsRows[0], templeRows, statsRows[0].class, statsRows[0].faction, questsTownshipBonuses)

    if (
      stats.energy !== statsRows[0].energy || stats.health !== statsRows[0].health ||
      stats.drachma !== statsRows[0].drachma ||
      stats.energy_regen_base !== statsRows[0].energy_regen_base ||
      stats.health_regen_base !== statsRows[0].health_regen_base
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${stats.energy}, health = ${stats.health},
            drachma = ${stats.drachma},
            drachma_lifetime = ${stats.drachma_lifetime},
            energy_regen_base = ${stats.energy_regen_base},
            health_regen_base = ${stats.health_regen_base},
            last_updated = ${stats.last_updated}
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
        u.faction, u.class, u.alignment,
        s.user_id, s.level, s.xp, s.energy, s.energy_max,
        s.health, s.health_max, s.drachma, s.drachma_lifetime,
        s.glory, s.glory_lifetime, s.attack, s.defense, s.stat_points, s.last_updated,
        s.energy_regen_base, s.health_regen_base
      FROM pw_users u
      JOIN pw_player_stats s ON s.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const row = rows[0]
    const { faction } = row
    const playerClass = row.class
    const alignment = row.alignment

    const completeTempleRows = await fetchOwnedTemples(req.userId)
    const completeTownships = await getPlayerTownships(sql, req.userId)
    const townshipBonuses = aggregateTownshipBonuses(completeTownships)
    let stats = regenPlayer(row, completeTempleRows, playerClass, faction, townshipBonuses)

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

    const perSourceBonuses = {
      faction_bonus:       quest.faction_bonus,
      faction_bonus_type:  quest.faction_bonus_type,
      faction_bonus_value: Number(quest.faction_bonus_value) || 0,
      class_bonus:         quest.class_bonus,
      class_bonus_type:    quest.class_bonus_type,
      class_bonus_value:   Number(quest.class_bonus_value) || 0,
      player_faction:      faction,
      player_class:        playerClass,
    }

    const earnedXp      = computeXpReward(quest.xp_reward, faction, alignment, perSourceBonuses, townshipBonuses)
    let   earnedDrachma = computeDrachmaReward(baseDrachma, faction, playerClass, perSourceBonuses, townshipBonuses)
    let effectiveLootChance = quest.loot_chance
    let lootUpgradeChance   = 0

    // Phase C — alliance Economic tier perk boosts drachma earned (applied last,
    // after all faction/class/township bonuses, before crediting). Quests grant no glory.
    const questAlliancePerks = await getAlliancePerks(sql, req.userId)
    if (questAlliancePerks.drachma_bonus_pct > 0) {
      earnedDrachma = Math.floor(earnedDrachma * (1 + questAlliancePerks.drachma_bonus_pct))
    }

    // Track bonuses applied for frontend display
    const bonuses_applied = []
    if (faction === 'olympians') bonuses_applied.push({ source: 'olympians', type: 'xp', value: 10 })
    if (alignment === 'coalition') bonuses_applied.push({ source: 'coalition', type: 'xp', value: 15 })
    if (faction === 'annunaki')  bonuses_applied.push({ source: 'annunaki', type: 'drachma', value: 5 })
    if (playerClass === 'broker') bonuses_applied.push({ source: 'broker', type: 'drachma', value: 10 })
    if (townshipBonuses.xp_pct > 0) bonuses_applied.push({ source: 'divination', type: 'xp', value: Math.round(townshipBonuses.xp_pct) })
    if (townshipBonuses.drachma_pct > 0) bonuses_applied.push({ source: 'commerce', type: 'drachma', value: Math.round(townshipBonuses.drachma_pct) })
    if (questAlliancePerks.drachma_bonus_pct > 0) bonuses_applied.push({ source: 'alliance', type: 'drachma', value: Math.round(questAlliancePerks.drachma_bonus_pct * 100) })

    // Per-quest faction bonus: xp/drachma handled in computeXpReward/computeDrachmaReward; handle loot here
    if (quest.faction_bonus && faction === quest.faction_bonus) {
      const v = Number(quest.faction_bonus_value) || 0
      switch (quest.faction_bonus_type) {
        case 'loot_chance':     effectiveLootChance = Math.min(100, effectiveLootChance + v); break
        case 'loot_upgrade':    lootUpgradeChance   = Math.max(lootUpgradeChance, v); break
        case 'guaranteed_loot': effectiveLootChance = 100; break
      }
      bonuses_applied.push({ source: 'quest_faction', type: quest.faction_bonus_type, value: v })
    }

    // Per-quest class bonus: xp/drachma handled in computeXpReward/computeDrachmaReward; handle loot here
    if (quest.class_bonus && playerClass === quest.class_bonus) {
      const v = Number(quest.class_bonus_value) || 0
      switch (quest.class_bonus_type) {
        case 'loot_chance':     effectiveLootChance = Math.min(100, effectiveLootChance + v); break
        case 'loot_upgrade':    lootUpgradeChance   = Math.max(lootUpgradeChance, v); break
        case 'guaranteed_loot': effectiveLootChance = 100; break
      }
      bonuses_applied.push({ source: 'quest_class', type: quest.class_bonus_type, value: v })
    }

    stats = {
      ...stats,
      xp:               stats.xp + earnedXp,
      drachma:          stats.drachma + earnedDrachma,
      drachma_lifetime: stats.drachma_lifetime + earnedDrachma,
    }

    const prevLevel = stats.level
    stats = checkLevelUp(stats, playerClass)
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
        energy             = ${stats.energy},
        energy_max         = ${stats.energy_max},
        health             = ${stats.health},
        health_max         = ${stats.health_max},
        xp                 = ${stats.xp},
        level              = ${stats.level},
        drachma            = ${stats.drachma},
        drachma_lifetime   = ${stats.drachma_lifetime},
        glory_lifetime     = ${stats.glory_lifetime},
        stat_points        = ${stats.stat_points},
        energy_regen_base  = ${stats.energy_regen_base},
        health_regen_base  = ${stats.health_regen_base},
        last_updated       = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    await sql`
      INSERT INTO pw_quest_progress (user_id, quest_id, completions)
      VALUES (${req.userId}, ${quest_id}, ${newCompletions})
      ON CONFLICT (user_id, quest_id) DO UPDATE SET completions = ${newCompletions}
    `

    return res.status(200).json({
      success:      true,
      rewards:      { xp: earnedXp, drachma: earnedDrachma, loot: lootItem, bonuses_applied },
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
    const statsRows = await sql`
      SELECT ps.*, u.class, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })
    const templeRows = await fetchOwnedTemples(req.userId)
    const invTownships = await getPlayerTownships(sql, req.userId)
    const invTownshipBonuses = aggregateTownshipBonuses(invTownships)

    let stats = regenPlayer(statsRows[0], templeRows, statsRows[0].class, statsRows[0].faction, invTownshipBonuses)
    if (
      stats.energy !== statsRows[0].energy || stats.health !== statsRows[0].health ||
      stats.drachma !== statsRows[0].drachma ||
      stats.energy_regen_base !== statsRows[0].energy_regen_base ||
      stats.health_regen_base !== statsRows[0].health_regen_base
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${stats.energy}, health = ${stats.health},
            drachma = ${stats.drachma},
            drachma_lifetime = ${stats.drachma_lifetime},
            energy_regen_base = ${stats.energy_regen_base},
            health_regen_base = ${stats.health_regen_base},
            last_updated = ${stats.last_updated}
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
        i.agility_bonus,
        i.crit_chance,
        i.block_chance,
        i.dodge_chance,
        i.rarity,
        i.level_required,
        i.faction_exclusive,
        i.sell_price,
        i.consumable_effect,
        i.consumable_value
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.user_id = ${req.userId}
      ORDER BY i.slot, inv.equipped DESC, i.rarity DESC, i.level_required DESC
    `

    const equipment_bonuses = await getEquipmentBonuses(sql, req.userId)

    const invStats = await resetDailyCountersIfNeeded(stats, req.userId)

    return res.status(200).json({
      inventory,
      equipment_bonuses,
      stats: {
        ...invStats,
        energy_potion_uses_today: invStats.energy_potion_uses_today ?? 0,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
    const equipment_bonuses = await getEquipmentBonuses(sql, req.userId)

    return res.status(200).json({
      success: true,
      inventory,
      equipment_bonuses,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
    const equipment_bonuses = await getEquipmentBonuses(sql, req.userId)

    return res.status(200).json({
      success: true,
      inventory,
      equipment_bonuses,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('Sell error:', err)
    return res.status(500).json({ error: 'Failed to sell item' })
  }
}

// ── Daily counter reset helper ────────────────────────────────────────────────

async function resetDailyCountersIfNeeded(statsObj, userId) {
  const TODAY_SEED = Math.floor(Date.now() / 86400000)
  if ((statsObj.energy_potion_reset_day ?? -1) === TODAY_SEED) return statsObj
  await sql`
    UPDATE pw_player_stats SET
      energy_potion_purchases_today      = 0,
      energy_potion_uses_today           = 0,
      health_potion_uses_today           = 0,
      divine_restoration_purchases_today = 0,
      energy_potion_reset_day            = ${TODAY_SEED}
    WHERE user_id = ${userId}
  `
  return {
    ...statsObj,
    energy_potion_purchases_today:      0,
    energy_potion_uses_today:           0,
    health_potion_uses_today:           0,
    divine_restoration_purchases_today: 0,
    energy_potion_reset_day:            TODAY_SEED,
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

    const statsRows = await sql`
      SELECT ps.*, u.class, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })
    const consumeTempleRows = await fetchOwnedTemples(req.userId)
    const consumeTownships = await getPlayerTownships(sql, req.userId)
    const consumeTownshipBonuses = aggregateTownshipBonuses(consumeTownships)
    let stats = regenPlayer(statsRows[0], consumeTempleRows, statsRows[0].class, statsRows[0].faction, consumeTownshipBonuses)

    let healthRestored = 0
    let energyRestored = 0

    // Apply daily counter reset before any potion checks
    stats = await resetDailyCountersIfNeeded(stats, req.userId)

    // Determine which daily counters this item affects
    let incrementEnergyUse = false
    let incrementHealthUse = false
    switch (item.consumable_effect) {
      case 'restore_energy_pct':
        incrementEnergyUse = true
        break
      case 'restore_health_pct':
      case 'restore_health':
        incrementHealthUse = true
        break
      case 'restore_full':
        // Divine Restoration restores both — counts against both daily limits
        incrementEnergyUse = true
        incrementHealthUse = true
        break
    }

    // Enforce daily use limits before applying any effect
    if (incrementEnergyUse && (stats.energy_potion_uses_today ?? 0) >= 10) {
      const resets_at = (Math.floor(Date.now() / 86400000) + 1) * 86400000
      return res.status(400).json({ error: 'energy_potion_use_limit', message: 'Daily energy potion use limit reached (10/day).', resets_at })
    }
    if (incrementHealthUse && (stats.health_potion_uses_today ?? 0) >= 10) {
      const resets_at = (Math.floor(Date.now() / 86400000) + 1) * 86400000
      return res.status(400).json({ error: 'health_potion_use_limit', message: 'Daily health potion use limit reached (10/day).', resets_at })
    }

    if (item.consumable_effect === 'restore_health_pct') {
      if (stats.health >= stats.health_max) {
        return res.status(400).json({ error: 'already_full_health' })
      }
      const restoreAmount = Math.floor(stats.health_max * (item.consumable_value / 100))
      healthRestored = Math.min(restoreAmount, stats.health_max - stats.health)
      stats = { ...stats, health: stats.health + healthRestored }
    } else if (item.consumable_effect === 'restore_energy_pct') {
      if (stats.energy >= stats.energy_max) {
        return res.status(400).json({ error: 'already_full_energy' })
      }
      const restoreAmount = Math.floor(stats.energy_max * (item.consumable_value / 100))
      energyRestored = Math.min(restoreAmount, stats.energy_max - stats.energy)
      stats = { ...stats, energy: stats.energy + energyRestored }
    } else if (item.consumable_effect === 'restore_health') {
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
    } else if (item.consumable_effect === 'realloc_stats') {
      // Scroll/Tablet of Reinvention — stat reset consumable
      const playerClass = statsRows[0].class
      const faction     = statsRows[0].faction
      const { attackBaseline, defenseBaseline, agilityBaseline, energyMaxBaseline, healthMaxBaseline } =
        computeResetBaselines(stats, playerClass, faction)

      const refundAttack  = Math.max(0, (stats.attack  ?? attackBaseline)  - attackBaseline)
      const refundDefense = Math.max(0, (stats.defense ?? defenseBaseline) - defenseBaseline)
      const refundAgility = Math.max(0, (stats.agility ?? agilityBaseline) - agilityBaseline)
      // energy_max and health_max are intentionally excluded — only atk/def/agi are refunded
      const totalRefunded = refundAttack + refundDefense + refundAgility

      const newStatPoints = (stats.stat_points || 0) + totalRefunded
      // Restore to current max (preserve any allocated energy/health capacity)
      const newEnergy = stats.energy_max
      const newHealth = stats.health_max

      await sql`DELETE FROM pw_inventory WHERE id = ${inventory_id}`
      await sql`
        UPDATE pw_player_stats SET
          attack            = ${attackBaseline},
          defense           = ${defenseBaseline},
          agility           = ${agilityBaseline},
          energy            = ${newEnergy},
          health            = ${newHealth},
          stat_points       = ${newStatPoints},
          drachma           = ${stats.drachma},
          drachma_lifetime  = ${stats.drachma_lifetime},
          energy_regen_base = ${stats.energy_regen_base},
          health_regen_base = ${stats.health_regen_base},
          last_updated      = ${stats.last_updated}
        WHERE user_id = ${req.userId}
      `

      return res.status(200).json({
        ok:      true,
        consumed: {
          id:             inventory_id,
          name:           item.name,
          effect:         'realloc_stats',
          points_refunded: totalRefunded,
        },
        stats: {
          attack:      attackBaseline,
          defense:     defenseBaseline,
          agility:     agilityBaseline,
          energy_max:  stats.energy_max,
          health_max:  stats.health_max,
          energy:      newEnergy,
          health:      newHealth,
          stat_points: newStatPoints,
        },
        pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      })
    } else {
      return res.status(400).json({ error: 'unknown_effect' })
    }

    await sql`DELETE FROM pw_inventory WHERE id = ${inventory_id}`
    await sql`
      UPDATE pw_player_stats SET
        health                     = ${stats.health},
        energy                     = ${stats.energy},
        drachma                    = ${stats.drachma},
        drachma_lifetime           = ${stats.drachma_lifetime},
        energy_regen_base          = ${stats.energy_regen_base},
        health_regen_base          = ${stats.health_regen_base},
        last_updated               = ${stats.last_updated},
        energy_potion_uses_today   = energy_potion_uses_today + ${incrementEnergyUse ? 1 : 0},
        health_potion_uses_today   = health_potion_uses_today + ${incrementHealthUse ? 1 : 0}
      WHERE user_id = ${req.userId}
    `

    return res.status(200).json({
      success:  true,
      consumed: { id: inventory_id, name: item.name, health_restored: healthRestored, energy_restored: energyRestored },
      stats: {
        health:                    stats.health,
        health_max:                stats.health_max,
        energy:                    stats.energy,
        energy_max:                stats.energy_max,
        energy_potion_uses_today:  (stats.energy_potion_uses_today ?? 0) + (incrementEnergyUse ? 1 : 0),
        health_potion_uses_today:  (stats.health_potion_uses_today ?? 0) + (incrementHealthUse ? 1 : 0),
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      SELECT ps.*, u.faction, u.class AS player_class
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const shopPlayerClass = rows[0].player_class
    const shopTemples = await fetchOwnedTemples(req.userId)
    const shopTownships = await getPlayerTownships(sql, req.userId)
    const shopTownshipBonuses = aggregateTownshipBonuses(shopTownships)

    let stats = regenPlayer(rows[0], shopTemples, shopPlayerClass, rows[0].faction, shopTownshipBonuses)
    if (
      stats.energy !== rows[0].energy || stats.health !== rows[0].health ||
      stats.drachma !== rows[0].drachma ||
      stats.energy_regen_base !== rows[0].energy_regen_base ||
      stats.health_regen_base !== rows[0].health_regen_base
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy = ${stats.energy}, health = ${stats.health},
            drachma = ${stats.drachma},
            drachma_lifetime = ${stats.drachma_lifetime},
            energy_regen_base = ${stats.energy_regen_base},
            health_regen_base = ${stats.health_regen_base},
            last_updated = ${stats.last_updated}
        WHERE user_id = ${req.userId}
      `
    }

    stats = await resetDailyCountersIfNeeded(stats, req.userId)

    // Drachma rotation — unified with handleBuy via getDailyRotationPool
    const rotationRaw = await getDailyRotationPool(sql, stats.level, 5)
    const rotation_items = rotationRaw.map(item => ({
      ...item,
      effective_price: shopPlayerClass === 'broker'
        ? Math.floor(item.buy_price * 0.90)
        : item.buy_price,
    }))

    // Drachma always_available: all consumables with a buy_price, level-gated
    const always_available = await sql`
      SELECT id, name, description, slot, attack_bonus, defense_bonus, agility_bonus,
             crit_chance, block_chance, dodge_chance,
             rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price,
             consumable_effect, consumable_value
      FROM pw_items
      WHERE slot = 'consumable' AND buy_price IS NOT NULL AND level_required <= ${stats.level}
      ORDER BY level_required, id
    `

    // Glory items — consumables always shown, equipment rotates daily
    const glory_always_available = await sql`
      SELECT id, name, description, slot, rarity, level_required, faction_exclusive,
             buy_price, sell_price, glory_price, consumable_effect, consumable_value
      FROM pw_items
      WHERE glory_price IS NOT NULL AND slot = 'consumable'
      ORDER BY level_required, id
    `
    const glory_rotation_items = await getGloryRotationPool(sql, 3)

    // Equipped items for gear comparison in the shop UI
    const equippedRows = await sql`
      SELECT inv.id, i.name, i.slot, i.rarity,
             i.attack_bonus, i.defense_bonus, i.agility_bonus,
             i.crit_chance, i.block_chance, i.dodge_chance,
             i.level_required, i.faction_exclusive
      FROM pw_inventory inv
      JOIN pw_items i ON i.id = inv.item_id
      WHERE inv.user_id = ${req.userId} AND inv.equipped = true
    `
    const equipped_by_slot = {}
    for (const row of equippedRows) {
      equipped_by_slot[row.slot] = row
    }

    const nowUtc = new Date()
    const tomorrowUtc = new Date(Date.UTC(
      nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() + 1, 0, 0, 0
    ))

    return res.status(200).json({
      rotation_items,
      always_available,
      glory_rotation_items,
      glory_always_available,
      equipped_by_slot,
      rotation_expires_at:       getShopRotationExpiry(),
      glory_rotation_expires_at: getGloryRotationExpiry(),
      rotation_seed: getShopRotationSeed(),
      player: {
        drachma:                            stats.drachma,
        glory:                              stats.glory,
        level:                              stats.level,
        faction:                            rows[0].faction,
        player_class:                       shopPlayerClass,
        energy_potion_purchases_today:      stats.energy_potion_purchases_today ?? 0,
        energy_potion_uses_today:           stats.energy_potion_uses_today ?? 0,
        health_potion_uses_today:           stats.health_potion_uses_today ?? 0,
        divine_restoration_purchases_today: stats.divine_restoration_purchases_today ?? 0,
      },
      daily_limits: {
        energy_potion_purchases_today:         stats.energy_potion_purchases_today ?? 0,
        energy_potion_uses_today:              stats.energy_potion_uses_today ?? 0,
        health_potion_uses_today:              stats.health_potion_uses_today ?? 0,
        divine_restoration_purchases_today:    stats.divine_restoration_purchases_today ?? 0,
        max_energy_purchases:                  5,
        max_energy_uses:                       10,
        max_health_uses:                       10,
        max_divine_restoration_purchases:      1,
        resets_at:                             tomorrowUtc.toISOString(),
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('Shop error:', err)
    return res.status(500).json({ error: 'Failed to fetch shop' })
  }
}

// ── Shop Buy (POST) ───────────────────────────────────────────────────────────

async function handleBuy(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { item_id, currency, rotation_seed } = req.body ?? {}
  if (!item_id) return res.status(400).json({ error: 'item_id is required' })
  if (!['drachma', 'glory'].includes(currency)) {
    return res.status(400).json({ error: 'currency must be "drachma" or "glory"' })
  }

  try {
    const itemRows = await sql`
      SELECT id, name, rarity, slot, level_required, faction_exclusive, buy_price, glory_price, consumable_effect
      FROM pw_items WHERE id = ${item_id}
    `
    if (itemRows.length === 0) return res.status(404).json({ error: 'Item not found' })

    const item = itemRows[0]
    const price = currency === 'drachma' ? item.buy_price : item.glory_price
    if (price === null) {
      return res.status(400).json({ error: `This item is not available in the ${currency} shop` })
    }

    const playerRows = await sql`
      SELECT ps.level, ps.drachma, ps.glory,
             ps.energy_potion_purchases_today, ps.energy_potion_uses_today, ps.energy_potion_reset_day,
             ps.divine_restoration_purchases_today,
             u.faction, u.class AS player_class
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (playerRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    let player = await resetDailyCountersIfNeeded(playerRows[0], req.userId)

    if (player.level < item.level_required) {
      return res.status(400).json({ error: `Requires level ${item.level_required}` })
    }
    if (item.faction_exclusive && item.faction_exclusive !== player.faction) {
      return res.status(400).json({ error: `This item is exclusive to the ${item.faction_exclusive} faction` })
    }

    if (currency === 'drachma' && item.slot !== 'consumable') {
      // If the client passed a rotation_seed, check it matches before doing the DB query.
      // Mismatch means UTC midnight rolled over between GET and POST — friendly error so
      // the frontend can reload the shop rather than showing a confusing message.
      if (rotation_seed != null && rotation_seed !== getShopRotationSeed()) {
        return res.status(400).json({ error: 'rotation_expired', message: 'The shop has just refreshed. Loading new items...' })
      }
      const rotated = await getDailyRotationPool(sql, player.level, 5)
      if (!rotated.some(r => r.id === item_id)) {
        return res.status(400).json({ error: 'item_not_in_rotation' })
      }
    }

    if (currency === 'glory' && item.slot !== 'consumable') {
      const gloryRotated = await getGloryRotationPool(sql, 3)
      if (!gloryRotated.some(r => r.id === item_id)) {
        return res.status(400).json({ error: 'glory_item_not_in_rotation' })
      }
    }

    // Energy potion purchase limit: max 5 per UTC day
    if (item.consumable_effect === 'restore_energy_pct') {
      const purchasesToday = player.energy_potion_purchases_today ?? 0
      if (purchasesToday >= 5) {
        const resets_at = (Math.floor(Date.now() / 86400000) + 1) * 86400000
        return res.status(400).json({ error: 'daily_purchase_limit_reached', resets_at })
      }
    }

    // Divine Restoration: max 1 purchase per UTC day
    if (item.name === 'Divine Restoration') {
      const drPurchasesToday = player.divine_restoration_purchases_today ?? 0
      if (drPurchasesToday >= 1) {
        const resets_at = (Math.floor(Date.now() / 86400000) + 1) * 86400000
        return res.status(400).json({ error: 'divine_restoration_daily_limit', message: 'Divine Restoration is limited to 1 purchase per day.', resets_at })
      }
    }

    // Broker gets 10% drachma shop discount
    const effectivePrice = currency === 'drachma' && player.player_class === 'broker'
      ? Math.floor(item.buy_price * 0.90)
      : price

    const balance = currency === 'drachma' ? player.drachma : player.glory
    if (balance < effectivePrice) {
      return res.status(400).json({ error: `Insufficient ${currency}`, required: effectivePrice })
    }

    if (currency === 'drachma') {
      await sql`UPDATE pw_player_stats SET drachma = drachma - ${effectivePrice} WHERE user_id = ${req.userId}`
    } else {
      await sql`UPDATE pw_player_stats SET glory = glory - ${effectivePrice} WHERE user_id = ${req.userId}`
    }

    await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${item_id})`

    // Increment purchase counters
    if (item.consumable_effect === 'restore_energy_pct') {
      const newPurchases = (player.energy_potion_purchases_today ?? 0) + 1
      const todaySeed    = Math.floor(Date.now() / 86400000)
      await sql`
        UPDATE pw_player_stats
        SET energy_potion_purchases_today = ${newPurchases},
            energy_potion_reset_day       = ${todaySeed}
        WHERE user_id = ${req.userId}
      `
    }
    if (item.name === 'Divine Restoration') {
      await sql`
        UPDATE pw_player_stats
        SET divine_restoration_purchases_today = divine_restoration_purchases_today + 1
        WHERE user_id = ${req.userId}
      `
    }

    const updated = await sql`SELECT drachma, glory FROM pw_player_stats WHERE user_id = ${req.userId}`

    return res.status(200).json({
      success:     true,
      purchased:   { id: item.id, name: item.name, rarity: item.rarity, slot: item.slot },
      new_drachma: updated[0].drachma,
      new_glory:   updated[0].glory,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('Leaderboard error:', err)
    return res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
}

// ── Allocate (POST) ───────────────────────────────────────────────────────────

async function handleAllocate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { attack = 0, defense = 0, energy_max = 0, health_max = 0, agility = 0 } = req.body || {}
  const a   = Number(attack)
  const d   = Number(defense)
  const e   = Number(energy_max)
  const h   = Number(health_max)
  const agi = Number(agility)

  if (!Number.isInteger(a)   || !Number.isInteger(d) || !Number.isInteger(e) ||
      !Number.isInteger(h)   || !Number.isInteger(agi) ||
      a < 0 || d < 0 || e < 0 || h < 0 || agi < 0) {
    return res.status(400).json({ error: 'Invalid allocation values' })
  }
  const total = a + d + e + h + agi
  if (total === 0) return res.status(400).json({ error: 'No points to allocate' })

  try {
    const rows = await sql`
      SELECT ps.*, u.class, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player stats not found' })
    const allocateTempleRows = await fetchOwnedTemples(req.userId)
    const allocateTownships = await getPlayerTownships(sql, req.userId)
    const allocateTownshipBonuses = aggregateTownshipBonuses(allocateTownships)

    const stats = regenPlayer(rows[0], allocateTempleRows, rows[0].class, rows[0].faction, allocateTownshipBonuses)

    if (stats.stat_points < total) {
      return res.status(400).json({
        error:     'Insufficient stat points',
        available: stats.stat_points,
        requested: total,
      })
    }

    const newAttack     = stats.attack     + a
    const newDefense    = stats.defense    + d
    const newAgility    = (stats.agility || 0) + agi
    const newEnergyMax  = stats.energy_max + e
    const newHealthMax  = stats.health_max + h
    const newStatPoints = stats.stat_points - total
    const newEnergy = Math.min(stats.energy + e, newEnergyMax)
    const newHealth = Math.min(stats.health + h, newHealthMax)

    await sql`
      UPDATE pw_player_stats SET
        attack             = ${newAttack},
        defense            = ${newDefense},
        agility            = ${newAgility},
        energy_max         = ${newEnergyMax},
        health_max         = ${newHealthMax},
        stat_points        = ${newStatPoints},
        glory_lifetime     = ${stats.glory_lifetime},
        drachma            = ${stats.drachma},
        drachma_lifetime   = ${stats.drachma_lifetime},
        energy             = ${newEnergy},
        health             = ${newHealth},
        energy_regen_base  = ${stats.energy_regen_base},
        health_regen_base  = ${stats.health_regen_base},
        last_updated       = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    return res.status(200).json({
      ok:        true,
      allocated: { attack: a, defense: d, agility: agi, energy_max: e, health_max: h },
      newStats: {
        attack:      newAttack,
        defense:     newDefense,
        agility:     newAgility,
        energy_max:  newEnergyMax,
        health_max:  newHealthMax,
        stat_points: newStatPoints,
        energy:      newEnergy,
        health:      newHealth,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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

const MAX_TEMPLE_LEVEL = 25

function templeIncomeMultiplier(level) {
  return 1 + 0.234 * Math.pow(level, 1.03)
}

// Tiered upgrade cost: levels 0-9 → 0.5×, levels 10-19 → 1.0×, levels 20-24 → 2.0×
function getUpgradeCost(baseCost, currentLevel) {
  const multiplier = currentLevel < 10 ? 0.5 : currentLevel < 20 ? 1.0 : 2.0
  return Math.floor(baseCost * multiplier)
}

function shapeOwnedTemple(row, playerDrachma) {
  const currentIncome  = Math.round(row.income_per_hour * templeIncomeMultiplier(row.upgrade_level))
  const upgradeCost    = row.upgrade_level < MAX_TEMPLE_LEVEL ? getUpgradeCost(row.base_cost, row.upgrade_level) : null
  const canUpgrade     = row.upgrade_level < MAX_TEMPLE_LEVEL && playerDrachma >= upgradeCost
  const nextIncome     = row.upgrade_level < MAX_TEMPLE_LEVEL
    ? Math.round(row.income_per_hour * templeIncomeMultiplier(row.upgrade_level + 1))
    : null
  const incomeDelta    = nextIncome !== null ? nextIncome - currentIncome : 0
  return {
    id:                      row.id,
    temple_type:             row.temple_type,
    name:                    row.name,
    upgrade_level:           row.upgrade_level,
    current_income_per_hour: currentIncome,
    upgrade_cost:            upgradeCost,
    can_upgrade:             canUpgrade,
    income_delta:            incomeDelta,
  }
}

// ── Temples (GET) ─────────────────────────────────────────────────────────────

async function handleTemples(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const statsRows = await sql`
      SELECT ps.*, u.faction, u.class AS player_class
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const playerLevel = statsRows[0].level

    const owned = await fetchOwnedTemples(req.userId)
    const templesTownships = await getPlayerTownships(sql, req.userId)
    const templesTownshipBonuses = aggregateTownshipBonuses(templesTownships)
    let stats = regenPlayer(statsRows[0], owned, statsRows[0].player_class, statsRows[0].faction, templesTownshipBonuses)

    if (
      stats.energy             !== statsRows[0].energy   ||
      stats.health             !== statsRows[0].health   ||
      stats.drachma            !== statsRows[0].drachma  ||
      stats.drachma_lifetime   !== statsRows[0].drachma_lifetime ||
      stats.energy_regen_base  !== statsRows[0].energy_regen_base ||
      stats.health_regen_base  !== statsRows[0].health_regen_base
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy             = ${stats.energy},
            health             = ${stats.health},
            drachma            = ${stats.drachma},
            drachma_lifetime   = ${stats.drachma_lifetime},
            glory_lifetime     = ${stats.glory_lifetime},
            energy_regen_base  = ${stats.energy_regen_base},
            health_regen_base  = ${stats.health_regen_base},
            last_updated       = ${stats.last_updated}
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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

    const statsRows = await sql`
      SELECT ps.*, u.faction, u.class AS player_class
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
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
    const buyTempleTownships = await getPlayerTownships(sql, req.userId)
    const buyTempleTownshipBonuses = aggregateTownshipBonuses(buyTempleTownships)
    let stats = regenPlayer(statsRows[0], owned, statsRows[0].player_class, statsRows[0].faction, buyTempleTownshipBonuses)

    if (stats.drachma < temple.base_cost) {
      return res.status(400).json({ error: 'insufficient_drachma', cost: temple.base_cost })
    }

    stats = { ...stats, drachma: stats.drachma - temple.base_cost }

    await sql`
      UPDATE pw_player_stats
      SET drachma            = ${stats.drachma},
          drachma_lifetime   = ${stats.drachma_lifetime},
          glory_lifetime     = ${stats.glory_lifetime},
          energy             = ${stats.energy},
          health             = ${stats.health},
          energy_regen_base  = ${stats.energy_regen_base},
          health_regen_base  = ${stats.health_regen_base},
          last_updated       = ${stats.last_updated}
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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

    if (pt.upgrade_level >= MAX_TEMPLE_LEVEL) return res.status(400).json({ error: 'max_level' })

    const upgradeCost = getUpgradeCost(pt.base_cost, pt.upgrade_level)

    const statsRows = await sql`
      SELECT ps.*, u.faction, u.class AS player_class
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const owned = await fetchOwnedTemples(req.userId)
    const upgradeTempleTownships = await getPlayerTownships(sql, req.userId)
    const upgradeTempleTownshipBonuses = aggregateTownshipBonuses(upgradeTempleTownships)
    let stats = regenPlayer(statsRows[0], owned, statsRows[0].player_class, statsRows[0].faction, upgradeTempleTownshipBonuses)

    if (stats.drachma < upgradeCost) {
      return res.status(400).json({ error: 'insufficient_drachma', cost: upgradeCost })
    }

    stats = { ...stats, drachma: stats.drachma - upgradeCost }

    await sql`
      UPDATE pw_player_stats
      SET drachma            = ${stats.drachma},
          drachma_lifetime   = ${stats.drachma_lifetime},
          glory_lifetime     = ${stats.glory_lifetime},
          energy             = ${stats.energy},
          health             = ${stats.health},
          energy_regen_base  = ${stats.energy_regen_base},
          health_regen_base  = ${stats.health_regen_base},
          last_updated       = ${stats.last_updated}
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      SELECT ps.*, u.class, u.faction, u.alignment
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })
    const row = rows[0]
    const alignTempleRows = await fetchOwnedTemples(req.userId)
    const alignTownships = await getPlayerTownships(sql, req.userId)
    const alignTownshipBonuses = aggregateTownshipBonuses(alignTownships)

    let stats = regenPlayer(row, alignTempleRows, row.class, row.faction, alignTownshipBonuses)

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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      SELECT u.alignment, u.faction, u.class,
             ps.level, ps.energy, ps.energy_max, ps.health, ps.health_max,
             ps.drachma, ps.drachma_lifetime, ps.glory, ps.glory_lifetime,
             ps.xp, ps.attack, ps.defense, ps.agility, ps.stat_points, ps.last_updated,
             ps.energy_regen_base, ps.health_regen_base
      FROM pw_users u
      JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (userRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const userRow = userRows[0]
    const ownedTemples = await fetchOwnedTemples(req.userId)
    const pvpTargetsTownships = await getPlayerTownships(sql, req.userId)
    const pvpTargetsTownshipBonuses = aggregateTownshipBonuses(pvpTargetsTownships)
    let stats = regenPlayer(userRow, ownedTemples, userRow.class, userRow.faction, pvpTargetsTownshipBonuses)
    const attAlignment = userRow.alignment

    if (!attAlignment && stats.level >= 10) {
      return res.status(200).json({
        targets:            [],
        stats,
        requires_alignment: true,
        pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      })
    }

    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit)  || 20))
    const offset = Math.max(0, parseInt(req.query.offset) || 0)
    // Asymmetric range: can't attack more than 4 levels below; can attack much higher (brave choice, capped at +50)
    const minLevel = Math.max(1, stats.level - 4)
    const maxLevel = stats.level + 50

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
    const raceClassBonus = getRaceClassCombatBonuses(userRow.faction, userRow.class)

    const computed_bonuses = {
      crit:    Math.min(75, (attEquip.crit  || 0) + (raceClassBonus.crit  || 0)),
      dodge:   Math.min(75, (attEquip.dodge || 0) + (raceClassBonus.dodge || 0)),
      block:   Math.min(75, (attEquip.block || 0) + (raceClassBonus.block || 0)),
      agility: (stats.agility || 0) + (attEquip.agility || 0),
    }

    const targetsWithPower = await Promise.all(targets.map(async t => {
      const equip = await getEquipmentBonuses(sql, t.user_id)
      return { ...t, power_rating: calculatePowerRating(t, equip) }
    }))

    // Batch cooldown check — uses idx_pw_combat_log_cooldown index, avoids N+1
    const targetIds = targetsWithPower.map(t => t.user_id)
    const recentAttacks = targetIds.length > 0 ? await sql`
      SELECT DISTINCT ON (defender_id) defender_id, created_at
      FROM pw_combat_log
      WHERE attacker_id = ${req.userId}
        AND defender_id = ANY(${targetIds}::uuid[])
        AND created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY defender_id, created_at DESC
    ` : []

    const cooldownMap = {}
    for (const row of recentAttacks) {
      const secsRemaining = Math.ceil(300 - (Date.now() - new Date(row.created_at).getTime()) / 1000)
      cooldownMap[row.defender_id] = Math.max(0, secsRemaining)
    }

    const targetsWithCooldowns = targetsWithPower.map(t => ({
      ...t,
      cooldown_active:            !!cooldownMap[t.user_id],
      cooldown_seconds_remaining: cooldownMap[t.user_id] || 0,
    }))

    return res.status(200).json({
      targets:          targetsWithCooldowns,
      stats,
      my_power_rating:  myPowerRating,
      computed_bonuses,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
             ps.glory, ps.glory_lifetime, ps.attack, ps.defense, ps.agility,
             ps.stat_points, ps.last_updated,
             ps.energy_regen_base, ps.health_regen_base
      FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (attRows.length === 0) return res.status(404).json({ error: 'Attacker not found' })
    const attUser = { faction: attRows[0].faction, class: attRows[0].class, alignment: attRows[0].alignment }

    const defRows = await sql`
      SELECT u.id, u.username, u.faction, u.class, u.alignment,
             ps.level, ps.xp, ps.energy, ps.energy_max,
             ps.health, ps.health_max, ps.drachma, ps.drachma_lifetime,
             ps.glory, ps.glory_lifetime, ps.attack, ps.defense, ps.agility,
             ps.stat_points, ps.last_updated
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

    // Higher player attacking lower: block if gap >= 5. Lower attacking higher: always allowed.
    if (attLevel > defLevel && (attLevel - defLevel) >= 5) {
      return res.status(400).json({
        error: 'level_gap_too_large',
        message: `You cannot attack players more than 4 levels below you. Target is level ${defLevel}.`,
      })
    }

    // Per-target 5-minute cooldown — uses idx_pw_combat_log_cooldown index
    const recentAttack = await sql`
      SELECT created_at FROM pw_combat_log
      WHERE attacker_id = ${req.userId}
        AND defender_id = ${target_user_id}
        AND created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `
    if (recentAttack.length > 0) {
      const secondsRemaining = Math.ceil(
        300 - (Date.now() - new Date(recentAttack[0].created_at).getTime()) / 1000
      )
      return res.status(400).json({
        error: 'cooldown_active',
        seconds_remaining: Math.max(0, secondsRemaining),
      })
    }

    const [attTemples, defTemples] = await Promise.all([
      fetchOwnedTemples(req.userId),
      fetchOwnedTemples(target_user_id),
    ])
    const [attTownshipRows, defTownshipRows] = await Promise.all([
      getPlayerTownships(sql, req.userId),
      getPlayerTownships(sql, target_user_id),
    ])
    const attTownshipBonuses = aggregateTownshipBonuses(attTownshipRows)
    const defTownshipBonuses = aggregateTownshipBonuses(defTownshipRows)

    let attStats = regenPlayer(attRows[0], attTemples, attRows[0].class, attRows[0].faction, attTownshipBonuses)
    let defStats = regenPlayer(defRows[0], defTemples, defRows[0].class, defRows[0].faction)

    const energyCost = Math.max(1, Math.ceil(attStats.level / 10))
    if (attStats.energy < energyCost) {
      return res.status(400).json({ error: 'not_enough_energy', energy_required: energyCost })
    }

    if (attStats.health <= 0) return res.status(400).json({ error: 'attacker_no_health' })
    if (defStats.health <= 0) return res.status(400).json({ error: 'defender_no_health' })

    attStats = { ...attStats, energy: attStats.energy - energyCost }

    // Defender always fights at 100 HP in simulation — real HP is never written to DB from combat
    const defStatsForCombat = { ...defStats, health: 100, health_max: Math.max(defStats.health_max, 100) }

    const [attEquip, defEquip] = await Promise.all([
      getEquipmentBonuses(sql, req.userId),
      getEquipmentBonuses(sql, target_user_id),
    ])

    // Phase C — alliance tier perks for both combatants, fetched once per fight.
    const [attAlliancePerks, defAlliancePerks] = await Promise.all([
      getAlliancePerks(sql, req.userId),
      getAlliancePerks(sql, target_user_id),
    ])

    // Apply township flat stat bonuses to combat simulation only — does not persist to DB.
    // alliance_attack/defense_bonus_pct ride along into simulateCombat (applied there).
    const attStatsBoosted = {
      ...attStats,
      attack:  attStats.attack  + Math.floor(attTownshipBonuses.flat_attack  || 0),
      defense: attStats.defense + Math.floor(attTownshipBonuses.flat_defense || 0),
      alliance_attack_bonus_pct:  attAlliancePerks.attack_bonus_pct,
      alliance_defense_bonus_pct: attAlliancePerks.defense_bonus_pct,
    }
    const defStatsForCombatBoosted = {
      ...defStatsForCombat,
      attack:  defStatsForCombat.attack  + Math.floor(defTownshipBonuses.flat_attack  || 0),
      defense: defStatsForCombat.defense + Math.floor(defTownshipBonuses.flat_defense || 0),
      alliance_attack_bonus_pct:  defAlliancePerks.attack_bonus_pct,
      alliance_defense_bonus_pct: defAlliancePerks.defense_bonus_pct,
    }

    const combat = simulateCombat({
      attacker:      { ...attUser, ...attStatsBoosted },
      defender:      { ...defUser, ...defStatsForCombatBoosted },
      attackerEquip: attEquip,
      defenderEquip: defEquip,
    })

    // Compute defense mitigation values for backwards-compatible response fields
    const defMitFn = (totalDef) => totalDef / (totalDef + 50) * 0.5
    const attMit = defMitFn((attStats.defense || 0) + (attEquip.defense || 0))
    const defMit = defMitFn((defStats.defense || 0) + (defEquip.defense || 0))

    // Summary power values for combat log and response (sum of damage dealt each side)
    const attackerPowerSummary = combat.rounds.reduce((s, r) => s + (r.attacker_action?.damage || 0), 0)
    const defenderPowerSummary = combat.rounds.reduce((s, r) => s + (r.defender_action?.damage || 0), 0)

    // Apply attacker HP change; defender real HP is unchanged (simulation uses virtual 100 HP)
    attStats = { ...attStats, health: combat.final_attacker_hp }

    let finalGlory = combat.glory_earned
    let consolationGlory = 0
    let healthRestored = 0

    if (combat.result === 'win') {
      if (attUser.alignment === 'compact') {
        finalGlory = Math.ceil(combat.glory_earned * 1.10)
      }
      // Phase C — alliance Economic tier perk boosts glory earned, applied before crediting.
      if (attAlliancePerks.glory_bonus_pct > 0) {
        finalGlory = Math.floor(finalGlory * (1 + attAlliancePerks.glory_bonus_pct))
      }
      healthRestored = Math.floor(attStats.health_max * 0.30)
      attStats = {
        ...attStats,
        glory:          attStats.glory + finalGlory,
        glory_lifetime: attStats.glory_lifetime + finalGlory,
        health:         Math.min(attStats.health_max, attStats.health + healthRestored),
      }
    } else if (combat.result === 'loss') {
      defStats = {
        ...defStats,
        glory:          defStats.glory + combat.defender_glory_earned,
        glory_lifetime: defStats.glory_lifetime + combat.defender_glory_earned,
      }
      if (attUser.alignment === 'compact') {
        consolationGlory = Math.min(20, Math.floor(defStats.level / 5))
        if (consolationGlory > 0) {
          attStats = {
            ...attStats,
            glory:          attStats.glory + consolationGlory,
            glory_lifetime: attStats.glory_lifetime + consolationGlory,
          }
        }
      }
    }

    await sql`
      UPDATE pw_player_stats SET
        xp                 = ${attStats.xp},
        level              = ${attStats.level},
        energy             = ${attStats.energy},
        energy_max         = ${attStats.energy_max},
        health             = ${attStats.health},
        health_max         = ${attStats.health_max},
        drachma            = ${attStats.drachma},
        drachma_lifetime   = ${attStats.drachma_lifetime},
        glory              = ${attStats.glory},
        glory_lifetime     = ${attStats.glory_lifetime},
        stat_points        = ${attStats.stat_points},
        energy_regen_base  = ${attStats.energy_regen_base},
        health_regen_base  = ${attStats.health_regen_base},
        last_updated       = ${attStats.last_updated}
      WHERE user_id = ${req.userId}
    `

    // Defender health and last_updated are intentionally not written — real HP is unchanged by combat
    await sql`
      UPDATE pw_player_stats SET
        glory          = ${defStats.glory},
        glory_lifetime = ${defStats.glory_lifetime}
      WHERE user_id = ${target_user_id}
    `

    await sql`
      INSERT INTO pw_combat_log (
        attacker_id, defender_id, attacker_power, defender_power, result,
        xp_earned, drachma_transferred, glory_earned, attacker_health_lost, defender_health_lost,
        rounds
      ) VALUES (
        ${req.userId}, ${target_user_id},
        ${attackerPowerSummary}, ${defenderPowerSummary}, ${combat.result},
        0, 0, ${finalGlory},
        ${combat.attacker_health_lost}, ${combat.defender_health_lost},
        ${JSON.stringify(combat.rounds)}
      )
    `

    return res.status(200).json({
      result:               combat.result,
      attacker_power:       attackerPowerSummary,
      defender_power:       defenderPowerSummary,
      xp_earned:            0,
      drachma_transferred:  0,
      glory_earned:         combat.glory_earned,
      final_glory:          finalGlory,
      consolation_glory:    consolationGlory,
      attacker_health_lost: combat.attacker_health_lost,
      defender_health_lost: combat.defender_health_lost,
      health_restored:      healthRestored,
      energy_cost:          energyCost,
      attacker_mitigation:  attMit,
      defender_mitigation:  defMit,
      rounds:               combat.rounds,
      defender_glory_earned: combat.defender_glory_earned,
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
        ps.glory, ps.glory_lifetime, ps.attack, ps.defense, ps.stat_points, ps.last_updated,
        ps.energy_regen_base, ps.health_regen_base
      FROM pw_users u
      JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const ownedTemples = await fetchOwnedTemples(req.userId)
    const advTownships = await getPlayerTownships(sql, req.userId)
    const advTownshipBonuses = aggregateTownshipBonuses(advTownships)
    let stats = regenPlayer(rows[0], ownedTemples, rows[0].player_class, rows[0].faction, advTownshipBonuses)

    if (
      stats.energy             !== rows[0].energy  ||
      stats.health             !== rows[0].health  ||
      stats.drachma            !== rows[0].drachma ||
      stats.energy_regen_base  !== rows[0].energy_regen_base ||
      stats.health_regen_base  !== rows[0].health_regen_base
    ) {
      await sql`
        UPDATE pw_player_stats
        SET energy             = ${stats.energy},
            health             = ${stats.health},
            drachma            = ${stats.drachma},
            drachma_lifetime   = ${stats.drachma_lifetime},
            energy_regen_base  = ${stats.energy_regen_base},
            health_regen_base  = ${stats.health_regen_base},
            last_updated       = ${stats.last_updated}
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
             ps.drachma, ps.drachma_lifetime, ps.last_updated,
             ps.energy_regen_base, ps.health_regen_base,
             u.faction, u.class AS player_class
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (pRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const ownedTemples = await fetchOwnedTemples(req.userId)
    const startAdvTownships = await getPlayerTownships(sql, req.userId)
    const startAdvTownshipBonuses = aggregateTownshipBonuses(startAdvTownships)
    let stats = regenPlayer(pRows[0], ownedTemples, pRows[0].player_class, pRows[0].faction, startAdvTownshipBonuses)

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
        energy             = ${stats.energy},
        health             = ${stats.health},
        drachma            = ${stats.drachma},
        drachma_lifetime   = ${stats.drachma_lifetime},
        energy_regen_base  = ${stats.energy_regen_base},
        health_regen_base  = ${stats.health_regen_base},
        last_updated       = ${stats.last_updated}
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
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
        pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
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
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
    })
  } catch (err) {
    console.error('Adventures claim error:', err)
    return res.status(500).json({ error: 'Failed to claim adventure rewards' })
  }
}

// ── Free Stat Reset (POST) ────────────────────────────────────────────────────

async function handleFreeStatReset(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rows = await sql`
      SELECT ps.level, ps.xp, ps.attack, ps.defense, ps.agility, ps.energy, ps.energy_max,
             ps.health, ps.health_max, ps.stat_points, ps.stat_reset_available, ps.glory,
             ps.glory_lifetime, ps.drachma, ps.drachma_lifetime, ps.last_updated,
             ps.energy_regen_base, ps.health_regen_base,
             u.class, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const resetTemples = await fetchOwnedTemples(req.userId)
    const resetTownships = await getPlayerTownships(sql, req.userId)
    const resetTownshipBonuses = aggregateTownshipBonuses(resetTownships)
    let stats = regenPlayer(rows[0], resetTemples, rows[0].class, rows[0].faction, resetTownshipBonuses)

    if (!stats.stat_reset_available) {
      return res.status(400).json({ error: 'free_reset_already_used' })
    }

    const playerClass = rows[0].class
    const faction     = rows[0].faction
    const { attackBaseline, defenseBaseline, agilityBaseline, energyMaxBaseline, healthMaxBaseline } =
      computeResetBaselines(stats, playerClass, faction)

    const refundAttack  = Math.max(0, (stats.attack  ?? attackBaseline)  - attackBaseline)
    const refundDefense = Math.max(0, (stats.defense ?? defenseBaseline) - defenseBaseline)
    const refundAgility = Math.max(0, (stats.agility ?? agilityBaseline) - agilityBaseline)
    // energy_max and health_max excluded — only atk/def/agi are refunded
    const totalRefunded = refundAttack + refundDefense + refundAgility

    const newStatPoints = (stats.stat_points || 0) + totalRefunded
    // Restore to current max (preserve any allocated energy/health capacity)
    const newEnergy = stats.energy_max
    const newHealth = stats.health_max

    await sql`
      UPDATE pw_player_stats SET
        attack               = ${attackBaseline},
        defense              = ${defenseBaseline},
        agility              = ${agilityBaseline},
        energy               = ${newEnergy},
        health               = ${newHealth},
        stat_points          = ${newStatPoints},
        stat_reset_available = FALSE,
        drachma              = ${stats.drachma},
        drachma_lifetime     = ${stats.drachma_lifetime},
        energy_regen_base    = ${stats.energy_regen_base},
        health_regen_base    = ${stats.health_regen_base},
        last_updated         = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    return res.status(200).json({
      ok:               true,
      used_free_reset:  true,
      points_refunded:  totalRefunded,
      stats: {
        attack:               attackBaseline,
        defense:              defenseBaseline,
        agility:              agilityBaseline,
        energy_max:           stats.energy_max,
        health_max:           stats.health_max,
        energy:               newEnergy,
        health:               newHealth,
        stat_points:          newStatPoints,
        stat_reset_available: false,
      },
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('[game?action=stat_reset_free]', err.message)
    return res.status(500).json({ error: 'Stat reset failed' })
  }
}

// ── Titan Status (GET) ────────────────────────────────────────────────────────

async function handleTitanStatus(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const events = await sql`
      SELECT e.*,
             t.slug AS titan_slug, t.name AS titan_name, t.pantheon AS titan_pantheon,
             t.difficulty AS titan_difficulty, t.description AS titan_description,
             t.lore AS titan_lore, t.ability_name AS titan_ability_name,
             t.ability_description AS titan_ability_description,
             t.ability_type AS titan_ability_type,
             t.loot_rarity_floor AS titan_loot_rarity_floor
      FROM pw_titan_events e
      JOIN pw_titans t ON t.id = e.titan_id
      WHERE e.status IN ('queue', 'active')
      ORDER BY e.fight_starts_at ASC
      LIMIT 1
    `

    const currentEvent = events[0] || null

    const unclaimedRows = await sql`
      SELECT p.*, e.id AS event_id, e.result AS event_result,
             t.name AS titan_name, t.difficulty AS titan_difficulty
      FROM pw_titan_participants p
      JOIN pw_titan_events e ON e.id = p.event_id
      JOIN pw_titans t ON t.id = e.titan_id
      WHERE p.user_id = ${req.userId}
        AND p.status = 'fought'
        AND p.rewards_claimed = false
        AND e.status = 'resolved'
      ORDER BY e.fight_ends_at DESC NULLS LAST
      LIMIT 1
    `

    let playerParticipation = null
    let participantCount = 0

    if (currentEvent) {
      const participation = await sql`
        SELECT * FROM pw_titan_participants
        WHERE event_id = ${currentEvent.id} AND user_id = ${req.userId}
      `
      playerParticipation = participation[0] || null

      const countRow = await sql`
        SELECT COUNT(*) AS n FROM pw_titan_participants WHERE event_id = ${currentEvent.id}
      `
      participantCount = parseInt(countRow[0].n, 10)
    }

    return res.status(200).json({
      ok: true,
      current_event: currentEvent ? {
        id:                    currentEvent.id,
        status:                currentEvent.status,
        titan: {
          slug:              currentEvent.titan_slug,
          name:              currentEvent.titan_name,
          pantheon:          currentEvent.titan_pantheon,
          difficulty:        currentEvent.titan_difficulty,
          description:       currentEvent.titan_description,
          lore:              currentEvent.titan_lore,
          ability_name:        currentEvent.titan_ability_name,
          ability_description: currentEvent.titan_ability_description,
          ability_type:        currentEvent.titan_ability_type,
          loot_rarity_floor:   currentEvent.titan_loot_rarity_floor,
        },
        queue_opens_at:        currentEvent.queue_opens_at,
        queue_closes_at:       currentEvent.queue_closes_at,
        fight_starts_at:       currentEvent.fight_starts_at,
        fight_ends_at:         currentEvent.fight_ends_at,
        fight_duration_seconds: currentEvent.fight_duration_seconds,
        titan_starting_hp:     currentEvent.titan_starting_hp,
        titan_final_hp:        currentEvent.titan_final_hp,
        result:                currentEvent.result,
        participant_count:     participantCount,
        player_participation:  playerParticipation,
        fight_log:             currentEvent.status === 'active' ? currentEvent.fight_log : null,
      } : null,
      unclaimed_reward:        unclaimedRows[0] || null,
      server_time:             new Date().toISOString(),
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('titan_status error:', err)
    return res.status(500).json({ error: 'status_failed' })
  }
}

// ── Titan Join (POST) ─────────────────────────────────────────────────────────

async function handleTitanJoin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const events = await sql`
      SELECT id, queue_opens_at, queue_closes_at FROM pw_titan_events
      WHERE status = 'queue'
        AND queue_opens_at <= NOW()
        AND queue_closes_at > NOW()
      ORDER BY queue_opens_at ASC
      LIMIT 1
    `

    if (events.length === 0) {
      return res.status(400).json({ error: 'no_open_queue', message: 'There is no open queue right now.' })
    }

    const event = events[0]

    const existing = await sql`
      SELECT id FROM pw_titan_participants
      WHERE event_id = ${event.id} AND user_id = ${req.userId}
    `
    if (existing.length > 0) {
      return res.status(400).json({ error: 'already_joined', message: 'You are already queued for this event.' })
    }

    await sql`
      INSERT INTO pw_titan_participants (event_id, user_id, status)
      VALUES (${event.id}, ${req.userId}, 'queued')
    `

    return res.status(200).json({
      ok:              true,
      event_id:        event.id,
      queue_closes_at: event.queue_closes_at,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('titan_join error:', err)
    return res.status(500).json({ error: 'join_failed' })
  }
}

// ── Titan Claim (POST) ────────────────────────────────────────────────────────

async function handleTitanClaim(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { event_id } = req.body || {}
  if (!event_id) return res.status(400).json({ error: 'missing_event_id' })

  try {
    const rows = await sql`
      SELECT
        p.id AS participant_id, p.event_id, p.user_id, p.status,
        p.damage_dealt, p.hp_lost, p.contribution_rank, p.reward_tier, p.rewards_claimed,
        e.result AS event_result, e.status AS event_status,
        t.id AS titan_id, t.slug, t.name, t.difficulty,
        t.base_attack, t.base_defense, t.base_hp_multiplier, t.loot_rarity_floor,
        t.ability_type, t.ability_value
      FROM pw_titan_participants p
      JOIN pw_titan_events e ON e.id = p.event_id
      JOIN pw_titans t ON t.id = e.titan_id
      WHERE p.event_id = ${event_id} AND p.user_id = ${req.userId}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'not_a_participant' })

    const row = rows[0]
    if (row.event_status !== 'resolved') return res.status(400).json({ error: 'event_not_resolved' })
    if (row.rewards_claimed)             return res.status(400).json({ error: 'already_claimed' })
    if (row.status !== 'fought')         return res.status(400).json({ error: 'did_not_fight' })

    const statsRows = await sql`
      SELECT ps.*, u.class AS player_class, u.faction, u.alignment
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    const playerClass = statsRows[0].player_class
    const faction     = statsRows[0].faction
    const alignment   = statsRows[0].alignment
    const ownedTemples = await fetchOwnedTemples(req.userId)
    const titanTownships = await getPlayerTownships(sql, req.userId)
    const titanTownshipBonuses = aggregateTownshipBonuses(titanTownships)
    let stats = regenPlayer(statsRows[0], ownedTemples, playerClass, faction, titanTownshipBonuses)

    const titan = {
      slug:               row.slug,
      name:               row.name,
      difficulty:         row.difficulty,
      base_attack:        row.base_attack,
      base_defense:       row.base_defense,
      base_hp_multiplier: row.base_hp_multiplier,
      loot_rarity_floor:  row.loot_rarity_floor,
      ability_type:       row.ability_type,
      ability_value:      row.ability_value,
    }
    const participantResult = {
      reward_tier:       row.reward_tier,
      contribution_rank: row.contribution_rank,
      player_level:      stats.level,
    }
    const rewards = calculateTitanRewards(titan, row.event_result, participantResult)

    // Resolve grant_potion → actual item
    let potionId = null
    if (rewards.grant_potion) {
      const potionRows = await sql`
        SELECT id FROM pw_items
        WHERE slot = 'consumable'
          AND (consumable_effect = 'restore_health_pct' OR consumable_effect = 'restore_energy_pct')
          AND level_required <= ${stats.level}
        ORDER BY RANDOM()
        LIMIT 1
      `
      potionId = potionRows[0]?.id || null
    }

    // Resolve grant_loot → actual item
    let lootId = null
    if (rewards.grant_loot) {
      const rolledRarity = rollTitanLootRarity(titan.difficulty, row.contribution_rank)

      const lootRows = await sql`
        SELECT id FROM pw_items
        WHERE slot IN ('weapon', 'armor', 'artifact', 'mount', 'companion')
          AND rarity = ${rolledRarity}
          AND level_required <= ${stats.level}
          AND (faction_exclusive IS NULL OR faction_exclusive = ${faction})
        ORDER BY RANDOM()
        LIMIT 1
      `
      lootId = lootRows[0]?.id || null
    }

    let xpMult = 1
    if (faction === 'olympians') xpMult *= 1.10
    if (alignment === 'coalition') xpMult *= 1.15
    let finalXp = Math.floor(rewards.xp * xpMult)
    if (titanTownshipBonuses.xp_pct > 0) {
      finalXp = Math.floor(finalXp * (1 + titanTownshipBonuses.xp_pct / 100))
    }

    let finalDrachma = rewards.drachma
    if (titanTownshipBonuses.drachma_pct > 0) {
      finalDrachma = Math.floor(finalDrachma * (1 + titanTownshipBonuses.drachma_pct / 100))
    }

    stats = {
      ...stats,
      xp:               stats.xp + finalXp,
      drachma:          stats.drachma + finalDrachma,
      drachma_lifetime: stats.drachma_lifetime + finalDrachma,
    }

    const prevLevel = stats.level
    stats = checkLevelUp(stats, playerClass)
    const levelsGained = stats.level - prevLevel

    await sql`
      UPDATE pw_player_stats SET
        xp                = ${stats.xp},
        level             = ${stats.level},
        energy            = ${stats.energy},
        energy_max        = ${stats.energy_max},
        health            = ${stats.health},
        health_max        = ${stats.health_max},
        drachma           = ${stats.drachma},
        drachma_lifetime  = ${stats.drachma_lifetime},
        attack            = ${stats.attack},
        defense           = ${stats.defense},
        agility           = ${stats.agility ?? 0},
        stat_points       = ${stats.stat_points},
        energy_regen_base = ${stats.energy_regen_base},
        health_regen_base = ${stats.health_regen_base},
        last_updated      = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    if (potionId) await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${potionId})`
    if (lootId)   await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${lootId})`

    await sql`
      UPDATE pw_titan_participants SET
        rewards_claimed  = true,
        reward_xp        = ${finalXp},
        reward_drachma   = ${finalDrachma},
        reward_potion_id = ${potionId},
        reward_loot_id   = ${lootId}
      WHERE event_id = ${event_id} AND user_id = ${req.userId}
    `

    let potionInfo = null, lootInfo = null
    if (potionId) {
      const pRows = await sql`SELECT id, name, rarity, slot FROM pw_items WHERE id = ${potionId}`
      potionInfo = pRows[0] || null
    }
    if (lootId) {
      const lRows = await sql`SELECT id, name, rarity, slot FROM pw_items WHERE id = ${lootId}`
      lootInfo = lRows[0] || null
    }

    return res.status(200).json({
      ok:                true,
      result:            row.event_result,
      reward_tier:       row.reward_tier,
      contribution_rank: row.contribution_rank,
      damage_dealt:      row.damage_dealt,
      energy_drained:    row.energy_drained || 0,
      xp:                finalXp,
      drachma:           finalDrachma,
      potion:            potionInfo,
      loot:              lootInfo,
      levelsGained,
      stats,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('titan_claim error:', err)
    return res.status(500).json({ error: 'claim_failed', message: err.message })
  }
}

// ── Titan Admin Trigger (POST) ────────────────────────────────────────────────

async function handleTitanAdminTrigger(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireAdmin(req, res))) return

  try {
    const { titan_id, queue_duration_minutes = 60 } = req.body || {}

    let chosenTitanId = titan_id
    if (!chosenTitanId) {
      const rows = await sql`SELECT id FROM pw_titans ORDER BY RANDOM() LIMIT 1`
      chosenTitanId = rows[0]?.id
    }
    if (!chosenTitanId) return res.status(500).json({ error: 'no_titans_found' })

    const existing = await sql`
      SELECT id FROM pw_titan_events WHERE status IN ('queue', 'active')
    `
    if (existing.length > 0) {
      return res.status(400).json({ error: 'event_already_active', message: 'Cannot trigger — an event is already queued or active.' })
    }

    const queueOpensAt  = new Date()
    const fightStartsAt = new Date(Date.now() + Number(queue_duration_minutes) * 60 * 1000)

    await sql`
      INSERT INTO pw_titan_events (titan_id, status, queue_opens_at, queue_closes_at, fight_starts_at, titan_starting_hp, triggered_by)
      VALUES (${chosenTitanId}, 'queue', ${queueOpensAt.toISOString()}, ${fightStartsAt.toISOString()}, ${fightStartsAt.toISOString()}, 0, 'admin')
    `

    return res.status(200).json({
      ok:              true,
      titan_id:        chosenTitanId,
      queue_opens_at:  queueOpensAt,
      fight_starts_at: fightStartsAt,
    })
  } catch (err) {
    console.error('titan_admin_trigger error:', err)
    return res.status(500).json({ error: 'admin_trigger_failed', message: err.message })
  }
}

// ── Titan History (GET) ───────────────────────────────────────────────────────

async function handleTitanHistory(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rows = await sql`
      SELECT p.event_id, p.damage_dealt, p.contribution_rank, p.reward_tier,
             p.reward_xp, p.reward_drachma,
             p.reward_potion_id, p.reward_loot_id,
             p.rewards_claimed,
             e.result AS event_result, e.fight_ends_at,
             t.name AS titan_name, t.difficulty AS titan_difficulty, t.slug AS titan_slug,
             pi.name AS potion_name, li.name AS loot_name, li.rarity AS loot_rarity
      FROM pw_titan_participants p
      JOIN pw_titan_events e ON e.id = p.event_id
      JOIN pw_titans t ON t.id = e.titan_id
      LEFT JOIN pw_items pi ON pi.id = p.reward_potion_id
      LEFT JOIN pw_items li ON li.id = p.reward_loot_id
      WHERE p.user_id = ${req.userId} AND p.status = 'fought'
      ORDER BY e.fight_ends_at DESC NULLS LAST
      LIMIT 20
    `

    return res.status(200).json({
      ok:      true,
      history: rows,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('titan_history error:', err)
    return res.status(500).json({ error: 'history_failed' })
  }
}

// ── Township (GET) ────────────────────────────────────────────────────────────

async function handleTownship(req, res) {
  try {
    const statsRows = await sql`SELECT level FROM pw_player_stats WHERE user_id = ${req.userId}`
    if (statsRows.length === 0) return res.status(404).json({ error: 'player_not_found' })
    const playerLevel = statsRows[0].level

    const catalog = await sql`SELECT * FROM pw_township_upgrades ORDER BY display_order`

    const ownedRows = await sql`SELECT * FROM pw_player_townships WHERE user_id = ${req.userId}`
    const ownedByType = {}
    for (const o of ownedRows) ownedByType[o.upgrade_type] = o

    const craftRows = await sql`
      SELECT id, craft_level, started_at, completes_at, status, rolled_rarity, rolled_item_id
      FROM pw_craftsmanship_cycles
      WHERE user_id = ${req.userId} AND status != 'claimed'
      ORDER BY id DESC LIMIT 1
    `
    const activeCraftCycle = craftRows[0] || null

    const townships = catalog.map(entry => {
      const owned = ownedByType[entry.type] || null
      const isOwned = !!owned
      const isUnlocked = playerLevel >= entry.level_required
      const isUpgrading = owned && owned.upgrade_completes_at !== null

      const currentLevel = owned?.level || 0
      const nextLevel = currentLevel < 100 ? currentLevel + 1 : null
      const currentBonus = isOwned ? getTownshipBonusValue(entry, currentLevel) : 0
      const nextBonus = nextLevel ? getTownshipBonusValue(entry, nextLevel) : null

      const upgradeCost = nextLevel ? getTownshipUpgradeCost(entry.initial_cost, currentLevel) : null
      const upgradeSeconds = nextLevel ? getTownshipUpgradeSeconds(currentLevel) : null

      return {
        type:            entry.type,
        name:            entry.name,
        establish_label: entry.establish_label,
        description:     entry.description,
        lore:            entry.lore,
        bonus_type:      entry.bonus_type,
        bonus_per_level: Number(entry.bonus_per_level),
        bonus_at_max:    Number(entry.bonus_at_max),
        initial_cost:    Number(entry.initial_cost),
        level_required:  Number(entry.level_required),
        display_order:   Number(entry.display_order),

        is_owned:     isOwned,
        is_unlocked:  isUnlocked,
        current_level: Number(currentLevel),
        next_level:    nextLevel === null ? null : Number(nextLevel),
        max_level:     100,
        current_bonus: currentBonus === 0 ? 0 : Number(currentBonus),
        next_bonus:    nextBonus === null ? null : Number(nextBonus),
        upgrade_cost:  upgradeCost === null ? null : Number(upgradeCost),
        upgrade_seconds: upgradeSeconds === null ? null : Number(upgradeSeconds),

        is_upgrading:        isUpgrading,
        upgrading_to_level:  owned?.upgrading_to_level ? Number(owned.upgrading_to_level) : null,
        upgrade_started_at:  owned?.upgrade_started_at || null,
        upgrade_completes_at: owned?.upgrade_completes_at || null,
        ...(entry.type === 'craftsmanship' && { craft_cycle: activeCraftCycle }),
      }
    })

    return res.status(200).json({
      ok: true,
      player_level: playerLevel,
      townships,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('township error:', err)
    return res.status(500).json({ error: 'township_fetch_failed' })
  }
}

// ── Township Establish (POST) ─────────────────────────────────────────────────

async function handleTownshipEstablish(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { upgrade_type } = req.body || {}
    if (!upgrade_type) return res.status(400).json({ error: 'missing_upgrade_type' })

    const catalogRows = await sql`SELECT * FROM pw_township_upgrades WHERE type = ${upgrade_type}`
    if (catalogRows.length === 0) return res.status(404).json({ error: 'unknown_upgrade' })
    const upgrade = catalogRows[0]

    const statsRows = await sql`
      SELECT ps.*, u.class, u.faction
      FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    const stats = statsRows[0]
    if (!stats) return res.status(404).json({ error: 'player_not_found' })

    if (stats.level < upgrade.level_required) {
      return res.status(400).json({ error: 'level_too_low', required: upgrade.level_required })
    }

    const ownedRows = await sql`
      SELECT id FROM pw_player_townships
      WHERE user_id = ${req.userId} AND upgrade_type = ${upgrade_type}
    `
    if (ownedRows.length > 0) return res.status(400).json({ error: 'already_established' })

    const temples = await fetchOwnedTemples(req.userId)
    const townships = await getPlayerTownships(sql, req.userId)
    const townshipBonuses = aggregateTownshipBonuses(townships)
    const regenStats = regenPlayer(stats, temples, stats.class, stats.faction, townshipBonuses)

    if (regenStats.drachma < upgrade.initial_cost) {
      return res.status(400).json({ error: 'insufficient_drachma', required: upgrade.initial_cost })
    }

    const newDrachma = regenStats.drachma - upgrade.initial_cost

    await sql`
      UPDATE pw_player_stats SET
        energy = ${regenStats.energy},
        health = ${regenStats.health},
        drachma = ${newDrachma},
        last_updated = NOW()
      WHERE user_id = ${req.userId}
    `

    await sql`
      INSERT INTO pw_player_townships (user_id, upgrade_type, level)
      VALUES (${req.userId}, ${upgrade_type}, 1)
    `

    // Auto-start first craft cycle when the Forge is established
    let firstCycleCompletesAt = null
    if (upgrade_type === 'craftsmanship') {
      const cycleSeconds = getCraftCycleSeconds(1)
      const completesAt = new Date(Date.now() + cycleSeconds * 1000)
      firstCycleCompletesAt = completesAt.toISOString()
      await sql`
        INSERT INTO pw_craftsmanship_cycles (user_id, craft_level, completes_at)
        VALUES (${req.userId}, 1, ${firstCycleCompletesAt})
      `
    }

    return res.status(200).json({
      ok: true,
      upgrade_type,
      level: 1,
      new_drachma: newDrachma,
      ...(upgrade_type === 'craftsmanship' && { first_cycle_completes_at: firstCycleCompletesAt }),
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('township_establish error:', err)
    return res.status(500).json({ error: 'establish_failed' })
  }
}

// ── Township Upgrade (POST) ───────────────────────────────────────────────────

async function handleTownshipUpgrade(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { upgrade_type } = req.body || {}
    if (!upgrade_type) return res.status(400).json({ error: 'missing_upgrade_type' })

    const rows = await sql`
      SELECT pt.*, u.initial_cost, u.name
      FROM pw_player_townships pt
      JOIN pw_township_upgrades u ON u.type = pt.upgrade_type
      WHERE pt.user_id = ${req.userId} AND pt.upgrade_type = ${upgrade_type}
    `
    if (rows.length === 0) return res.status(404).json({ error: 'not_established' })
    const owned = rows[0]

    if (owned.upgrade_completes_at !== null) {
      return res.status(400).json({ error: 'upgrade_in_progress', completes_at: owned.upgrade_completes_at })
    }
    if (owned.level >= 100) return res.status(400).json({ error: 'max_level' })

    const statsRows = await sql`
      SELECT ps.*, u.class, u.faction
      FROM pw_player_stats ps JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    const stats = statsRows[0]

    const upgradeCost = getTownshipUpgradeCost(owned.initial_cost, owned.level)
    const upgradeSeconds = getTownshipUpgradeSeconds(owned.level)

    const temples = await fetchOwnedTemples(req.userId)
    const townships = await getPlayerTownships(sql, req.userId)
    const townshipBonuses = aggregateTownshipBonuses(townships)
    const regenStats = regenPlayer(stats, temples, stats.class, stats.faction, townshipBonuses)

    if (regenStats.drachma < upgradeCost) {
      return res.status(400).json({ error: 'insufficient_drachma', required: upgradeCost })
    }

    const newDrachma = regenStats.drachma - upgradeCost

    await sql`
      UPDATE pw_player_stats SET
        energy = ${regenStats.energy},
        health = ${regenStats.health},
        drachma = ${newDrachma},
        last_updated = NOW()
      WHERE user_id = ${req.userId}
    `

    const completesAt = new Date(Date.now() + upgradeSeconds * 1000)
    await sql`
      UPDATE pw_player_townships SET
        upgrading_to_level   = ${owned.level + 1},
        upgrade_started_at   = NOW(),
        upgrade_completes_at = ${completesAt}
      WHERE id = ${owned.id}
    `

    return res.status(200).json({
      ok: true,
      upgrade_type,
      upgrading_to_level:  owned.level + 1,
      upgrade_completes_at: completesAt,
      cost_paid:   upgradeCost,
      new_drachma: newDrachma,
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles: req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('township_upgrade error:', err)
    return res.status(500).json({ error: 'upgrade_failed' })
  }
}

// ── Codex (GET, no per-player state) ─────────────────────────────────────────

async function handleCodex(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const titans = await sql`
      SELECT id, slug, name, pantheon, difficulty,
             description, lore, ability_name, ability_description,
             base_hp_multiplier, base_attack, base_defense, loot_rarity_floor
      FROM pw_titans
      ORDER BY difficulty DESC, name ASC
    `
    const professions = await sql`
      SELECT type, name, establish_label, description, lore,
             bonus_type, bonus_per_level, bonus_at_max,
             initial_cost, level_required, display_order
      FROM pw_township_upgrades
      ORDER BY display_order
    `
    return res.status(200).json({
      ok: true,
      titans: titans.map(t => ({
        ...t,
        base_hp_multiplier: Number(t.base_hp_multiplier),
        base_attack:        Number(t.base_attack),
        base_defense:       Number(t.base_defense),
      })),
      professions: professions.map(p => ({
        ...p,
        bonus_per_level: Number(p.bonus_per_level),
        bonus_at_max:    Number(p.bonus_at_max),
        initial_cost:    Number(p.initial_cost),
        level_required:  Number(p.level_required),
        display_order:   Number(p.display_order),
      })),
    })
  } catch (err) {
    console.error('codex error:', err)
    return res.status(500).json({ error: 'codex_fetch_failed' })
  }
}

// ── Pending Rewards (GET) ─────────────────────────────────────────────────────

async function handlePendingRewards(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const rows = await sql`
      SELECT id, reward_type, reward_payload, created_at
      FROM pw_pending_rewards
      WHERE user_id = ${req.userId} AND acknowledged_at IS NULL
      ORDER BY created_at ASC
    `
    return res.status(200).json({
      ok: true,
      pending_rewards: rows.map(r => ({
        id:         r.id,
        type:       r.reward_type,
        payload:    r.reward_payload,
        created_at: r.created_at,
      })),
    })
  } catch (err) {
    console.error('pending_rewards error:', err)
    return res.status(500).json({ error: 'fetch_failed' })
  }
}

// ── Acknowledge Reward (POST) ─────────────────────────────────────────────────

async function handleAcknowledgeReward(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { reward_id } = req.body || {}
    if (!reward_id) return res.status(400).json({ error: 'missing_reward_id' })
    await sql`
      UPDATE pw_pending_rewards
      SET acknowledged_at = NOW()
      WHERE id = ${reward_id} AND user_id = ${req.userId} AND acknowledged_at IS NULL
    `
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('acknowledge_reward error:', err)
    return res.status(500).json({ error: 'ack_failed' })
  }
}

// ── Craftsmanship Claim (POST) ────────────────────────────────────────────────

async function handleCraftsmanshipClaim(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Find player's 'ready' cycle
    const cycleRows = await sql`
      SELECT id, craft_level FROM pw_craftsmanship_cycles
      WHERE user_id = ${req.userId} AND status = 'ready'
      LIMIT 1
    `
    if (cycleRows.length === 0) {
      return res.status(400).json({ error: 'no_ready_cycle', message: 'No craft cycle is ready to claim.' })
    }
    const cycle = cycleRows[0]

    // Get player's CURRENT craftsmanship level (may have leveled up since cycle started)
    const townshipRows = await sql`
      SELECT level FROM pw_player_townships
      WHERE user_id = ${req.userId} AND upgrade_type = 'craftsmanship'
    `
    if (townshipRows.length === 0) {
      return res.status(400).json({ error: 'craftsmanship_not_established' })
    }
    const currentCraftLevel = townshipRows[0].level

    // Get player level and faction for item filtering
    const statsRows = await sql`
      SELECT ps.level, u.faction
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'player_not_found' })
    const { level: playerLevel, faction: playerFaction } = statsRows[0]

    // Roll rarity based on current craft level (never legendary)
    const rolledRarity = rollCraftRarity(currentCraftLevel)

    // Select a matching non-consumable item
    const itemRows = await sql`
      SELECT id, name, rarity, slot, level_required, attack_bonus, defense_bonus, agility_bonus
      FROM pw_items
      WHERE slot != 'consumable'
        AND rarity = ${rolledRarity}
        AND level_required <= ${playerLevel}
        AND (faction_exclusive IS NULL OR faction_exclusive = ${playerFaction})
      ORDER BY RANDOM()
      LIMIT 1
    `

    let grantedItem = null
    if (itemRows.length > 0) {
      const picked = itemRows[0]
      await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${req.userId}, ${picked.id})`
      grantedItem = {
        id:             picked.id,
        name:           picked.name,
        rarity:         picked.rarity,
        slot:           picked.slot,
        level_required: Number(picked.level_required),
        attack_bonus:   Number(picked.attack_bonus ?? 0),
        defense_bonus:  Number(picked.defense_bonus ?? 0),
        agility_bonus:  Number(picked.agility_bonus ?? 0),
      }
    }

    // Mark cycle 'claimed'
    await sql`
      UPDATE pw_craftsmanship_cycles SET
        status         = 'claimed',
        rolled_rarity  = ${rolledRarity},
        rolled_item_id = ${grantedItem?.id ?? null},
        claimed_at     = NOW()
      WHERE id = ${cycle.id}
    `

    // Auto-start next cycle at current craft level
    const cycleSeconds = getCraftCycleSeconds(currentCraftLevel)
    const completesAt = new Date(Date.now() + cycleSeconds * 1000)
    await sql`
      INSERT INTO pw_craftsmanship_cycles (user_id, craft_level, completes_at)
      VALUES (${req.userId}, ${currentCraftLevel}, ${completesAt.toISOString()})
    `

    return res.status(200).json({
      ok:                      true,
      granted_item:            grantedItem,
      rolled_rarity:           rolledRarity,
      craft_level:             currentCraftLevel,
      next_cycle_completes_at: completesAt.toISOString(),
      pendingAdventureRewards: req.pendingAdventureRewards || null,
      pendingTownshipUpgrades: req.pendingTownshipUpgrades || null,
      pendingCraftCycles:      req.pendingCraftCycles || null,
    })
  } catch (err) {
    console.error('craftsmanship_claim error:', err)
    return res.status(500).json({ error: 'claim_failed' })
  }
}

// ── Chat Send (POST) ──────────────────────────────────────────────────────────

async function handleChatSend(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { channel, content } = req.body || {}
    if (channel !== 'general' && channel !== 'alliance') {
      return res.status(400).json({ error: 'invalid_channel', message: 'Only general and alliance channels are supported.' })
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'invalid_content' })
    }
    const trimmed = content.trim()
    if (trimmed.length < 1 || trimmed.length > 500) {
      return res.status(400).json({ error: 'invalid_length', message: 'Message must be 1-500 characters.' })
    }

    // Alliance chat: caller must be a current member; messages scope to their alliance.
    let allianceId = null
    if (channel === 'alliance') {
      const member = await getUserAllianceMembership(sql, req.userId)
      if (!member) return res.status(403).json({ error: 'not_in_alliance', message: 'You are not in an alliance.' })
      allianceId = member.alliance_id
    }

    const rl = await checkChatRateLimit(sql, req.userId)
    if (rl) return res.status(429).json(rl)

    const muteRows = await sql`
      SELECT 1 FROM pw_chat_moderations
      WHERE target_user_id = ${req.userId}
        AND action IN ('mute', 'timeout', 'ban')
        AND lifted_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `
    if (muteRows.length > 0) {
      return res.status(403).json({ error: 'muted', message: 'You are currently muted from chat.' })
    }

    const userRows = await sql`SELECT username FROM pw_users WHERE id = ${req.userId}`
    const senderUsername = userRows[0]?.username
    if (!senderUsername) return res.status(404).json({ error: 'user_not_found' })

    const channelType = channel // 'general' | 'alliance'
    const insertRows = await sql`
      INSERT INTO pw_chat_messages (channel_type, channel_id, sender_id, sender_username, content)
      VALUES (${channelType}, ${allianceId}, ${req.userId}, ${senderUsername}, ${trimmed})
      RETURNING id, created_at
    `
    const inserted = insertRows[0]

    const pusher = getPusherServer()
    const pusherChannel = channel === 'alliance' ? `private-alliance-${allianceId}` : 'general'
    await pusher.trigger(pusherChannel, 'new_message', {
      id:              Number(inserted.id),
      channel_type:    channelType,
      channel_id:      allianceId,
      sender_id:       req.userId,
      sender_username: senderUsername,
      content:         trimmed,
      created_at:      inserted.created_at,
      is_system:       false,
      is_mod_message:  !!req.modId,
      mod_username:    req.modId && req.modShowBadge ? req.modUsername : null,
    })

    return res.status(200).json({ ok: true, message_id: Number(inserted.id) })
  } catch (err) {
    console.error('chat_send error:', err)
    return res.status(500).json({ error: 'send_failed' })
  }
}

// ── Chat Fetch (GET) ──────────────────────────────────────────────────────────

async function handleChatFetch(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const channel = req.query?.channel || 'general'
    if (channel !== 'general' && channel !== 'alliance') {
      return res.status(400).json({ error: 'invalid_channel' })
    }

    if (channel === 'alliance') {
      const member = await getUserAllianceMembership(sql, req.userId)
      if (!member) return res.status(403).json({ error: 'not_in_alliance' })

      const allianceRows = await sql`
        SELECT id, channel_type, channel_id, sender_id, sender_username, content,
               is_system, created_at, deleted_at, deleted_by_name, deleted_by_type
        FROM pw_chat_messages
        WHERE channel_type = 'alliance' AND channel_id = ${member.alliance_id}
        ORDER BY created_at DESC
        LIMIT 100
      `
      return res.status(200).json({
        ok:       true,
        channel:  'alliance',
        messages: allianceRows.reverse(),
      })
    }

    const rows = await sql`
      SELECT id, channel_type, channel_id, sender_id, sender_username, content,
             created_at, deleted_at, deleted_by_name, deleted_by_type, is_system
      FROM pw_chat_messages
      WHERE channel_type = 'general'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 100
    `
    return res.status(200).json({
      ok:       true,
      channel:  'general',
      messages: rows.reverse(),
    })
  } catch (err) {
    console.error('chat_fetch error:', err)
    return res.status(500).json({ error: 'fetch_failed' })
  }
}

// ── Chat Pusher Auth (POST) ───────────────────────────────────────────────────

async function handleChatPusherAuth(req, res) {
  try {
    const { socket_id, channel_name } = req.body || {}
    if (!socket_id || !channel_name) {
      return res.status(400).json({ error: 'missing_params' })
    }
    if (channel_name === 'private-mod') {
      if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })
      const pusher = getPusherServer()
      const auth = pusher.authorizeChannel(socket_id, channel_name)
      return res.status(200).json(auth)
    }
    // Only allow private-user-{userId} for the user themselves
    if (channel_name.startsWith('private-user-')) {
      const requestedUserId = channel_name.replace('private-user-', '')
      if (requestedUserId !== req.userId) {
        return res.status(403).json({ error: 'not_your_channel' })
      }
      const pusher = getPusherServer()
      const auth = pusher.authorizeChannel(socket_id, channel_name)
      return res.status(200).json(auth)
    }
    // Alliance chat: only current members of the alliance may subscribe.
    if (channel_name.startsWith('private-alliance-')) {
      const allianceId = channel_name.replace('private-alliance-', '')
      if (!UUID_RE.test(allianceId)) {
        return res.status(403).json({ error: 'invalid_alliance_id' })
      }
      const memberCheck = await sql`
        SELECT 1 FROM pw_alliance_members
        WHERE user_id = ${req.userId} AND alliance_id = ${allianceId}
        LIMIT 1
      `
      if (memberCheck.length === 0) {
        return res.status(403).json({ error: 'not_alliance_member' })
      }
      const pusher = getPusherServer()
      const auth = pusher.authorizeChannel(socket_id, channel_name)
      return res.status(200).json(auth)
    }
    return res.status(403).json({ error: 'channel_not_authorized' })
  } catch (err) {
    console.error('chat_pusher_auth error:', err)
    return res.status(500).json({ error: 'auth_failed' })
  }
}

// ── Chat DM Threads (GET) ─────────────────────────────────────────────────────

async function handleChatDmThreads(req, res) {
  try {
    const rows = await sql`
      SELECT
        t.id AS thread_id,
        CASE WHEN t.user_a_id = ${req.userId} THEN t.user_b_id ELSE t.user_a_id END AS other_user_id,
        CASE WHEN t.user_a_id = ${req.userId} THEN ub.username ELSE ua.username END AS other_username,
        CASE WHEN t.user_a_id = ${req.userId} THEN ub.faction  ELSE ua.faction  END AS other_faction,
        t.last_message_at,
        (SELECT content FROM pw_chat_messages
         WHERE channel_type = 'dm' AND channel_id = t.id::text AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 1) AS last_message_preview,
        (SELECT COUNT(*)::int FROM pw_chat_messages
         WHERE channel_type = 'dm' AND channel_id = t.id::text
           AND deleted_at IS NULL
           AND sender_id != ${req.userId}
           AND id > COALESCE(
             (SELECT last_seen_id FROM pw_chat_dm_read_state
              WHERE user_id = ${req.userId} AND thread_id = t.id),
             0
           )
        ) AS unread_count
      FROM pw_chat_dm_threads t
      JOIN pw_users ua ON ua.id = t.user_a_id
      JOIN pw_users ub ON ub.id = t.user_b_id
      WHERE t.user_a_id = ${req.userId} OR t.user_b_id = ${req.userId}
      ORDER BY t.last_message_at DESC
      LIMIT 50
    `
    return res.status(200).json({ ok: true, threads: rows })
  } catch (err) {
    console.error('chat_dm_threads error:', err)
    return res.status(500).json({ error: 'fetch_failed' })
  }
}

// ── Chat DM Fetch (GET ?thread_id=N) ─────────────────────────────────────────

async function handleChatDmFetch(req, res) {
  try {
    const thread_id = parseInt(req.query?.thread_id)
    if (!thread_id) return res.status(400).json({ error: 'missing_thread_id' })

    const threadRows = await sql`
      SELECT user_a_id, user_b_id FROM pw_chat_dm_threads WHERE id = ${thread_id}
    `
    if (threadRows.length === 0) return res.status(404).json({ error: 'thread_not_found' })
    const t = threadRows[0]
    if (t.user_a_id !== req.userId && t.user_b_id !== req.userId) {
      return res.status(403).json({ error: 'not_a_member' })
    }

    const messages = await sql`
      SELECT id, sender_id, sender_username, content, created_at, deleted_at
      FROM pw_chat_messages
      WHERE channel_type = 'dm' AND channel_id = ${thread_id.toString()}
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 100
    `

    if (messages.length > 0) {
      const latestId = Math.max(...messages.map(m => Number(m.id)))
      await sql`
        INSERT INTO pw_chat_dm_read_state (user_id, thread_id, last_seen_id, updated_at)
        VALUES (${req.userId}, ${thread_id}, ${latestId}, NOW())
        ON CONFLICT (user_id, thread_id) DO UPDATE
        SET last_seen_id = GREATEST(pw_chat_dm_read_state.last_seen_id, ${latestId}),
            updated_at = NOW()
      `
    }

    return res.status(200).json({ ok: true, thread_id, messages: messages.reverse() })
  } catch (err) {
    console.error('chat_dm_fetch error:', err)
    return res.status(500).json({ error: 'fetch_failed' })
  }
}

// ── Chat DM Send (POST) ───────────────────────────────────────────────────────

async function handleChatDmSend(req, res) {
  try {
    const { target_username, content } = req.body || {}
    if (!target_username || !content) {
      return res.status(400).json({ error: 'missing_params' })
    }
    const trimmed = content.trim()
    if (trimmed.length < 1 || trimmed.length > 500) {
      return res.status(400).json({ error: 'invalid_length', message: 'Message must be 1-500 characters.' })
    }

    const rl = await checkChatRateLimit(sql, req.userId)
    if (rl) return res.status(429).json(rl)

    const muteRows = await sql`
      SELECT 1 FROM pw_chat_moderations
      WHERE target_user_id = ${req.userId}
        AND action IN ('mute', 'timeout', 'ban')
        AND lifted_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `
    if (muteRows.length > 0) return res.status(403).json({ error: 'muted' })

    const targetRows = await sql`
      SELECT id, username FROM pw_users WHERE LOWER(username) = LOWER(${target_username})
    `
    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'user_not_found', message: `No player named "${target_username}".` })
    }
    const target = targetRows[0]
    if (target.id === req.userId) {
      return res.status(400).json({ error: 'cannot_dm_self', message: 'You cannot DM yourself.' })
    }

    // Canonical ordering: smaller UUID string = user_a
    const userA = req.userId < target.id ? req.userId : target.id
    const userB = req.userId < target.id ? target.id   : req.userId

    let threadId
    const existingRows = await sql`
      SELECT id FROM pw_chat_dm_threads WHERE user_a_id = ${userA} AND user_b_id = ${userB}
    `
    if (existingRows.length > 0) {
      threadId = existingRows[0].id
    } else {
      const insertRows = await sql`
        INSERT INTO pw_chat_dm_threads (user_a_id, user_b_id, last_message_at)
        VALUES (${userA}, ${userB}, NOW())
        RETURNING id
      `
      threadId = insertRows[0].id
    }

    const senderRows = await sql`SELECT username FROM pw_users WHERE id = ${req.userId}`
    const senderUsername = senderRows[0].username

    const msgRows = await sql`
      INSERT INTO pw_chat_messages (channel_type, channel_id, sender_id, sender_username, content)
      VALUES ('dm', ${threadId.toString()}, ${req.userId}, ${senderUsername}, ${trimmed})
      RETURNING id, created_at
    `
    const inserted = msgRows[0]

    await sql`UPDATE pw_chat_dm_threads SET last_message_at = NOW() WHERE id = ${threadId}`

    const pusher = getPusherServer()
    const payload = {
      id:              Number(inserted.id),
      thread_id:       threadId,
      sender_id:       req.userId,
      sender_username: senderUsername,
      target_user_id:  target.id,
      target_username: target.username,
      content:         trimmed,
      created_at:      inserted.created_at,
      is_system:       false,
      is_mod_message:  !!req.modId,
      mod_username:    req.modId && req.modShowBadge ? req.modUsername : null,
    }
    await pusher.trigger(`private-user-${req.userId}`, 'dm_message', payload)
    await pusher.trigger(`private-user-${target.id}`,  'dm_message', payload)

    return res.status(200).json({
      ok:             true,
      message_id:     Number(inserted.id),
      thread_id:      threadId,
      target_username: target.username,
    })
  } catch (err) {
    console.error('chat_dm_send error:', err)
    return res.status(500).json({ error: 'send_failed' })
  }
}

// ── Chat State (GET) ──────────────────────────────────────────────────────────

async function handleChatState(req, res) {
  // Alliance membership tells the frontend whether to render the ALLIANCE tab.
  let allianceId = null, allianceName = null, allianceTag = null
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (member) {
      allianceId = member.alliance_id
      const allianceRows = await sql`
        SELECT name, tag FROM pw_alliances WHERE id = ${member.alliance_id}
      `
      allianceName = allianceRows[0]?.name || null
      allianceTag  = allianceRows[0]?.tag  || null
    }
  } catch (err) {
    console.error('chat_state alliance lookup error:', err)
  }

  return res.status(200).json({
    ok:            true,
    isMod:         !!req.modId,
    modUsername:   req.modUsername || null,
    modShowBadge:  req.modId ? req.modShowBadge : false,
    alliance_id:   allianceId,
    alliance_name: allianceName,
    alliance_tag:  allianceTag,
  })
}

// ── Chat Mod Send (POST) ──────────────────────────────────────────────────────

async function handleChatModSend(req, res) {
  try {
    if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })

    const { content } = req.body || {}
    const trimmed = (content || '').trim()
    if (trimmed.length < 1 || trimmed.length > 500) {
      return res.status(400).json({ error: 'invalid_length' })
    }

    const rl = await checkChatRateLimit(sql, req.userId)
    if (rl) return res.status(429).json(rl)

    const insertRows = await sql`
      INSERT INTO pw_chat_messages (channel_type, channel_id, sender_id, sender_username, content)
      VALUES ('mod', NULL, ${req.userId}, ${req.modUsername}, ${trimmed})
      RETURNING id, created_at
    `
    const inserted = insertRows[0]

    const pusher = getPusherServer()
    await pusher.trigger('private-mod', 'new_message', {
      id:              Number(inserted.id),
      channel_type:    'mod',
      channel_id:      null,
      sender_id:       req.userId,
      sender_username: req.modUsername,
      content:         trimmed,
      created_at:      inserted.created_at,
      is_system:       false,
      is_mod_message:  true,
    })

    return res.status(200).json({ ok: true, message_id: Number(inserted.id) })
  } catch (err) {
    console.error('chat_mod_send error:', err)
    return res.status(500).json({ error: 'send_failed' })
  }
}

// ── Chat Mod Fetch (GET) ──────────────────────────────────────────────────────

async function handleChatModFetch(req, res) {
  try {
    if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })

    const rows = await sql`
      SELECT id, channel_type, sender_id, sender_username, content,
             created_at, deleted_at, deleted_by_name, is_system
      FROM pw_chat_messages
      WHERE channel_type = 'mod'
      ORDER BY created_at DESC
      LIMIT 100
    `
    return res.status(200).json({ ok: true, channel: 'mod', messages: rows.reverse() })
  } catch (err) {
    console.error('chat_mod_fetch error:', err)
    return res.status(500).json({ error: 'fetch_failed' })
  }
}

// ── Chat Moderate (POST) ──────────────────────────────────────────────────────

async function handleChatModerate(req, res) {
  try {
    if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })

    const { action, message_id, target_user_id, duration_minutes, reason } = req.body || {}

    const validActions = ['delete_msg', 'mute', 'timeout', 'ban', 'kick']
    if (!validActions.includes(action)) return res.status(400).json({ error: 'invalid_action' })

    let targetUserId = target_user_id
    let targetUsername = null
    let channelType = null
    let channelId = null

    if (action === 'delete_msg') {
      if (!message_id) return res.status(400).json({ error: 'missing_message_id' })

      const msgRows = await sql`
        SELECT id, sender_id, sender_username, channel_type, channel_id
        FROM pw_chat_messages WHERE id = ${message_id} AND deleted_at IS NULL
      `
      if (msgRows.length === 0) return res.status(404).json({ error: 'message_not_found' })
      const msg = msgRows[0]

      targetUserId   = msg.sender_id
      targetUsername = msg.sender_username
      channelType    = msg.channel_type
      channelId      = msg.channel_id

      await sql`
        UPDATE pw_chat_messages
        SET deleted_at = NOW(), deleted_by_name = ${req.modUsername}, deleted_by_type = 'moderator'
        WHERE id = ${message_id}
      `

      const pusher = getPusherServer()
      if (channelType === 'general') {
        await pusher.trigger('general', 'message_deleted', { id: Number(message_id) })
      } else if (channelType === 'mod') {
        await pusher.trigger('private-mod', 'message_deleted', { id: Number(message_id) })
      } else if (channelType === 'alliance') {
        await pusher.trigger(`private-alliance-${channelId}`, 'message_deleted', { id: Number(message_id) })
      } else if (channelType === 'dm') {
        const threadId = parseInt(channelId)
        if (!isNaN(threadId)) {
          const threadRows = await sql`SELECT user_a_id, user_b_id FROM pw_chat_dm_threads WHERE id = ${threadId}`
          if (threadRows.length > 0) {
            const deletePayload = { id: Number(message_id), thread_id: threadId }
            await pusher.trigger(`private-user-${threadRows[0].user_a_id}`, 'dm_message_deleted', deletePayload)
            await pusher.trigger(`private-user-${threadRows[0].user_b_id}`, 'dm_message_deleted', deletePayload)
          }
        }
      }
    } else {
      if (!targetUserId) return res.status(400).json({ error: 'missing_target_user_id' })
      const userRows = await sql`SELECT username FROM pw_users WHERE id = ${targetUserId}`
      if (userRows.length === 0) return res.status(404).json({ error: 'target_not_found' })
      targetUsername = userRows[0].username
    }

    let expiresAt = null
    if (action === 'timeout' && duration_minutes) {
      expiresAt = new Date(Date.now() + Number(duration_minutes) * 60 * 1000)
    }

    await sql`
      INSERT INTO pw_chat_moderations
        (target_user_id, mod_id, action, channel_type, duration_minutes, expires_at, reason)
      VALUES
        (${targetUserId}, ${req.modId}, ${action}, ${channelType}, ${duration_minutes || null}, ${expiresAt}, ${reason || null})
    `

    // System message in the affected channel (general for global actions)
    const sysChannelType = channelType || 'general'
    const sysChannelId   = channelId || null

    const actionText = (() => {
      switch (action) {
        case 'delete_msg': return `${req.modUsername} deleted a message from ${targetUsername}`
        case 'mute':       return `${targetUsername} was muted by ${req.modUsername}`
        case 'timeout': {
          const mins  = Number(duration_minutes) || 30
          const label = mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`
          return `${targetUsername} was timed out for ${label} by ${req.modUsername}`
        }
        case 'ban':  return `${targetUsername} was banned by ${req.modUsername}`
        case 'kick': return `${targetUsername} was kicked from chat by ${req.modUsername}`
        default:     return `${action} applied to ${targetUsername} by ${req.modUsername}`
      }
    })()

    // Only post system message to general or mod channels (not DMs)
    if (sysChannelType !== 'dm') {
      const sysRows = await sql`
        INSERT INTO pw_chat_messages (channel_type, channel_id, sender_id, sender_username, content, is_system)
        VALUES (${sysChannelType}, ${sysChannelId}, ${req.userId}, '[MOD]', ${actionText}, TRUE)
        RETURNING id, created_at
      `
      const pusher = getPusherServer()
      const sysChan = sysChannelType === 'general' ? 'general'
        : sysChannelType === 'mod' ? 'private-mod'
        : sysChannelType === 'alliance' ? `private-alliance-${sysChannelId}`
        : null
      if (sysChan) {
        await pusher.trigger(sysChan, 'new_message', {
          id:              Number(sysRows[0].id),
          channel_type:    sysChannelType,
          channel_id:      sysChannelId,
          sender_id:       null,
          sender_username: '[MOD]',
          content:         actionText,
          is_system:       true,
          created_at:      sysRows[0].created_at,
        })
      }
    }

    return res.status(200).json({ ok: true, action, target_username: targetUsername })
  } catch (err) {
    console.error('chat_moderate error:', err)
    return res.status(500).json({ error: 'moderate_failed' })
  }
}

// ── Chat Lift Moderation (POST) ───────────────────────────────────────────────

async function handleChatLiftModeration(req, res) {
  try {
    if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })

    const { moderation_id } = req.body || {}
    if (!moderation_id) return res.status(400).json({ error: 'missing_moderation_id' })

    const modRows = await sql`
      SELECT m.id, m.action, m.target_user_id, u.username AS target_username
      FROM pw_chat_moderations m
      JOIN pw_users u ON u.id = m.target_user_id
      WHERE m.id = ${moderation_id} AND m.lifted_at IS NULL
    `
    if (modRows.length === 0) return res.status(404).json({ error: 'moderation_not_found_or_already_lifted' })
    const mod = modRows[0]

    await sql`
      UPDATE pw_chat_moderations SET lifted_at = NOW(), lifted_by = ${req.modId}
      WHERE id = ${moderation_id}
    `

    const liftText = `${mod.target_username}'s ${mod.action} was lifted by ${req.modUsername}`
    const sysRows = await sql`
      INSERT INTO pw_chat_messages (channel_type, channel_id, sender_id, sender_username, content, is_system)
      VALUES ('general', NULL, ${req.userId}, '[MOD]', ${liftText}, TRUE)
      RETURNING id, created_at
    `
    const pusher = getPusherServer()
    await pusher.trigger('general', 'new_message', {
      id:              Number(sysRows[0].id),
      channel_type:    'general',
      channel_id:      null,
      sender_id:       null,
      sender_username: '[MOD]',
      content:         liftText,
      is_system:       true,
      created_at:      sysRows[0].created_at,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('chat_lift_moderation error:', err)
    return res.status(500).json({ error: 'lift_failed' })
  }
}

// ── Chat List Moderations (GET ?scope=active|audit) ───────────────────────────

async function handleChatListModerations(req, res) {
  try {
    if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })

    const scope = req.query?.scope || 'active'
    let rows

    if (scope === 'active') {
      rows = await sql`
        SELECT m.id, m.target_user_id, u.username AS target_username,
               m.mod_id, mod.username AS mod_username,
               m.action, m.channel_type, m.duration_minutes, m.expires_at,
               m.reason, m.created_at
        FROM pw_chat_moderations m
        JOIN pw_users u ON u.id = m.target_user_id
        LEFT JOIN pw_moderators mod ON mod.id = m.mod_id
        WHERE m.lifted_at IS NULL
          AND (m.expires_at IS NULL OR m.expires_at > NOW())
          AND m.action IN ('mute', 'timeout', 'ban', 'kick')
        ORDER BY m.created_at DESC
      `
    } else {
      rows = await sql`
        SELECT m.id, m.target_user_id, u.username AS target_username,
               m.mod_id, mod.username AS mod_username,
               m.action, m.channel_type, m.duration_minutes, m.expires_at,
               m.lifted_at, lift.username AS lifted_by_username,
               m.reason, m.created_at
        FROM pw_chat_moderations m
        JOIN pw_users u ON u.id = m.target_user_id
        LEFT JOIN pw_moderators mod ON mod.id = m.mod_id
        LEFT JOIN pw_moderators lift ON lift.id = m.lifted_by
        ORDER BY m.created_at DESC
        LIMIT 100
      `
    }

    return res.status(200).json({ ok: true, scope, moderations: rows })
  } catch (err) {
    console.error('chat_list_moderations error:', err)
    return res.status(500).json({ error: 'fetch_failed' })
  }
}

// ── Chat Set Mod Badge (POST) ─────────────────────────────────────────────────

async function handleChatSetModBadge(req, res) {
  try {
    if (!req.modId) return res.status(403).json({ error: 'not_a_moderator' })
    const { show_badge } = req.body || {}
    await sql`UPDATE pw_moderators SET show_chat_badge = ${!!show_badge} WHERE id = ${req.modId}`
    return res.status(200).json({ ok: true, show_badge: !!show_badge })
  } catch (err) {
    console.error('chat_set_mod_badge error:', err)
    return res.status(500).json({ error: 'update_failed' })
  }
}

// ── Chat Alliance Delete (POST) ───────────────────────────────────────────────
// Founder/Officer can delete messages in their OWN alliance chat. Moderators can
// delete any alliance message. The player path never touches pw_chat_moderations
// (that audit table is keyed by mod_id); only the message row is tombstoned.

async function handleChatAllianceDelete(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { message_id } = req.body || {}
    if (!message_id) return res.status(400).json({ error: 'missing_message_id' })

    const msgRows = await sql`
      SELECT id, channel_type, channel_id, sender_username
      FROM pw_chat_messages WHERE id = ${message_id} AND deleted_at IS NULL
    `
    if (msgRows.length === 0) return res.status(404).json({ error: 'message_not_found' })
    const msg = msgRows[0]
    if (msg.channel_type !== 'alliance') {
      return res.status(400).json({ error: 'not_alliance_message' })
    }

    // Resolve permission + the deleter's display identity.
    let deletedByType, deletedByName
    if (req.modId) {
      deletedByType = 'moderator'
      deletedByName = req.modUsername
    } else {
      const member = await getUserAllianceMembership(sql, req.userId)
      if (!member || member.alliance_id !== msg.channel_id ||
          (member.rank !== 'founder' && member.rank !== 'officer')) {
        return res.status(403).json({ error: 'insufficient_permissions' })
      }
      const userRows = await sql`SELECT username FROM pw_users WHERE id = ${req.userId}`
      deletedByType = 'player'
      deletedByName = userRows[0]?.username || 'Alliance Officer'
    }

    await sql`
      UPDATE pw_chat_messages
      SET deleted_at = NOW(), deleted_by_name = ${deletedByName}, deleted_by_type = ${deletedByType}
      WHERE id = ${message_id}
    `

    const pusher = getPusherServer()
    const allianceChannel = `private-alliance-${msg.channel_id}`
    await pusher.trigger(allianceChannel, 'message_deleted', { id: Number(message_id) })

    // System message so clients can re-render the tombstone with context.
    const sysText = `${deletedByName} deleted a message from ${msg.sender_username}`
    const sysRows = await sql`
      INSERT INTO pw_chat_messages (channel_type, channel_id, sender_id, sender_username, content, is_system)
      VALUES ('alliance', ${msg.channel_id}, ${req.userId}, ${deletedByName}, ${sysText}, TRUE)
      RETURNING id, created_at
    `
    await pusher.trigger(allianceChannel, 'new_message', {
      id:              Number(sysRows[0].id),
      channel_type:    'alliance',
      channel_id:      msg.channel_id,
      sender_id:       null,
      sender_username: deletedByName,
      content:         sysText,
      is_system:       true,
      created_at:      sysRows[0].created_at,
    })

    return res.status(200).json({ ok: true, message_id: Number(message_id) })
  } catch (err) {
    console.error('chat_alliance_delete error:', err)
    return res.status(500).json({ error: 'delete_failed' })
  }
}

// ── Admin Metrics (GET) ───────────────────────────────────────────────────────

async function handleAdminMetrics(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!(await requireAdmin(req, res))) return

  try {
    const [
      totalPlayersRows,
      newPlayersTodayRows,
      activePlayers24hRows,
      levelDistRows,
      factionDistRows,
      classDistRows,
      economyRows,
      topRichestRows,
      pvpTodayRows,
      pvpTotalRows,
      questCompletionsRows,
      titanEventsRows,
      chatTodayRows,
      activeModsRows,
    ] = await Promise.all([
      sql`SELECT COUNT(*) AS c FROM pw_users`,
      sql`SELECT COUNT(*) AS c FROM pw_users WHERE created_at > NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(DISTINCT user_id) AS c FROM pw_player_stats WHERE last_updated > NOW() - INTERVAL '24 hours'`,
      sql`SELECT level, COUNT(*) AS count FROM pw_player_stats GROUP BY level ORDER BY level`,
      sql`SELECT faction, COUNT(*) AS count FROM pw_users WHERE faction IS NOT NULL GROUP BY faction`,
      sql`SELECT class, COUNT(*) AS count FROM pw_users WHERE class IS NOT NULL GROUP BY class`,
      sql`SELECT COALESCE(SUM(drachma), 0) AS total_drachma, COALESCE(AVG(drachma)::int, 0) AS avg_drachma FROM pw_player_stats`,
      sql`
        SELECT u.username, s.drachma, s.level
        FROM pw_player_stats s
        JOIN pw_users u ON u.id = s.user_id
        ORDER BY s.drachma DESC
        LIMIT 10
      `,
      sql`SELECT COUNT(*) AS c FROM pw_combat_log WHERE created_at > NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) AS c FROM pw_combat_log`,
      sql`SELECT COALESCE(SUM(completions), 0) AS c FROM pw_quest_progress`,
      sql`SELECT status, COUNT(*) AS count FROM pw_titan_events GROUP BY status`,
      sql`SELECT COUNT(*) AS c FROM pw_chat_messages WHERE created_at > NOW() - INTERVAL '24 hours' AND deleted_at IS NULL`,
      sql`SELECT COUNT(*) AS c FROM pw_chat_moderations WHERE lifted_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())`,
    ])

    return res.status(200).json({
      totalPlayers:          Number(totalPlayersRows[0].c),
      newPlayersToday:       Number(newPlayersTodayRows[0].c),
      activePlayers24h:      Number(activePlayers24hRows[0].c),
      levelDistribution:     levelDistRows.map(r => ({ level: Number(r.level), count: Number(r.count) })),
      factionDistribution:   factionDistRows.map(r => ({ faction: r.faction, count: Number(r.count) })),
      classDistribution:     classDistRows.map(r => ({ class: r.class, count: Number(r.count) })),
      totalDrachma:          Number(economyRows[0].total_drachma),
      avgDrachma:            Number(economyRows[0].avg_drachma),
      topRichest:            topRichestRows.map(r => ({ username: r.username, drachma: Number(r.drachma), level: Number(r.level) })),
      pvpFightsToday:        Number(pvpTodayRows[0].c),
      pvpFightsTotal:        Number(pvpTotalRows[0].c),
      questCompletionsTotal: Number(questCompletionsRows[0].c),
      titanEvents:           titanEventsRows.map(r => ({ status: r.status, count: Number(r.count) })),
      chatMessagesToday:     Number(chatTodayRows[0].c),
      activeModerations:     Number(activeModsRows[0].c),
    })
  } catch (err) {
    console.error('admin_metrics error:', err)
    return res.status(500).json({ error: 'Failed to load game metrics' })
  }
}

// ── Alliances (Phase A) ─────────────────────────────────────────────────────────

const ALLIANCE_FOUND_DRACHMA = 100000
const ALLIANCE_FOUND_GLORY   = 100
const ALLIANCE_FOUND_LEVEL   = 25
const ALLIANCE_MEMBER_CAP    = 25
const ALLIANCE_LEAVE_COOLDOWN_MS = 24 * 60 * 60 * 1000
const ALLIANCE_MIN_INVITE_LEVEL  = 5

// Validate UUID inputs before they hit the DB — a malformed string against a uuid
// column throws Postgres 22P02, which the generic 500 path can't disambiguate.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUuid(v) { return typeof v === 'string' && UUID_RE.test(v) }

function allianceErrorResponse(res, err, logLabel) {
  if (err?.isAllianceError) return res.status(err.status).json({ error: err.code, message: err.message })
  console.error(logLabel, err)
  return res.status(500).json({ error: 'server_error' })
}

// Roster query shared by alliance_info — ranks ordered founder→officer→veteran→member.
async function fetchAllianceRoster(allianceId) {
  return sql`
    SELECT m.id, m.user_id, m.rank, m.joined_at, m.veteran_eligible_at,
           u.username, u.faction, u.class, ps.level
    FROM pw_alliance_members m
    JOIN pw_users u ON u.id = m.user_id
    JOIN pw_player_stats ps ON ps.user_id = m.user_id
    WHERE m.alliance_id = ${allianceId}
    ORDER BY
      CASE m.rank WHEN 'founder' THEN 0 WHEN 'officer' THEN 1 WHEN 'veteran' THEN 2 ELSE 3 END,
      m.joined_at ASC
  `
}

// alliance_info (GET)
async function handleAllianceInfo(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (!member) {
      const urows = await sql`SELECT last_left_alliance_at FROM pw_users WHERE id = ${req.userId}`
      const lastLeft = urows[0]?.last_left_alliance_at
      let cooldown_remaining_seconds = 0
      if (lastLeft) {
        const remainMs = ALLIANCE_LEAVE_COOLDOWN_MS - (Date.now() - new Date(lastLeft).getTime())
        cooldown_remaining_seconds = remainMs > 0 ? Math.ceil(remainMs / 1000) : 0
      }
      return res.status(200).json({ alliance: null, cooldown_remaining_seconds })
    }

    const allianceId = member.alliance_id

    // Lazy veteran auto-promotion: any member past their eligibility window becomes a veteran.
    await sql`
      UPDATE pw_alliance_members
      SET rank = 'veteran'
      WHERE alliance_id = ${allianceId}
        AND rank = 'member'
        AND NOW() >= veteran_eligible_at
    `

    const aRows = await sql`SELECT * FROM pw_alliances WHERE id = ${allianceId}`
    if (aRows.length === 0) return res.status(404).json({ error: 'alliance_not_found' })
    const members = await fetchAllianceRoster(allianceId)
    const me = members.find(m => m.user_id === req.userId) || member

    // Phase C — power_breakdown is computed on demand (cheap, only on Alliance page load).
    // Raw military_power/economic_power + the three tiers already live on the alliance row.
    const power_breakdown = await computeAlliancePowerBreakdown(sql, allianceId)

    return res.status(200).json({ alliance: aRows[0], member: me, members, power_breakdown })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_info error:')
  }
}

// alliance_create (POST)
async function handleAllianceCreate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { name, tag, description } = req.body ?? {}
  try {
    const existing = await getUserAllianceMembership(sql, req.userId)
    if (existing) return res.status(400).json({ error: 'already_in_alliance' })

    const nameTrim = typeof name === 'string' ? name.trim() : ''
    const tagTrim  = typeof tag  === 'string' ? tag.trim()  : ''
    const descTrim = typeof description === 'string' ? description.trim() : null

    if (nameTrim.length < 3 || nameTrim.length > 30) {
      return res.status(400).json({ error: 'invalid_name', message: 'Name must be 3-30 characters.' })
    }
    if (tagTrim.length < 2 || tagTrim.length > 4) {
      return res.status(400).json({ error: 'invalid_tag', message: 'Tag must be 2-4 characters.' })
    }
    if (isProfane(nameTrim) || isProfane(tagTrim)) {
      return res.status(400).json({ error: 'profane', message: 'Name or tag contains banned words.' })
    }

    // Best-effort case-insensitive uniqueness for a friendly error; the DB UNIQUE
    // constraints (case-sensitive) remain the race-safe backstop via 23505 below.
    const dupName = await sql`SELECT 1 FROM pw_alliances WHERE LOWER(name) = LOWER(${nameTrim}) LIMIT 1`
    if (dupName.length) return res.status(400).json({ error: 'name_taken' })
    const dupTag = await sql`SELECT 1 FROM pw_alliances WHERE LOWER(tag) = LOWER(${tagTrim}) LIMIT 1`
    if (dupTag.length) return res.status(400).json({ error: 'tag_taken' })

    const statsRows = await sql`
      SELECT ps.*, u.faction, u.class AS player_class, u.last_left_alliance_at
      FROM pw_player_stats ps
      JOIN pw_users u ON u.id = ps.user_id
      WHERE ps.user_id = ${req.userId}
    `
    if (statsRows.length === 0) return res.status(404).json({ error: 'Player not found' })

    if (statsRows[0].level < ALLIANCE_FOUND_LEVEL) {
      return res.status(400).json({ error: 'level_too_low', level_required: ALLIANCE_FOUND_LEVEL })
    }

    // Founding is becoming a member, so the leave cooldown applies here too.
    const lastLeft = statsRows[0].last_left_alliance_at
    if (lastLeft) {
      const remainMs = ALLIANCE_LEAVE_COOLDOWN_MS - (Date.now() - new Date(lastLeft).getTime())
      if (remainMs > 0) {
        return res.status(400).json({ error: 'leave_cooldown', cooldown_remaining_seconds: Math.ceil(remainMs / 1000) })
      }
    }

    // Credit temple income / advance regen clocks before the affordability check.
    const owned = await fetchOwnedTemples(req.userId)
    const tships = await getPlayerTownships(sql, req.userId)
    const tbon = aggregateTownshipBonuses(tships)
    let stats = regenPlayer(statsRows[0], owned, statsRows[0].player_class, statsRows[0].faction, tbon)

    await sql`
      UPDATE pw_player_stats
      SET drachma            = ${stats.drachma},
          drachma_lifetime   = ${stats.drachma_lifetime},
          energy             = ${stats.energy},
          health             = ${stats.health},
          energy_regen_base  = ${stats.energy_regen_base},
          health_regen_base  = ${stats.health_regen_base},
          last_updated       = ${stats.last_updated}
      WHERE user_id = ${req.userId}
    `

    if (stats.drachma < ALLIANCE_FOUND_DRACHMA) {
      return res.status(400).json({ error: 'insufficient_drachma', cost: ALLIANCE_FOUND_DRACHMA })
    }
    if (stats.glory < ALLIANCE_FOUND_GLORY) {
      return res.status(400).json({ error: 'insufficient_glory', cost: ALLIANCE_FOUND_GLORY })
    }

    // Atomic deduct + create + enroll in one round-trip. The guarded UPDATE backstops
    // a concurrent spend; UNIQUE(name/tag/user_id) violations surface as 23505.
    let created
    try {
      created = await sql`
        WITH deducted AS (
          UPDATE pw_player_stats
          SET drachma = drachma - ${ALLIANCE_FOUND_DRACHMA},
              glory   = glory   - ${ALLIANCE_FOUND_GLORY}
          WHERE user_id = ${req.userId}
            AND drachma >= ${ALLIANCE_FOUND_DRACHMA}
            AND glory   >= ${ALLIANCE_FOUND_GLORY}
          RETURNING user_id, drachma, glory
        ),
        new_alliance AS (
          INSERT INTO pw_alliances (name, tag, description, founder_id, member_count)
          SELECT ${nameTrim}::varchar, ${tagTrim}::varchar, ${descTrim}::text, user_id, 1 FROM deducted
          RETURNING id
        ),
        new_member AS (
          INSERT INTO pw_alliance_members (alliance_id, user_id, rank, veteran_eligible_at)
          SELECT id, ${req.userId}::uuid, 'founder', NOW() + INTERVAL '30 days' FROM new_alliance
          RETURNING alliance_id
        )
        SELECT (SELECT id FROM new_alliance) AS alliance_id,
               (SELECT drachma FROM deducted) AS drachma,
               (SELECT glory FROM deducted) AS glory
      `
    } catch (e) {
      if (e?.code === '23505') {
        // Unique violation — figure out which constraint lost the race.
        const m = String(e.message || '').toLowerCase()
        if (m.includes('user_id')) return res.status(400).json({ error: 'already_in_alliance' })
        if (m.includes('tag'))     return res.status(400).json({ error: 'tag_taken' })
        return res.status(400).json({ error: 'name_taken' })
      }
      throw e
    }

    if (!created[0]?.alliance_id) {
      // Guarded UPDATE matched no row — a concurrent spend depleted funds.
      return res.status(400).json({ error: 'insufficient_funds' })
    }

    // Founding clears any prior leave cooldown.
    await sql`UPDATE pw_users SET last_left_alliance_at = NULL WHERE id = ${req.userId}`

    const aRows = await sql`SELECT * FROM pw_alliances WHERE id = ${created[0].alliance_id}`
    return res.status(201).json({
      alliance: aRows[0],
      stats: { ...stats, drachma: created[0].drachma, glory: created[0].glory },
    })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_create error:')
  }
}

// alliance_disband (POST) — founder only
async function handleAllianceDisband(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder'])
    // Alliance chat has no FK — purge it explicitly before the cascade delete.
    await sql`DELETE FROM pw_chat_messages WHERE channel_type = 'alliance' AND channel_id = ${alliance_id}`
    await sql`DELETE FROM pw_alliances WHERE id = ${alliance_id}`  // cascades members/invites/treasury log
    return res.status(200).json({ ok: true, disbanded: true })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_disband error:')
  }
}

// alliance_leave (POST) — any rank
async function handleAllianceLeave(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (!member) return res.status(400).json({ error: 'not_in_alliance' })
    const allianceId = member.alliance_id

    if (member.rank === 'founder') {
      // Succession: oldest officer, else oldest veteran, else oldest member.
      const successorRows = await sql`
        SELECT user_id FROM pw_alliance_members
        WHERE alliance_id = ${allianceId} AND user_id != ${req.userId}
        ORDER BY
          CASE rank WHEN 'officer' THEN 0 WHEN 'veteran' THEN 1 ELSE 2 END,
          joined_at ASC
        LIMIT 1
      `
      if (successorRows.length === 0) {
        // Founder is the only member — disband instead of leaving an empty shell.
        await sql`DELETE FROM pw_chat_messages WHERE channel_type = 'alliance' AND channel_id = ${allianceId}`
        await sql`DELETE FROM pw_alliances WHERE id = ${allianceId}`
        await sql`UPDATE pw_users SET last_left_alliance_at = NOW() WHERE id = ${req.userId}`
        return res.status(200).json({
          ok: true, left: true, disbanded: true,
          cooldown_until: new Date(Date.now() + ALLIANCE_LEAVE_COOLDOWN_MS).toISOString(),
        })
      }
      const successorId = successorRows[0].user_id
      await sql`UPDATE pw_alliance_members SET rank = 'founder' WHERE alliance_id = ${allianceId} AND user_id = ${successorId}`
      await sql`UPDATE pw_alliances SET founder_id = ${successorId} WHERE id = ${allianceId}`
    }

    await sql`DELETE FROM pw_alliance_members WHERE alliance_id = ${allianceId} AND user_id = ${req.userId}`
    await sql`UPDATE pw_alliances SET member_count = GREATEST(member_count - 1, 0) WHERE id = ${allianceId}`
    await sql`UPDATE pw_users SET last_left_alliance_at = NOW() WHERE id = ${req.userId}`

    // Phase C — losing a member lowers the combat baseline; refresh cached power/tiers.
    // (Only the surviving path: the founder-is-last-member branch above deletes the alliance.)
    try { await recalculateAlliancePower(sql, allianceId) } catch (e) { console.error('recalc after leave:', e) }

    return res.status(200).json({
      ok: true, left: true,
      cooldown_until: new Date(Date.now() + ALLIANCE_LEAVE_COOLDOWN_MS).toISOString(),
    })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_leave error:')
  }
}

// alliance_kick (POST)
async function handleAllianceKick(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { target_user_id } = req.body ?? {}
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (!member) return res.status(400).json({ error: 'not_in_alliance' })
    if (!target_user_id) return res.status(400).json({ error: 'target_user_id is required' })
    if (target_user_id === req.userId) return res.status(400).json({ error: 'cannot_kick_self' })
    if (member.rank !== 'founder' && member.rank !== 'officer') {
      return res.status(403).json({ error: 'insufficient_rank' })
    }

    const targetRows = await sql`
      SELECT * FROM pw_alliance_members WHERE alliance_id = ${member.alliance_id} AND user_id = ${target_user_id}
    `
    if (targetRows.length === 0) return res.status(404).json({ error: 'target_not_in_alliance' })
    const target = targetRows[0]

    // Officers can only kick veterans and members; founder can kick anyone (except self).
    if (member.rank === 'officer' && (target.rank === 'founder' || target.rank === 'officer')) {
      return res.status(403).json({ error: 'insufficient_rank' })
    }

    await sql`DELETE FROM pw_alliance_members WHERE alliance_id = ${member.alliance_id} AND user_id = ${target_user_id}`
    await sql`UPDATE pw_alliances SET member_count = GREATEST(member_count - 1, 0) WHERE id = ${member.alliance_id}`
    // Kick carries no cooldown — last_left_alliance_at intentionally left untouched.

    // Phase C — removing a member lowers the combat baseline; refresh cached power/tiers.
    try { await recalculateAlliancePower(sql, member.alliance_id) } catch (e) { console.error('recalc after kick:', e) }

    return res.status(200).json({ ok: true, kicked: true })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_kick error:')
  }
}

// alliance_promote (POST) — founder only; member/veteran → officer
async function handleAlliancePromote(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { target_user_id } = req.body ?? {}
  try {
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder'])
    if (!target_user_id) return res.status(400).json({ error: 'target_user_id is required' })

    const targetRows = await sql`
      SELECT * FROM pw_alliance_members WHERE alliance_id = ${alliance_id} AND user_id = ${target_user_id}
    `
    if (targetRows.length === 0) return res.status(404).json({ error: 'target_not_in_alliance' })
    if (targetRows[0].rank === 'founder') return res.status(400).json({ error: 'cannot_promote_founder' })
    if (targetRows[0].rank === 'officer') return res.status(400).json({ error: 'already_officer' })

    const updated = await sql`
      UPDATE pw_alliance_members SET rank = 'officer'
      WHERE alliance_id = ${alliance_id} AND user_id = ${target_user_id}
      RETURNING *
    `
    return res.status(200).json({ ok: true, member: updated[0] })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_promote error:')
  }
}

// alliance_demote (POST) — founder only; officer → veteran (if eligible) or member
async function handleAllianceDemote(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { target_user_id } = req.body ?? {}
  try {
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder'])
    if (!target_user_id) return res.status(400).json({ error: 'target_user_id is required' })

    const targetRows = await sql`
      SELECT * FROM pw_alliance_members WHERE alliance_id = ${alliance_id} AND user_id = ${target_user_id}
    `
    if (targetRows.length === 0) return res.status(404).json({ error: 'target_not_in_alliance' })
    if (targetRows[0].rank !== 'officer') return res.status(400).json({ error: 'not_an_officer' })

    // Drops to veteran if they've already passed their eligibility window, else member.
    const updated = await sql`
      UPDATE pw_alliance_members
      SET rank = CASE WHEN NOW() >= veteran_eligible_at THEN 'veteran' ELSE 'member' END
      WHERE alliance_id = ${alliance_id} AND user_id = ${target_user_id}
      RETURNING *
    `
    return res.status(200).json({ ok: true, member: updated[0] })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_demote error:')
  }
}

// alliance_transfer_ownership (POST) — founder only; target must be an officer
async function handleAllianceTransferOwnership(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { target_user_id } = req.body ?? {}
  try {
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder'])
    if (!target_user_id) return res.status(400).json({ error: 'target_user_id is required' })
    if (target_user_id === req.userId) return res.status(400).json({ error: 'cannot_transfer_to_self' })

    const targetRows = await sql`
      SELECT * FROM pw_alliance_members WHERE alliance_id = ${alliance_id} AND user_id = ${target_user_id}
    `
    if (targetRows.length === 0) return res.status(404).json({ error: 'target_not_in_alliance' })
    if (targetRows[0].rank !== 'officer') return res.status(400).json({ error: 'target_not_officer' })

    await sql`UPDATE pw_alliance_members SET rank = 'officer' WHERE alliance_id = ${alliance_id} AND user_id = ${req.userId}`
    await sql`UPDATE pw_alliance_members SET rank = 'founder' WHERE alliance_id = ${alliance_id} AND user_id = ${target_user_id}`
    await sql`UPDATE pw_alliances SET founder_id = ${target_user_id} WHERE id = ${alliance_id}`

    return res.status(200).json({ ok: true, new_founder: target_user_id })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_transfer_ownership error:')
  }
}

// alliance_browse (GET) — paginated, sortable
async function handleAllianceBrowse(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const sort = req.query.sort
    const page = Math.max(0, parseInt(req.query.page, 10) || 0)
    const limit = 50
    const offset = page * limit

    // Column names can't be parameterized in the sql tag — branch on a whitelist.
    let rows
    if (sort === 'military_tier') {
      rows = await sql`
        SELECT id, name, tag, description, member_count, military_tier, economic_tier, overall_tier, created_at
        FROM pw_alliances ORDER BY military_tier DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    } else if (sort === 'economic_tier') {
      rows = await sql`
        SELECT id, name, tag, description, member_count, military_tier, economic_tier, overall_tier, created_at
        FROM pw_alliances ORDER BY economic_tier DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    } else if (sort === 'member_count') {
      rows = await sql`
        SELECT id, name, tag, description, member_count, military_tier, economic_tier, overall_tier, created_at
        FROM pw_alliances ORDER BY member_count DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    } else {
      rows = await sql`
        SELECT id, name, tag, description, member_count, military_tier, economic_tier, overall_tier, created_at
        FROM pw_alliances ORDER BY overall_tier DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`
    }

    return res.status(200).json({ alliances: rows, page, limit })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_browse error:')
  }
}

// ── Alliance Invites (Phase B) ──────────────────────────────────────────────────

// alliance_invite_send (POST) — founder/officer invite a player to their alliance
async function handleAllianceInviteSend(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { target_user_id } = req.body ?? {}
  try {
    // Sender must be founder or officer (throws not_in_alliance / insufficient_rank).
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder', 'officer'])
    if (!isValidUuid(target_user_id)) return res.status(400).json({ error: 'invalid_uuid' })

    // One round-trip: target existence, level, and current membership.
    const targetRows = await sql`
      SELECT u.id, u.username, ps.level, am.id AS membership_id
      FROM pw_users u
      LEFT JOIN pw_player_stats ps ON ps.user_id = u.id
      LEFT JOIN pw_alliance_members am ON am.user_id = u.id
      WHERE u.id = ${target_user_id}
    `
    if (targetRows.length === 0) return res.status(404).json({ error: 'target_not_found' })
    const target = targetRows[0]
    if ((target.level ?? 0) < ALLIANCE_MIN_INVITE_LEVEL) {
      return res.status(400).json({ error: 'target_too_low_level', level_required: ALLIANCE_MIN_INVITE_LEVEL })
    }
    if (target.membership_id) return res.status(400).json({ error: 'target_already_in_alliance' })

    // Don't bother inviting into a full alliance.
    const aRows = await sql`SELECT member_count FROM pw_alliances WHERE id = ${alliance_id}`
    if (aRows.length === 0) return res.status(404).json({ error: 'alliance_not_found' })
    if (aRows[0].member_count >= ALLIANCE_MEMBER_CAP) return res.status(400).json({ error: 'alliance_full' })

    // Friendly duplicate check; the partial UNIQUE index backstops the race below.
    const dup = await sql`
      SELECT 1 FROM pw_alliance_invites
      WHERE alliance_id = ${alliance_id} AND invitee_user_id = ${target_user_id} AND status = 'pending'
      LIMIT 1
    `
    if (dup.length) return res.status(400).json({ error: 'invite_exists' })

    let inserted
    try {
      inserted = await sql`
        INSERT INTO pw_alliance_invites (alliance_id, invitee_user_id, inviter_user_id, status)
        VALUES (${alliance_id}, ${target_user_id}, ${req.userId}, 'pending')
        RETURNING *
      `
    } catch (e) {
      if (e?.code === '23505') return res.status(400).json({ error: 'invite_exists' })
      throw e
    }

    return res.status(201).json({ invite: inserted[0], target_username: target.username })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_invite_send error:')
  }
}

// alliance_invite_list_received (GET) — pending invites addressed to the caller
async function handleAllianceInviteListReceived(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const invites = await sql`
      SELECT i.id, i.alliance_id, i.inviter_user_id, i.status, i.created_at,
             a.name AS alliance_name, a.tag AS alliance_tag, a.description AS alliance_description,
             a.member_count, a.military_tier, a.economic_tier, a.overall_tier,
             u.username AS inviter_username
      FROM pw_alliance_invites i
      JOIN pw_alliances a ON a.id = i.alliance_id
      JOIN pw_users u ON u.id = i.inviter_user_id
      WHERE i.invitee_user_id = ${req.userId} AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `
    return res.status(200).json({ invites })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_invite_list_received error:')
  }
}

// alliance_invite_list_sent (GET) — founder/officer view of their alliance's pending invites
async function handleAllianceInviteListSent(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder', 'officer'])
    const invites = await sql`
      SELECT i.id, i.invitee_user_id, i.inviter_user_id, i.status, i.created_at,
             u.username AS invitee_username,
             iu.username AS inviter_username
      FROM pw_alliance_invites i
      JOIN pw_users u ON u.id = i.invitee_user_id
      JOIN pw_users iu ON iu.id = i.inviter_user_id
      WHERE i.alliance_id = ${alliance_id} AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `
    return res.status(200).json({ invites })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_invite_list_sent error:')
  }
}

// alliance_invite_accept (POST) — invitee joins; clears cooldown, auto-declines other invites
async function handleAllianceInviteAccept(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { invite_id } = req.body ?? {}
  const inviteId = Number(invite_id)
  if (!Number.isInteger(inviteId) || inviteId <= 0) return res.status(400).json({ error: 'invalid_uuid' })

  try {
    // Friendly pre-checks (separate autocommitted reads). The CTE below is the
    // authoritative gate — these only produce nicer error messages.
    const invRows = await sql`
      SELECT alliance_id, status, invitee_user_id
      FROM pw_alliance_invites WHERE id = ${inviteId}
    `
    if (invRows.length === 0 || invRows[0].invitee_user_id !== req.userId || invRows[0].status !== 'pending') {
      return res.status(404).json({ error: 'invite_not_found' })
    }
    const allianceId = invRows[0].alliance_id

    const existing = await getUserAllianceMembership(sql, req.userId)
    if (existing) return res.status(400).json({ error: 'already_in_alliance' })

    const uRows = await sql`
      SELECT ps.level, u.last_left_alliance_at
      FROM pw_users u JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE u.id = ${req.userId}
    `
    if (uRows.length === 0) return res.status(404).json({ error: 'Player not found' })
    if (uRows[0].level < ALLIANCE_MIN_INVITE_LEVEL) return res.status(400).json({ error: 'level_too_low' })

    const lastLeft = uRows[0].last_left_alliance_at
    if (lastLeft) {
      const cooldownEnd = new Date(lastLeft).getTime() + ALLIANCE_LEAVE_COOLDOWN_MS
      if (Date.now() < cooldownEnd) {
        return res.status(400).json({ error: 'cooldown_active', cooldown_until: new Date(cooldownEnd).toISOString() })
      }
    }

    const aRows = await sql`SELECT member_count FROM pw_alliances WHERE id = ${allianceId}`
    if (aRows.length === 0) return res.status(404).json({ error: 'alliance_not_found' })
    if (aRows[0].member_count >= ALLIANCE_MEMBER_CAP) return res.status(400).json({ error: 'alliance_full' })

    // Atomic, all-or-nothing. The invite UPDATE is the gate (re-validates pending +
    // ownership inside the same transaction); every other op hangs off it, so a
    // concurrently-resolved invite makes the whole statement a clean no-op.
    let result
    try {
      result = await sql`
        WITH accept_invite AS (
          UPDATE pw_alliance_invites SET status = 'accepted', resolved_at = NOW()
          WHERE id = ${inviteId} AND invitee_user_id = ${req.userId} AND status = 'pending'
          RETURNING alliance_id
        ),
        ins_member AS (
          INSERT INTO pw_alliance_members (alliance_id, user_id, rank, veteran_eligible_at)
          SELECT alliance_id, ${req.userId}::uuid, 'member', NOW() + INTERVAL '30 days' FROM accept_invite
          RETURNING alliance_id
        ),
        bump AS (
          UPDATE pw_alliances SET member_count = member_count + 1
          WHERE id = (SELECT alliance_id FROM accept_invite)
          RETURNING id
        ),
        decline_others AS (
          UPDATE pw_alliance_invites SET status = 'declined', resolved_at = NOW()
          WHERE invitee_user_id = ${req.userId} AND status = 'pending' AND id != ${inviteId}
            AND EXISTS (SELECT 1 FROM accept_invite)
          RETURNING id
        ),
        clear_cd AS (
          UPDATE pw_users SET last_left_alliance_at = NULL
          WHERE id = ${req.userId} AND EXISTS (SELECT 1 FROM accept_invite)
          RETURNING id
        )
        SELECT (SELECT alliance_id FROM accept_invite) AS alliance_id
      `
    } catch (e) {
      // UNIQUE(user_id) on pw_alliance_members — a concurrent join won the race.
      if (e?.code === '23505') return res.status(400).json({ error: 'already_in_alliance' })
      throw e
    }

    if (!result[0]?.alliance_id) {
      // Invite was resolved (declined/cancelled/accepted) between pre-check and CTE.
      return res.status(404).json({ error: 'invite_not_found' })
    }

    // Phase C — new member changes the combat baseline; refresh cached power/tiers.
    try { await recalculateAlliancePower(sql, result[0].alliance_id) } catch (e) { console.error('recalc after invite_accept:', e) }

    const allianceRow = await sql`SELECT * FROM pw_alliances WHERE id = ${result[0].alliance_id}`
    return res.status(200).json({ ok: true, alliance: allianceRow[0] })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_invite_accept error:')
  }
}

// alliance_invite_decline (POST) — invitee declines a pending invite
async function handleAllianceInviteDecline(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { invite_id } = req.body ?? {}
  const inviteId = Number(invite_id)
  if (!Number.isInteger(inviteId) || inviteId <= 0) return res.status(400).json({ error: 'invalid_uuid' })

  try {
    // Guarded UPDATE checks existence + ownership + pending atomically.
    const updated = await sql`
      UPDATE pw_alliance_invites SET status = 'declined', resolved_at = NOW()
      WHERE id = ${inviteId} AND invitee_user_id = ${req.userId} AND status = 'pending'
      RETURNING id
    `
    if (updated.length === 0) return res.status(404).json({ error: 'invite_not_found' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_invite_decline error:')
  }
}

// alliance_invite_cancel (POST) — founder/officer rescinds an invite their alliance sent
async function handleAllianceInviteCancel(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { invite_id } = req.body ?? {}
  const inviteId = Number(invite_id)
  if (!Number.isInteger(inviteId) || inviteId <= 0) return res.status(400).json({ error: 'invalid_uuid' })

  try {
    const { alliance_id } = await requireAllianceRank(sql, req.userId, ['founder', 'officer'])
    // Guarded UPDATE checks existence + alliance ownership + pending atomically.
    const updated = await sql`
      UPDATE pw_alliance_invites SET status = 'cancelled', resolved_at = NOW()
      WHERE id = ${inviteId} AND alliance_id = ${alliance_id} AND status = 'pending'
      RETURNING id
    `
    if (updated.length === 0) return res.status(404).json({ error: 'invite_not_found' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_invite_cancel error:')
  }
}

// ── Alliance Treasury Donations (Phase C) ────────────────────────────────────────
// All require alliance membership (any rank), use an atomic CTE to move the resource,
// log it with its computed power_value, then refresh cached power/tiers.

// alliance_donate_drachma (POST) — body { amount }
async function handleAllianceDonateDrachma(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const amount = Number(req.body?.amount)
  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'invalid_amount' })
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (!member) return res.status(400).json({ error: 'not_in_alliance' })
    const allianceId = member.alliance_id

    const result = await sql`
      WITH deducted AS (
        UPDATE pw_player_stats SET drachma = drachma - ${amount}
        WHERE user_id = ${req.userId} AND drachma >= ${amount}
        RETURNING drachma
      ),
      bump AS (
        UPDATE pw_alliances SET treasury_drachma = treasury_drachma + ${amount}
        WHERE id = ${allianceId} AND EXISTS (SELECT 1 FROM deducted)
        RETURNING treasury_drachma
      ),
      logged AS (
        INSERT INTO pw_alliance_treasury_log
          (alliance_id, donor_user_id, donation_type, amount, power_value, power_track)
        SELECT ${allianceId}, ${req.userId}, 'drachma', ${amount}, FLOOR(${amount} * 0.1), 'economic'
        WHERE EXISTS (SELECT 1 FROM deducted)
        RETURNING id
      )
      SELECT (SELECT drachma FROM deducted) AS player_drachma,
             (SELECT treasury_drachma FROM bump) AS alliance_treasury_drachma
    `
    if (result[0]?.alliance_treasury_drachma == null) {
      return res.status(400).json({ error: 'insufficient_funds' })
    }

    const power = await recalculateAlliancePower(sql, allianceId)
    return res.status(200).json({
      ok: true,
      player_drachma: Number(result[0].player_drachma),
      alliance_treasury_drachma: Number(result[0].alliance_treasury_drachma),
      power,
    })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_donate_drachma error:')
  }
}

// alliance_donate_glory (POST) — body { amount }
async function handleAllianceDonateGlory(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const amount = Number(req.body?.amount)
  if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ error: 'invalid_amount' })
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (!member) return res.status(400).json({ error: 'not_in_alliance' })
    const allianceId = member.alliance_id

    const result = await sql`
      WITH deducted AS (
        UPDATE pw_player_stats SET glory = glory - ${amount}
        WHERE user_id = ${req.userId} AND glory >= ${amount}
        RETURNING glory
      ),
      bump AS (
        UPDATE pw_alliances SET treasury_glory = treasury_glory + ${amount}
        WHERE id = ${allianceId} AND EXISTS (SELECT 1 FROM deducted)
        RETURNING treasury_glory
      ),
      logged AS (
        INSERT INTO pw_alliance_treasury_log
          (alliance_id, donor_user_id, donation_type, amount, power_value, power_track)
        SELECT ${allianceId}, ${req.userId}, 'glory', ${amount}, ${amount} * 10, 'economic'
        WHERE EXISTS (SELECT 1 FROM deducted)
        RETURNING id
      )
      SELECT (SELECT glory FROM deducted) AS player_glory,
             (SELECT treasury_glory FROM bump) AS alliance_treasury_glory
    `
    if (result[0]?.alliance_treasury_glory == null) {
      return res.status(400).json({ error: 'insufficient_funds' })
    }

    const power = await recalculateAlliancePower(sql, allianceId)
    return res.status(200).json({
      ok: true,
      player_glory: Number(result[0].player_glory),
      alliance_treasury_glory: Number(result[0].alliance_treasury_glory),
      power,
    })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_donate_glory error:')
  }
}

// alliance_donate_item (POST) — body { inventory_id }; donates an unequipped owned item
async function handleAllianceDonateItem(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const inventoryId = Number(req.body?.inventory_id)
  if (!Number.isInteger(inventoryId) || inventoryId <= 0) return res.status(400).json({ error: 'invalid_inventory_id' })
  try {
    const member = await getUserAllianceMembership(sql, req.userId)
    if (!member) return res.status(400).json({ error: 'not_in_alliance' })
    const allianceId = member.alliance_id

    // Look the row up to give precise errors and snapshot item details for the log.
    const itemRows = await sql`
      SELECT pi.id, pi.equipped, i.id AS item_id, i.rarity, i.level_required
      FROM pw_inventory pi
      JOIN pw_items i ON i.id = pi.item_id
      WHERE pi.id = ${inventoryId} AND pi.user_id = ${req.userId}
    `
    if (itemRows.length === 0) return res.status(404).json({ error: 'item_not_found' })
    if (itemRows[0].equipped) return res.status(400).json({ error: 'item_equipped' })

    const { item_id, rarity } = itemRows[0]
    const levelRequired = itemRows[0].level_required ?? 1
    const powerValue = (RARITY_VALUE[rarity] || 0) * levelRequired

    const result = await sql`
      WITH removed AS (
        DELETE FROM pw_inventory
        WHERE id = ${inventoryId} AND user_id = ${req.userId} AND equipped = false
        RETURNING item_id
      ),
      logged AS (
        INSERT INTO pw_alliance_treasury_log
          (alliance_id, donor_user_id, donation_type, item_id, item_rarity, item_level_required, power_value, power_track)
        SELECT ${allianceId}, ${req.userId}, 'item', ${item_id}, ${rarity}, ${levelRequired}, ${powerValue}, 'military'
        WHERE EXISTS (SELECT 1 FROM removed)
        RETURNING id
      )
      SELECT (SELECT item_id FROM removed) AS removed_item_id,
             (SELECT id FROM logged) AS log_id
    `
    if (result[0]?.removed_item_id == null) {
      // Lost a race — equipped or already gone between the read and the delete.
      return res.status(400).json({ error: 'item_not_found' })
    }

    const power = await recalculateAlliancePower(sql, allianceId)
    return res.status(200).json({
      ok: true,
      donated: { inventory_id: inventoryId, item_id, rarity, level_required: levelRequired, power_value: powerValue },
      power,
    })
  } catch (err) {
    return allianceErrorResponse(res, err, 'alliance_donate_item error:')
  }
}

// ── User lookup (Phase E1) ────────────────────────────────────────────────────
// Username → { id, username, level } resolver for the alliance invite flow, which
// needs a UUID (invite_send takes target_user_id). Read-only, auth-gated by the
// standard player session, and exposes nothing beyond identity + level.
async function handleUserLookup(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const username = typeof req.query.username === 'string' ? req.query.username.trim() : ''
  if (!username) return res.status(400).json({ error: 'username_required' })
  try {
    const rows = await sql`
      SELECT u.id, u.username, ps.level
      FROM pw_users u
      LEFT JOIN pw_player_stats ps ON ps.user_id = u.id
      WHERE LOWER(u.username) = LOWER(${username})
      LIMIT 1
    `
    if (rows.length === 0) return res.status(404).json({ error: 'user_not_found' })
    return res.status(200).json({ id: rows[0].id, username: rows[0].username, level: rows[0].level ?? 0 })
  } catch (err) {
    console.error('user_lookup error:', err)
    return res.status(500).json({ error: 'server_error' })
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

const innerHandler = requireUserWithModCheck(async function handler(req, res) {
  const { action } = req.query

  // Auto-complete any expired adventure, township upgrade, or craft cycle before processing any action
  req.pendingAdventureRewards = null
  req.pendingTownshipUpgrades = null
  req.pendingCraftCycles = null
  try { req.pendingAdventureRewards = await checkAndCompleteAdventures(sql, req.userId) } catch {}
  try { req.pendingTownshipUpgrades = await checkAndCompleteUpgrades(sql, req.userId) } catch {}
  try { req.pendingCraftCycles = await checkAndCompleteCrafts(sql, req.userId) } catch {}
  try { await processExpiredTitanEvents(sql) } catch (err) { console.error('inline titan processing error:', err) }
  try { await checkAndInsertTempleIncomeReward(sql, req.userId) } catch {}

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
  if (action === 'stat_reset_free')    return handleFreeStatReset(req, res)
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
  if (action === 'titan_status')        return handleTitanStatus(req, res)
  if (action === 'titan_join')          return handleTitanJoin(req, res)
  if (action === 'titan_claim')         return handleTitanClaim(req, res)
  if (action === 'titan_admin_trigger') return handleTitanAdminTrigger(req, res)
  if (action === 'titan_history')       return handleTitanHistory(req, res)
  if (action === 'township')            return handleTownship(req, res)
  if (action === 'township_establish')  return handleTownshipEstablish(req, res)
  if (action === 'township_upgrade')    return handleTownshipUpgrade(req, res)
  if (action === 'codex')               return handleCodex(req, res)
  if (action === 'pending_rewards')     return handlePendingRewards(req, res)
  if (action === 'acknowledge_reward')  return handleAcknowledgeReward(req, res)
  if (action === 'craftsmanship_claim') return handleCraftsmanshipClaim(req, res)
  if (action === 'chat_send')              return handleChatSend(req, res)
  if (action === 'chat_fetch')             return handleChatFetch(req, res)
  if (action === 'chat_pusher_auth')       return handleChatPusherAuth(req, res)
  if (action === 'chat_dm_threads')        return handleChatDmThreads(req, res)
  if (action === 'chat_dm_fetch')          return handleChatDmFetch(req, res)
  if (action === 'chat_dm_send')           return handleChatDmSend(req, res)
  if (action === 'chat_state')             return handleChatState(req, res)
  if (action === 'chat_mod_send')          return handleChatModSend(req, res)
  if (action === 'chat_mod_fetch')         return handleChatModFetch(req, res)
  if (action === 'chat_moderate')          return handleChatModerate(req, res)
  if (action === 'chat_lift_moderation')   return handleChatLiftModeration(req, res)
  if (action === 'chat_list_moderations')  return handleChatListModerations(req, res)
  if (action === 'chat_set_mod_badge')     return handleChatSetModBadge(req, res)
  if (action === 'chat_alliance_delete')   return handleChatAllianceDelete(req, res)
  if (action === 'alliance_info')               return handleAllianceInfo(req, res)
  if (action === 'alliance_create')             return handleAllianceCreate(req, res)
  if (action === 'alliance_disband')            return handleAllianceDisband(req, res)
  if (action === 'alliance_leave')              return handleAllianceLeave(req, res)
  if (action === 'alliance_kick')               return handleAllianceKick(req, res)
  if (action === 'alliance_promote')            return handleAlliancePromote(req, res)
  if (action === 'alliance_demote')             return handleAllianceDemote(req, res)
  if (action === 'alliance_transfer_ownership') return handleAllianceTransferOwnership(req, res)
  if (action === 'alliance_browse')             return handleAllianceBrowse(req, res)
  if (action === 'alliance_invite_send')          return handleAllianceInviteSend(req, res)
  if (action === 'alliance_invite_list_received') return handleAllianceInviteListReceived(req, res)
  if (action === 'alliance_invite_list_sent')     return handleAllianceInviteListSent(req, res)
  if (action === 'alliance_invite_accept')        return handleAllianceInviteAccept(req, res)
  if (action === 'alliance_invite_decline')       return handleAllianceInviteDecline(req, res)
  if (action === 'alliance_invite_cancel')        return handleAllianceInviteCancel(req, res)
  if (action === 'alliance_donate_drachma')       return handleAllianceDonateDrachma(req, res)
  if (action === 'alliance_donate_glory')         return handleAllianceDonateGlory(req, res)
  if (action === 'alliance_donate_item')          return handleAllianceDonateItem(req, res)
  if (action === 'user_lookup')                   return handleUserLookup(req, res)
  return res.status(400).json({ error: 'Unknown action' })
})

export default async function gameHandler(req, res) {
  if (req.query.action === 'admin_metrics') return handleAdminMetrics(req, res)
  return innerHandler(req, res)
}

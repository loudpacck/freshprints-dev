// Game logic helpers. Pure functions unless noted.
// Callers are responsible for persisting the returned stats object.

const MAX_LEVEL = 100

/**
 * Calculates passive energy, health, and temple income since last_updated.
 * Run at the top of every game API handler before processing the request.
 *
 * Rates (GDD §4.1):
 *   energy: 1 per 300 s (5 min)
 *   health:  1 per 180 s (3 min)
 *   temple income: income_per_hour * (1 + 0.25 * upgrade_level) * hours_elapsed
 *
 * @param {object} playerStats - raw stats row from pw_player_stats
 * @param {Array}  ownedTemples - rows joined from pw_player_temples + pw_temples;
 *                                each needs income_per_hour and upgrade_level.
 *                                Defaults to [] so all existing callers need no changes.
 */
export function regenPlayer(playerStats, ownedTemples = []) {
  const now = new Date()

  // Each resource tracks its own base so their clocks never interfere.
  // Fall back to last_updated for rows that predate the regen-fix migration.
  const energyBase = new Date(playerStats.energy_regen_base ?? playerStats.last_updated)
  const healthBase = new Date(playerStats.health_regen_base ?? playerStats.last_updated)

  const energyElapsed = Math.max(0, Math.floor((now - energyBase) / 1000))
  const healthElapsed = Math.max(0, Math.floor((now - healthBase) / 1000))

  const energyTicks = Math.floor(energyElapsed / 300)
  const healthTicks = Math.floor(healthElapsed / 180)

  // Only credit ticks when below max; advance the base regardless so leftover
  // accumulation is preserved correctly for the next call.
  const energyGained = playerStats.energy < playerStats.energy_max ? energyTicks : 0
  const healthGained = playerStats.health  < playerStats.health_max ? healthTicks : 0

  const newEnergyBase = energyTicks > 0
    ? new Date(energyBase.getTime() + energyTicks * 300 * 1000).toISOString()
    : (playerStats.energy_regen_base ?? playerStats.last_updated)

  const newHealthBase = healthTicks > 0
    ? new Date(healthBase.getTime() + healthTicks * 180 * 1000).toISOString()
    : (playerStats.health_regen_base ?? playerStats.last_updated)

  // Temple income uses wall-clock last_updated (not the regen bases).
  const contactElapsed = Math.max(0, Math.floor((now - new Date(playerStats.last_updated)) / 1000))
  const hoursElapsed = contactElapsed / 3600
  let templeIncome = 0
  for (const t of ownedTemples) {
    templeIncome += t.income_per_hour * (1 + 0.25 * t.upgrade_level) * hoursElapsed
  }
  const incomeFloored = Math.floor(templeIncome)

  return {
    ...playerStats,
    energy:             Math.min(playerStats.energy + energyGained, playerStats.energy_max),
    health:             Math.min(playerStats.health  + healthGained, playerStats.health_max),
    energy_regen_base:  newEnergyBase,
    health_regen_base:  newHealthBase,
    drachma:            playerStats.drachma          + incomeFloored,
    drachma_lifetime:   playerStats.drachma_lifetime + incomeFloored,
    last_updated:       now.toISOString(),
  }
}

/**
 * Checks if accumulated XP triggers one or more level-ups.
 * Handles multi-level jumps in a single call.
 * On each level-up: 5 stat points awarded, energy and health fully restored.
 * XP threshold formula (GDD §9): floor(100 * level^1.5)
 */
/**
 * Queries equipped items for a player and returns aggregate attack/defense bonuses.
 * Requires the neon sql tag to be passed in so this module stays DB-driver-agnostic.
 */
export async function getEquipmentBonuses(sql, userId) {
  const rows = await sql`
    SELECT i.attack_bonus, i.defense_bonus
    FROM pw_inventory inv
    JOIN pw_items i ON i.id = inv.item_id
    WHERE inv.user_id = ${userId} AND inv.equipped = true
  `
  return {
    attack:  rows.reduce((s, r) => s + (r.attack_bonus  || 0), 0),
    defense: rows.reduce((s, r) => s + (r.defense_bonus || 0), 0),
  }
}

/**
 * Pure combat formula (GDD §8.2). No DB writes — caller handles persistence.
 *
 * attacker/defender objects need: attack, defense, level, faction, class
 * attackerEquip/defenderEquip objects need: attack, defense
 *
 * Returns a result object including defender_glory_earned (only meaningful on loss).
 */
export function calculateCombat({ attacker, defender, attackerEquip, defenderEquip }) {
  const randInt = (max) => Math.floor(Math.random() * (max + 1))

  // Defense mitigation: up to 50% damage reduction with diminishing returns
  const defenseMitigation = (totalDef) => totalDef / (totalDef + 50) * 0.5

  let attackerPower = attacker.attack + attackerEquip.attack + randInt(attacker.level)
  let defenderPower = defender.defense + defenderEquip.defense + randInt(defender.level)

  if (attacker.faction === 'aesir') attackerPower *= 1.05
  if (attacker.class  === 'slayer') attackerPower *= 1.10

  attackerPower = Math.floor(attackerPower)
  defenderPower = Math.floor(defenderPower)

  const attTotalDef = (attacker.defense || 0) + (attackerEquip.defense || 0)
  const defTotalDef = (defender.defense || 0) + (defenderEquip.defense || 0)
  const attMit = defenseMitigation(attTotalDef)
  const defMit = defenseMitigation(defTotalDef)

  if (attackerPower > defenderPower) {
    const defBlowout = Math.max(1, Math.floor((attackerPower - defenderPower) / 10))
    return {
      result:               'win',
      attacker_power:       attackerPower,
      defender_power:       defenderPower,
      xp_earned:            10 + (defender.level * 2),
      drachma_transferred:  0,
      glory_earned:         1 + Math.floor(defender.level / 10),
      attacker_health_lost: Math.floor(Math.floor(attacker.health_max * 0.25) * (1 - attMit)),
      defender_health_lost: Math.max(Math.floor(Math.floor(defender.health_max * 0.40) * (1 - defMit)), defBlowout),
      defender_glory_earned: 0,
      attacker_mitigation:  attMit,
      defender_mitigation:  defMit,
    }
  } else {
    return {
      result:               'loss',
      attacker_power:       attackerPower,
      defender_power:       defenderPower,
      xp_earned:            0,
      drachma_transferred:  0,
      glory_earned:         0,
      attacker_health_lost: Math.floor(Math.floor(attacker.health_max * 0.40) * (1 - attMit)),
      defender_health_lost: 0,
      defender_glory_earned: 1,
      attacker_mitigation:  attMit,
      defender_mitigation:  defMit,
    }
  }
}

export function checkLevelUp(playerStats) {
  let { level, xp, stat_points, energy_max, health_max } = playerStats
  let leveled = false

  while (level < MAX_LEVEL) {
    const threshold = Math.floor(100 * Math.pow(level, 1.5))
    if (xp < threshold) break
    xp -= threshold
    level++
    stat_points += 5
    energy_max += 2
    health_max += 10
    leveled = true
  }

  if (!leveled) return { ...playerStats }

  return {
    ...playerStats,
    level,
    xp,
    stat_points,
    energy_max,
    health_max,
    energy: energy_max,
    health: health_max,
  }
}

export function calculatePowerRating(stats, equipBonuses) {
  return Math.floor(
    stats.attack + stats.defense +
    (equipBonuses?.attack  || 0) + (equipBonuses?.defense || 0) +
    stats.level * 2
  )
}

// Daily rotation seed — UTC days since Unix epoch. All players see the same shop within
// the same UTC day. Avoids timezone math entirely; each UTC midnight triggers a new seed.
export function getShopRotationSeed() {
  return Math.floor(Date.now() / 86400000)
}

// Returns a Unix-ms timestamp of the next UTC midnight (when today's rotation expires).
export function getShopRotationExpiry() {
  const today = getShopRotationSeed()
  return (today + 1) * 86400000
}

// Quest rotation: 3-hour buckets (8x daily)
export function getQuestRotationSeed() {
  return Math.floor(Date.now() / (3 * 3600 * 1000))
}

export function getQuestRotationExpiry() {
  const seed = getQuestRotationSeed()
  return (seed + 1) * 3 * 3600 * 1000
}

// Adventure rotation: 6-hour buckets (4x daily)
export function getAdventureRotationSeed() {
  return Math.floor(Date.now() / (6 * 3600 * 1000))
}

export function getAdventureRotationExpiry() {
  const seed = getAdventureRotationSeed()
  return (seed + 1) * 6 * 3600 * 1000
}

// Generic alias so callers can use a consistent name for both quest and adventure rotation.
export const pickRotatedFromPool = pickRotatedItems

// Mulberry32 PRNG — deterministic, seeded. Returns a closure.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Seeded Fisher-Yates shuffle. Returns first `count` items.
// Same seed → same order every call. Day N seed → different order than day N+1.
export function pickRotatedItems(allItems, seed, count = 8) {
  if (allItems.length <= count) return [...allItems]
  const items = [...allItems]
  const rand = mulberry32(seed)
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items.slice(0, count)
}

// Builds the deterministic daily drachma shop rotation pool for a given player level.
// The ORDER BY must match the handleShop GET query exactly — same pool order = same shuffle.
// Both handleShop and handleBuy must call this helper so they always produce identical sets.
export async function getDailyRotationPool(sql, playerLevel, count = 8) {
  const rows = await sql`
    SELECT id FROM pw_items
    WHERE buy_price IS NOT NULL
      AND level_required <= ${playerLevel}
      AND rarity IN ('common', 'uncommon', 'rare')
      AND slot != 'consumable'
    ORDER BY slot, level_required, rarity
  `
  return pickRotatedItems(rows, getShopRotationSeed(), count)
}

// Rarity ordering helper — used for loot upgrade calculations.
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const RARITY_NUM   = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 }

function applyBonuses(base, { xpMult, drachmaMult, bonusType, bonusValue, lootChance, lootUpgradeChance }) {
  // Returns { xp, drachma, lootChance, lootUpgradeChance }
  // No-op if bonusType is null/undefined
  let xp = Math.floor(base.xp * xpMult)
  let drachma = Math.floor(base.drachma * drachmaMult)
  let lc = lootChance
  let lu = lootUpgradeChance
  if (!bonusType) return { xp, drachma, lootChance: lc, lootUpgradeChance: lu }
  const val = Number(bonusValue) || 0
  switch (bonusType) {
    case 'xp':              xp      = Math.floor(xp * (1 + val / 100));       break
    case 'drachma':         drachma = Math.floor(drachma * (1 + val / 100));  break
    case 'loot_chance':     lc      = Math.min(100, lc + val);                break
    case 'loot_upgrade':    lu      = Math.max(lu, val);                       break
    case 'guaranteed_loot': lc      = 100;                                     break
  }
  return { xp, drachma, lootChance: lc, lootUpgradeChance: lu }
}

/**
 * Auto-completes any adventure whose completes_at has passed for this player.
 * Called at the top of every authenticated game.js handler.
 * Returns the rewards object (for frontend toast) or null if nothing completed.
 * Persists stats + marks adventure completed. Handles regen + temple income.
 */
export async function checkAndCompleteAdventures(sql, userId) {
  // Check for expired active adventure
  const activeRows = await sql`
    SELECT
      pa.id               AS player_adventure_id,
      pa.adventure_id,
      pa.completes_at,
      a.name              AS adventure_name,
      a.xp_reward,
      a.drachma_base,
      a.drachma_range,
      a.loot_chance,
      a.min_loot_rarity,
      a.faction_bonus,
      a.faction_bonus_type,
      a.faction_bonus_value,
      a.class_bonus,
      a.class_bonus_type,
      a.class_bonus_value
    FROM pw_player_adventures pa
    JOIN pw_adventures a ON a.id = pa.adventure_id
    WHERE pa.user_id = ${userId}
      AND pa.status = 'active'
      AND pa.completes_at <= NOW()
    LIMIT 1
  `
  if (activeRows.length === 0) return null

  const adv = activeRows[0]

  // Fetch player stats + faction/class for bonus calc
  const playerRows = await sql`
    SELECT
      u.faction,
      u.class             AS player_class,
      ps.level, ps.xp, ps.energy, ps.energy_max,
      ps.health, ps.health_max, ps.drachma, ps.drachma_lifetime,
      ps.glory, ps.glory_lifetime, ps.attack, ps.defense,
      ps.stat_points, ps.last_updated, ps.energy_regen_base, ps.health_regen_base
    FROM pw_users u
    JOIN pw_player_stats ps ON ps.user_id = u.id
    WHERE u.id = ${userId}
  `
  if (playerRows.length === 0) return null
  const player = playerRows[0]

  // Include temple income in regen
  const ownedTemples = await sql`
    SELECT pt.upgrade_level, t.income_per_hour
    FROM pw_player_temples pt
    JOIN pw_temples t ON t.type = pt.temple_type
    WHERE pt.user_id = ${userId}
  `
  let stats = regenPlayer(player, ownedTemples)

  const { faction, player_class } = player
  const drachmaRoll = adv.drachma_range > 0
    ? Math.floor(Math.random() * (adv.drachma_range + 1))
    : 0

  // Global faction + class multipliers (same as quests)
  const xpMult      = faction === 'olympians' ? 1.05 : 1
  const drachmaMult = (faction === 'annunaki' ? 1.05 : 1) * (player_class === 'broker' ? 1.1 : 1)

  let earnedXp      = Math.floor(adv.xp_reward * xpMult)
  let earnedDrachma = Math.floor((adv.drachma_base + drachmaRoll) * drachmaMult)
  let effectiveLootChance = adv.loot_chance
  let lootUpgradeChance   = 0

  // Per-adventure faction bonus
  if (adv.faction_bonus && faction === adv.faction_bonus) {
    const r = applyBonuses(
      { xp: earnedXp, drachma: earnedDrachma },
      { xpMult: 1, drachmaMult: 1, bonusType: adv.faction_bonus_type, bonusValue: adv.faction_bonus_value, lootChance: effectiveLootChance, lootUpgradeChance }
    )
    earnedXp      = r.xp
    earnedDrachma = r.drachma
    effectiveLootChance = r.lootChance
    lootUpgradeChance   = r.lootUpgradeChance
  }

  // Per-adventure class bonus
  if (adv.class_bonus && player_class === adv.class_bonus) {
    const r = applyBonuses(
      { xp: earnedXp, drachma: earnedDrachma },
      { xpMult: 1, drachmaMult: 1, bonusType: adv.class_bonus_type, bonusValue: adv.class_bonus_value, lootChance: effectiveLootChance, lootUpgradeChance }
    )
    earnedXp      = r.xp
    earnedDrachma = r.drachma
    effectiveLootChance = r.lootChance
    lootUpgradeChance   = r.lootUpgradeChance
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

  // Loot roll
  let lootItem = null
  if (effectiveLootChance > 0 && Math.random() * 100 <= effectiveLootChance) {
    let rarityIdx = RARITY_ORDER.indexOf(adv.min_loot_rarity)
    if (rarityIdx < 0) rarityIdx = 0
    if (lootUpgradeChance > 0 && Math.random() * 100 <= lootUpgradeChance) {
      rarityIdx = Math.min(rarityIdx + 1, 4)
    }
    const minNum = rarityIdx + 1 // 1-based

    const lootRows = await sql`
      SELECT id, name, rarity, slot
      FROM pw_items
      WHERE slot != 'consumable'
        AND CASE rarity
              WHEN 'common'    THEN 1
              WHEN 'uncommon'  THEN 2
              WHEN 'rare'      THEN 3
              WHEN 'epic'      THEN 4
              WHEN 'legendary' THEN 5
              ELSE 0
            END >= ${minNum}
      ORDER BY RANDOM()
      LIMIT 1
    `
    if (lootRows.length > 0) {
      const picked = lootRows[0]
      await sql`INSERT INTO pw_inventory (user_id, item_id) VALUES (${userId}, ${picked.id})`
      lootItem = { id: picked.id, name: picked.name, rarity: picked.rarity, slot: picked.slot }
    }
  }

  // Persist updated stats
  await sql`
    UPDATE pw_player_stats SET
      xp                 = ${stats.xp},
      level              = ${stats.level},
      energy             = ${stats.energy},
      energy_max         = ${stats.energy_max},
      health             = ${stats.health},
      health_max         = ${stats.health_max},
      drachma            = ${stats.drachma},
      drachma_lifetime   = ${stats.drachma_lifetime},
      glory_lifetime     = ${stats.glory_lifetime},
      stat_points        = ${stats.stat_points},
      energy_regen_base  = ${stats.energy_regen_base},
      health_regen_base  = ${stats.health_regen_base},
      last_updated       = ${stats.last_updated}
    WHERE user_id = ${userId}
  `

  // Mark adventure completed
  await sql`
    UPDATE pw_player_adventures
    SET status = 'completed', completed_at = NOW()
    WHERE id = ${adv.player_adventure_id}
  `

  return {
    adventure_name: adv.adventure_name,
    xp:             earnedXp,
    drachma:        earnedDrachma,
    loot:           lootItem,
    levelsGained,
  }
}

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
export function regenPlayer(playerStats, ownedTemples = [], playerClass = null, faction = null) {
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
    templeIncome += t.income_per_hour * (1 + 0.234 * Math.pow(t.upgrade_level, 1.03)) * hoursElapsed
  }
  // Broker +20% temple income, Annunaki +5% temple income (stackable)
  let templeMultiplier = 1.0
  if (playerClass === 'broker')   templeMultiplier += 0.20
  if (faction     === 'annunaki') templeMultiplier += 0.05
  const incomeFloored = Math.floor(templeIncome * templeMultiplier)

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
 * Queries equipped items for a player and returns aggregate combat bonuses.
 * Requires the neon sql tag to be passed in so this module stays DB-driver-agnostic.
 */
export async function getEquipmentBonuses(sql, userId) {
  const rows = await sql`
    SELECT i.attack_bonus, i.defense_bonus, i.agility_bonus,
           i.crit_chance, i.block_chance, i.dodge_chance
    FROM pw_inventory inv
    JOIN pw_items i ON i.id = inv.item_id
    WHERE inv.user_id = ${userId} AND inv.equipped = true
  `
  return {
    attack:  rows.reduce((s, r) => s + (r.attack_bonus  || 0), 0),
    defense: rows.reduce((s, r) => s + (r.defense_bonus || 0), 0),
    agility: rows.reduce((s, r) => s + (r.agility_bonus || 0), 0),
    crit:    rows.reduce((s, r) => s + (r.crit_chance   || 0), 0),
    block:   rows.reduce((s, r) => s + (r.block_chance  || 0), 0),
    dodge:   rows.reduce((s, r) => s + (r.dodge_chance  || 0), 0),
  }
}

/**
 * Returns combat-context bonuses derived from a player's faction and class.
 * Used by simulateCombat to apply identity advantages before item bonuses.
 * All values are percentage points (0–100 scale), matching item chance columns.
 */
export function getRaceClassCombatBonuses(faction, playerClass) {
  const bonuses = { crit: 0, dodge: 0, block: 0, agility: 0 }

  if (faction === 'olympians')     bonuses.crit  += 5   // divine strikes
  else if (faction === 'aesir')    bonuses.dodge += 5   // battle-hardened reflexes
  else if (faction === 'annunaki') bonuses.block += 5   // ancient ward

  if (playerClass === 'warden')      bonuses.block += 10  // tank archetype
  else if (playerClass === 'slayer') bonuses.crit  += 10  // DPS archetype
  else if (playerClass === 'oracle') bonuses.dodge += 5   // utility / evasive
  // broker: no combat bonus

  return bonuses
}


/**
 * 5-round round-based combat simulation.
 * Pure function — no DB writes. Pass 2 wires this into handlePvPAttack.
 *
 * attacker/defender need: health, attack, defense, agility (optional), level, faction, class
 * attackerEquip/defenderEquip come from getEquipmentBonuses (all six fields).
 *
 * Returns { result, rounds, final_attacker_hp, final_defender_hp,
 *           attacker_health_lost, defender_health_lost,
 *           xp_earned, glory_earned, defender_glory_earned }
 */
export function simulateCombat({ attacker, defender, attackerEquip, defenderEquip }) {
  const randInt  = (min, max) => min + Math.floor(Math.random() * (max - min + 1))
  const defMitFn = (totalDef)  => totalDef / (totalDef + 50) * 0.5

  let attackerHP = attacker.health
  let defenderHP = defender.health

  const attB = getRaceClassCombatBonuses(attacker.faction, attacker.class)
  const defB = getRaceClassCombatBonuses(defender.faction, defender.class)

  // Combine identity + equipment chances; cap at 75%
  const attCrit    = Math.min(75, attB.crit  + (attackerEquip.crit  || 0))
  const attDodge   = Math.min(75, attB.dodge + (attackerEquip.dodge || 0))
  const attBlock   = Math.min(75, attB.block + (attackerEquip.block || 0))
  const defCrit    = Math.min(75, defB.crit  + (defenderEquip.crit  || 0))
  const defDodge   = Math.min(75, defB.dodge + (defenderEquip.dodge || 0))
  const defBlock   = Math.min(75, defB.block + (defenderEquip.block || 0))
  const attAgility = (attacker.agility || 0) + (attackerEquip.agility || 0)
  const defAgility = (defender.agility || 0) + (defenderEquip.agility || 0)

  const attTotalDef = (attacker.defense || 0) + (attackerEquip.defense || 0)
  const defTotalDef = (defender.defense || 0) + (defenderEquip.defense || 0)
  const attMit = defMitFn(attTotalDef)
  const defMit = defMitFn(defTotalDef)

  const rounds = []

  for (let round = 1; round <= 5; round++) {
    let attacker_action = null
    let defender_action = null
    let counterHappened = false

    // ── 2a  Attacker strikes ─────────────────────────────────────────────────
    let attPower = (attacker.attack || 0) + (attackerEquip.attack || 0) + randInt(0, attacker.level + 1)
    if (attacker.faction === 'aesir')   attPower = Math.floor(attPower * 1.05)
    if (attacker.class   === 'slayer')  attPower = Math.floor(attPower * 1.10)

    if (Math.random() * 100 < defDodge) {
      // Defender dodged — attacker misses
      attacker_action = { type: 'miss', damage: 0, blocked: false }

      // Counter chance: defender agility * 0.5%
      if (Math.random() * 100 < defAgility * 0.5) {
        counterHappened = true
        let ctrPower = Math.floor(
          (defender.attack || 0) * 0.5 +
          (defenderEquip.attack || 0) * 0.5 +
          randInt(0, defender.level)
        )
        let ctrDmg = Math.floor(ctrPower * (1 - attMit))
        if (Math.random() * 100 < defCrit * 0.5) ctrDmg *= 2
        ctrDmg = Math.max(0, ctrDmg)
        attackerHP = Math.max(0, attackerHP - ctrDmg)
        defender_action = { type: 'counter', damage: ctrDmg, blocked: false, dodged: false }

        if (attackerHP <= 0) {
          rounds.push({ round, attacker_action, defender_action, attacker_hp_after: attackerHP, defender_hp_after: defenderHP })
          break
        }
      }
    } else {
      // Normal hit — check crit and block
      const isCrit    = Math.random() * 100 < attCrit
      let   dmg       = Math.floor(attPower * (1 - defMit))
      if (isCrit) dmg *= 2
      const isBlocked = Math.random() * 100 < defBlock
      if (isBlocked) dmg = Math.floor(dmg * 0.4)
      dmg = Math.max(0, dmg)
      defenderHP = Math.max(0, defenderHP - dmg)
      attacker_action = { type: isCrit ? 'crit' : 'hit', damage: dmg, blocked: isBlocked }
    }

    // ── 2b  Defender KO? ─────────────────────────────────────────────────────
    if (defenderHP <= 0) {
      rounds.push({ round, attacker_action, defender_action, attacker_hp_after: attackerHP, defender_hp_after: defenderHP })
      break
    }

    // ── 2c  Defender strikes back (skip if counter already consumed turn) ────
    if (!counterHappened) {
      let defPower = (defender.attack || 0) + (defenderEquip.attack || 0) + randInt(0, defender.level + 1)

      if (Math.random() * 100 < attDodge) {
        defender_action = { type: 'miss', damage: 0, blocked: false, dodged: true }
      } else {
        const isCrit    = Math.random() * 100 < defCrit
        let   dmg       = Math.floor(defPower * (1 - attMit))
        if (isCrit) dmg *= 2
        const isBlocked = Math.random() * 100 < attBlock
        if (isBlocked) dmg = Math.floor(dmg * 0.4)
        dmg = Math.max(0, dmg)
        attackerHP = Math.max(0, attackerHP - dmg)
        defender_action = { type: isCrit ? 'crit' : 'hit', damage: dmg, blocked: isBlocked, dodged: false }
      }
    }

    // ── 2d  Attacker KO? ─────────────────────────────────────────────────────
    if (attackerHP <= 0) {
      rounds.push({ round, attacker_action, defender_action, attacker_hp_after: attackerHP, defender_hp_after: defenderHP })
      break
    }

    // ── 2e  Record round ─────────────────────────────────────────────────────
    rounds.push({ round, attacker_action, defender_action, attacker_hp_after: attackerHP, defender_hp_after: defenderHP })
  }

  // Determine result
  let result
  if (defenderHP <= 0)             result = 'win'
  else if (attackerHP <= 0)        result = 'loss'
  else if (attackerHP > defenderHP) result = 'win'
  else if (defenderHP > attackerHP) result = 'loss'
  else                              result = 'draw'

  const final_attacker_hp    = Math.max(1, attackerHP)
  const final_defender_hp    = Math.max(1, defenderHP)
  const attacker_health_lost = attacker.health - final_attacker_hp
  const defender_health_lost = defender.health - final_defender_hp

  let xp_earned, glory_earned, defender_glory_earned
  if (result === 'win') {
    xp_earned             = 0
    glory_earned          = 1 + Math.floor(defender.level / 10)
    defender_glory_earned = 0
  } else if (result === 'loss') {
    xp_earned             = 0
    glory_earned          = 0
    defender_glory_earned = 1
  } else {
    // Draw — no rewards either side
    xp_earned             = 0
    glory_earned          = 0
    defender_glory_earned = 0
  }

  return {
    result,
    rounds,
    final_attacker_hp,
    final_defender_hp,
    attacker_health_lost,
    defender_health_lost,
    xp_earned,
    glory_earned,
    defender_glory_earned,
  }
}

export function checkLevelUp(playerStats, playerClass = null) {
  let { level, xp, stat_points, energy_max, health_max } = playerStats
  let attack  = playerStats.attack  ?? 5
  let defense = playerStats.defense ?? 5
  let leveled = false

  while (level < MAX_LEVEL) {
    const threshold = Math.floor(100 * Math.pow(level, 1.5))
    if (xp < threshold) break
    xp -= threshold
    level++
    stat_points += 5
    energy_max += 2
    health_max += 10
    if (playerClass === 'warden') defense    += 1
    if (playerClass === 'oracle') energy_max += 1
    if (playerClass === 'slayer') attack     += 1
    leveled = true
  }

  if (!leveled) return { ...playerStats }

  const result = {
    ...playerStats,
    level,
    xp,
    stat_points,
    energy_max,
    health_max,
    energy: energy_max,
    health: health_max,
  }
  if (playerClass === 'warden') result.defense = defense
  if (playerClass === 'slayer') result.attack  = attack
  return result
}

export function calculatePowerRating(stats, equipBonuses) {
  return Math.floor(
    stats.attack + stats.defense + (stats.agility || 0) +
    (equipBonuses?.attack   || 0) + (equipBonuses?.defense || 0) + (equipBonuses?.agility || 0) +
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

export function getGloryRotationSeed() {
  return Math.floor(Date.now() / 86400000)
}

export function getGloryRotationExpiry() {
  const today = getGloryRotationSeed()
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
export async function getDailyRotationPool(sql, playerLevel, count = 5) {
  const rows = await sql`
    SELECT * FROM pw_items
    WHERE buy_price IS NOT NULL
      AND level_required <= ${playerLevel}
      AND rarity IN ('common', 'uncommon', 'rare')
      AND slot != 'consumable'
    ORDER BY slot, level_required, rarity, id
  `
  return pickRotatedItems(rows, getShopRotationSeed(), count)
}

/**
 * Computes class/faction-aware stat baselines for a player at their current level.
 * Used by stat reset handlers to determine how many points to refund and what values to set.
 * Both handleConsume (realloc_stats) and handleFreeStatReset must use this helper.
 */
export function computeResetBaselines(stats, playerClass, faction) {
  const levelsGained = (stats.level || 1) - 1

  let attackBaseline    = 5
  let defenseBaseline   = 5
  let agilityBaseline   = 0
  let energyMaxBaseline = 20 + levelsGained * 2
  let healthMaxBaseline = 100 + levelsGained * 10

  // Class starting bonuses (applied at signup)
  if (playerClass === 'warden') defenseBaseline   += 5
  if (playerClass === 'oracle') energyMaxBaseline += 5
  if (playerClass === 'slayer') attackBaseline    += 5

  // Class per-level bonuses (applied in checkLevelUp)
  if (playerClass === 'warden') defenseBaseline   += levelsGained
  if (playerClass === 'oracle') energyMaxBaseline += levelsGained
  if (playerClass === 'slayer') attackBaseline    += levelsGained

  // Faction starting bonuses
  if (faction === 'aesir') agilityBaseline += 2

  return { attackBaseline, defenseBaseline, agilityBaseline, energyMaxBaseline, healthMaxBaseline }
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
  const { faction, player_class } = player
  let stats = regenPlayer(player, ownedTemples, player_class, faction)

  const drachmaRoll = adv.drachma_range > 0
    ? Math.floor(Math.random() * (adv.drachma_range + 1))
    : 0

  // Global faction + class multipliers (same as quests)
  const xpMult      = faction === 'olympians' ? 1.10 : 1
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
  stats = checkLevelUp(stats, player_class)
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

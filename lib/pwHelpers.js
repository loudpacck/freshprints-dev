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
  const elapsedSeconds = Math.floor((now - new Date(playerStats.last_updated)) / 1000)

  if (elapsedSeconds <= 0) return { ...playerStats }

  const energyGained = Math.floor(elapsedSeconds / 300)
  const healthGained  = Math.floor(elapsedSeconds / 180)

  const hoursElapsed = elapsedSeconds / 3600
  let templeIncome = 0
  for (const t of ownedTemples) {
    templeIncome += t.income_per_hour * (1 + 0.25 * t.upgrade_level) * hoursElapsed
  }
  const incomeFloored = Math.floor(templeIncome)

  return {
    ...playerStats,
    energy:           Math.min(playerStats.energy + energyGained, playerStats.energy_max),
    health:           Math.min(playerStats.health  + healthGained,  playerStats.health_max),
    drachma:          playerStats.drachma          + incomeFloored,
    drachma_lifetime: playerStats.drachma_lifetime + incomeFloored,
    last_updated:     now.toISOString(),
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

  let attackerPower = attacker.attack + attackerEquip.attack + randInt(attacker.level)
  let defenderPower = defender.defense + defenderEquip.defense + randInt(defender.level)

  if (attacker.faction === 'aesir') attackerPower *= 1.05
  if (attacker.class  === 'slayer') attackerPower *= 1.10

  attackerPower = Math.floor(attackerPower)
  defenderPower = Math.floor(defenderPower)

  if (attackerPower > defenderPower) {
    return {
      result:               'win',
      attacker_power:       attackerPower,
      defender_power:       defenderPower,
      xp_earned:            10 + (defender.level * 2),
      drachma_transferred:  Math.floor(defender.level * 5) + randInt(defender.level * 10),
      glory_earned:         1 + Math.floor(defender.level / 10),
      attacker_health_lost: 1,
      defender_health_lost: Math.max(1, Math.floor((attackerPower - defenderPower) / 10)),
      defender_glory_earned: 0,
    }
  } else {
    return {
      result:               'loss',
      attacker_power:       attackerPower,
      defender_power:       defenderPower,
      xp_earned:            0,
      drachma_transferred:  0,
      glory_earned:         0,
      attacker_health_lost: 2,
      defender_health_lost: 0,
      defender_glory_earned: 1,
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
    leveled = true
  }

  if (!leveled) return { ...playerStats }

  return {
    ...playerStats,
    level,
    xp,
    stat_points,
    // Fully restore on level-up; stat allocation (energy_max/health_max bumps) is separate
    energy: energy_max,
    health:  health_max,
  }
}

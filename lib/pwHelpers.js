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
export function regenPlayer(playerStats, ownedTemples = [], playerClass = null, faction = null, townshipBonuses = {}) {
  const now = new Date()

  // Each resource tracks its own base so their clocks never interfere.
  // Fall back to last_updated for rows that predate the regen-fix migration.
  const energyBase = new Date(playerStats.energy_regen_base ?? playerStats.last_updated)
  const healthBase = new Date(playerStats.health_regen_base ?? playerStats.last_updated)

  const energyElapsed = Math.max(0, Math.floor((now - energyBase) / 1000))
  const healthElapsed = Math.max(0, Math.floor((now - healthBase) / 1000))

  // Township Stewardship speeds up energy regen; floor at 60s
  const energyMult = 1 + (townshipBonuses.energy_regen_pct || 0) / 100
  const energyInterval = Math.max(60, Math.floor(300 / energyMult))
  // Township Ritual speeds up health regen; floor at 45s
  const healthMult = 1 + (townshipBonuses.health_regen_pct || 0) / 100
  const healthInterval = Math.max(45, Math.floor(180 / healthMult))

  const energyTicks = Math.floor(energyElapsed / energyInterval)
  const healthTicks = Math.floor(healthElapsed / healthInterval)

  // Only credit ticks when below max; advance the base regardless so leftover
  // accumulation is preserved correctly for the next call.
  const energyGained = playerStats.energy < playerStats.energy_max ? energyTicks : 0
  const healthGained = playerStats.health  < playerStats.health_max ? healthTicks : 0

  const newEnergyBase = energyTicks > 0
    ? new Date(energyBase.getTime() + energyTicks * energyInterval * 1000).toISOString()
    : (playerStats.energy_regen_base ?? playerStats.last_updated)

  const newHealthBase = healthTicks > 0
    ? new Date(healthBase.getTime() + healthTicks * healthInterval * 1000).toISOString()
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
  templeMultiplier += (townshipBonuses.temple_income_pct || 0) / 100
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

/**
 * Simulates a Titan raid: N players vs 1 Titan.
 * Pure function — no DB writes. Designed for cron-triggered batch resolution.
 *
 * titan        — pw_titans row
 * participants — Array of { user_id, username, level, faction, class, stats, equipBonuses }
 *                stats needs: attack, defense, agility, health, level
 *                equipBonuses needs: attack, defense, agility, crit, block, dodge
 *
 * Returns:
 *   { result, titan_starting_hp, titan_final_hp, fight_duration_seconds, rounds_count,
 *     fight_log: { titan: {...}, rounds: [...] },
 *     participant_results: [{ user_id, damage_dealt, hp_lost, contribution_rank, reward_tier }] }
 */
export function simulateTitanFight(titan, participants) {
  if (!participants || participants.length === 0) {
    return {
      result: 'expired',
      titan_starting_hp: 0,
      titan_final_hp: 0,
      fight_duration_seconds: 0,
      rounds_count: 0,
      fight_log: { titan: { name: titan.name, slug: titan.slug }, rounds: [] },
      participant_results: [],
    }
  }

  // Step 1: Titan HP — scales with combined player power (diminishing returns on count)
  const totalPlayerPower = participants.reduce((sum, p) => {
    return sum + (p.stats.attack || 0) + (p.equipBonuses.attack || 0) + (p.stats.level || 1) * 2
  }, 0)
  const playerCountWeight = Math.pow(participants.length, 1.2)
  const titanHpBase = Math.floor(
    (totalPlayerPower * 8 * Number(titan.base_hp_multiplier) * playerCountWeight) / participants.length
  )
  const titanStartingHp = Math.max(1000, titanHpBase)
  let titanHp = titanStartingHp

  // Step 2: Fight duration (60–600 s)
  const diffMult = titan.difficulty === 'extreme' ? 1.5 : titan.difficulty === 'hard' ? 1.2 : 1.0
  const fightDurationSeconds = Math.max(60, Math.min(600,
    Math.floor((90 + participants.length * 15) * diffMult)
  ))

  // Step 3: Rounds (one per ~15 s of fight time, 4–40 rounds)
  const roundsCount = Math.max(4, Math.min(40, Math.floor(fightDurationSeconds / 15)))

  // Step 4: Per-player tracking state
  const damageByPlayer = {}
  const hpLostByPlayer = {}
  const playerHp = {}
  participants.forEach(p => {
    damageByPlayer[p.user_id] = 0
    hpLostByPlayer[p.user_id] = 0
    playerHp[p.user_id] = Math.max(1, p.stats.health || 100)
  })

  const rounds = []
  const abilityType = titan.ability_type
  const abilityValue = Number(titan.ability_value) || 0

  for (let r = 1; r <= roundsCount; r++) {
    const attacks = []

    // Each living player attacks the Titan
    for (const p of participants) {
      if (playerHp[p.user_id] <= 1) continue

      // time_dilation: chance to lose turn
      if (abilityType === 'time_dilation' && Math.random() * 100 < abilityValue) {
        attacks.push({ user_id: p.user_id, username: p.username, damage_dealt: 0, attack_type: 'time_warp', is_crit: false, is_blocked: false })
        continue
      }

      const rcb = getRaceClassCombatBonuses(p.faction, p.class)
      // frost_veil: reduce crit chance
      const critReduction = abilityType === 'frost_veil' ? abilityValue : 0
      const totalCrit = Math.min(75, rcb.crit + (p.equipBonuses.crit || 0) - critReduction)

      let damage = (p.stats.attack || 0) + (p.equipBonuses.attack || 0)
        + Math.floor(Math.random() * ((p.stats.level || 1) + 1))
      if (p.class === 'slayer')  damage = Math.floor(damage * 1.10)
      if (p.faction === 'aesir') damage = Math.floor(damage * 1.05)

      // arcane_disrupt: 20% attack reduction for affected players (random 50% chance each round)
      if (abilityType === 'arcane_disrupt' && Math.random() < 0.5) {
        damage = Math.floor(damage * (1 - abilityValue / 100))
      }

      const titanDefMit = titan.base_defense / (Number(titan.base_defense) + 50) * 0.5
      damage = Math.floor(damage * (1 - titanDefMit))

      const isCrit = Math.random() * 100 < totalCrit
      if (isCrit) damage = damage * 2

      // chaos_surge: 35% chance to triple total damage
      if (abilityType === 'chaos_surge' && Math.random() * 100 < abilityValue) {
        damage = damage * 3
      }

      damage = Math.max(0, damage)
      titanHp = Math.max(0, titanHp - damage)
      damageByPlayer[p.user_id] += damage

      attacks.push({
        user_id: p.user_id,
        username: p.username,
        damage_dealt: damage,
        attack_type: isCrit ? 'crit' : 'hit',
        is_crit: isCrit,
        is_blocked: false,
      })

      if (titanHp <= 0) break
    }

    // Titan counter-attack — targets a random living player
    let titanAttack = null
    const living = participants.filter(p => playerHp[p.user_id] > 1)

    if (titanHp > 0 && living.length > 0) {
      // ragnarok_flame in final round: AoE all living players
      if (abilityType === 'ragnarok_flame' && r === roundsCount) {
        for (const p of living) {
          const pDef = (p.stats.defense || 0) + (p.equipBonuses.defense || 0)
          const pMit = pDef / (pDef + 50) * 0.5
          const aoeDmg = Math.max(0, Math.floor(abilityValue * (1 - pMit)))
          playerHp[p.user_id] = Math.max(1, playerHp[p.user_id] - aoeDmg)
          hpLostByPlayer[p.user_id] += aoeDmg
        }
        titanAttack = { target_user_id: 'all', target_username: 'ALL PLAYERS', damage: abilityValue, type: 'ragnarok_aoe' }
      } else {
        const target = living[Math.floor(Math.random() * living.length)]
        const pDef = (target.stats.defense || 0) + (target.equipBonuses.defense || 0)
        const pMit = pDef / (pDef + 50) * 0.5

        // arcane_disrupt: 50% chance to reduce defender defense too
        let titanDmg = Number(titan.base_attack) + Math.floor(Math.random() * 30)
        if (abilityType === 'arcane_disrupt' && Math.random() < 0.5) {
          titanDmg = Math.floor(titanDmg * (1 + abilityValue / 100))
        }
        titanDmg = Math.max(0, Math.floor(titanDmg * (1 - pMit)))
        playerHp[target.user_id] = Math.max(1, playerHp[target.user_id] - titanDmg)
        hpLostByPlayer[target.user_id] += titanDmg
        titanAttack = { target_user_id: target.user_id, target_username: target.username, damage: titanDmg, type: 'hit' }
      }
    }

    rounds.push({
      round: r,
      attacks,
      titan_attack: titanAttack,
      titan_hp_after: titanHp,
      player_hp_after: { ...playerHp },
    })

    if (titanHp <= 0) break
  }

  // Step 5: Rankings and result
  const result = titanHp <= 0 ? 'victory' : 'defeat'

  const ranked = participants
    .map(p => ({ user_id: p.user_id, damage_dealt: damageByPlayer[p.user_id] }))
    .sort((a, b) => b.damage_dealt - a.damage_dealt)

  const participantResults = participants.map(p => {
    const rankIdx = ranked.findIndex(r => r.user_id === p.user_id)
    const contributionRank = rankIdx < 3 ? rankIdx + 1 : null
    return {
      user_id: p.user_id,
      damage_dealt: damageByPlayer[p.user_id],
      hp_lost: hpLostByPlayer[p.user_id],
      contribution_rank: contributionRank,
      reward_tier: contributionRank ? 'top' : 'base',
    }
  })

  return {
    result,
    titan_starting_hp: titanStartingHp,
    titan_final_hp: titanHp,
    fight_duration_seconds: fightDurationSeconds,
    rounds_count: rounds.length,
    fight_log: {
      titan: {
        name: titan.name,
        slug: titan.slug,
        ability_name: titan.ability_name,
        ability_type: abilityType,
        starting_hp: titanStartingHp,
        final_hp: titanHp,
      },
      rounds,
    },
    participant_results: participantResults,
  }
}

/**
 * Computes XP/Drachma rewards for a Titan event participant.
 * Returns { xp, drachma, grant_potion, grant_loot } — pass/fail flags only.
 * Actual pw_items resolution happens in the API handler (needs DB access).
 *
 * participantResult needs: reward_tier ('top'|'base'), player_level
 */
export function calculateTitanRewards(titan, eventResult, participantResult) {
  const isVictory = eventResult === 'victory'
  const isTop     = participantResult.reward_tier === 'top'
  const level     = participantResult.player_level || 1

  const diffXp = titan.difficulty === 'extreme' ? 500 : titan.difficulty === 'hard' ? 300 : 200
  let xp = diffXp + level * 10

  // Defeat: half XP, no currency or drops
  if (!isVictory) {
    return { xp: Math.floor(xp * 0.5), drachma: 0, grant_potion: false, grant_loot: false }
  }

  // Victory drachma
  const baseDrachma = titan.difficulty === 'extreme' ? 5000 : titan.difficulty === 'hard' ? 3000 : 2000
  const drachma = isTop ? Math.floor(baseDrachma * 1.5) : baseDrachma

  // Victory potion: 100% for top, 80% for base
  const grant_potion = Math.random() * 100 < (isTop ? 100 : 80)

  // Victory loot: 60% for top, 25% for base
  const grant_loot = Math.random() * 100 < (isTop ? 60 : 25)

  return { xp, drachma, grant_potion, grant_loot }
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

// ── Township Helpers ──────────────────────────────────────────────────────────

/**
 * Linear interpolation of bonus value based on current level.
 * Level 1 → bonus_per_level; Level 100 → bonus_at_max.
 */
export function getTownshipBonusValue(upgrade, level) {
  const pct = (level - 1) / 99
  const value = upgrade.bonus_per_level + (upgrade.bonus_at_max - upgrade.bonus_per_level) * pct
  return Number(value.toFixed(3))
}

/**
 * Cost to upgrade FROM current level TO next level.
 * Formula: initial_cost × currentLevel^1.7
 * Level 99→100 for Stewardship (500 base) ≈ 1,000,000₯
 */
export function getTownshipUpgradeCost(initialCost, currentLevel) {
  return Math.floor(initialCost * Math.pow(currentLevel, 1.7))
}

/**
 * Time in seconds to upgrade FROM current level TO next level.
 * Formula: 5 × currentLevel^1.3 minutes
 * Level 1→2: 5 min; Level 99→100: ~29 hours
 */
export function getTownshipUpgradeSeconds(currentLevel) {
  return Math.floor(5 * 60 * Math.pow(currentLevel, 1.3))
}

/**
 * Fetches the player's owned township upgrades joined with the catalog.
 * Returns array of { type, name, bonus_type, bonus_per_level, bonus_at_max, level }
 */
export async function getPlayerTownships(sql, userId) {
  const rows = await sql`
    SELECT pt.upgrade_type AS type, pt.level,
           u.name, u.bonus_type, u.bonus_per_level, u.bonus_at_max
    FROM pw_player_townships pt
    JOIN pw_township_upgrades u ON u.type = pt.upgrade_type
    WHERE pt.user_id = ${userId}
  `
  return rows
}

/**
 * Aggregates a player's active township bonuses into a single flat object.
 * Pure function — caller fetches the data and passes it in.
 *
 * Input: ownedTownships — rows joined from pw_player_townships + pw_township_upgrades
 * Output: cumulative bonus values keyed by bonus_type
 */
export function aggregateTownshipBonuses(ownedTownships) {
  const bonuses = {
    xp_pct: 0,
    drachma_pct: 0,
    temple_income_pct: 0,
    adventure_reward_pct: 0,
    energy_regen_pct: 0,
    health_regen_pct: 0,
    flat_defense: 0,
    flat_attack: 0,
  }
  if (!ownedTownships || ownedTownships.length === 0) return bonuses
  for (const t of ownedTownships) {
    const value = getTownshipBonusValue(t, t.level)
    if (t.bonus_type in bonuses) {
      bonuses[t.bonus_type] += value
    }
  }
  return bonuses
}

/**
 * Auto-completes any township upgrades whose timer has elapsed.
 * Returns { upgrades: [...] } with completed upgrade info, or null if none.
 * Mirrors the pattern of checkAndCompleteAdventures.
 */
export async function checkAndCompleteUpgrades(sql, userId) {
  const expired = await sql`
    SELECT pt.id, pt.upgrade_type, pt.upgrading_to_level, u.name
    FROM pw_player_townships pt
    JOIN pw_township_upgrades u ON u.type = pt.upgrade_type
    WHERE pt.user_id = ${userId}
      AND pt.upgrade_completes_at IS NOT NULL
      AND pt.upgrade_completes_at <= NOW()
  `
  if (expired.length === 0) return null

  const completed = []
  for (const row of expired) {
    await sql`
      UPDATE pw_player_townships SET
        level = upgrading_to_level,
        upgrading_to_level = NULL,
        upgrade_started_at = NULL,
        upgrade_completes_at = NULL
      WHERE id = ${row.id}
    `
    completed.push({
      type: row.upgrade_type,
      name: row.name,
      new_level: row.upgrading_to_level,
    })
  }
  return { upgrades: completed }
}

// ── Shared Reward Helpers (used by quests, adventures, Titan — wired in Pass 2) ─

/**
 * Standard XP cascade applied to all XP-granting actions.
 * Applies: global faction/alignment multipliers → per-source faction bonus →
 *          per-source class bonus → Township Divination.
 *
 * perSourceBonuses — flat object with faction_bonus_type, faction_bonus_value,
 *   class_bonus_type, class_bonus_value, faction_bonus, class_bonus,
 *   player_class, player_faction from the quest/adventure row + user row.
 */
export function computeXpReward(baseXp, faction, alignment, perSourceBonuses, townshipBonuses) {
  let xpMult = 1
  if (faction === 'olympians') xpMult *= 1.10
  if (alignment === 'coalition') xpMult *= 1.15
  let xp = Math.floor(baseXp * xpMult)

  if (perSourceBonuses.faction_bonus_type === 'xp'
      && perSourceBonuses.faction_bonus === perSourceBonuses.player_faction) {
    xp = Math.floor(xp * (1 + perSourceBonuses.faction_bonus_value / 100))
  }

  if (perSourceBonuses.class_bonus_type === 'xp'
      && perSourceBonuses.class_bonus === perSourceBonuses.player_class) {
    xp = Math.floor(xp * (1 + perSourceBonuses.class_bonus_value / 100))
  }

  if (townshipBonuses && townshipBonuses.xp_pct > 0) {
    xp = Math.floor(xp * (1 + townshipBonuses.xp_pct / 100))
  }

  return xp
}

/**
 * Standard drachma cascade applied to all drachma-granting actions.
 * Applies: global faction/class multipliers → per-source faction bonus →
 *          per-source class bonus → Township Commerce.
 */
export function computeDrachmaReward(baseDrachma, faction, playerClass, perSourceBonuses, townshipBonuses) {
  let drachmaMult = 1
  if (faction === 'annunaki') drachmaMult *= 1.05
  if (playerClass === 'broker') drachmaMult *= 1.10
  let drachma = Math.floor(baseDrachma * drachmaMult)

  if (perSourceBonuses.faction_bonus_type === 'drachma'
      && perSourceBonuses.faction_bonus === perSourceBonuses.player_faction) {
    drachma = Math.floor(drachma * (1 + perSourceBonuses.faction_bonus_value / 100))
  }

  if (perSourceBonuses.class_bonus_type === 'drachma'
      && perSourceBonuses.class_bonus === perSourceBonuses.player_class) {
    drachma = Math.floor(drachma * (1 + perSourceBonuses.class_bonus_value / 100))
  }

  if (townshipBonuses && townshipBonuses.drachma_pct > 0) {
    drachma = Math.floor(drachma * (1 + townshipBonuses.drachma_pct / 100))
  }

  return drachma
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
      u.alignment,
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
  const { faction, player_class, alignment } = player

  const ownedTownships = await getPlayerTownships(sql, userId)
  const townshipBonuses = aggregateTownshipBonuses(ownedTownships)
  let stats = regenPlayer(player, ownedTemples, player_class, faction, townshipBonuses)

  const drachmaRoll = adv.drachma_range > 0
    ? Math.floor(Math.random() * (adv.drachma_range + 1))
    : 0

  const perSourceBonuses = {
    faction_bonus:       adv.faction_bonus,
    faction_bonus_type:  adv.faction_bonus_type,
    faction_bonus_value: Number(adv.faction_bonus_value) || 0,
    class_bonus:         adv.class_bonus,
    class_bonus_type:    adv.class_bonus_type,
    class_bonus_value:   Number(adv.class_bonus_value) || 0,
    player_faction:      faction,
    player_class:        player_class,
  }

  let earnedXp      = computeXpReward(adv.xp_reward, faction, alignment, perSourceBonuses, townshipBonuses)
  let earnedDrachma = computeDrachmaReward(adv.drachma_base + drachmaRoll, faction, player_class, perSourceBonuses, townshipBonuses)
  let effectiveLootChance = adv.loot_chance
  let lootUpgradeChance   = 0

  // Exploration township: applies flat bonus to XP, drachma, and loot chance for adventures
  if (townshipBonuses.adventure_reward_pct > 0) {
    earnedXp      = Math.floor(earnedXp      * (1 + townshipBonuses.adventure_reward_pct / 100))
    earnedDrachma = Math.floor(earnedDrachma * (1 + townshipBonuses.adventure_reward_pct / 100))
    effectiveLootChance = Math.min(100, effectiveLootChance + townshipBonuses.adventure_reward_pct)
  }

  // Per-adventure faction bonus: loot types only — xp/drachma handled in compute helpers above
  if (adv.faction_bonus && faction === adv.faction_bonus) {
    const v = Number(adv.faction_bonus_value) || 0
    switch (adv.faction_bonus_type) {
      case 'loot_chance':     effectiveLootChance = Math.min(100, effectiveLootChance + v); break
      case 'loot_upgrade':    lootUpgradeChance   = Math.max(lootUpgradeChance, v); break
      case 'guaranteed_loot': effectiveLootChance = 100; break
    }
  }

  // Per-adventure class bonus: loot types only — xp/drachma handled in compute helpers above
  if (adv.class_bonus && player_class === adv.class_bonus) {
    const v = Number(adv.class_bonus_value) || 0
    switch (adv.class_bonus_type) {
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

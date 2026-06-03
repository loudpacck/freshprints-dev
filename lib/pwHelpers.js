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
    energy:               Math.min(playerStats.energy + energyGained, playerStats.energy_max),
    health:               Math.min(playerStats.health  + healthGained, playerStats.health_max),
    energy_regen_base:    newEnergyBase,
    health_regen_base:    newHealthBase,
    drachma:              playerStats.drachma          + incomeFloored,
    drachma_lifetime:     playerStats.drachma_lifetime + incomeFloored,
    last_updated:         now.toISOString(),
    drachma_from_temples: incomeFloored,
    hours_elapsed:        hoursElapsed,
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
 * Dynamic round-based combat simulation. Runs round-by-round until one side is reduced
 * to ≤1 HP (decisive), capped at 100 rounds for safety. The attacker fights at their real
 * current HP; the defender fights at a virtual 100 HP. Ties — both sides ≤1 HP in the same
 * round, OR equal HP when the safety cap is hit — resolve in the defender's favour.
 * Pure function — no DB writes. Wired into handlePvPAttack.
 *
 * attacker/defender need: health, attack, defense, agility (optional), level, faction, class
 * attackerEquip/defenderEquip come from getEquipmentBonuses (all six fields).
 *
 * Returns { result, winner, rounds, rounds_total, safety_cap_reached,
 *           final_attacker_hp, final_defender_hp, attacker_final_hp, defender_final_hp,
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

  // Phase C — alliance tier perks (optional fields, default 0 → backward-safe).
  // Per spec: multiply the attacker's attack and the defender's defense.
  const attAllianceAtk = attacker.alliance_attack_bonus_pct  || 0
  const defAllianceDef = defender.alliance_defense_bonus_pct || 0
  const attBaseAttack  = Math.floor((attacker.attack  || 0) * (1 + attAllianceAtk))
  const defBaseDefense = Math.floor((defender.defense || 0) * (1 + defAllianceDef))

  const attTotalDef = (attacker.defense || 0) + (attackerEquip.defense || 0)
  const defTotalDef = defBaseDefense + (defenderEquip.defense || 0)
  const attMit = defMitFn(attTotalDef)
  const defMit = defMitFn(defTotalDef)

  const rounds = []

  // Dynamic combat: the fight runs until one side drops to ≤1 HP (decisive), rather than
  // a fixed number of rounds. Both combatants complete their swing every round before the
  // win check, so a same-round double-KO is possible and breaks to the defender.
  const MAX_ROUNDS = 100
  let winner = null            // 'attacker' | 'defender'
  let safety_cap_reached = false
  let round = 0

  while (round < MAX_ROUNDS) {
    round++
    let attacker_action = null
    let defender_action = null
    let counterHappened = false

    // ── Attacker strikes ─────────────────────────────────────────────────────
    let attPower = attBaseAttack + (attackerEquip.attack || 0) + randInt(0, attacker.level + 1)
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

    // ── Defender strikes back (skip if a counter already consumed the turn) ───
    // No mid-round break: the defender always completes its swing so both sides can
    // fall in the same round; the round-end check then resolves the tie defensively.
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

    // ── Record round ─────────────────────────────────────────────────────────
    rounds.push({ round, attacker_action, defender_action, attacker_hp_after: attackerHP, defender_hp_after: defenderHP })

    // ── Decisive end check (ties → defender) ──────────────────────────────────
    const attackerDown = attackerHP <= 1
    const defenderDown = defenderHP <= 1
    if (attackerDown && defenderDown) { winner = 'defender'; break }
    if (attackerDown)                 { winner = 'defender'; break }
    if (defenderDown)                 { winner = 'attacker'; break }
  }

  // Safety cap fallback — whoever has the higher current HP wins; a tie → defender.
  if (!winner) {
    safety_cap_reached = true
    winner = attackerHP > defenderHP ? 'attacker' : 'defender'
  }

  // Map winner → legacy result string. There is no 'draw' anymore: ties resolve to the defender.
  const result = winner === 'attacker' ? 'win' : 'loss'

  const final_attacker_hp    = Math.max(1, attackerHP)
  const final_defender_hp    = Math.max(1, defenderHP)
  const attacker_health_lost = attacker.health - final_attacker_hp
  const defender_health_lost = defender.health - final_defender_hp

  let xp_earned, glory_earned, defender_glory_earned
  if (result === 'win') {
    xp_earned             = 0
    glory_earned          = 1 + Math.floor(defender.level / 10)
    defender_glory_earned = 0
  } else {
    xp_earned             = 0
    glory_earned          = 0
    defender_glory_earned = 1
  }

  return {
    result,
    winner,
    rounds,
    rounds_total: rounds.length,
    safety_cap_reached,
    final_attacker_hp,
    final_defender_hp,
    attacker_final_hp: final_attacker_hp,
    defender_final_hp: final_defender_hp,
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
 * Dynamic combat: each participant enters at their real current HP and deals damage every
 * round. When a participant falls to ≤1 HP they DROP OUT (stop attacking, no longer targeted)
 * but stay in the results for reward distribution. The fight runs until the Titan is destroyed
 * (players win) or every participant has dropped out (Titan wins), capped at 100 rounds per
 * participant. If the cap is hit, the Titan being below half its starting HP counts as a player
 * victory. Titan damage is REAL — participant final HP is persisted by the caller.
 *
 * titan        — pw_titans row
 * participants — Array of { user_id, username, level, faction, class, stats, equipBonuses }
 *                stats needs: attack, defense, agility, health, level
 *                equipBonuses needs: attack, defense, agility, crit, block, dodge
 *
 * Returns:
 *   { result, winner, safety_cap_reached, titan_starting_hp, titan_final_hp,
 *     fight_duration_seconds, rounds_count,
 *     fight_log: { titan: {...}, rounds: [...] },
 *     participant_results: [{ user_id, damage_dealt, hp_lost, final_hp,
 *                             contribution_rank, reward_tier, energy_remaining, energy_drained }] }
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

  // Step 2: Fight duration (60–600 s) — still used for fight_ends_at scheduling.
  const diffMult = titan.difficulty === 'extreme' ? 1.5 : titan.difficulty === 'hard' ? 1.2 : 1.0
  const fightDurationSeconds = Math.max(60, Math.min(600,
    Math.floor((90 + participants.length * 15) * diffMult)
  ))

  // Combat is now dynamic (runs until decisive — see the round loop below). `roundsCount`
  // no longer bounds the fight; it is retained only as the scripted-ultimate marker round
  // for the ragnarok_flame AoE, which fires once if/when the fight reaches that round.
  const roundsCount = Math.max(4, Math.min(40, Math.floor(fightDurationSeconds / 15)))

  // Step 4: Per-player tracking state
  const damageByPlayer = {}
  const hpLostByPlayer = {}
  const playerHp = {}
  const playerEnergy = {}
  const energyDrainedByPlayer = {}
  participants.forEach(p => {
    damageByPlayer[p.user_id] = 0
    hpLostByPlayer[p.user_id] = 0
    playerHp[p.user_id] = Math.max(1, p.stats.health || 100)
    playerEnergy[p.user_id] = Math.max(0, p.stats.energy || 0)
    energyDrainedByPlayer[p.user_id] = 0
  })

  const rounds = []
  const abilityType = titan.ability_type
  const abilityValue = Number(titan.ability_value) || 0

  // Dynamic combat: run until the Titan is destroyed or every participant has dropped out,
  // capped at 100 rounds per participant for safety.
  const MAX_ROUNDS = 100 * participants.length
  let winner = null            // 'players' | 'titan'
  let safetyCapReached = false
  let r = 0

  while (r < MAX_ROUNDS) {
    r++
    const attacks = []

    // Enlil divine_storm — drains energy from all living participants before attacks
    if (abilityType === 'divine_storm') {
      for (const p of participants) {
        if (playerHp[p.user_id] <= 1) continue
        const drained = Math.min(playerEnergy[p.user_id], abilityValue)
        playerEnergy[p.user_id] = Math.max(0, playerEnergy[p.user_id] - drained)
        energyDrainedByPlayer[p.user_id] += drained
      }
    }

    // Each living player attacks the Titan
    for (const p of participants) {
      if (playerHp[p.user_id] <= 1) continue

      const isFatigued = playerEnergy[p.user_id] === 0

      // time_dilation: chance to lose turn
      if (abilityType === 'time_dilation' && Math.random() * 100 < abilityValue) {
        attacks.push({ user_id: p.user_id, username: p.username, damage_dealt: 0, attack_type: 'time_warp', is_crit: false, is_blocked: false, is_dodged: false, is_fatigued: isFatigued })
        continue
      }

      // FATIGUED: 30% miss chance
      if (isFatigued && Math.random() * 100 < 30) {
        attacks.push({
          user_id: p.user_id, username: p.username,
          damage_dealt: 0, attack_type: 'miss', is_crit: false, is_blocked: false, is_dodged: false, is_fatigued: true,
        })
        continue
      }

      // Titan dodge — applies regardless of fatigue
      if (Math.random() * 100 < Number(titan.dodge_chance || 0)) {
        attacks.push({
          user_id: p.user_id, username: p.username,
          damage_dealt: 0, attack_type: 'dodged', is_crit: false, is_blocked: false, is_dodged: true,
          is_fatigued: isFatigued,
        })
        continue
      }

      // Titan block — fully negates damage
      if (Math.random() * 100 < Number(titan.block_chance || 0)) {
        attacks.push({
          user_id: p.user_id, username: p.username,
          damage_dealt: 0, attack_type: 'blocked', is_crit: false, is_blocked: true, is_dodged: false,
          is_fatigued: isFatigued,
        })
        continue
      }

      // Phase C — alliance Military tier perk boosts this player's attack contribution.
      const pBaseAttack = Math.floor((p.stats.attack || 0) * (1 + (p.alliance_attack_bonus_pct || 0)))
      let damage = pBaseAttack + (p.equipBonuses.attack || 0)
        + Math.floor(Math.random() * ((p.stats.level || 1) + 1))
      if (p.faction === 'aesir') damage = Math.floor(damage * 1.05)
      if (p.class   === 'slayer')  damage = Math.floor(damage * 1.10)

      const titanDefMit = Number(titan.base_defense) / (Number(titan.base_defense) + 50) * 0.5
      damage = Math.floor(damage * (1 - titanDefMit))

      // crushing_weight: Atlas — reduces player damage by ability_value%
      if (abilityType === 'crushing_weight') {
        damage = Math.floor(damage * (1 - abilityValue / 100))
      }

      // arcane_disrupt: 50% chance per round to reduce player attack by abilityValue%
      if (abilityType === 'arcane_disrupt' && Math.random() < 0.5) {
        damage = Math.floor(damage * (1 - abilityValue / 100))
      }

      // chaos_surge: 35% chance to triple damage
      if (abilityType === 'chaos_surge' && Math.random() < 0.35) {
        damage = damage * 3
      }

      // Crit — only if not fatigued
      let isCrit = false
      if (!isFatigued) {
        const critReduction = abilityType === 'frost_veil' ? abilityValue : 0
        const RCB = getRaceClassCombatBonuses(p.faction, p.class)
        const totalCrit = Math.max(0, Math.min(75, RCB.crit + (p.equipBonuses.crit || 0) - critReduction))
        isCrit = Math.random() * 100 < totalCrit
        if (isCrit) damage = damage * 2
      }

      damage = Math.max(1, damage)
      titanHp = Math.max(0, titanHp - damage)
      damageByPlayer[p.user_id] += damage

      attacks.push({
        user_id: p.user_id,
        username: p.username,
        damage_dealt: damage,
        attack_type: isCrit ? 'crit' : 'hit',
        is_crit: isCrit,
        is_blocked: false,
        is_dodged: false,
        is_fatigued: isFatigued,
      })

      if (titanHp <= 0) break
    }

    // Titan counter-attack — targets a random living player
    let titanAttack = null
    const living = participants.filter(p => playerHp[p.user_id] > 1)

    if (titanHp > 0 && living.length > 0) {
      // ragnarok_flame scripted ultimate: AoE all living players on the marker round
      // (roundsCount). Fires at most once, only if the dynamic fight reaches that round.
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

    // Nergal death_aura — flat damage to all living participants per round
    if (abilityType === 'death_aura') {
      for (const p of participants) {
        if (playerHp[p.user_id] <= 1) continue
        const auraDamage = abilityValue
        playerHp[p.user_id] = Math.max(1, playerHp[p.user_id] - auraDamage)
        hpLostByPlayer[p.user_id] += auraDamage
      }
    }

    rounds.push({
      round: r,
      attacks,
      titan_attack: titanAttack,
      titan_hp_after: titanHp,
      player_hp_after: { ...playerHp },
      player_energy_after: { ...playerEnergy },
    })

    // End conditions — checked at round end (dropping out happens via the ≤1 HP floor above).
    if (titanHp <= 0) { winner = 'players'; break }
    if (participants.every(p => playerHp[p.user_id] <= 1)) { winner = 'titan'; break }
  }

  // Safety cap fallback: if the round cap is hit without a decisive end, the Titan being
  // below half its starting HP counts as a player victory (they did heavy damage); else Titan wins.
  if (!winner) {
    safetyCapReached = true
    winner = titanHp < titanStartingHp / 2 ? 'players' : 'titan'
  }

  // Capture each participant's final HP — dropped-out players are floored at 1, survivors
  // keep whatever HP they ended the fight with. Persisted to pw_player_stats by the caller.
  const finalHpByPlayer = {}
  for (const p of participants) {
    finalHpByPlayer[p.user_id] = playerHp[p.user_id]
  }

  // Step 5: Rankings and result
  const result = winner === 'players' ? 'victory' : 'defeat'

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
      final_hp: finalHpByPlayer[p.user_id],
      contribution_rank: contributionRank,
      reward_tier: contributionRank ? 'top' : 'base',
      energy_remaining: playerEnergy[p.user_id],
      energy_drained: energyDrainedByPlayer[p.user_id],
    }
  })

  return {
    result,
    winner,
    safety_cap_reached: safetyCapReached,
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
        block_chance: Number(titan.block_chance || 0),
        dodge_chance: Number(titan.dodge_chance || 0),
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

// Builds the deterministic daily glory shop equipment rotation.
// ORDER BY must match the handleShop GET query exactly — same pool order = same shuffle.
// Both handleShop GET and handleBuy must call this helper so they always produce identical sets.
export async function getGloryRotationPool(sql, count = 3) {
  const rows = await sql`
    SELECT id, name, description, slot, rarity, level_required,
           attack_bonus, defense_bonus, agility_bonus,
           crit_chance, block_chance, dodge_chance,
           glory_price, faction_exclusive
    FROM pw_items
    WHERE glory_price IS NOT NULL
      AND slot != 'consumable'
    ORDER BY slot, level_required, id
  `
  return pickRotatedItems(rows, getGloryRotationSeed(), count)
}

// ── Township Helpers ──────────────────────────────────────────────────────────

/**
 * Linear interpolation of bonus value based on current level.
 * Level 1 → bonus_per_level; Level 100 → bonus_at_max.
 */
export function getTownshipBonusValue(upgrade, level) {
  const perLevel = Number(upgrade.bonus_per_level)
  const atMax = Number(upgrade.bonus_at_max)
  const pct = (level - 1) / 99
  const value = perLevel + (atMax - perLevel) * pct
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

// ── Titan Event Processing ────────────────────────────────────────────────────

// Private helper — batch equipment bonuses for a set of user IDs.
async function fetchEquipBonusesBatch(sql, userIds) {
  if (!userIds.length) return {}
  const rows = await sql`
    SELECT inv.user_id,
           SUM(i.attack_bonus)  AS attack,
           SUM(i.defense_bonus) AS defense,
           SUM(i.agility_bonus) AS agility,
           SUM(i.crit_chance)   AS crit,
           SUM(i.block_chance)  AS block,
           SUM(i.dodge_chance)  AS dodge
    FROM pw_inventory inv
    JOIN pw_items i ON i.id = inv.item_id
    WHERE inv.user_id = ANY(${userIds}::uuid[])
      AND inv.equipped = true
    GROUP BY inv.user_id
  `
  const map = {}
  for (const r of rows) {
    map[r.user_id] = {
      attack:  Number(r.attack)  || 0,
      defense: Number(r.defense) || 0,
      agility: Number(r.agility) || 0,
      crit:    Number(r.crit)    || 0,
      block:   Number(r.block)   || 0,
      dodge:   Number(r.dodge)   || 0,
    }
  }
  for (const uid of userIds) {
    if (!map[uid]) map[uid] = { attack: 0, defense: 0, agility: 0, crit: 0, block: 0, dodge: 0 }
  }
  return map
}

/**
 * Resolves active fights past fight_ends_at and starts queued fights past
 * queue_closes_at. Uses a Postgres advisory lock so only one concurrent
 * request does heavy work at a time.
 *
 * Does NOT schedule new events — only the cron does that.
 * Returns true if any work was done, false otherwise.
 */
export async function processExpiredTitanEvents(sql) {
  // Cheap pre-check: skip the lock if there's nothing to do.
  const checkRows = await sql`
    SELECT COUNT(*) AS work_count
    FROM pw_titan_events
    WHERE (status = 'queue' AND queue_closes_at <= NOW())
       OR (status = 'active' AND fight_ends_at  <= NOW())
  `
  if (Number(checkRows[0]?.work_count || 0) === 0) return false

  const lockRows = await sql`SELECT pg_try_advisory_lock(847391) AS acquired`
  if (!lockRows[0]?.acquired) return false

  try {
    // STEP 1: Resolve active fights whose fight_ends_at has passed
    const expiredFights = await sql`
      SELECT id FROM pw_titan_events
      WHERE status = 'active' AND fight_ends_at <= NOW()
    `
    for (const fight of expiredFights) {
      await sql`UPDATE pw_titan_events SET status = 'resolved' WHERE id = ${fight.id}`
    }

    // STEP 2: Start queued fights whose queue window has closed
    const queuedEvents = await sql`
      SELECT * FROM pw_titan_events
      WHERE status = 'queue' AND queue_closes_at <= NOW()
    `

    for (const event of queuedEvents) {
      const participantRows = await sql`
        SELECT p.user_id, u.username, u.faction, u.class,
               ps.level, ps.attack, ps.defense, ps.agility, ps.health,
               ps.energy, ps.energy_max
        FROM pw_titan_participants p
        JOIN pw_users u  ON u.id  = p.user_id
        JOIN pw_player_stats ps ON ps.user_id = p.user_id
        WHERE p.event_id = ${event.id} AND p.status = 'queued'
      `

      if (participantRows.length === 0) {
        await sql`UPDATE pw_titan_events SET status = 'expired' WHERE id = ${event.id}`
        continue
      }

      const userIds = participantRows.map(p => p.user_id)
      const equipMap = await fetchEquipBonusesBatch(sql, userIds)

      const townshipBonusesByUser = {}
      const alliancePerksByUser = {}
      for (const p of participantRows) {
        const tRows = await getPlayerTownships(sql, p.user_id)
        townshipBonusesByUser[p.user_id] = aggregateTownshipBonuses(tRows)
        alliancePerksByUser[p.user_id] = await getAlliancePerks(sql, p.user_id)
      }

      const participants = participantRows.map(p => {
        const tb = townshipBonusesByUser[p.user_id]
        return {
          user_id:      p.user_id,
          username:     p.username,
          level:        p.level,
          faction:      p.faction,
          class:        p.class,
          // Phase C — alliance Military tier perk applied to attack contribution in simulateTitanFight.
          alliance_attack_bonus_pct: alliancePerksByUser[p.user_id]?.attack_bonus_pct || 0,
          stats: {
            attack:     p.attack  + Math.floor(tb.flat_attack  || 0),
            defense:    p.defense + Math.floor(tb.flat_defense || 0),
            agility:    p.agility || 0,
            health:     p.health,
            energy:     p.energy,
            energy_max: p.energy_max,
            level:      p.level,
          },
          equipBonuses: equipMap[p.user_id],
        }
      })

      const titanRows = await sql`SELECT * FROM pw_titans WHERE id = ${event.titan_id}`
      if (!titanRows.length) {
        await sql`UPDATE pw_titan_events SET status = 'expired' WHERE id = ${event.id}`
        continue
      }
      const titan = titanRows[0]

      const fight = simulateTitanFight(titan, participants)
      const fightEndsAt = new Date(Date.now() + fight.fight_duration_seconds * 1000)

      await sql`
        UPDATE pw_titan_events SET
          status                 = 'active',
          fight_ends_at          = ${fightEndsAt.toISOString()},
          fight_duration_seconds = ${fight.fight_duration_seconds},
          titan_starting_hp      = ${fight.titan_starting_hp},
          titan_final_hp         = ${fight.titan_final_hp},
          result                 = ${fight.result},
          fight_log              = ${JSON.stringify(fight.fight_log)}::jsonb
        WHERE id = ${event.id}
      `

      for (const pr of fight.participant_results) {
        await sql`
          UPDATE pw_titan_participants SET
            status            = 'fought',
            damage_dealt      = ${pr.damage_dealt},
            hp_lost           = ${pr.hp_lost},
            contribution_rank = ${pr.contribution_rank},
            reward_tier       = ${pr.reward_tier},
            energy_drained    = ${pr.energy_drained || 0}
          WHERE event_id = ${event.id} AND user_id = ${pr.user_id}
        `
        // Titan damage is real now: persist each participant's final HP. Reset health_regen_base
        // to NOW() so passive health regen accrues from fight end — without this, a stale regen
        // base would over-credit health on the next page load and instantly erase the damage.
        await sql`
          UPDATE pw_player_stats
          SET energy            = ${pr.energy_remaining},
              health            = ${pr.final_hp},
              health_regen_base = NOW()
          WHERE user_id = ${pr.user_id}
        `
      }
    }

    return true
  } finally {
    try { await sql`SELECT pg_advisory_unlock(847391)` } catch {}
  }
}

/**
 * Schedules the next Titan event 12 hours from now.
 * Cron-exclusive — never call from inline game.js processing.
 * Returns the Date of the next fight.
 */
export async function scheduleNextTitanEvent(sql) {
  const nextFightAt     = new Date(Date.now() + 12 * 60 * 60 * 1000)
  const nextQueueOpenAt = new Date() // open immediately on creation

  const nextTitanRows = await sql`SELECT id FROM pw_titans ORDER BY RANDOM() LIMIT 1`
  const nextTitanId   = nextTitanRows[0].id

  await sql`
    INSERT INTO pw_titan_events
      (titan_id, status, queue_opens_at, queue_closes_at, fight_starts_at, titan_starting_hp, triggered_by)
    VALUES
      (${nextTitanId}, 'queue',
       ${nextQueueOpenAt.toISOString()},
       ${nextFightAt.toISOString()},
       ${nextFightAt.toISOString()},
       0, 'cron')
  `
  return nextFightAt
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

  // Phase C — alliance Economic tier perk boosts drachma earned (applied last, after
  // all faction/class/township bonuses, before crediting the account). Adventures
  // grant no glory, so the glory perk has nothing to apply here.
  const advAlliancePerks = await getAlliancePerks(sql, userId)
  if (advAlliancePerks.drachma_bonus_pct > 0) {
    earnedDrachma = Math.floor(earnedDrachma * (1 + advAlliancePerks.drachma_bonus_pct))
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
            END BETWEEN ${minNum} AND 3
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

  const rewardPayload = {
    adventure_name: adv.adventure_name,
    xp:             earnedXp,
    drachma:        earnedDrachma,
    loot:           lootItem || null,
    levelsGained:   levelsGained || 0,
  }

  // Persist reward for cross-session / cross-page delivery
  await sql`
    INSERT INTO pw_pending_rewards (user_id, reward_type, source_id, reward_payload)
    VALUES (${userId}, 'adventure', ${adv.player_adventure_id}, ${JSON.stringify(rewardPayload)})
  `

  return rewardPayload
}

// ── Craftsmanship Helpers ─────────────────────────────────────────────────────

/**
 * Cycle time in seconds for a given craftsmanship level.
 * Level 1 → 86400 s (24 h). Level 100 → ~43236 s (~12 h).
 */
export function getCraftCycleSeconds(craftLevel) {
  const level = Math.max(1, Math.min(100, craftLevel))
  return 86400 - ((level - 1) * 436)
}

/**
 * Rolls craft item rarity based on level-banded probability tables.
 * Never returns 'legendary' — craftsmanship caps at 'epic'.
 */
export function rollCraftRarity(craftLevel) {
  const BANDS = [
    { max:   9, table: [100,  0,  0,  0] },
    { max:  19, table: [ 85, 15,  0,  0] },
    { max:  29, table: [ 65, 35,  0,  0] },
    { max:  39, table: [ 45, 45, 10,  0] },
    { max:  49, table: [ 30, 50, 20,  0] },
    { max:  59, table: [ 20, 55, 24,  1] },
    { max:  69, table: [ 15, 50, 32,  3] },
    { max:  79, table: [ 12, 45, 37,  6] },
    { max:  89, table: [ 10, 40, 42,  8] },
    { max: 100, table: [  8, 35, 45, 12] },
  ]
  const RARITIES = ['common', 'uncommon', 'rare', 'epic']
  const band = BANDS.find(b => craftLevel <= b.max) || BANDS[0]
  const table = band.table
  const roll = Math.random() * 100
  let cumulative = 0
  for (let i = 0; i < table.length; i++) {
    cumulative += table[i]
    if (roll <= cumulative) return RARITIES[i]
  }
  return RARITIES[0]
}

/**
 * Checks for completed (elapsed) craft cycles and flips them to 'ready'.
 * Called at the top of every authenticated game.js handler.
 * Returns { cycles: [...] } if any cycles flipped, null otherwise.
 */
export async function checkAndCompleteCrafts(sql, userId) {
  const expired = await sql`
    SELECT id, craft_level FROM pw_craftsmanship_cycles
    WHERE user_id = ${userId} AND status = 'active' AND completes_at <= NOW()
  `
  if (expired.length === 0) return null

  const flipped = []
  for (const row of expired) {
    await sql`UPDATE pw_craftsmanship_cycles SET status = 'ready' WHERE id = ${row.id}`
    flipped.push({ id: row.id, craft_level: row.craft_level })
  }
  return { cycles: flipped }
}

/**
 * Inserts a temple_income pending reward when a player returns after >=30 min
 * with >=100 drachma earned from temples.  Only fires once per gap — skips if
 * an unacknowledged temple_income reward already exists for this user.
 * Must be called from the top of the innerHandler wrapper (before any action).
 */
export async function checkAndInsertTempleIncomeReward(sql, userId) {
  const rows = await sql`
    SELECT ps.last_updated, u.class, u.faction
    FROM pw_player_stats ps
    JOIN pw_users u ON u.id = ps.user_id
    WHERE ps.user_id = ${userId}
  `
  if (!rows.length) return

  const ps = rows[0]
  const hoursElapsed = Math.max(0, (Date.now() - new Date(ps.last_updated).getTime()) / 3600000)
  if (hoursElapsed < 0.5) return

  // Fetch temples to compute prospective offline income
  const temples = await sql`
    SELECT pt.upgrade_level, t.income_per_hour
    FROM pw_player_temples pt
    JOIN pw_temples t ON t.type = pt.temple_type
    WHERE pt.user_id = ${userId}
  `
  if (!temples.length) return

  let templeIncome = 0
  for (const t of temples) {
    templeIncome += t.income_per_hour * (1 + 0.234 * Math.pow(t.upgrade_level, 1.03)) * hoursElapsed
  }

  let mult = 1.0
  if (ps.class === 'broker')    mult += 0.20
  if (ps.faction === 'annunaki') mult += 0.05
  const earned = Math.floor(templeIncome * mult)
  if (earned < 100) return

  const existing = await sql`
    SELECT 1 FROM pw_pending_rewards
    WHERE user_id = ${userId}
      AND reward_type = 'temple_income'
      AND acknowledged_at IS NULL
    LIMIT 1
  `
  if (existing.length > 0) return

  await sql`
    INSERT INTO pw_pending_rewards (user_id, reward_type, reward_payload)
    VALUES (
      ${userId},
      'temple_income',
      ${JSON.stringify({ drachma: earned, hours_away: hoursElapsed.toFixed(1) })}
    )
  `
}

/**
 * Rolls an item rarity based on Titan difficulty and contribution rank.
 * Returns one of: 'common', 'uncommon', 'rare', 'epic', 'legendary'
 *
 * Rank-1 bump always promotes +1 tier. Ranks 2-3 promote 50% of the time.
 * Each difficulty has a hard ceiling so rank bumps can never escape the tier cap.
 */
export function rollTitanLootRarity(titanDifficulty, contributionRank) {
  const TABLES = {
    medium:  [55, 32, 12,  1,  0],
    hard:    [35, 38, 22,  5,  0],
    extreme: [12, 35, 32, 17,  4],
  }
  // Per-difficulty rarity ceiling — even with rank bump, drops can't exceed this index
  const CEILINGS = {
    medium:  3,  // epic
    hard:    3,  // epic
    extreme: 4,  // legendary
  }
  const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const table = TABLES[titanDifficulty] || TABLES.medium
  const ceiling = CEILINGS[titanDifficulty] ?? 3

  let bumpRoll = 0
  if (contributionRank === 1) bumpRoll = 1
  else if (contributionRank === 2 || contributionRank === 3) {
    bumpRoll = Math.random() < 0.5 ? 1 : 0
  }

  const roll = Math.random() * 100
  let cumulative = 0
  let rolledIdx = 0
  for (let i = 0; i < table.length; i++) {
    cumulative += table[i]
    if (roll <= cumulative) {
      rolledIdx = i
      break
    }
  }

  // Clamp to per-difficulty ceiling
  const finalIdx = Math.min(rolledIdx + bumpRoll, ceiling)
  return RARITIES[finalIdx]
}

/**
 * Check if user has hit the chat rate limit.
 * Returns null if under limit, or { error, message, retry_in_seconds } if over.
 * Limit: 5 messages per 30 seconds.
 */
export async function checkChatRateLimit(sql, userId) {
  const recentRows = await sql`
    SELECT COUNT(*)::int AS recent_count
    FROM pw_chat_messages
    WHERE sender_id = ${userId}
      AND created_at > NOW() - INTERVAL '30 seconds'
      AND deleted_at IS NULL
  `
  const count = recentRows[0]?.recent_count || 0
  if (count >= 5) {
    return {
      error: 'rate_limited',
      message: 'You are sending messages too quickly. Please wait a moment.',
      retry_in_seconds: 30,
    }
  }
  return null
}

// ── Alliance helpers (Phase A) ──────────────────────────────────────────────────

/**
 * Maps a raw power score to a tier 0-5 using fixed log-scale thresholds.
 * Used for both military and economic power. Power calc itself lands in Phase C.
 */
export function computePowerTier(score) {
  if (score >= 10_000_000) return 5
  if (score >= 1_000_000) return 4
  if (score >= 100_000) return 3
  if (score >= 10_000) return 2
  if (score >= 1_000) return 1
  return 0
}

/** Overall tier is the rounded average of the military and economic tiers. */
export function computeOverallTier(military, economic) {
  return Math.round((military + economic) / 2)
}

/**
 * Returns the caller's pw_alliance_members row, or null if not in an alliance.
 */
export async function getUserAllianceMembership(sql, userId) {
  const rows = await sql`
    SELECT * FROM pw_alliance_members WHERE user_id = ${userId}
  `
  return rows[0] || null
}

/**
 * Thrown by requireAllianceRank. Handlers catch `err.isAllianceError` and translate
 * to res.status(err.status).json({ error: err.code }) before the generic 500 path.
 */
export class AllianceError extends Error {
  constructor(status, code, message) {
    super(message || code)
    this.isAllianceError = true
    this.status = status
    this.code = code
  }
}

/**
 * Middleware-style guard. Throws AllianceError if the user isn't in an alliance or
 * lacks one of the allowed ranks. Returns { member, alliance_id } on success.
 */
export async function requireAllianceRank(sql, userId, allowedRanks) {
  const member = await getUserAllianceMembership(sql, userId)
  if (!member) {
    throw new AllianceError(400, 'not_in_alliance', 'You are not in an alliance.')
  }
  if (!allowedRanks.includes(member.rank)) {
    throw new AllianceError(403, 'insufficient_rank', 'Your rank does not permit this action.')
  }
  return { member, alliance_id: member.alliance_id }
}

// ── Alliance Power Calculation (Phase C) ─────────────────────────────────────────

// Item donation power = RARITY_VALUE[rarity] * level_required.
const RARITY_VALUE = { common: 1, uncommon: 5, rare: 25, epic: 100, legendary: 500 }
export { RARITY_VALUE }

// Township upgrade_type buckets feeding each power track.
// NOTE: the live column is pw_player_townships.upgrade_type (not profession_type).
// 'craftsmanship' is a separate system with no township row — it matches nothing
// here, kept only for forward-compatibility / parity with the locked formula.
export const MILITARY_TOWNSHIPS = ['warfare', 'fortification', 'stewardship', 'ritual']
export const ECONOMIC_TOWNSHIPS = ['commerce', 'divination', 'exploration', 'craftsmanship']

/**
 * Computes the six raw components feeding an alliance's military/economic power.
 * Single source of truth shared by recalculateAlliancePower (to derive tiers) and
 * handleAllianceInfo (to surface power_breakdown on the Alliance page).
 *
 * Neon returns SUM() as strings — every aggregate is Number()-coerced so the
 * downstream additions are arithmetic, not string concatenation.
 */
export async function computeAlliancePowerBreakdown(sql, allianceId) {
  const memberRows = await sql`
    SELECT user_id FROM pw_alliance_members WHERE alliance_id = ${allianceId}
  `
  const members = memberRows.map(r => r.user_id)

  if (members.length === 0) {
    // No members → currency/item donations still count toward power, members don't.
    const itemRows0 = await sql`
      SELECT COALESCE(SUM(power_value), 0) AS total
      FROM pw_alliance_treasury_log
      WHERE alliance_id = ${allianceId} AND power_track = 'military'
    `
    const currencyRows0 = await sql`
      SELECT COALESCE(SUM(power_value), 0) AS total
      FROM pw_alliance_treasury_log
      WHERE alliance_id = ${allianceId} AND power_track = 'economic'
    `
    return {
      member_combat_sum: 0,
      member_temple_income: 0,
      member_military_townships: 0,
      member_economic_townships: 0,
      item_donations_value: Number(itemRows0[0].total) || 0,
      drachma_glory_value: Number(currencyRows0[0].total) || 0,
    }
  }

  const combatRows = await sql`
    SELECT COALESCE(SUM(attack + defense + agility + energy_max + health_max), 0) AS total
    FROM pw_player_stats
    WHERE user_id = ANY(${members}::uuid[])
  `
  const member_combat_sum = Number(combatRows[0].total) || 0

  const templeRows = await sql`
    SELECT COALESCE(SUM(t.income_per_hour * (1 + 0.234 * POWER(pt.upgrade_level::float, 1.03))), 0) AS total
    FROM pw_player_temples pt
    JOIN pw_temples t ON t.type = pt.temple_type
    WHERE pt.user_id = ANY(${members}::uuid[])
  `
  const member_temple_income = Number(templeRows[0].total) || 0

  const milTownRows = await sql`
    SELECT COALESCE(SUM(level), 0) AS total
    FROM pw_player_townships
    WHERE user_id = ANY(${members}::uuid[]) AND upgrade_type = ANY(${MILITARY_TOWNSHIPS})
  `
  const member_military_townships = Number(milTownRows[0].total) || 0

  const ecoTownRows = await sql`
    SELECT COALESCE(SUM(level), 0) AS total
    FROM pw_player_townships
    WHERE user_id = ANY(${members}::uuid[]) AND upgrade_type = ANY(${ECONOMIC_TOWNSHIPS})
  `
  const member_economic_townships = Number(ecoTownRows[0].total) || 0

  const itemRows = await sql`
    SELECT COALESCE(SUM(power_value), 0) AS total
    FROM pw_alliance_treasury_log
    WHERE alliance_id = ${allianceId} AND power_track = 'military'
  `
  const item_donations_value = Number(itemRows[0].total) || 0

  const currencyRows = await sql`
    SELECT COALESCE(SUM(power_value), 0) AS total
    FROM pw_alliance_treasury_log
    WHERE alliance_id = ${allianceId} AND power_track = 'economic'
  `
  const drachma_glory_value = Number(currencyRows[0].total) || 0

  return {
    member_combat_sum,
    member_temple_income,
    member_military_townships,
    member_economic_townships,
    item_donations_value,
    drachma_glory_value,
  }
}

/**
 * Recomputes and persists an alliance's cached power scores + tiers.
 * Event-driven — called after every donation and every membership change.
 * Returns the new { military_power, economic_power, military_tier, economic_tier, overall_tier }.
 */
export async function recalculateAlliancePower(sql, allianceId) {
  const b = await computeAlliancePowerBreakdown(sql, allianceId)

  const military_power = b.member_combat_sum + b.member_military_townships + b.item_donations_value
  const economic_power = Math.round(b.member_temple_income) + b.member_economic_townships + b.drachma_glory_value

  const military_tier = computePowerTier(military_power)
  const economic_tier = computePowerTier(economic_power)
  const overall_tier  = computeOverallTier(military_tier, economic_tier)

  await sql`
    UPDATE pw_alliances SET
      military_power = ${military_power},
      economic_power = ${economic_power},
      military_tier  = ${military_tier},
      economic_tier  = ${economic_tier},
      overall_tier   = ${overall_tier}
    WHERE id = ${allianceId}
  `

  return { military_power, economic_power, military_tier, economic_tier, overall_tier }
}

/**
 * Returns the combat/economy perk percentages a player inherits from their alliance.
 * Reads the cached tiers off pw_alliances (single cheap SELECT). Not in an alliance → all zeros.
 *
 * Per Military tier above 0: +3% Attack and +3% Defense (max +15% at T5).
 * Per Economic tier above 0: +3% drachma and +3% glory earned (max +15% at T5).
 * Values are fractions (0.03 per tier), ready to use as (1 + pct).
 */
export async function getAlliancePerks(sql, userId) {
  const rows = await sql`
    SELECT a.military_tier, a.economic_tier
    FROM pw_alliance_members m
    JOIN pw_alliances a ON a.id = m.alliance_id
    WHERE m.user_id = ${userId}
  `
  if (rows.length === 0) {
    return { attack_bonus_pct: 0, defense_bonus_pct: 0, drachma_bonus_pct: 0, glory_bonus_pct: 0 }
  }
  const mil = Number(rows[0].military_tier) || 0
  const eco = Number(rows[0].economic_tier) || 0
  return {
    attack_bonus_pct:  mil * 0.03,
    defense_bonus_pct: mil * 0.03,
    drachma_bonus_pct: eco * 0.03,
    glory_bonus_pct:   eco * 0.03,
  }
}

// Returns per-member contribution stats keyed by user_id.
// Uses 4 batched queries — never a per-member loop.
export async function computeMemberContributions(sql, memberUserIds) {
  if (!memberUserIds || memberUserIds.length === 0) return {}
  const map = {}
  for (const id of memberUserIds) {
    map[id] = {
      combat_power: 0, township_total: 0, temple_income_per_hour: 0,
      donation_lifetime_drachma: 0, donation_lifetime_glory: 0,
      donation_lifetime_items: 0, power_contribution: 0,
    }
  }

  const combatRows = await sql`
    SELECT user_id, attack, defense, agility, energy_max, health_max
    FROM pw_player_stats WHERE user_id = ANY(${memberUserIds}::uuid[])
  `
  for (const r of combatRows) {
    map[r.user_id].combat_power =
      Number(r.attack) + Number(r.defense) + Number(r.agility) +
      Number(r.energy_max) + Number(r.health_max)
  }

  const twRows = await sql`
    SELECT user_id, COALESCE(SUM(level), 0) AS twn
    FROM pw_player_townships WHERE user_id = ANY(${memberUserIds}::uuid[]) GROUP BY user_id
  `
  for (const r of twRows) map[r.user_id].township_total = Number(r.twn)

  const templeRows = await sql`
    SELECT pt.user_id,
           COALESCE(SUM(t.income_per_hour * (1 + 0.234 * POWER(pt.upgrade_level::float, 1.03))), 0) AS income
    FROM pw_player_temples pt
    JOIN pw_temples t ON t.type = pt.temple_type
    WHERE pt.user_id = ANY(${memberUserIds}::uuid[])
    GROUP BY pt.user_id
  `
  for (const r of templeRows) map[r.user_id].temple_income_per_hour = Number(r.income)

  const donRows = await sql`
    SELECT donor_user_id, donation_type, COALESCE(SUM(amount), 0) AS amt, COUNT(*) AS cnt
    FROM pw_alliance_treasury_log WHERE donor_user_id = ANY(${memberUserIds}::uuid[])
    GROUP BY donor_user_id, donation_type
  `
  for (const r of donRows) {
    const entry = map[r.donor_user_id]
    if (!entry) continue
    if (r.donation_type === 'drachma')      entry.donation_lifetime_drachma = Number(r.amt)
    else if (r.donation_type === 'glory')   entry.donation_lifetime_glory   = Number(r.amt)
    else if (r.donation_type === 'item')    entry.donation_lifetime_items   = Number(r.cnt)
  }

  for (const id of memberUserIds) {
    const e = map[id]
    e.power_contribution = e.combat_power + e.township_total
  }

  return map
}

# Alliance Dungeons — Phase D3 Recon (Combat Sim Integration)

**Status:** RECON ONLY. No code, schema, or migrations were modified.
**Date:** 2026-06-24
**Scope:** Determine exactly how to build `simulateDungeonRun` + between-round potion auto-use **without altering `simulateTitanFight`'s behavior.**

> ## HEADLINE — §2 RECOMMENDATION (read this first)
>
> **The between-ROUND potion requirement cannot be satisfied by the per-encounter wrap alone, because `simulateTitanFight`'s round loop is fully internal — one call runs the whole fight start-to-finish with no per-round hook, no `maxRounds`, no resume, and it *resets the enemy to full HP at the top of every call*.** So:
>
> - **Carry-over + BETWEEN-ENCOUNTER potions = free, zero Titan edits.** Wrap `simulateTitanFight` once per encounter; feed each encounter's `final_hp`/`energy_remaining` into the next encounter's input `stats`. Apply potions in the wrapper between calls. This is the prior recon's "WRAP, don't fork" and it stands.
> - **BETWEEN-ROUND potions inside a single boss fight = needs a decision**, because the round loop is internal. Two truly-viable paths:
>   1. **Option B — optional `onRoundComplete` callback** (RECOMMENDED *if* "keep working identically" means **behavior-preservation**). One guarded call added after the round-record push; Titan passes nothing → **bit-identical** Titan behavior, provable by diff and by the fact that `simulateTitanFight` has **exactly one caller** (`pwHelpers.js:1234`). Single combat core. Least code.
>   2. **Dedicated dungeon round-resolver** (RECOMMENDED *if* the constraint is literal "do not edit the function at all"). Zero edits to `simulateTitanFight`, at the cost of a **third combat core** — because the per-hit damage math is **NOT extracted** (it's inline in both `simulateTitanFight` and `simulateCombat`), so a resolver must reimplement it.
>
> - **Option A (call the existing fn one round at a time) is NOT viable** — it recomputes `titanStartingHp` and resets `titanHp` every call, so the enemy never dies; fixing that needs *more* invasive params than B.
> - **Option C (extract the loop into a shared helper) is rejected** — it moves Titan's loop body, the highest-risk way to "touch internals."
>
> **My recommendation: Option B**, because the user's true goal ("Titan must keep working identically") is provably met by a behavior-preserving additive hook, and it avoids a third divergent combat engine. **Confidence Titan stays bit-identical: very high** (single caller; the new code is unreachable on the Titan path). The one honest asterisk: B *does edit the function* (a ~3-line additive hook). If "do NOT modify internals" is meant literally as "do not edit the file," then the dedicated round-resolver is the answer and the duplication cost is unavoidable. **This interpretation is the single decision to lock before building §2.**

---

## SECTION 1 — `simulateTitanFight` ANATOMY

### 1.1 Full source

`lib/pwHelpers.js:489–801`. Pasted verbatim (the key region; the function is 312 lines):

```js
export function simulateTitanFight(titan, participants) {
  if (!participants || participants.length === 0) {
    return { result: 'expired', titan_starting_hp: 0, titan_final_hp: 0,
      fight_duration_seconds: 0, rounds_count: 0,
      fight_log: { titan: { name: titan.name, slug: titan.slug }, rounds: [] },
      participant_results: [] }
  }

  // Step 1: Titan HP — scales with combined player power (diminishing returns on count)
  const totalPlayerPower = participants.reduce((sum, p) =>
    sum + (p.stats.attack || 0) + (p.equipBonuses.attack || 0) + (p.stats.level || 1) * 2, 0)
  const playerCountWeight = Math.pow(participants.length, 1.2)
  const titanHpBase = Math.floor(
    (totalPlayerPower * 8 * Number(titan.base_hp_multiplier) * playerCountWeight) / participants.length)
  const titanStartingHp = Math.max(1000, titanHpBase)
  let titanHp = titanStartingHp                                    // ← reset to full EVERY call

  const diffMult = titan.difficulty === 'extreme' ? 1.5 : titan.difficulty === 'hard' ? 1.2 : 1.0
  const fightDurationSeconds = Math.max(60, Math.min(600,
    Math.floor((90 + participants.length * 15) * diffMult)))
  const roundsCount = Math.max(4, Math.min(40, Math.floor(fightDurationSeconds / 15)))

  // Step 4: Per-player tracking state (five parallel maps keyed by user_id)
  const damageByPlayer = {}, hpLostByPlayer = {}, playerHp = {}, playerEnergy = {}, energyDrainedByPlayer = {}
  const maxHpByPlayer = {}   // entry HP — lifesteal ceiling
  participants.forEach(p => {
    damageByPlayer[p.user_id] = 0
    hpLostByPlayer[p.user_id] = 0
    playerHp[p.user_id]  = Math.max(1, p.stats.health || 100)      // ← ENTRY HP from stats
    maxHpByPlayer[p.user_id] = playerHp[p.user_id]
    playerEnergy[p.user_id] = Math.max(0, p.stats.energy || 0)     // ← ENTRY energy from stats
    energyDrainedByPlayer[p.user_id] = 0
  })

  const rounds = []
  const abilityType = titan.ability_type
  const abilityValue = Number(titan.ability_value) || 0
  const divineStormActive = abilityType === 'divine_storm'
  const MAX_ROUNDS = 100 * participants.length
  let winner = null, safetyCapReached = false, ragnarokFired = false, r = 0

  while (r < MAX_ROUNDS) {
    r++
    const attacks = []
    // [Enlil divine_storm pre-attack energy drain — 561–568]
    for (const p of participants) {                                // per-living-player attack pass
      if (playerHp[p.user_id] <= 1) continue                       // ← DROP-OUT floor
      const isFatigued = playerEnergy[p.user_id] === 0
      // [time_dilation skip, fatigue 30% miss, titan dodge, titan block — 577–609]
      // damage = base attack + equip + rand; faction/class mult; titan def mitigation; ability mods; crit×2
      damage = Math.max(1, damage)
      titanHp = Math.max(0, titanHp - damage)
      damageByPlayer[p.user_id] += damage
      // ── lifesteal (650–656) ──
      const pLifesteal = p.equipBonuses.lifesteal || 0
      if (pLifesteal > 0) {
        const heal = Math.floor(damage * pLifesteal / 100)
        playerHp[p.user_id] = Math.min(maxHpByPlayer[p.user_id], playerHp[p.user_id] + heal)  // ← clamps to ENTRY HP
      }
      // ── energy_on_hit (657–667) ── suppressed while divineStormActive
      const pEnergyOnHit = p.equipBonuses.energy_on_hit || 0
      if (pEnergyOnHit > 0 && !divineStormActive) {
        const hitQuality = Math.min(1, damage / Math.max(1, p.stats.attack || 1))
        const restored = Math.floor((p.stats.energy_max || 0) * (pEnergyOnHit / 100) * hitQuality)
        if (restored > 0) playerEnergy[p.user_id] = Math.min(p.stats.energy_max || 0, playerEnergy[p.user_id] + restored)
      }
      attacks.push({ user_id, username, damage_dealt, attack_type, is_crit, is_blocked, is_dodged, is_fatigued })
      if (titanHp <= 0) break
    }

    // Titan counter-attack — random living target, def mitigation, or scripted ragnarok_flame AoE [683–716]
    // Nergal death_aura — flat AoE to all living [718–726]

    rounds.push({ round: r, attacks, titan_attack: titanAttack, titan_hp_after: titanHp,
      player_hp_after: { ...playerHp }, player_energy_after: { ...playerEnergy } })   // ← snapshot per round

    if (titanHp <= 0) { winner = 'players'; break }
    if (participants.every(p => playerHp[p.user_id] <= 1)) { winner = 'titan'; break }
  }

  if (!winner) { safetyCapReached = true; winner = titanHp < titanStartingHp / 2 ? 'players' : 'titan' }

  const finalHpByPlayer = {}
  for (const p of participants) finalHpByPlayer[p.user_id] = playerHp[p.user_id]
  const result = winner === 'players' ? 'victory' : 'defeat'
  // ranked by damage → contribution_rank (top 3) → reward_tier
  const participantResults = participants.map(p => ({
    user_id: p.user_id, damage_dealt: damageByPlayer[p.user_id], hp_lost: hpLostByPlayer[p.user_id],
    final_hp: finalHpByPlayer[p.user_id], contribution_rank, reward_tier,
    energy_remaining: playerEnergy[p.user_id], energy_drained: energyDrainedByPlayer[p.user_id] }))

  return { result, winner, safety_cap_reached, titan_starting_hp, titan_final_hp: titanHp,
    fight_duration_seconds, rounds_count: rounds.length,
    fight_log: { titan: {...}, rounds }, participant_results }
}
```

### 1.2 Signature — exact inputs/outputs

**`simulateTitanFight(titan, participants)`** — pure, synchronous, no DB access.

**Per-participant fields it reads** (from the participant object built at `pwHelpers.js:1203–1225`):
- `user_id`, `username`, `level`, `faction`, `class`
- `alliance_attack_bonus_pct` (optional; defaults 0)
- `stats.attack`, `stats.defense`, `stats.agility`, `stats.health`, `stats.energy`, `stats.energy_max`, `stats.level`
- `equipBonuses.attack`, `.defense`, `.crit`, `.block`, `.dodge`, `.lifesteal`, `.energy_on_hit`
  - (`equipBonuses.agility` is selected but **not read** in the titan loop; `getRaceClassCombatBonuses(faction, class)` supplies crit/dodge/block identity bonuses.)

> **Gap for dungeons:** the titan `stats` payload does **NOT include `health_max`** (only `energy_max`). The sim never needs it because it never heals a player above entry HP. **Dungeon potions heal toward `health_max`, so the wrapper must add `stats.health_max` to each participant.** This is a wrapper-side addition; Titan is unaffected.

**Enemy fields it reads** (from a `pw_titans` row): `name`, `slug`, `base_hp_multiplier`, `base_attack`, `base_defense`, `difficulty`, `block_chance`, `dodge_chance`, `ability_name`, `ability_type`, `ability_value`. All numeric reads use `Number(... || 0)`, so missing columns degrade gracefully to 0.

**Return shape:**
```
{ result: 'victory'|'defeat'|'expired', winner, safety_cap_reached,
  titan_starting_hp, titan_final_hp, fight_duration_seconds, rounds_count,
  fight_log: { titan: {...}, rounds: [ { round, attacks[], titan_attack,
              titan_hp_after, player_hp_after{uid}, player_energy_after{uid} } ] },
  participant_results: [ { user_id, damage_dealt, hp_lost, final_hp,
              contribution_rank, reward_tier, energy_remaining, energy_drained } ] }
```

### 1.3 Round loop — fully INTERNAL

The loop (`while (r < MAX_ROUNDS)`, lines 556–740) runs the **entire fight in one call**. There is **no** way to invoke it for a single round, resume from a state, or stop early from outside. `MAX_ROUNDS = 100 * participants.length`, dynamic — it ends when the titan dies, all players drop out, or the cap is hit. **This is the central architectural fact driving §2.**

### 1.4 Entry state — YES (via `stats`), but enemy HP is NOT threadable

- **Player entry HP/energy: supported.** Lines 534/536 seed `playerHp`/`playerEnergy` from `p.stats.health`/`p.stats.energy`. Dungeon carry-over between encounters = feed prior `final_hp`/`energy_remaining` into the next encounter's `stats.health`/`stats.energy`. **Free.**
- **Enemy entry HP: NOT supported.** Line 510–511 recomputes `titanStartingHp` from player power and sets `titanHp = titanStartingHp` at the top of *every* call. There is no enemy-HP input param. **This is exactly why per-round invocation (Option A) fails** — each call resets the enemy to full.

### 1.5 lifesteal / energy_on_hit + per-round energy — confirmed inside the loop

The lifesteal block (650–656) and energy_on_hit block (657–667) are **inside the per-living-player attack pass, inside the round loop**. Per-round energy is tracked in `playerEnergy[uid]` (drained by abilities, gated by fatigue, restored by `energy_on_hit`, snapshotted each round). **Any mechanism that drives this fight round-by-round inherits both correctly** — they live on the hot path every round reuses.

> **Subtle interaction (matters for potion injection):** lifesteal caps at `maxHpByPlayer[uid]` = **entry HP** (line 655, `Math.min`). If a potion heals a player *above* entry HP mid-fight, the **next** lifesteal hit's `Math.min(entryHP, ...)` would **clamp the HP back down**, erasing the potion. Any between-round potion logic must therefore **also raise `maxHpByPlayer[uid]`** (up to `health_max`) when it heals. See §2/§6.

### 1.6 Mutation — returns fresh objects, does NOT mutate inputs

`simulateTitanFight` never writes to `participants[i]` or `participants[i].stats`. It reads them and builds fresh local maps (`playerHp`, `damageByPlayer`, …) and returns fresh objects. **Threading state between encounters is safe**: build a *new* participant array each encounter from the prior result; no aliasing hazards.

---

## SECTION 2 — THE BETWEEN-ROUND POTION PROBLEM

The locked design needs potion checks **(a) between encounters** and **(b) between rounds within a boss fight**. (a) is free in the wrapper. (b) is the hard part because the round loop is internal (§1.3).

### Option A — single-round invocation — ❌ NOT VIABLE
Calling `simulateTitanFight` once per round would require it to accept an entry state **and** run exactly one round. The current signature accepts player entry HP/energy via `stats` — **but not enemy HP** (§1.4) and **not a round cap**. Worse, every call recomputes `titanStartingHp`, resets `titanHp` to full, and resets cross-round ability flags (`ragnarokFired`). To make A work you'd add `maxRounds` **and** an enemy-HP entry param **and** thread `titan_final_hp` back in **and** thread ability state — i.e. *more* invasive than B, and it changes the function's contract. **Not backward-compatible without substantial new params. Reject.**

### Option B — optional `onRoundComplete` callback — ✅ RECOMMENDED (behavior-preserving)
Add one optional param and one guarded call immediately after the round-record `rounds.push(...)` (line 735), before the end-condition check:

```js
export function simulateTitanFight(titan, participants, onRoundComplete) {   // new optional param
  ...
  rounds.push({ round: r, ... })
  if (onRoundComplete) onRoundComplete({ playerHp, playerEnergy, maxHpByPlayer, round: r, participants })
  if (titanHp <= 0) { winner = 'players'; break }
  ...
}
```

- **Titan path bit-identical:** Titan's single caller (`pwHelpers.js:1234`) passes no third arg → `onRoundComplete` is `undefined` → the guard is false → **zero behavior change**, provable by diff. (`simulateTitanFight` has **exactly one caller** in the entire repo — confirmed by grep — so the blast radius is a single line.)
- **Dungeon path:** the wrapper passes a closure that, after each round, for each living player (`playerHp[uid] > 1`): if `HP/health_max < 0.60` and a health potion remains and daily allowance remains → apply restore %, **raise `maxHpByPlayer[uid]`** to avoid the lifesteal clamp (§1.5), decrement the stack + daily counter, and log a `potion_used` event; same for energy `< 0.30`. The callback mutates the live `playerHp`/`playerEnergy`/`maxHpByPlayer` objects in place, so the **next** round sees the heal. The combat math is never duplicated.
- **Is the loop structured for this?** Yes — `playerHp`/`playerEnergy`/`maxHpByPlayer` are plain mutable objects read fresh at the top of each round. A callback that mutates them between rounds injects heals cleanly with no change to combat logic.
- **Less invasive than A?** Far less — one optional param vs. a re-architected enemy-HP/round-cap contract.

**Honest caveat:** B *does edit the function* (a ~3-line additive hook). It is **behavior-preserving, not zero-edit.** If the constraint forbids editing the file at all, fall to the resolver below.

### Option C — extract the round body into a shared helper — ❌ REJECT
Cleanest separation in theory, but it physically relocates Titan's loop body — the **highest-risk** way to "touch internals," and any subtle reordering would change Titan output. Contradicts the constraint most directly. Reject.

### Fallback — dedicated dungeon round-resolver (zero Titan edits)
If "do NOT modify internals" is literal: write a **new** `resolveDungeonEncounter(enemy, party, potionCtx)` that runs the fight round-by-round with potion checks between rounds, **reusing the helpers that ARE extracted** — `getRaceClassCombatBonuses`, `clampGearStats`, `fetchEquipBonusesBatch` — but **reimplementing the per-round attack/counter/lifesteal/energy/fatigue loop.**

> **Critical premise check the prompt raised:** the per-hit damage helpers are **NOT extracted.** The damage math (`base + equip + rand`, `defMit = def/(def+50)*0.5`, crit×2, lifesteal, energy_on_hit, fatigue) is written **inline in both `simulateTitanFight` (571–726) and `simulateCombat` (170+)** — there is no shared `applyHit()` primitive to call. So the resolver would be a **third copy** of the combat core, the exact duplication the codebase already warns about (`pwHelpers.js:105` flags the 2-way equip-aggregation drift). That's the real cost of the literal-constraint path.

**Decision criterion to lock:** *Does "keep working identically" mean Titan's output is unchanged (→ Option B), or that the function file is untouched (→ dedicated resolver)?* I recommend **B** — it meets the stated goal ("Titan must keep working identically") provably while keeping one combat core. **Confidence B is non-invasive to Titan behavior: very high.**

---

## SECTION 3 — SHARED PRIMITIVES

### 3.1 Per-hit damage calc — INLINE, not a shared function
There is **no** extracted per-hit primitive. The damage/crit/block/dodge/lifesteal/energy_on_hit math is inline in `simulateTitanFight`'s loop (571–667) and independently re-implemented in `simulateCombat` (PvP, 170+). **A dungeon resolver cannot "reuse the per-hit helper" — it doesn't exist.** This is the decisive fact making Option B (one shared loop, hooked) materially cheaper than the dedicated resolver (third copy).

What **is** shared/extracted and reusable by dungeons with no Titan edits:
- `getRaceClassCombatBonuses(faction, class)` (`pwHelpers.js:139`) — crit/dodge/block/agility identity bonuses.
- `clampGearStats(rawLifesteal, rawEnergyOnHit)` (`:94`) — the 20-pt cap, shared by both equip paths.

### 3.2 `fetchEquipBonusesBatch` — dungeons reuse it directly
`pwHelpers.js:1078`. Batch-aggregates equipped-gear bonuses for an array of user IDs (`attack/defense/agility/crit/block/dodge` + clamped `lifesteal/energy_on_hit`), returns a `{ [user_id]: bonuses }` map, zero-fills users with no gear. **Dungeon participants get equip bonuses via the identical call** — pass the party's user IDs. (Keep it in sync with the single-user `getEquipmentBonuses` per the standing duplication warning at `:105`.)

### 3.3 Potion effect dispatch — currently a hardcoded switch in `handleConsume`
The effect application lives in `handleConsume` (`game.js:~691–760`), driven by `item.consumable_effect`:

```js
switch (item.consumable_effect) {            // game.js:691 — only decides which daily counter to bump
  case 'restore_energy_pct': incrementEnergyUse = true; break
  case 'restore_health_pct': case 'restore_health': incrementHealthUse = true; break
  case 'restore_full': incrementEnergyUse = incrementHealthUse = true; break
}
// then an if/else chain (716–760) applies the effect:
//   restore_health_pct → health += floor(health_max * value/100)
//   restore_energy_pct → energy += floor(energy_max * value/100)
//   restore_health     → flat (value>=9000 ⇒ full)
//   restore_full       → health=health_max, energy=energy_max
//   realloc_stats      → stat reset (DB writes; not a combat potion)
```

**This dispatch is NOT reusable as-is** for the sim: it's an HTTP handler that reads its own DB rows, enforces "already full" rejections, and writes `pw_player_stats` directly. The sim operates on in-memory `playerHp`/`playerEnergy` maps with no DB.

**Recommendation for the "future Revive without a rewrite" constraint:** extract a tiny **pure** helper that the sim and (optionally) `handleConsume` both call —
```js
applyConsumableEffect(effect, value, { hp, energy, healthMax, energyMax }) → { hp, energy, applied }
```
data-driven off `consumable_effect`. The sim's potion callback dispatches through it; adding `'revive'` later is a new `case` in **one** pure function, no sim rewrite. This is the data-driven dispatch the constraint asks for. (Building it is D3 work, but flag the shape now so the callback in §2 is written against it from day one rather than hardcoding `restore_health_pct`/`restore_energy_pct`.)

> Note: the daily-limit columns (`health_potion_uses_today`, `energy_potion_uses_today`, cap 10/day, reset via `resetDailyCountersIfNeeded`) live on `pw_player_stats`. Auto-used dungeon potions must count against these — pass each player's remaining allowance into the sim and stop auto-drinking at the cap (§6 of the D1/D2 recon).

---

## SECTION 4 — ENEMY MODELING

### 4.1 How Titan builds its boss enemy
The enemy is a single `pw_titans` row (`SELECT * FROM pw_titans WHERE id = event.titan_id`, `pwHelpers.js:1227`) passed straight in as `titan`. HP is derived dynamically inside the sim from `base_hp_multiplier × player power × count^1.2` (510). One row = one enemy.

### 4.2 `pw_dungeon_encounters` vs the titan vocabulary — mostly aligned, two gaps
From `db/migrations/dungeons-d1.sql:51–71`, each encounter row has:
`id, dungeon_id, encounter_index, encounter_type ('trash'|'boss'|'final_boss'), name, enemy_count, base_hp_multiplier, base_attack, base_defense, ability_name, ability_description, ability_type, ability_value, drachma_min, drachma_max, common_gear_chance`.

Building a sim-enemy object from an encounter row is a near-direct field map (`base_hp_multiplier`/`base_attack`/`base_defense`/`ability_type`/`ability_value` all line up with what the sim reads). **Gaps:**
1. **No `block_chance` / `dodge_chance` columns.** The sim reads `Number(titan.block_chance || 0)` / `dodge_chance` — so a dungeon enemy simply **never blocks/dodges** (degrades to 0). Acceptable for D3; if bosses should block/dodge, add the two columns in a small `dungeons-d3.sql` ALTER. **Not blocking.**
2. **No flat `base_hp`.** Encounters carry `base_hp_multiplier`, so dungeon enemy HP would ride the **same dynamic player-power formula** as titans. That works, but means trash/boss HP scales with party power rather than being flat-authored per bracket. The prior recon (§1.5) preferred flat HP for tuned encounters; D1 chose the multiplier. **Decision to confirm:** keep the dynamic formula (zero new work, reuse the sim's Step 1) **or** add a `base_hp` column and branch HP derivation in the wrapper. Recommend **keep the multiplier for D3** (simplest, reuses the sim untouched); revisit in D7 tuning if encounters feel swingy.

### 4.3 `enemy_count > 1` (trash waves) — sequential sub-fights compose cleanly
The sim is strictly **N players vs 1 enemy**. For `enemy_count > 1`, run **sequential sub-fights** within the encounter: party vs enemy 1, survivors (carried HP/energy) vs enemy 2, … This composes with **both** §2 options:
- With **Option B**: each sub-fight is one `simulateTitanFight(enemyN, party, onRoundComplete)` call; the callback handles between-round potions inside each sub-fight; the wrapper handles potions between sub-fights and between encounters. Carry-over is the same `final_hp`/`energy_remaining` → next `stats` thread.
- With the **dedicated resolver**: same loop, just the resolver instead of the titan fn.

(The cheaper alternative — model a wave as one pooled enemy with summed HP — loses per-mob flavor; recommend true sequential sub-fights since carry-over makes them nearly free.)

---

## SECTION 5 — RESOLUTION WIRING

### 5.1 Current `processExpiredDungeonRuns` (D2 skeleton)
`game.js:5498–5522`. D2 only flips `starting → active`:

```js
const DUNGEON_LOCK_KEY = 847392
async function processExpiredDungeonRuns(sql) {
  const checkRows = await sql`SELECT COUNT(*) AS work_count FROM pw_dungeon_runs
    WHERE status = 'starting' AND starts_at <= NOW()`
  if (Number(checkRows[0]?.work_count || 0) === 0) return false        // cheap idle bail
  const lockRows = await sql`SELECT pg_try_advisory_lock(${DUNGEON_LOCK_KEY}) AS acquired`
  if (!lockRows[0]?.acquired) return false
  try {
    await sql`UPDATE pw_dungeon_runs SET status = 'active'
      WHERE status = 'starting' AND starts_at <= NOW()`                // D2: just unlock the gate
  } finally { try { await sql`SELECT pg_advisory_unlock(${DUNGEON_LOCK_KEY})` } catch {} }
  return true
}
```
Called inline at `game.js:6209` (next to `processExpiredTitanEvents`), own lock `847392`. Statuses are constrained to `('forming','starting','active','resolved')` (D1, `pw_dungeon_runs.status` CHECK).

### 5.2 Where D3 combat slots in
Replace the D2 "just flip to active" body with the resolution mirror of `processExpiredTitanEvents` (`pwHelpers.js:1146–1271`):
1. Select runs where `status='starting' AND starts_at <= NOW()` (and/or `status='active' AND ends_at <= NOW()` if you split start/resolve like Titan).
2. For each run: load `pw_dungeon_party` members (`status='committed'`), batch `fetchEquipBonusesBatch`, credit offline regen via `regenPlayer` (as Titan does at 1188), build participants with **`stats.health_max` added** (§1.2) + committed potion loadout + remaining daily allowances.
3. Load the dungeon's encounters (ordered) + per-encounter enemies.
4. Run `simulateDungeonRun(...)` → loop encounters while `result==='victory'`, carrying HP/energy, applying potions between encounters and (via §2's mechanism) between rounds; stop at first wipe and record `wiped_at_encounter`.
5. Persist: `pw_dungeon_runs.status='resolved'`, `result`, `wiped_at_encounter`, `ends_at`, `fight_log` (the composed `dungeon_log`); per-member `pw_dungeon_party.damage_dealt`, `status='fought'`, and final HP/energy back to `pw_player_stats` (mirror 1263–1269, including `health_regen_base=NOW()` so regen doesn't erase damage).

### 5.3 Recommend a `rewards_distributed` separation flag — YES, tiny ALTER
D1 gives `pw_dungeon_party.rewards_claimed` (player-acknowledged a reward) but **no run-level "loot has been rolled & granted" flag.** To cleanly separate **D3 = combat resolved** from **D4 = loot distributed**, add a run-level boolean so D4 can find resolved-but-not-yet-distributed runs idempotently and never double-grant if resolution and distribution are split across requests:

```sql
-- dungeons-d3.sql (flagged, do NOT apply during recon)
ALTER TABLE pw_dungeon_runs ADD COLUMN IF NOT EXISTS rewards_distributed BOOLEAN NOT NULL DEFAULT FALSE;
```
(If D3 resolves combat **and** rolls loot in the same pass, this is optional — but the flag is cheap insurance and matches the inline-lazy model where the same run row may be revisited. Recommend adding it.)

---

## SECTION 6 — RISKS / FLAGS

1. **`fight_log` size / compute — the real scaling risk.** Worst case 10-man raid × (say) 5 encounters × up to `100 × party_size` rounds × full `player_hp_after`/`player_energy_after` snapshots **plus** per-round potion-check passes. Rough envelope: 10 players, ~6 encounters, an average ~40 rounds/encounter ⇒ ~240 round records, each with 10-key HP + 10-key energy maps + an attacks array ⇒ a **multi-hundred-KB JSONB** and a multi-second synchronous sim that runs **inline in whichever unlucky player's request triggers resolution** (behind lock `847392`). Titan has the same property for one encounter; dungeons multiply by encounter count. **Mitigations to decide before the 10-man:** (a) cap rounds-per-encounter tighter than `100×n`; (b) store HP **deltas** or snapshot every K rounds; (c) full detail for bosses, summarized trash; (d) optionally fast-resolve obviously-trivial trash. **Set a perf budget before D7 raid content.**

2. **Potion-injection desync hazards.** Three concrete ones:
   - **Lifesteal clamp erases potions** (§1.5): the callback **must** raise `maxHpByPlayer[uid]` when it heals, else the next lifesteal `Math.min(entryHP, …)` clamps the heal away. Easy to miss.
   - **`health_max` missing from the payload** (§1.2): without it the potion % has nothing to scale against / cap to. Wrapper must add it.
   - **Double-logging / double-count:** the callback runs **after** `rounds.push`, so a `potion_used` event must attach to the round record (mutate the just-pushed entry or log into the next round's preamble) consistently — pick one and document it, or the recap UI will mis-time heals. No damage double-count risk as long as the callback only touches HP/energy, never `damageByPlayer`/`titanHp`.

3. **Single-round invocation would lose multi-round Titan ability state** — but this is moot because (a) Option A is rejected and (b) Titan abilities (`ragnarok_flame` HP<15% trigger, `divine_storm` cumulative drain, `death_aura`) are **Titan-only**. Dungeon enemies use plain `ability_type`/`ability_value` and **do not need** Surtr/Enlil-style cross-round state. With **Option B**, the dungeon reuses the same loop but its enemies simply won't carry those ability types, so no Titan-specific state leaks in. With the dedicated resolver, you'd implement only the abilities dungeons actually use. Either way, **no Titan ability state is dragged into dungeons.**

4. **Anything forcing a Titan-internal edit despite the constraint?** Only the **between-round potion requirement itself** (§2). Everything else (carry-over, between-encounter potions, equip bonuses, enemy modeling, persistence) needs **zero** Titan edits. The between-round requirement forces a binary choice: **a behavior-preserving additive hook in `simulateTitanFight` (Option B)** or **a third combat core (dedicated resolver).** There is no path that gets true between-round potions *and* touches neither the function nor duplicates the loop — the per-hit math isn't extracted (§3.1), so it can't be shared without either hooking the existing loop or copying it. **Lock the constraint interpretation; that single decision picks the architecture.**

5. **Enemy modeling minor gaps** (§4.2): no `block_chance`/`dodge_chance` (degrade to 0, safe) and HP rides the dynamic multiplier formula rather than flat-authored values. Both are acceptable for D3; flag for D7 tuning.

---

## DELIVERABLE SUMMARY

- **§1:** `simulateTitanFight` is a pure, single-call, fully-internal-loop function with **one caller** (`pwHelpers.js:1234`). It reads player entry HP/energy from `stats` (carry-over free) but **resets enemy HP every call** (no enemy-HP entry). lifesteal/energy_on_hit/per-round energy all live on the in-loop hot path. It does **not** mutate inputs. Missing `stats.health_max` in the payload is the one wrapper-side addition dungeons need.
- **§2 — HEADLINE RECOMMENDATION: Option B (optional `onRoundComplete` callback).** Behavior-identical for Titan (provable; single caller, guarded call), single combat core, least code. **Fallback if the constraint is literal "don't edit the file":** a dedicated dungeon round-resolver — at the cost of a **third combat core**, because the per-hit math is not extracted. **Option A rejected** (resets enemy HP). **Option C rejected** (moves Titan's loop). Confidence Titan stays bit-identical under B: **very high.**
- **§3:** No shared per-hit primitive exists (inline in two places) — decisive for choosing B over the resolver. `fetchEquipBonusesBatch` + `clampGearStats` reuse directly. Extract a pure `applyConsumableEffect(effect,value,state)` so future potion types (Revive) are data-driven.
- **§4:** Encounter rows map onto the titan enemy vocabulary; two minor gaps (no block/dodge, multiplier-based HP), both safe. `enemy_count>1` → sequential sub-fights, composes with either §2 option.
- **§5:** D2 skeleton flips `starting→active`; D3 replaces that body with a Titan-style resolution that runs `simulateDungeonRun` and persists `dungeon_log` + per-member results. Recommend a tiny `rewards_distributed BOOLEAN` ALTER to cleanly fence D3 (combat) from D4 (loot).
- **§6:** Top risks: `fight_log` size/inline-compute on the 10-man; the lifesteal-clamp/`health_max` potion gotchas; and the constraint-interpretation fork that selects the §2 architecture.
```

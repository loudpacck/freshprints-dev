# Alliance Dungeons — Recon Report

**Status:** RECON ONLY. No code, schema, or migrations were modified.
**Date:** 2026-06-24
**Scope:** Map every existing system the dungeon feature touches, against the locked design.

> **TL;DR on the two questions you care about most:**
> - **§1 (sim):** **WRAP `simulateTitanFight` in a per-encounter loop — do NOT fork a dedicated sim.** It already does everything a single dungeon encounter needs (N players vs 1 enemy, per-round energy, lifesteal/energy_on_hit per hit, drop-out, fight_log). A thin `simulateDungeonRun(encounters[], party[])` orchestrator calls it once per encounter, carries HP/energy forward, and stops at the death point. The *only* real gaps are multiple simultaneous enemies per encounter and per-participant potion auto-use — both solvable as additions, not a rewrite.
> - **§8 (no-cron):** **Feasible with ZERO new crons.** Titan already proves the pattern: `processExpiredTitanEvents(sql)` runs inline at the top of every authenticated `game.js` request (line 5473) behind advisory lock 847391. A run "starts" at fill+30s (a stored timestamp) and "resolves" lazily on the next API request after its end time — identical to Titan's inline path. **But you have only 1 free Vercel function slot (11/12 used), so every dungeon action MUST fold into `game.js` as `?action=` routes, and you CANNOT add a dungeon-cron file.**

---

## SECTION 1 — Combat Sim: Extend Titan or Build Dedicated?

### 1.1 `simulateTitanFight` structure (lib/pwHelpers.js:489–801)

Full anatomy of the function:

- **Signature:** `simulateTitanFight(titan, participants)` — pure, no DB writes.
- **Enemy HP scaling (502–511):** derives `titanStartingHp` from combined player power × `base_hp_multiplier` × player-count weight (`count^1.2`), floored at 1000.
- **Per-participant tracking state (524–538):** five parallel maps keyed by `user_id`:
  - `damageByPlayer`, `hpLostByPlayer`, `playerHp`, `playerEnergy`, `energyDrainedByPlayer`
  - `maxHpByPlayer` — captures **entry HP** as the lifesteal ceiling (heal can never exceed entry HP).
- **Round loop (556–740):** `while (r < MAX_ROUNDS)` where `MAX_ROUNDS = 100 * participants.length`. Dynamic — runs until decisive, not fixed length.
  - Optional titan pre-attack effects (e.g. `divine_storm` energy drain, 561–568).
  - **Per-living-player attack pass (571–681):** skips players at `≤1 HP` (the drop-out floor). Applies fatigue (energy==0 → 30% miss), titan dodge/block, ability damage modifiers, crit, then deals damage to the titan and procs lifesteal/energy_on_hit (see §1.4).
  - **Titan counter-attack (683–716):** targets one random living player, applies defense mitigation, can be a scripted AoE ultimate (`ragnarok_flame`).
  - Optional per-round AoE (`death_aura`, 718–726).
  - Pushes a round record (728–735) with `attacks[]`, `titan_attack`, `titan_hp_after`, **`player_hp_after: {...}`** and **`player_energy_after: {...}`** snapshots.
  - End check (737–739): titan dead → players win; all players ≤1 HP → titan wins.
- **Drop-out logic:** a player at `≤1 HP` is skipped in the attack pass and is no longer a valid counter-target (`living` filter, 685), but stays in `participant_results` for reward distribution. HP is floored at 1, never 0.
- **Result shape (778–800):**
  ```
  { result, winner, safety_cap_reached,
    titan_starting_hp, titan_final_hp, fight_duration_seconds, rounds_count,
    fight_log: { titan: {...}, rounds: [ {round, attacks[], titan_attack, titan_hp_after,
                                          player_hp_after{}, player_energy_after{}} ] },
    participant_results: [ { user_id, damage_dealt, hp_lost, final_hp,
                             contribution_rank, reward_tier,
                             energy_remaining, energy_drained } ] }
  ```
- **Abilities** are data-driven off the `pw_titans` row: `ability_type` (string switch) + `ability_value` (number). Each ability is a hard-coded branch in the loop.

### 1.2 Per-round energy tracking (needed for dungeon energy_on_hit)

`playerEnergy[user_id]` is initialized from `p.stats.energy` (536), drained by titan abilities (`divine_storm`, 564–566), checked for **fatigue** (`isFatigued = playerEnergy === 0`, 574 → 30% miss + no crit), **restored by `energy_on_hit` gear** (660–667), and snapshotted every round into `player_energy_after`. Final value flows out as `energy_remaining`. **This is exactly the energy machinery dungeons need — it already exists and works.**

### 1.3 Recommendation: WRAP, don't fork

**Build `simulateDungeonRun(dungeon, encounters, party)` as a thin orchestrator that calls `simulateTitanFight` (or a lightly generalized variant) once per encounter.**

Reasoning:
- **Carry-over is trivial.** `simulateTitanFight` already takes per-participant `stats.health` and `stats.energy` as entry values and returns `final_hp` + `energy_remaining` per participant. Feed encounter N's output HP/energy into encounter N+1's input `party[].stats`. Party HP carrying between encounters is *free*.
- **Wipe-at-death-point is native.** Each encounter returns `result: 'victory'|'defeat'`. The orchestrator loops encounters while `result === 'victory'`; on the first `'defeat'` it stops, awards rewards earned up to that encounter, and grants **no further boss loot** — matching the locked design exactly.
- **lifesteal/energy_on_hit inherit automatically** (§1.4) because they live inside the per-hit path that every encounter reuses.
- **fight_log composes cleanly.** Wrap each encounter's `fight_log` in an array → `dungeon_log: { encounters: [ {encounter_index, type:'trash'|'boss', enemy/enemies, rounds[...] }, ... ] }`. The existing recap UI pattern (§2.3) renders per-round; you add an encounter dimension on top.

**The two genuine gaps** (additions, not a rewrite):

1. **Multiple enemies per encounter.** Titan = exactly one enemy. Trash waves likely want 2–4 simultaneous enemies. Options: (a) model a trash wave as a single pooled "enemy" with summed HP (cheapest, loses per-mob flavor), or (b) generalize the inner loop to iterate an `enemies[]` array with target selection. Recommend (a) for trash, (b) only if per-mob targeting is a design goal. Bosses stay single-enemy → identical to Titan.
2. **Per-participant potion auto-use** (§6.3). The sim must, mid-encounter, consume from each player's committed potion stack when HP/energy crosses a threshold. This is new sim-internal state (`potionStacks[user_id] = {health:{itemId, qty}, energy:{itemId, qty}}`) — the sim already has per-player HP/energy maps to hang it off of.

**Do NOT fork a fully independent `simulateDungeonRun` that reimplements combat** — you'd duplicate the entire ability/crit/mitigation/lifesteal/fatigue engine and immediately have two divergent combat cores to keep balanced (the codebase already fights the cost of *one* duplicated path — see §1.4 note).

### 1.4 lifesteal / energy_on_hit application point (just shipped)

Confirmed inside `simulateTitanFight`'s per-player attack pass, applied **per hit, immediately after damage is dealt to the enemy**:

- **lifesteal (650–656):** `heal = floor(damage * pLifesteal/100)`, then `playerHp = min(maxHpByPlayer, playerHp + heal)`. Self-scaling: blocked/dodged hits deal ~0 → heal ~0; crits heal most. Capped at entry HP.
- **energy_on_hit (657–667):** `restored = floor(energy_max * (pEnergyOnHit/100) * hitQuality)` where `hitQuality = min(1, damage/baseAttack)`. **Suppressed entirely while `divineStormActive`** (line 661) so gear can't negate a titan's energy-drain identity.
- Both values arrive pre-clamped to ≤20 via `clampGearStats` in the equipment-aggregation step (`fetchEquipBonusesBatch`, 1105).

**Implication for dungeons:** because the wrap reuses this exact code path, dungeon combat inherits lifesteal/energy_on_hit correctly **with zero extra work**. If any dungeon boss should suppress energy_on_hit (a Titan-style gimmick), add a boss-ability flag mirroring `divineStormActive`.

> ⚠️ **Duplication caveat:** equipment aggregation exists in **two** hand-synced copies — `getEquipmentBonuses` (single-user/PvP, 109) and `fetchEquipBonusesBatch` (batch/Titan, 1078). Dungeons will batch-fetch a party → use/extend `fetchEquipBonusesBatch`. Keep the clamp + column list in sync (the file flags this explicitly).

### 1.5 Enemy/boss stat modeling vs `pw_titans`

Current titan shape (db/migrations/titan-event.sql:7–24): `slug, name, pantheon, difficulty, ability_name/description/type/value, base_hp_multiplier, base_attack, base_defense, loot_rarity_floor`. **One row = one enemy.**

Dungeon enemies need a **different shape** because of the trash-vs-boss distinction and multi-encounter structure. Recommended modeling (schema proposed in §3.2):
- A dungeon has ordered **encounters**; each encounter has a `type` (`trash`|`boss`) and one or more **enemies**.
- Boss enemies can reuse the titan field vocabulary almost verbatim (`base_attack`, `base_defense`, `base_hp_multiplier` *or* a flat `base_hp`, `ability_type`, `ability_value`, `block_chance`, `dodge_chance`).
- Trash enemies are simpler: HP, attack, defense, maybe one ability.
- **Key difference from titans:** dungeon enemy HP should probably be a **flat authored value per difficulty**, not the titan's dynamic `power × multiplier` formula — dungeons are tuned encounters, not scaling raids. (The titan formula assumes variable party size and scales HP to it; dungeons have fixed bracket sizes — 2/5/10 — so flat tuning per bracket+difficulty is cleaner.)

---

## SECTION 2 — Titan Event Lifecycle as the Template

### 2.1 `pw_titan_events` + `pw_titan_participants` lifecycle

- **`pw_titan_events`** (titan-event.sql:44–62): `status ∈ {queue, active, resolved, expired}`, timestamps `queue_opens_at / queue_closes_at / fight_starts_at / fight_ends_at`, `fight_duration_seconds`, `titan_starting_hp / titan_final_hp`, `result`, **`fight_log JSONB`**, `triggered_by ∈ {cron, admin}`.
- **`pw_titan_participants`** (66–83): `event_id`, `user_id`, `status ∈ {queued, fought, abandoned}`, result columns (`damage_dealt, hp_lost, contribution_rank, reward_tier, reward_xp, reward_drachma, reward_potion_id, reward_loot_id, rewards_claimed`), **`UNIQUE(event_id, user_id)`**.
- **Lifecycle:**
  1. **queue** — `handleTitanJoin` (game.js:2701) inserts a `queued` participant if an open queue exists and the player hasn't joined (`UNIQUE` + explicit existing-check). No leader, no commit confirmation.
  2. **active** — resolution (`processExpiredTitanEvents`, §2.2) reads `queued` participants, credits offline regen, builds the participant payload, runs `simulateTitanFight`, writes `status='active'` + `fight_log` + `fight_ends_at = now + duration`.
  3. **resolved** — when `fight_ends_at` passes, flipped to `resolved` (the watchable window between active→resolved is the "fight is playing out" UI period).
  4. Rewards persisted to participant rows; claimed later via `handleTitanClaim`.

### 2.2 `processExpiredTitanEvents` — inline + cron resolution

(lib/pwHelpers.js:1122–1277)
- **Cheap pre-check (1124–1130):** counts events needing work; returns `false` immediately if none (so the inline call on every request is nearly free when idle).
- **Advisory lock (1132–1133):** `pg_try_advisory_lock(847391)`; bails if not acquired (prevents concurrent double-resolution).
- **Step 1 (1137–1143):** active fights past `fight_ends_at` → `resolved`.
- **Step 2 (1146–1271):** queued events past `queue_closes_at` → run sim, set `active`, persist `fight_log`, write participant results + final HP/energy back to `pw_player_stats`.
- **Does NOT schedule new events** — only the cron does (`scheduleNextTitanEvent`). It's called from **both** the cron (`titan-cron.js:29`) and **inline** at `game.js:5473`.

**How dungeons trigger resolution (no new cron):** Identical lazy pattern. A dungeon run row stores `starts_at` (= fill time + 30s) and, once started, `ends_at` (= starts_at + computed duration). A `processExpiredDungeonRuns(sql)` helper — added to the **same inline block** at `game.js:5473`, behind its **own advisory lock** (§2.4) — does: (a) start runs whose `starts_at ≤ now` and `status='committed'` (run sim, set `active`, persist log + `ends_at`); (b) flip `active` runs past `ends_at` to `resolved`. Players need not be online; the run resolves the next time *any* authenticated user hits `game.js`. Same "starts at fill+30s, resolves on next request after end time" semantics as Titan. See §8/§9 for the honest caveat about an empty server.

### 2.3 Rewards → `pw_pending_rewards` + claim + recap

- **`pw_pending_rewards`** (pending-rewards.sql): `user_id, reward_type CHECK IN ('adventure','titan'), source_id, reward_payload JSONB, acknowledged_at`. Used for cross-session/cross-page reward delivery (toast on next load).
- **Claim flow:** Titan uses **participant-row reward columns + `rewards_claimed` flag** (claimed via `handleTitanClaim`, game.js:2749), surfaced by `handleTitanStatus`'s `unclaimed_reward` query (2602–2614). Adventures use `pw_pending_rewards` directly (pwHelpers.js:1526).
- **Recap:** `handleTitanRecap` (game.js:3014) + `TitanRecapPanel` render the stored `fight_log` round-by-round (watchable or claim-later, matching the Titan "watch OR claim later" model).
- **Dungeons can reuse both:** widen `pw_pending_rewards.reward_type` CHECK to include `'dungeon'` for the toast path, **and** store per-player loot/key results on a `pw_dungeon_run_members` row with a `rewards_claimed` flag (mirrors `pw_titan_participants`). The recap renders the composed `dungeon_log` with the same per-round component, plus an encounter wrapper.

### 2.4 Advisory lock

Titan uses `pg_try_advisory_lock(847391)`. **Dungeons need their own distinct lock key** (e.g. `847392`) so dungeon resolution and titan resolution don't serialize against each other unnecessarily, and so a dungeon run can't double-resolve. Note it explicitly when building.

---

## SECTION 3 — Party / Queue System (NET-NEW)

### 3.1 Closest existing analog

There is **no general matchmaking/party system**. The two closest patterns:
- **Titan "join"** (`handleTitanJoin`, 2701) — the closest: players commit to a shared event row via an insert into a participants table with `UNIQUE(event_id, user_id)`. But Titan is a single global event with unlimited participants, no brackets, no leader, no fill-to-start — so it's a *commit* model, not a *party/queue* model.
- **Alliance membership** (`pw_alliance_members`, `UNIQUE(user_id)`) — the pattern for "a user belongs to exactly one X," enforced by a unique index. Directly relevant to the "one queue/run at a time" constraint (§3.3).

### 3.2 Proposed schema shape (tables + key columns + relationships — for review, no SQL)

1. **`pw_dungeons`** — static catalog of the 13 instances.
   - `id, slug, name, bracket (2|5|10), difficulty (easy|med|hard|raid_expert), level_required`
   - `cost_drachma` (alliance-treasury cost), `requires_key_type` (NULL for easy/med; the key slug for hard/raid)
   - `requires_alliance` (bool — true only for the 10-man raid)
   - relationships: 1→many `pw_dungeon_encounters`.

2. **`pw_dungeon_encounters`** — ordered encounters per dungeon.
   - `id, dungeon_id, encounter_index, type (trash|boss), is_final_boss (bool)`
   - relationships: 1→many `pw_dungeon_enemies`; 1→many `pw_dungeon_boss_loot` (boss encounters) and per-dungeon trash-loot config (§5).

3. **`pw_dungeon_enemies`** — enemy stat blocks per encounter (titan-field vocabulary; §1.5).
   - `id, encounter_id, name, base_hp, base_attack, base_defense, block_chance, dodge_chance, ability_type, ability_value`

4. **`pw_dungeon_runs`** — a specific run instance (the dungeon analog of `pw_titan_events`).
   - `id, dungeon_id, mode (auto|manual), status (forming|committed|active|resolved|expired|abandoned)`
   - `leader_user_id` (NULL for auto-queue), `name` (manual named groups), `alliance_id` (raid gating + treasury source)
   - `starts_at` (set = NOW()+30s when fill completes), `ends_at` (set at start), `duration_seconds`
   - `key_item_id` + `key_consumed_from_user_id` (the single rolled key holder), `result`, `dungeon_log JSONB`
   - relationships: 1→many `pw_dungeon_run_members`.

5. **`pw_dungeon_run_members`** — party membership + per-player results (the `pw_titan_participants` analog).
   - `id, run_id, user_id, slot_index, status (queued|committed|fought|left|kicked)`
   - committed potion loadout snapshot: `health_potion_id, health_potion_qty, energy_potion_id, energy_potion_qty` (committed at fill so the sim has them; §6)
   - result cols: `final_hp, damage_dealt, died_at_encounter, rewards_payload JSONB, rewards_claimed`
   - **`UNIQUE(run_id, user_id)`**.

6. **`pw_dungeon_kick_votes`** (auto-queue vote-kick state; §3.4).
   - `run_id, voter_user_id, target_user_id, created_at`, `UNIQUE(run_id, voter_user_id)` (one vote per person per run).

### 3.3 Enforcing "one queue/run at a time per player"

Use the **alliance-membership pattern**: a **partial unique index** on `pw_dungeon_run_members(user_id)` `WHERE status IN ('queued','committed','active'...)` — i.e. a user can have at most one *non-terminal* membership row. (Postgres partial unique indexes are the clean enforcement; the same approach `pw_alliance_members` uses for one-alliance-per-user, but scoped to active states.) The insert into a new queue fails if the player already holds an active membership → translate to a `already_in_queue` error.

### 3.4 Vote-kick / leader-kick — **FLAG: needs a design micro-decision**

State: `pw_dungeon_kick_votes` (auto) + `leader_user_id` (manual).
- **Manual group:** leader kicks at will → direct `DELETE`/`status='kicked'` on the target membership row, no tally.
- **Auto-queue:** your locked design says "one vote-kick per person." **Ambiguity to resolve before building:**
  - **(A) One vote = instant kick** ("any one player can eject any other once") — simplest, but grief-prone in a no-leader party.
  - **(B) One vote *each*, tallied, kick at majority** (e.g. ≥⌈(n-1)/2⌉ distinct voters against a target) — "one vote-kick per person" then means *each person gets one vote to spend per run*, and a majority carries it.
  - Recommendation: **(B)** for a fair no-leader system; the `UNIQUE(run_id, voter_user_id)` index enforces "one vote per person," and a count against `target_user_id` vs party size decides the kick. **This is yours to lock — it changes the votes table semantics and the kick handler.**

---

## SECTION 4 — Key Economy

### 4.1 Keys as `pw_items` vs dedicated table — **Recommendation: dedicated `pw_dungeon_keys`-style handling, OR a `pw_items` slot — leaning items table with a `key` slot**

Two viable models:
- **(A) `pw_items` with `slot='key'` + `pw_inventory` rows.** Pros: reuses the entire inventory/loot-grant/consume infrastructure (loot drops already `INSERT INTO pw_inventory`; §5). Keys show up in inventory for free. Cons: the `pw_items.slot` CHECK constraint is currently `('weapon','armor','artifact','mount','companion')` in base schema, widened to include `'consumable'` by later migrations — **adding `'key'` requires another CHECK-widening migration**, and you must make sure keys are excluded from shop rotations, equip logic, sell-all, and loot-rarity-roll queries (most of those already filter `slot != 'consumable'`; you'd add `AND slot NOT IN ('consumable','key')`).
- **(B) Dedicated `pw_dungeon_keys` table** (`user_id, key_type, quantity` or one row per key). Pros: clean separation, trivial "consume on entry" decrement, no pollution of item queries. Cons: new grant/consume code (small).

**Recommendation:** **(A) `pw_items` slot `'key'`** *if* you want keys to appear in the existing inventory UI and ride the existing loot-grant path; otherwise **(B)** for isolation. Given keys are consumed-on-entry, tier-specific, and stack in quantity, a lightweight **(B)** (a `pw_dungeon_keys` quantity table) is actually the *lower-risk* choice — it avoids touching every `slot`-filtering query across `game.js`. Lean **(B)** unless inventory-visibility of keys is a hard design goal.

### 4.2 "Consume on use" pattern to mirror

Two existing precedents:
- **Energy on quest entry** (`handleComplete`): deducts energy up-front before running the action — the canonical "spend a resource to enter" pattern.
- **Daily potion limits / counters** (`resetDailyCountersIfNeeded` + `energy_potion_uses_today` increment, game.js:629, 707–714): the "consume against a tracked limit" pattern.
- **Consumable deletion** (`handleConsume`): `DELETE FROM pw_inventory WHERE id = ...` after applying effect — the literal "consume an inventory item" pattern.

For keys: on dungeon entry/commit, in a single transactional CTE (mirroring the treasury-deduct CTE at game.js:5227–5247), **decrement the key holder's key quantity (or delete the key inventory row) only if quantity ≥ 1**, and reject entry otherwise.

### 4.3 Random-roll-among-party for the single key drop

Existing weighted/random distribution code to reuse:
- **`rollTitanLootRarity`** (pwHelpers.js:1659) — weighted rarity table with rank-based bumps (rank-1 always +1 tier, ranks 2–3 50%). The "single best item is contested by contribution rank" mechanic (§5) maps directly onto this.
- **Quest/adventure loot:** `pw_quest_loot.drop_weight` weighted selection, and `ORDER BY RANDOM() LIMIT 1` for uniform picks (pwHelpers.js:1469–1483).
- **For "1 key, random roll among party":** simplest is `ORDER BY RANDOM() LIMIT 1` over the party's `run_members` to pick the key recipient, then grant. If you want contribution-weighted (more damage = better key odds), build a weighted pick off `damage_dealt` like the loot path. Locked design says **random roll** → uniform `RANDOM()` pick is correct and trivial.

---

## SECTION 5 — Loot Distribution

### 5.1 Existing loot systems (brief)

- **Quest loot** — `pw_quest_loot(quest_id, item_id, drop_weight)`, weighted selection per quest.
- **Adventure loot** — `min_loot_rarity` floor + optional upgrade chance, then `ORDER BY RANDOM() LIMIT 1` within a rarity band (pwHelpers.js:1459–1489).
- **Titan loot** — `rollTitanLootRarity(difficulty, contributionRank)` (1659): per-difficulty weighted rarity table + per-difficulty ceiling + rank bumps. Then `calculateTitanRewards` gates *whether* loot drops (60% top / 25% base, 831).

### 5.2 "Best item contested, rest individual" — how to express it

Per the locked design: each boss table has many items rolled **per-player individually**, plus **exactly one "best" item** that only **one** player rolls for.

Model it with a **`is_contested` boolean flag on the boss-loot rows**:
- **Individual items** (`is_contested = false`): for each surviving party member, roll independently against that item's drop chance/weight → each player can get their own copy.
- **Contested item** (`is_contested = true`, the single best per boss): rolled **once per run**, awarded to **one** player chosen by a single roll (uniform random, or contribution-weighted by `damage_dealt` — your call; Titan precedent uses contribution rank). Only that one player rolls; everyone else cannot receive it.

**Sim/roll ordering caveat (also flagged in §9):** the contested roll must run **after** the encounter resolves and `damage_dealt` per player is known (if you make it contribution-weighted), and **after** the death-point check (dead-before-this-boss players are ineligible). Keep the contested roll as a distinct, clearly-ordered post-encounter step so it can't accidentally run per-player.

### 5.3 Per-boss loot tables — proposed schema

**`pw_dungeon_boss_loot`** (mapping bosses → items → weights + contested flag):
- `id, encounter_id` (the boss encounter), `item_id`
- `drop_weight` (or `drop_chance_pct`), `min_rarity` (optional, for rarity-banded rolls)
- **`is_contested BOOLEAN DEFAULT false`** — exactly one contested row per boss table (enforce in seed, optionally a partial unique index `WHERE is_contested`).
- For the **final boss**, the key is granted alongside (the key is a fixed reward, not a weighted loot row — handle it in the run-resolution code, not the loot table, since "final boss = best loot + key" is deterministic).

### 5.4 Trash loot — simpler

Per the design (drachma + occasional common gear), keep it **per-dungeon config**, not a full table:
- On `pw_dungeons` (or `pw_dungeon_encounters` for trash rows): `trash_drachma_min, trash_drachma_max, trash_common_gear_chance`.
- On trash-encounter clear: each surviving player rolls drachma in range + a low-chance common-gear pull (`slot != 'consumable' AND rarity='common' ORDER BY RANDOM() LIMIT 1`, mirroring the adventure loot query). No contested mechanic on trash.

---

## SECTION 6 — Potion Loadout (Auto-Use)

### 6.1 Reuse `pw_inventory.equipped` or dedicated loadout table?

`pw_inventory.equipped` is a boolean with **one-per-slot enforced in app logic** (not a DB constraint) — used for gear. **Do NOT overload it for potions:** potions are `slot='consumable'` and the loadout needs *two distinct potion slots* (1 health + 1 energy) **each with a committed quantity** (e.g. 3), which `equipped BOOLEAN` cannot express.

**Recommendation: dedicated `pw_dungeon_loadout`** (per-player persistent default loadout):
- `user_id (PK), health_potion_item_id, health_potion_qty, energy_potion_item_id, energy_potion_qty`
- This is the player's *configured* loadout. At dungeon **commit/fill**, snapshot it onto the `pw_dungeon_run_members` row (the committed stack the sim actually draws from), so the sim is deterministic even if the player changes their loadout mid-run-window.

### 6.2 Daily potion limits — where consumption decrements

The daily limit columns live on `pw_player_stats`: `energy_potion_uses_today`, `health_potion_uses_today` (and `_purchases_today`, `_reset_day`), each **capped at 10/day**, reset via `resetDailyCountersIfNeeded` using the UTC-day seed (`Math.floor(Date.now()/86400000)`), enforced in `handleConsume` (game.js:707–714).

**Auto-used dungeon potions count against these.** Decrement point: in **dungeon run resolution** (the sim-orchestration code in `game.js`/`pwHelpers.js`), **after** the sim reports how many potions each player auto-consumed, increment `energy_potion_uses_today` / `health_potion_uses_today` per player by the consumed count — and ideally **respect the cap mid-sim** (the sim should stop auto-using a player's potions once they'd exceed 10 for the day, to honor "counts against existing daily potion limits"). This means the sim needs each player's *remaining daily allowance* passed in alongside their committed stack (see §6.3).

### 6.3 Mid-run auto-use — sim access to per-participant potion stacks

The sim **must** receive, per participant: the committed potion stack (item id, effect %, remaining qty) **and** the remaining daily allowance for each potion type. The orchestrator (`processExpiredDungeonRuns` → `simulateDungeonRun`) loads these from `pw_dungeon_run_members` (committed snapshot) + `pw_player_stats` (daily counters) before the run, exactly as `processExpiredTitanEvents` already loads regen/township/alliance data per participant (pwHelpers.js:1175–1201).

Mid-encounter logic (new, sim-internal): after each round, for each living player, if `playerHp/maxHp < healthThreshold` and `healthStack.qty > 0` and `dailyHealthAllowanceRemaining > 0` → apply the potion's restore %, decrement stack qty + daily allowance, log a `potion_used` event into that round's record. Same for energy vs an energy threshold (energy auto-use also dovetails with the existing **fatigue** mechanic — a player about to hit energy==0 could auto-drink to avoid the 30% miss penalty). The sim already tracks `playerHp`/`playerEnergy`/`maxHpByPlayer` per player (§1.2), so the potion stacks hang directly off that existing state.

---

## SECTION 7 — Nav Tiles (DUNGEONS / WAR / CONQUER)

### 7.1 How the Dashboard tiles work

`NAV_ITEMS` array in `src/pages/games/pantheon-wars/Dashboard.jsx:13–26`. Each entry: `{ label, glyph, path, glyphStyle?, comingSoon? }`. Rendered by `NavButton` (399) in a 3-col grid (1010).
- **Live tile:** wraps a `<Link to={item.path}>` with hover/tap motion.
- **comingSoon tile:** `NavButton` short-circuits (400) to a non-clickable `opacity:0.45 cursor:not-allowed` card with a **"SOON" badge** in the corner and a tooltip. (The `STORE` tile is the current example, line 25.)
- **The ALLIANCE tile was "unlocked"** simply by *not* setting `comingSoon` and pointing `path` at the real route (line 24) — that's the entire mechanism.

### 7.2 Adding the 3 new tiles

Append to `NAV_ITEMS`:
- **DUNGEONS** — `{ label:'DUNGEONS', glyph:'🗝'(or similar), path:'/games/pantheon-wars/dungeons' }` (no `comingSoon` → live).
- **WAR** — `{ label:'WAR', glyph:'⚔', path:'/games/pantheon-wars/war', comingSoon:true }`.
- **CONQUER** — `{ label:'CONQUER', glyph:'🏴', path:'/games/pantheon-wars/conquer', comingSoon:true }`.

(Grid is `repeat(3,1fr)` and already wraps to new rows automatically; no layout change needed.)

### 7.3 Route registration (App.jsx)

Pattern (App.jsx:45–64 imports, 203–222 routes):
1. Add a lazy import: `const PantheonDungeons = lazy(() => import('@/pages/games/pantheon-wars/Dungeons'))`.
2. Add the route: `<Route path="/games/pantheon-wars/dungeons" element={<PantheonDungeons />} />`.
3. For WAR/CONQUER placeholders, reuse the existing **`PantheonComingSoon`** component (already imported, used for STORE at line 222): `<Route path=".../war" element={<PantheonComingSoon title="WAR" message="…" />} />` — though since the tiles are `comingSoon` (non-clickable), routes for them are optional until the tiles go live.

---

## SECTION 8 — Vercel / Function / Cron Budget

### 8.1 Current `api/` file count

**11 serverless functions** (each file in `api/` = one Vercel function):
1. `api/contact.js`
2. `api/track.js`
3. `api/admin/overview.js`
4. `api/auth/admin.js`
5. `api/auth/check.js`
6. `api/auth/logout.js`
7. `api/auth/reset.js`
8. `api/auth/moderator.js`
9. `api/games/pantheon-wars/auth.js`
10. `api/games/pantheon-wars/game.js`
11. `api/games/pantheon-wars/titan-cron.js`

(CLAUDE.md's "8 functions" note is **stale** — `auth/reset.js` and `auth/moderator.js` were added since. The live count is **11/12**.)

→ **Only 1 free function slot.** **ALL dungeon actions MUST fold into `game.js` as `?action=` routes** (e.g. `dungeon_list`, `dungeon_queue_join`, `dungeon_queue_leave`, `dungeon_party_create`, `dungeon_party_join`, `dungeon_kick_vote`, `dungeon_status`, `dungeon_claim`, `dungeon_loadout_set`). The router is a flat `if (action === ...)` chain at game.js:5476–5548 — append there. **Do not create a new `api/` file for dungeons** (the one remaining slot is your only margin; spending it on a dungeon endpoint leaves zero headroom and risks blowing the limit on the next feature).

### 8.2 Cron slots — confirmed NO new cron needed

`vercel.json` crons array has **exactly 2/2 used** (titan-cron morning `0 13 * * *` + evening `0 1 * * *`). **Hobby plan cron limit is 2** → you are at the cap.

**Dungeons can work with ZERO new crons**, confirmed feasible via Titan's inline-lazy pattern:
- Auto-start-30s-after-fill and resolve-without-players-online are both handled by an inline `processExpiredDungeonRuns(sql)` call added to the existing inline block at **game.js:5473** (right next to `processExpiredTitanEvents`), behind its **own advisory lock** (§2.4).
- A run "starts" at its stored `starts_at` (fill+30s) and "resolves" lazily on the **next authenticated `game.js` request** after `ends_at` — exactly Titan's model. The cheap pre-check pattern (count rows needing work, bail if zero — pwHelpers.js:1124–1130) keeps the per-request cost negligible when idle.

**This is the critical green light: the feature does not require a cron, so it does not exceed the cron budget.** See §9 for the one honest caveat.

---

## SECTION 9 — Risks / Flags

1. **No-cron lazy resolution on an idle server (acceptable, with eyes open).** A run "starts" at fill+30s and "resolves" on the next API request after `ends_at`. If **literally no one** hits `game.js` after a run's end time, the run sits in `active`/`committed` until someone does. This is **identical to Titan's existing behavior** and is acceptable for a low-traffic game — but be explicit in the UI: the countdown is "resolves when the next player checks in," not a hard real-time guarantee. The first player to load after the window triggers (and pays the compute for) resolution. With any regular traffic this is invisible.

2. **Multi-encounter sim performance / `fight_log` size — the real scaling risk.** A 10-man raid × many encounters × up to `100 × party_size` rounds per encounter × per-hit lifesteal/energy/potion recalcs, with a full `player_hp_after`/`player_energy_after` snapshot **per round**, can produce a very large `dungeon_log` JSONB and meaningful compute. Titan already does this for up-to-N players in **one** encounter; dungeons multiply it by encounter count. Mitigations to decide up front: (a) cap rounds-per-encounter tighter than Titan's `100×n`; (b) trim per-round snapshots (e.g. only store HP deltas, or snapshot every K rounds); (c) consider summarizing trash encounters in the log (full detail for bosses only). **Flag for a perf budget before building the 10-man.** The resolution runs **inline in a player's request** behind the advisory lock — a multi-second raid sim would add latency to whichever unlucky player triggers it (Titan has the same property but smaller blast radius).

3. **"Best item contested, rest individual" roll ordering** (§5.2). The contested item must be rolled **exactly once per run**, **after** per-player `damage_dealt` is known (if contribution-weighted) and **after** the death-point eligibility filter. Easy to accidentally roll it inside the per-player loop → everyone gets the "unique" item. Keep it a distinct, well-commented post-encounter step.

4. **Party disbandment / edge cases (net-new state machine — highest design surface area):**
   - Player leaves mid-queue (before fill) → free; just delete their membership row, re-open the slot.
   - Player committed once full → locked in (matches "committed once full"); their potion snapshot + key eligibility are frozen.
   - **Alliance disbands mid-raid-queue** (10-man needs alliance membership): what happens to a `forming`/`committed` raid run whose `alliance_id` just vanished? Must define — likely cancel the run and refund treasury cost + any consumed key. The alliance-disband handler (`handleAllianceDisband`, game.js:4693) would need a hook to cancel pending dungeon runs.
   - **Treasury can't cover cost at start time** (drachma spent between queue and start) → run must validate treasury at **commit**, not just at queue, or reserve/escrow the cost on commit (recommend escrow-on-commit via the treasury-deduct CTE pattern, game.js:5227).
   - **Key holder leaves before start** → the key was rolled/consumed from one party member; if they leave, does the run lose access? Define whether the key is consumed at **commit** (safe) or at **start** (race-prone).
   - **Partial-fill expiry** → an auto-queue party that never fills needs a timeout → `expired`, releasing members (their one-queue lock, §3.3).

5. **Vote-kick semantics unresolved** (§3.4) — instant-kick vs tallied-majority is a genuine fork in the votes-table design. **Lock before building.**

6. **Schema CHECK constraints to widen (each needs its own migration):**
   - `pw_pending_rewards.reward_type` CHECK currently `('adventure','titan')` → add `'dungeon'` (§2.3).
   - `pw_items.slot` CHECK → add `'key'` **only if** keys go in `pw_items` (§4.1; avoidable by choosing the dedicated key table).

7. **Equipment-aggregation duplication** (§1.4) — dungeons batch-fetch party gear; use/extend `fetchEquipBonusesBatch` and keep it in sync with `getEquipmentBonuses` (the file explicitly warns about this drift).

8. **Nothing conflicts with the locked design.** Every locked mechanic (13 instances, bracket/difficulty matrix, treasury+key costs, key drop chain, auto/manual party formation, one-run-at-a-time, multi-encounter carry-over combat, wipe-for-partial-rewards, watch-or-claim, per-player loot with one contested item, potion loadout, 3 nav tiles) maps onto an existing pattern or a clean additive extension. The biggest *new* surface is the party/queue state machine (§3) — it has no real precedent and deserves the most design care.

---

## Appendix — Build-Order Implications (not a plan, just what the recon implies)

- **Sim first, as a wrap** (`simulateDungeonRun` over `simulateTitanFight`) — proves carry-over + lifesteal/energy inheritance cheaply before any UI.
- **Inline resolution** (`processExpiredDungeonRuns` at game.js:5473, lock `847392`) — reuse Titan's exact pattern.
- **All API as `game.js` `?action=` routes** — the 1 free function slot is not for dungeons.
- **Schema:** 6 new tables (`pw_dungeons`, `pw_dungeon_encounters`, `pw_dungeon_enemies`, `pw_dungeon_runs`, `pw_dungeon_run_members`, `pw_dungeon_kick_votes`) + `pw_dungeon_boss_loot` + `pw_dungeon_loadout` (+ optional `pw_dungeon_keys`), plus 1–2 CHECK widenings.
- **Two open design decisions to lock before building:** vote-kick tally semantics (§3.4) and contested-loot recipient selection (uniform vs contribution-weighted, §5.2).

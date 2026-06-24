# Gear Expansion Recon — 100 New Items + lifesteal/energy_on_hit

Recon only. No files modified except this report. All findings sourced from `db/schema.sql` + every migration in `db/migrations/` layered on top (the live schema is base + all migrations, not `schema.sql` alone), plus `lib/pwHelpers.js`, `api/games/pantheon-wars/game.js`, `api/games/pantheon-wars/titan-cron.js`, `src/pages/games/pantheon-wars/Inventory.jsx`, `src/pages/games/pantheon-wars/Shop.jsx`, `src/pages/games/pantheon-wars/Profile.jsx`, and the docs (`docs/PROJECT_REFERENCE.md`, `PANTHEON-WARS-GDD-v2.md`).

**Docs are stale.** `docs/PROJECT_REFERENCE.md:375,616` still says "50 items" — true only at base-seed time, before 5 migrations added more rows. Treat `.sql`/`.js` source as ground truth.

---

## SECTION 1 — Item Schema + Seed Structure

### 1. Full `pw_items` schema (base + migrations applied in order)

Base table — `db/schema.sql:132-145`:
```sql
CREATE TABLE pw_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slot VARCHAR(20) NOT NULL CHECK (slot IN ('weapon', 'armor', 'artifact', 'mount', 'companion')),
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    level_required INTEGER DEFAULT 1,
    faction_exclusive VARCHAR(20) DEFAULT NULL,
    buy_price INTEGER DEFAULT NULL,
    sell_price INTEGER DEFAULT 0,
    glory_price INTEGER DEFAULT NULL
);
```

Columns added by later migrations (all idempotent `ADD COLUMN IF NOT EXISTS`):
- `db/migrations/round-combat-system.sql:17-20` → `agility_bonus INTEGER DEFAULT 0`, `crit_chance INTEGER DEFAULT 0`, `block_chance INTEGER DEFAULT 0`, `dodge_chance INTEGER DEFAULT 0`
- `db/migrations/health-potions.sql:5-10` → `consumable_effect VARCHAR(50)`, `consumable_value INTEGER`, and **widens the `slot` CHECK** (drops `pw_items_slot_check`, re-adds with `'consumable'` added to the allowed list)

**Current full column list (live schema):** `id, name, description, slot, attack_bonus, defense_bonus, rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price, agility_bonus, crit_chance, block_chance, dodge_chance, consumable_effect, consumable_value` — **18 columns**, of which **6 are combat stats**: `attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance`. Confirmed exact names — matches the user's assumption.

`slot` CHECK constraint (current): `slot IN ('weapon', 'armor', 'artifact', 'mount', 'companion', 'consumable')`.

### 2. Sample item rows (post-migration values, after `items-combat-overhaul.sql` rebalance)

From `db/seed-pantheon-wars.sql` + `db/migrations/items-combat-overhaul.sql`:

| id | name | slot | atk | def | agi | crit | block | dodge | rarity | lvl | faction | buy | sell | glory |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Iron Gladius | weapon | 2 | 0 | 0 | 0 | 0 | 0 | common | 1 | NULL | 200 | 40 | NULL |
| 6 | Mjolnir Shard | weapon | 16 | 0 | 0 | 15 | 0 | 0 | rare | 18 | aesir | 4000 | 800 | NULL |
| 17 | Aegis Breastplate | armor | 0 | 16 | 0 | 0 | 25 | 0 | epic | — | NULL | — | — | — |
| 30 | Eye of Providence | artifact | 28 | 28 | 0 | 25 | 15 | 10 | legendary | — | NULL | NULL | — | 300 (after 2x/3x price migrations) |
| 50 | Bound Titan | companion | 45 | 20 | 0 | 20 | 15 | 5 | legendary | — | NULL | NULL | — | 900 |

Consumables look different (zeroed combat stats + `consumable_effect`/`consumable_value` populated), e.g. `db/migrations/health-potions-seed.sql:12-19` (Minor Healing Tonic: `slot='consumable', attack_bonus=0, defense_bonus=0, consumable_effect='restore_health', consumable_value=25`).

### 3. Where items are seeded

- **Base 50 equipment items:** `db/seed-pantheon-wars.sql:193-201` onward. INSERT column order: `(name, description, slot, attack_bonus, defense_bonus, rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price)` — note this predates `agility_bonus`/`crit_chance`/`block_chance`/`dodge_chance`/`consumable_effect`/`consumable_value`, which are backfilled by later migrations.
- **Post-seed item additions (all migrations, chronological by first commit date):**
  1. `health-potions.sql` + `health-potions-seed.sql` (2026-05-17 01:05) — adds `consumable` slot + 5 health potions
  2. `round-combat-system.sql` + `items-combat-overhaul.sql` (2026-05-17 18:04) — adds 4 combat columns, rebalances all 50 base items, inserts **Tablet of Reinvention**
  3. `scroll-of-reinvention.sql` (2026-05-18 20:56) — inserts **Scroll of Reinvention**, also auto-grants one to every existing player
  4. `phase14-potions.sql` (2026-05-18 22:44) — inserts 5 energy potions
  5. `energy-potion-limits.sql` (2026-05-18 23:46) — columns only, no items
  6. `craftsmanship-potion-overhaul.sql` (2026-05-21) — nulls Divine Surge's prices (item row kept, not deleted), no new items

All item INSERTs are written `WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = '...')` or `ON CONFLICT DO NOTHING` — idempotent, safe to re-run.

### 4. Current item count by slot / rarity

Base seed comment (`db/seed-pantheon-wars.sql:196-198`) confirms **10 per slot × 5 slots = 50**:
```
Weapons:   1–10  | Armor: 11–20 | Artifact: 21–30
Mounts:   31–40  | Companion: 41–50
```
Rarity spread per slot (consistent pattern, confirmed via `items-combat-overhaul.sql` UPDATE comments): 2 common, 2 uncommon, 2 rare/uncommon mix, 2 epic-tier, 2 legendary roughly — exact spread is common/common/uncommon/uncommon/rare/rare/epic/epic/legendary/legendary per 10-item slot block (ids 1-2 common, 3-4 uncommon, 5-6 rare, 7-8 epic, 9-10 legendary, repeating per slot).

**Consumables added on top:** 5 health potions + 1 Tablet of Reinvention + 1 Scroll of Reinvention + 5 energy potions = **12 consumables**.

**Total current item count: 62** (50 equipment + 12 consumables), assuming migrations ran in commit order with no manual reordering or deletions (see Open Questions — this cannot be verified without DB access).

### 5. UNIQUE constraint on item name?

**No.** `db/schema.sql:132-145` has no `UNIQUE` constraint on `name`. All migrations defend against duplicate inserts manually via `WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = '...')` or `ON CONFLICT DO NOTHING` (which requires a unique index to actually trigger — `health-potions-seed.sql:52` uses `ON CONFLICT DO NOTHING` with no declared conflict target, which in Postgres means **any** constraint violation is ignored; since there's no unique constraint on `name`, this clause does nothing to prevent name collisions — only the `id` PK governs conflicts, and since `id` is `SERIAL` with no caller-supplied value, this `ON CONFLICT DO NOTHING` is effectively a no-op safety net, not a real guard).

**Implication for the 100-item migration:** name collisions are NOT prevented by the DB. Must dedupe manually against the existing 62 item names before writing INSERTs, and use the `WHERE NOT EXISTS` pattern (not `ON CONFLICT`) for idempotency, matching the existing convention.

### 6. ID range of current items

IDs 1–50 are stable (referenced directly by id in `loot-overhaul.sql`, `items-combat-overhaul.sql`, and `quests-expansion.sql`'s loot tables — e.g. `quests-expansion.sql:303-343` hardcodes item ids like 1,11,3,13,5,16,7 etc., confirming ids 1-50 are fixed and depended upon). IDs 51+ belong to consumables, assigned by `SERIAL` in whatever order the INSERTs actually executed against the live DB.

**This cannot be determined precisely from source alone** — see Risk #4 below. The new 100 items MUST be inserted using `SELECT MAX(id) FROM pw_items` semantics (or just rely on `SERIAL` auto-assignment and never hardcode new IDs), not by guessing a starting number like 63.

### 7. `faction_exclusive` column

Confirmed: `VARCHAR(20) DEFAULT NULL` (`db/schema.sql:141`). Of the 50 base items, **most are NULL**, but contrary to the user's premise and to `PANTHEON-WARS-GDD-v2.md:390` ("faction exclusivity has not been applied to any of the 50 base equipment items"), the actual seed data sets it on several legendary/epic-tier weapons:
- `Mjolnir Shard` (id 6) → `'aesir'`
- `Spear of Olympus` (id 7) → `'olympians'`
- `Enkidu's Axe` (id 8) → `'annunaki'`
- `Gungnir` (id 10) → `'aesir'`

(`db/seed-pantheon-wars.sql:226-244`). **This is a discrepancy between the GDD doc and actual seed data** — flagged in Open Questions. All 12 consumables are NULL for `faction_exclusive` (no faction-locked consumables exist yet).

---

## SECTION 2 — Combat Sim Integration Points

### 1. `simulateCombat` (PvP) — `lib/pwHelpers.js:146-306`

Two exact apply points for per-hit lifesteal/energy_on_hit, both inside the `while (round < MAX_ROUNDS)` loop:

- **Attacker's normal hit** — `lib/pwHelpers.js:217-227`: damage is computed into `dmg`, then `defenderHP = Math.max(0, defenderHP - dmg)` (line 225). **Lifesteal would heal `attackerHP` and energy_on_hit would restore attacker energy immediately after line 225**, gated on `dmg > 0` (a dodge produces `dmg=0` and skips this branch entirely already).
- **Defender's strike-back** — `lib/pwHelpers.js:232-247`: mirrors the above; damage lands via `attackerHP = Math.max(0, attackerHP - dmg)` (line 244). **Apply defender's lifesteal/energy_on_hit here.**
- **Counter-attack branch** (defender dodged, then counters) — `lib/pwHelpers.js:203-216`: `attackerHP = Math.max(0, attackerHP - ctrDmg)` (line 214). This is also a damage-dealing event for the defender and should probably also trigger their lifesteal/energy_on_hit if it's meant to be "any time you deal damage" — **needs a design decision**, not just a code drop-in (see Open Questions).

`damage_dealt` (the variable `dmg`/`ctrDmg`) is available at every apply point before the HP write — confirms section 2.5's premise.

### 2. `simulateTitanFight` — `lib/pwHelpers.js:443-730`

Apply point: `lib/pwHelpers.js:594-596`:
```js
damage = Math.max(1, damage)
titanHp = Math.max(0, titanHp - damage)
damageByPlayer[p.user_id] += damage
```
This is per-participant, inside the `for (const p of participants)` loop (line 519). **Lifesteal would heal `playerHp[p.user_id]` and energy_on_hit would restore `playerEnergy[p.user_id]`** right after line 596, using the same `damage` variable. Each participant has their own `p.equipBonuses` object passed in (see below), so the cap and bonus value are available per-player inside this loop.

Note: titan retaliation (titan hitting a player, lines 612-644) is a separate code path — lifesteal/energy_on_hit should NOT apply there (it's the player taking damage, not dealing it).

### 3. Equipment bonus aggregation — **NOT a single shared function**

Two **separate, duplicated** implementations:
- `getEquipmentBonuses(sql, userId)` — `lib/pwHelpers.js:92-108`. Single-user, used by PvP (`handlePvPAttack`, `game.js:1939-1940`) and the equip/unequip/inventory/sell handlers in `game.js` (lines 382, 456, 500).
- `fetchEquipBonusesBatch(sql, userIds)` — `lib/pwHelpers.js:1002-1033`. Batch version, used for Titan fights (multi-participant). Re-implements the identical `SUM(...)` query per-field rather than calling `getEquipmentBonuses` in a loop.

Both run the same explicit-column `SELECT i.attack_bonus, i.defense_bonus, i.agility_bonus, i.crit_chance, i.block_chance, i.dodge_chance` shape — **adding lifesteal/energy_on_hit requires editing both functions**, and the 20% cap must be applied in both (or refactored into one shared helper first — recommended, see Risks).

### 4. Single vs. duplicated aggregation — **duplicated** (confirmed above, section 2.3). Cap logic added in one place will NOT automatically cover the other; this is the single biggest "easy to silently miss one path" risk in this whole expansion.

### 5. `damage_dealt` availability — confirmed available at every apply point in both sims (see 2.1/2.2 above) before the HP mutation, so lifesteal/energy_on_hit scaling off damage dealt is a straightforward insert, not a refactor.

---

## SECTION 3 — Equip Flow + Cap Warning UI

### 1. Equip handler — `handleEquip`, `api/games/pantheon-wars/game.js:405-470`

Yes — it returns updated equipment totals. After equipping (lines 434-444), it re-fetches the full inventory (446-455) and calls `getEquipmentBonuses(sql, req.userId)` (line 456), returning `{ success, inventory, equipment_bonuses, ... }` (458-465). The frontend (`Inventory.jsx:920-921`) consumes `data.equipment_bonuses` directly into state. **A lifesteal/energy_on_hit cap-warning would have everything it needs already in this response** — no new endpoint needed, just new fields on `equipment_bonuses`.

The inventory re-fetch query at lines 446-455 explicitly lists columns (`i.attack_bonus, i.defense_bonus, i.rarity, i.level_required, i.faction_exclusive, i.sell_price`) — **does NOT include `agility_bonus, crit_chance, block_chance, dodge_chance` even today**, let alone the new stats. This looks like an existing gap (the per-item combat stat columns aren't in this particular SELECT), separate from the new-stat work but worth flagging since the pattern will repeat for lifesteal/energy_on_hit if not caught.

### 2. `Inventory.jsx` equip UI

- `BONUS_CHIPS` (`Inventory.jsx:40-47`) — hardcoded array of `{key, label, color}` for the 6 stats, rendered as `+N LABEL` chips in `EquipSlot` (line 317) and `ItemCard` (line 508).
- `STAT_DEFS` (`Inventory.jsx:49-56`) — separate hardcoded array (same 6 stats + a `pct` flag) used by the gear-comparison panel (`getVisibleStats`, line 100; `StatColumn`, line 108; `DiffRow`, line 174).
- The "Equipped bonuses" summary row (`Inventory.jsx:1135-1171`) hardcodes each stat individually: `bonuses.attack`, `bonuses.defense`, `bonuses.agility`, `bonuses.crit_chance`, `bonuses.block_chance`, `bonuses.dodge_chance` — **6 explicit conditional `<span>` blocks**, not a loop over a list. This is the natural place to add a 7th/8th conditional span for lifesteal/energy_on_hit, with the "→ capped" warning logic living right here (it already has `bonuses` in scope).

### 3. "Total equipped stats" summary

Yes — the "Equipped bonuses" row described above (`Inventory.jsx:1134-1171`) is exactly this: a character-sheet-style summary of all equipped-item totals, sourced from the `equipment_bonuses` API response. It would need 2 new conditional spans for lifesteal %/energy_on_hit, plus the cap-warning text (e.g. "Lifesteal: 18% → 24% (capped)") inserted there using the raw-sum vs. capped-value comparison.

`Profile.jsx` does NOT show equipment bonuses (only allocated stat points + a basic power-rating calc at lines 39-41 that only sums attack/defense, ignoring agility/crit/block/dodge entirely) — not the right place for this UI.

### 4. Item comparison / equip preview UI

`ComparisonPanelContent` (`Inventory.jsx:206-245`) — shown on hover (desktop) or tap (mobile) before equipping, via `getVisibleStats()` which filters `STAT_DEFS` to only stats present on either the held item or the currently-equipped item (line 100-106), then renders a 2-column "This Item vs. Equipped" comparison (`StatColumn`, line 108) plus a delta chip row (`DiffRow`, line 174, showing `+N`/`-N` per stat). **This is the natural surface for a cap warning at preview time** — e.g. showing "would push total lifesteal to 24%, capped at 20%" before the player commits to equipping. Requires adding lifesteal/energy_on_hit to `STAT_DEFS` (line 49-56) so they flow through `getVisibleStats`/`StatColumn`/`DiffRow` automatically — the comparison panel itself is otherwise stat-list-driven, not hardcoded per-stat, unlike the bonus summary row.

`Shop.jsx` has its own equivalent hardcoded per-stat rendering at lines 451-454 (`item.agility_bonus`, `item.crit_chance`, `item.block_chance`, `item.dodge_chance` each as a separate conditional span) plus a parallel `STAT_DEFS`-equivalent array near the top of the file (not fully read, but the pattern at 451-454 mirrors `Inventory.jsx`'s `BONUS_CHIPS` exactly) — **a second place needing the same 2-line addition**.

---

## SECTION 4 — Shop + Loot Integration

### 1. Drachma/glory rotation pools — generic, confirmed auto-inclusion

`getDailyRotationPool(sql, playerLevel, count)` — `lib/pwHelpers.js:768-778` — uses `SELECT * FROM pw_items WHERE buy_price IS NOT NULL AND level_required <= $level AND rarity IN ('common','uncommon','rare') AND slot != 'consumable' ORDER BY slot, level_required, rarity, id`, then `pickRotatedItems(...)`. **`SELECT *` means any new column (lifesteal, energy_on_hit) automatically flows through with zero code changes.**

`getGloryRotationPool(sql, count)` — `lib/pwHelpers.js:783-795` — explicit column list (`id, name, description, slot, rarity, level_required, attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance, glory_price, faction_exclusive`) — **does NOT use `SELECT *`**, so lifesteal/energy_on_hit must be added to this column list explicitly or they will silently not appear in the glory shop response even though the item rotates in.

**Confirmed: new items with `buy_price`/`glory_price` set WILL rotate into the drachma pool automatically (price/level/rarity gating only — fully data-driven, no slug/name allowlist anywhere in this query). The glory pool rotates them in too, but their lifesteal/energy_on_hit values need the column-list edit above to actually display.**

Other explicit-column queries that would also need the 2 new columns added (all in `api/games/pantheon-wars/game.js`):
- `always_available` consumables query (lines 882-890) — already lists `agility_bonus, crit_chance, block_chance, dodge_chance` explicitly; will need `lifesteal, energy_on_hit` added (low priority since consumables presumably don't carry these new stats, but matters if any future gear-like consumable does)
- `equippedRows` for shop gear-comparison (lines 903-911) — same explicit list, same gap
- `itemRows` in `handleBuy` (lines 975-978) — doesn't select stat columns at all (only metadata needed for the purchase transaction), no change needed here
- `handleEquip`/`handleUnequip` inventory re-fetch (lines 446-455, 490-499) — explicit list, missing even the *existing* 4 round-combat stats today, so lifesteal/energy_on_hit need to be added here too if this response is ever used for live equip-bonus display (currently it isn't — `equipment_bonuses` from `getEquipmentBonuses` carries the totals instead)

### 2. `pw_quest_loot` — items need explicit loot mappings, not automatic

`pw_quest_loot` is a manually-populated mapping table (`quest_id, item_id, drop_weight`), confirmed by every quest-content migration hand-writing `INSERT INTO pw_quest_loot ... VALUES (...)` per quest (e.g. `quests-expansion.sql:303-343`). **New items will NOT be quest-droppable unless explicit loot rows are inserted for them.** Per the user's stated scope (shop-buyable only this phase, dungeon loot later), no loot-table work is required for the 100 new items — confirmed safe to skip.

Also confirmed via `loot-overhaul.sql:24-25`: legendary-rarity items are deliberately excluded from ALL quest loot (`DELETE FROM pw_quest_loot WHERE item_id IN (SELECT id FROM pw_items WHERE rarity = 'legendary')`) — this is an enforced design rule, not an oversight. If any of the 100 new items are legendary AND ever get loot-table entries in a future phase, that exclusion will need to be respected (probably automatically, since the delete is rarity-driven and re-runnable).

### 3. `faction_exclusive` enforcement — **yes, actively enforced**, contrary to the "may be untested" premise

- **Equip block:** `game.js:430-432` — `if (item.faction_exclusive && item.faction_exclusive !== playerFaction) return res.status(400)...`
- **Buy block:** `game.js:1003-1004` — identical check in `handleBuy`
- **Shop visibility filter:** `game.js:2825` and `game.js:3595` — `AND (faction_exclusive IS NULL OR faction_exclusive = ${faction})` in two different query contexts (not yet read in full, but both reference the same gating pattern)
- **Frontend UI:** `Shop.jsx:275,287,294,337,356,372,479` — color-codes faction-locked items, shows a "FACTION ONLY" badge, disables purchase with a tooltip explaining the requirement

This is fully wired and tested-by-construction since 4 of the 50 base items (Mjolnir Shard, Spear of Olympus, Enkidu's Axe, Gungnir — see Section 1.7) already exercise this path in production. **Not an untested edge case** — the user's premise here was incorrect; this should be reflected in the build prompt.

---

## SECTION 5 — Display / Rarity / Stat Rendering

### 1. Where item stats render — components confirmed

- `src/pages/games/pantheon-wars/Inventory.jsx` — `BONUS_CHIPS` (line 40), `STAT_DEFS` (line 49), `EquipSlot` (line 279), `ItemCard` (line 338), `ComparisonPanelContent`/`StatColumn`/`DiffRow` (lines 108-245), "Equipped bonuses" summary (lines 1134-1171)
- `src/pages/games/pantheon-wars/Shop.jsx` — equivalent hardcoded stat-chip rendering at lines 451-454 (and almost certainly a `RARITY_COLOR`/stat-array constant block near the top, mirroring `Inventory.jsx`'s pattern, not fully enumerated here but should be checked line-by-line when building)

### 2. Rarity color map location

`RARITY_COLOR` constant, defined independently in **at least** `Inventory.jsx:11-17`:
```js
const RARITY_COLOR = { common:'#A0A0B8', uncommon:'#22C55E', rare:'#8BBECC', epic:'#A78BFA', legendary:'#F5D88B' }
```
Keyed by `rarity` string value, not by item id — **new items automatically inherit correct colors purely from their `rarity` column value, zero code changes needed**, as long as all 100 new items use one of the 5 existing rarity strings (`common/uncommon/rare/epic/legendary` — the only values the `rarity` CHECK constraint permits, `db/schema.sql:139`). Shop.jsx likely duplicates this same constant (not confirmed by direct read, but the pattern of duplicated constants between these two files is already established for `BONUS_CHIPS`/stat rendering — worth a grep-and-confirm step in the actual build, not just this recon).

### 3. Hardcoded "6 stats" patterns that would MISS lifesteal/energy_on_hit

Confirmed hardcoded, non-loop-driven, would silently drop the new stats unless edited:
1. `Inventory.jsx:40-47` — `BONUS_CHIPS` array (6 entries)
2. `Inventory.jsx:1151-1168` — "Equipped bonuses" summary, 6 explicit `bonuses.X > 0 && <span>` blocks (not array-driven at all, fully manual)
3. `Shop.jsx:451-454` (+ presumably an attack/defense pair just above, not shown) — same per-stat-conditional pattern
4. `lib/pwHelpers.js:92-108` (`getEquipmentBonuses`) — explicit `SELECT` column list + explicit `.reduce()` per field (6 fields)
5. `lib/pwHelpers.js:1002-1033` (`fetchEquipBonusesBatch`) — explicit `SELECT SUM(...)` per column (6 columns), separately from #4
6. `lib/pwHelpers.js:783-795` (`getGloryRotationPool`) — explicit column list
7. `api/games/pantheon-wars/game.js` — multiple explicit column lists at lines ~413, 450, 494, 883-886, 894-895, 904-907 (equip/unequip/shop/inventory queries)

**`STAT_DEFS` in `Inventory.jsx:49-56` is array-driven** (used by `getVisibleStats`/`StatColumn`/`DiffRow`) — adding 2 entries there is sufficient to light up the comparison-panel UI for the new stats, unlike the other 6 hardcoded spots which need direct edits. This asymmetry (array-driven comparison panel vs. hardcoded summary bar) is worth calling out in the build prompt so the easy win (extend `STAT_DEFS`) isn't mistaken for full coverage.

---

## SECTION 6 — Stat Allocation Guard

`handleAllocate` — `api/games/pantheon-wars/game.js:1229-1318`. Confirmed **whitelisted by explicit destructure with defaults**:
```js
const { attack = 0, defense = 0, energy_max = 0, health_max = 0, agility = 0 } = req.body || {}
```
(line 1232). Only these 5 named fields are ever read off the request body; any other field present in the JSON payload (including a hypothetical `lifesteal` or `energy_on_hit`) is silently ignored — there is no path from `req.body` to `pw_player_stats` or `pw_items` for arbitrary keys. The subsequent `UPDATE pw_player_stats SET attack=..., defense=..., agility=..., energy_max=..., health_max=..., stat_points=...` (lines 1278-1295) only ever writes these 5 columns plus bookkeeping fields (`glory_lifetime`, `drachma`, regen bases, `last_updated`) carried over from `regenPlayer()`.

**Confirmed safe by design — no migration or code change needed to prevent stat-point injection into the new gear-only stats.** This holds regardless of how the new stats are named, since the guard is an allowlist, not a denylist.

The frontend (`Profile.jsx:637-643`) only ever sends `attack/defense/agility/energy_max/health_max` in the POST body too, reinforcing that there's no UI path either.

---

## SECTION 7 — Risks / Flags

1. **Lifesteal vs. the decisive-combat model — real degenerate-fight risk, confirmed by reading the sim.** `simulateCombat` now runs round-by-round to a decisive end (≤1 HP) rather than a fixed round count (`lib/pwHelpers.js:180-258`), capped at 100 rounds as a safety net only. If an attacker's lifesteal-per-hit ever exceeds the defender's mitigated counter-damage-per-round, the attacker's HP can *net positive* every round, making them effectively unkillable until the 100-round safety cap kicks in (`safety_cap_reached`, line 264-269) — at which point the **tie-break rule explicitly favors the defender** (`Ties → defender (locked design)`, line 263), so a degenerate lifesteal stall doesn't even reward the lifestealing attacker; it just produces a long, wasted 100-round simulation that loses anyway. **Net effect: not a correctness bug (no infinite loop — `MAX_ROUNDS` bounds it), but a real "feels broken" UX/balance risk** (very long fights, possibly perceived as unfair given the defender-favored tie-break) unless lifesteal is tuned conservatively or explicitly excluded from the safety-cap math. The same applies to `simulateTitanFight`, which has its own `MAX_ROUNDS = 100 * participants.length` cap (line 498) and a different, HP-threshold-based tie-break (line 673-676) — Titan fights are long-running multi-participant fights already; runaway lifesteal there could make Titans nearly unkillable within the round cap, which actually matters more (Titans are meant to be hard but beatable, not stalled to a cron timeout).

2. **The 20% cap must be enforced in the aggregation step, not the sim, and must be enforced in BOTH duplicated aggregation functions.** Section 2.3/2.4 confirmed `getEquipmentBonuses` (PvP, single-user) and `fetchEquipBonusesBatch` (Titan, batch) are two independent implementations of the same SQL shape. A cap added to one and forgotten in the other means **PvP could be safely capped at 20% while Titan fights allow uncapped lifesteal (or vice versa)** — a realistic, easy-to-miss split-brain bug given the existing duplication pattern. Recommend either (a) refactoring Titan's batch path to call a shared per-user bonus function in a loop (simpler, possibly slower at high participant counts) or (b) writing the cap logic once as an exported helper (e.g. `capLifesteal(raw)`) and calling it identically from both aggregation functions. Either way, this needs a deliberate decision before writing the migration, not an incidental fix.

3. **Energy-positive loop risk in PvP is low — but only because PvP doesn't track energy mid-fight at all.** Checked: `simulateCombat`'s `attacker`/`defender` objects carry `health`, `attack`, `defense`, `agility`, `level`, `faction`, `class` (per the function's own doc comment, line 138) — **no `energy` field is read or mutated anywhere in the PvP sim.** Energy is only spent once, up-front, to initiate the PvP attack (outside `simulateCombat`, presumably in `handlePvPAttack` before calling it — not fully traced in this recon but implied by the broader energy-cost pattern used for quests/titans). So `energy_on_hit` **cannot create a mid-fight energy-positive loop in PvP**, because PvP combat doesn't consume energy round-by-round to begin with — there's nothing to loop against. **This DOES matter for Titan fights**, though: `simulateTitanFight` tracks `playerEnergy[p.user_id]` live per round (line 482, 488, 522) and uses `energy === 0` to trigger a 30%-miss "Fatigued" state (lines 522, 530-537, 584-586 disabling crit while fatigued). If `energy_on_hit` restores energy mid-fight, a player could avoid ever going Fatigued for the whole fight as long as they keep landing hits — this is a real, intended-sounding power fantasy for the stat, but it interacts directly with the Fatigue mechanic and the Enlil titan's `divine_storm` energy-drain ability (lines 508-516) — Enlil exists specifically to drain energy and force Fatigue; energy_on_hit gear could counteract that titan's entire identity. Worth a explicit balance call: should `energy_on_hit` have reduced effect (or be disabled) during `divine_storm` rounds, similar to how `frost_veil` explicitly reduces crit (line 587)?

4. **ID collision / seed-rerun safety — cannot be fully verified from source; must be checked against the live DB before writing the migration.** Section 1.6 confirmed ids 1-50 are fixed and hardcoded-referenced by later migrations (quest loot tables), so those are safe. But the 12 consumable items (ids 51-62, by inferred commit order) were inserted by 5 separate migrations across 4 days, each using `SERIAL` auto-assignment with no explicit id — **the true id of "item #51" depends entirely on the order these migrations were actually executed against the live Neon database**, which may not match git commit order if they were run manually out of sequence (the migration headers consistently say "Run via Neon console," implying manual, not automated, execution). **Before writing the 100-item migration: run `SELECT MAX(id), COUNT(*) FROM pw_items` against the live DB first** to confirm the actual current state matches this recon's inference (62 items, max id ~62) rather than assuming it. All new INSERTs should omit `id` (let `SERIAL` assign) and use the same `WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = '...')` idempotency pattern as every prior item migration — never hardcode new ids.

5. **Hardcoded stat-list UI surfaces (Section 5.3) are the most certain, lowest-severity, highest-count risk.** Six call sites across `Inventory.jsx`, `Shop.jsx`, and `lib/pwHelpers.js` enumerate the 6 existing stats by name rather than iterating a shared list. None of these will error or crash if lifesteal/energy_on_hit are added to the schema without touching these files — they will just **silently fail to display or aggregate the new stats**, which is a worse failure mode than a visible error (a player could equip a lifesteal weapon, see no UI feedback, and reasonably conclude the feature is broken or the item is mislabeled). This is pure build-checklist work, not a design risk, but the count of separate call sites (6, not 1) means it's easy to fix 5 and miss 1 mid-build.

6. **`faction_exclusive` enforcement is real and already battle-tested** (Section 4.3) — not a risk, but flagged because the user's recon request explicitly worried it "may exist but be untested." It is both implemented (4 separate enforcement points: equip, buy, 2 shop-visibility filters) and exercised in production today via the 4 faction-locked base items. No new risk here; safe to build on top of as-is for any new faction-locked items in the 100.

---

## Open Questions / Discrepancies

1. **`PANTHEON-WARS-GDD-v2.md:390` claims no base item has `faction_exclusive` set; the actual seed data (`db/seed-pantheon-wars.sql`) sets it on 4 items** (Mjolnir Shard, Spear of Olympus, Enkidu's Axe, Gungnir). The GDD doc is wrong/stale — treat the seed SQL as ground truth, not the doc, when reasoning about faction-exclusive precedent for the new items.

2. **`docs/PROJECT_REFERENCE.md:375,616` says "50 items" / "seeded" without mentioning the 12 consumables added afterward by 4 separate migrations.** This doc needs an update pass independent of the gear expansion work, but more importantly: **don't trust this doc's item count or schema column list when scoping the 100-item migration** — it reflects base `schema.sql`, not the live post-migration state.

3. **Exact id values for items 51-62 cannot be confirmed from source.** Inferred order (by git commit date) is: 5 health potions → Tablet of Reinvention → Scroll of Reinvention → 5 energy potions, giving ids 51-55, 56, 57, 58-62 respectively — but this assumes migrations ran in commit order against the live DB, which is an assumption, not a fact (see Risk #4). **Action before building: query the live DB for `MAX(id)` and total count.**

4. **Whether lifesteal/energy_on_hit should trigger on the PvP counter-attack branch** (`lib/pwHelpers.js:203-216`, Section 2.1) is a design decision, not something resolvable from code alone — the counter is a real damage-dealing event for the defender, but it's narratively a "free" bonus action, and whether it should also proc gear stats wasn't specified by the user. Flag for the build prompt.

5. **Whether `energy_on_hit` should be reduced/disabled during Enlil's `divine_storm` energy-drain rounds** (Risk #3) is also an open balance decision, not a code question — the mechanic as a flat "restore energy when you deal damage" would partially negate Enlil's signature ability by design, which may or may not be the intent.

6. **Shop.jsx's full stat-rendering and `RARITY_COLOR`-equivalent block was not read in its entirety** (only the targeted grep hits at lines 451-454 and 275-479 for faction-lock UI were read) — the build phase should do a full read of `Shop.jsx`'s top-of-file constants before editing, since this recon infers but does not 100%-confirm that it exactly mirrors `Inventory.jsx`'s `BONUS_CHIPS`/`RARITY_COLOR` duplication pattern.

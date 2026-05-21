# Pantheon Wars — Game Design Document

> **Project**: freshprints.dev idle browser game
> **Genre**: Idle / incremental RPG (Mafia Wars-derived, now with real-time elements)
> **Stack**: React + Vite + Tailwind v4 / Framer Motion / Vercel Serverless / Neon Postgres / Pusher
> **Repo**: github.com/loudpacck/freshprints-dev
> **Location in repo**: PANTHEON-WARS-GDD.md (project root)
> **Last updated**: 2026-05-21

---

## 1. Concept

Pantheon Wars is a text-and-UI-driven browser MMO played at `freshprints.dev/games/pantheon-wars`. It is a direct mechanical descendant of Facebook-era Mafia Wars, reskinned with three colliding mythological pantheons in a shared world called Kishar.

### 1.1 The World of Kishar

Kishar is an ancient, mythologically layered world where three divine civilizations — Greek, Norse, and Mesopotamian — have coexisted in uneasy balance since the Eternal Accord, a treaty signed after a cataclysmic conflict known as the Unraveling. The Unraveling was sparked by Ermanôs the Betrayer, who attempted to collapse the divine order for personal ascension. The Accord prevented total destruction but left permanent scars: fractured bloodlines, contested territories, and an unresolved question of whether mortals should be ruled by the divine or granted sovereignty.

Two factions now contest this question:

- **The Pantheon Coalition** — divine loyalists who believe the gods' authority is legitimate and necessary.
- **The Mortal Compact** — sovereignty rebels who argue that mortal achievement and self-determination must supersede divine control.

Players are mortals of divine heritage who enter this conflict, choosing a faction (their bloodline), a class (their role in the conflict), and an alignment (their ideological side). All three are permanent choices.

### 1.2 Design Philosophy

At its core, the game is an idle RPG: spend energy on quests, earn XP and drachma, level up, buy equipment, and build passive income through temples. The idle loop runs server-side — all regen is calculated inline on every API request, so there are no background jobs for resource recovery.

Layered atop the idle base are real-time systems: Titan Events (cooperative boss fights resolved by a cron-driven scheduler), Live Chat (Pusher-powered persistent messaging), and PvP (player-vs-player combat against the opposing alignment). These systems create the social texture that makes the idle loop meaningful.

All game routes are namespaced under `/games/pantheon-wars/*`, all API endpoints under `/api/games/pantheon-wars/*`, and all database tables prefixed `pw_` to avoid collisions with the freshprints.dev site tables.

---

## 2. Core Loop

```
1. Spend Energy → Complete Quests → Earn XP, Drachma, Loot
2. Spend Energy upfront → Send heroes on Adventures → Claim rewards on return
3. Level Up → Unlock harder content, receive Stat Points, expand Energy and Health caps
4. Allocate Stat Points → Attack, Defense, Agility
5. Buy Equipment from Shops → Equip best-in-slot across 5 gear slots
6. Join Titan Events → Cooperative boss fights → Rare and Epic loot drops
7. Attack Opposing Players (PvP) → Earn Glory → Spend Glory in Glory Shop
8. Build Temples → Passive Drachma income calculated inline on every request
9. Establish Township Professions → Passive multipliers on XP, Drachma, Regen, Combat
10. Unlock Craftsmanship → Timed crafting cycles that produce equipment up to Epic rarity
11. Chat with other players → Coordinate Titan attacks, form alliances, engage in rivalry
12. Repeat from step 1
```

Energy and health regenerate at all times (server-calculated). Temple income accrues in real time. Adventures run in real time. Craftsmanship cycles run in real time. The player does not need to be online for any of these — everything is computed inline when they next interact with the game.

---

## 3. Player Identity

### 3.1 Factions

Faction represents a player's divine heritage — the mythological bloodline they were born into. Chosen at signup, faction is permanent and determines passive combat bonuses, quest flavor, faction-exclusive equipment eligibility, and which temple and adventure bonuses apply.

| Faction | Pantheon | Passive Bonus | Combat Bonus |
|---------|----------|---------------|--------------|
| **Olympians** | Greek | +10% XP from all sources | +5% crit chance |
| **Aesir** | Norse | +2 Agility at signup | +5% dodge chance |
| **Annunaki** | Mesopotamian | +5% Drachma from all sources; +5% temple income | +5% block chance |

### 3.2 Classes

Class determines starting stats, per-level growth, and combat role. Chosen at signup, class is permanent.

| Class | Starting Bonus | Per-Level Bonus | Combat Bonus |
|-------|----------------|-----------------|--------------|
| **Warden** | +5 Defense | +1 Defense/level | +10% block chance |
| **Oracle** | +5 Energy Max | +1 Energy Max/level | +5% dodge chance |
| **Slayer** | +5 Attack | +1 Attack/level | +10% crit chance |
| **Broker** | +250 Drachma (total 750), +10% Drachma from quests, +20% temple income | — | — |

The Broker is a pure economic class with no combat bonuses. It is the correct choice for players who want to accelerate their equipment acquisition and passive income rather than raw combat power.

### 3.3 Alignments

Alignment is chosen at level 10 and is permanent. It determines which players can be attacked in PvP, as well as economic bonuses tied to the conflict's narrative stakes.

| Alignment | Lore Side | Bonus |
|-----------|-----------|-------|
| **Coalition** (Pantheon Coalition) | Divine loyalists | +15% XP from all sources |
| **Compact** (Mortal Compact) | Sovereignty rebels | +10% Glory on PvP win; consolation Glory on loss |

Players below level 10 have no alignment and can only attack other unaligned players (and be attacked by either aligned side). At level 10, the game requires alignment selection before PvP becomes available.

Alignment-based attack restrictions:
- Coalition players may attack: Compact players, or any player below level 10.
- Compact players may attack: Coalition players, or any player below level 10.
- Players without alignment may attack: only other players below level 10.

### 3.4 Heritage

The Three Heritages are the Codex's lore explanation for faction identity. Olympian-born carry the blood of the Olympian survivors of the Unraveling. Aesir-born descend from Norse heroes who answered Odin's call after Ragnarök was narrowly averted. Annunaki-born trace their lineage to the divine engineers of the first cities. These distinctions are narrative in nature; the mechanical expression of heritage is the faction bonus.

### 3.5 Identity Permanence and the Tablet of Reinvention

Faction, class, and alignment are all permanent. Stat Point allocations (Attack, Defense, Agility) are the only numeric identity layer that can be reset. Two items enable this:

- **Scroll of Reinvention** — given free at signup; reallocates all stat points.
- **Tablet of Reinvention** — purchased from the Glory Shop for 50 Glory; same effect.

---

## 4. Resources

Pantheon Wars tracks six resource types. Energy and health regenerate continuously. Drachma, XP, and Glory are earned through actions. Stat Points are granted at level-up.

### 4.1 Resource Summary

| Resource | Earned From | Spent On |
|----------|-------------|----------|
| **Energy** | Regen (continuous) + potions | Quests (per-quest cost), Adventures (upfront on departure), PvP (per-attack scaling), Titan Event participation |
| **Health** | Regen (continuous) + potions | Depleted when attacking in PvP (attacker's real HP); restored on PvP win (+30% of health max) |
| **Drachma (₯)** | Quests, Adventures, Temple income, Titan rewards | Equipment (Drachma Shop), Temple purchase and upgrade, Township establishment and upgrade |
| **XP** | Quests, Adventures, Titan Events | Level-up thresholds (automatic) |
| **Glory** | PvP wins; Compact players also earn consolation Glory on loss | Glory Shop (legendary equipment, Tablet of Reinvention, Divine Restoration) |
| **Stat Points** | +5 per level-up | Allocated to Attack, Defense, Agility (1 point = +1 stat, no cap) |

### 4.2 Regen Formulas

Regen is calculated inline on every authenticated API request via `regenPlayer()`. There are no background jobs. The formula computes elapsed time since the relevant base timestamp and awards whole-integer resource points.

**Energy regen:**
```
energyMult = 1 + (stewardship_township_bonus_pct / 100)
secondsPerPoint = max(60, floor(300 / energyMult))
```
- Base (no Stewardship): 300 seconds per 1 energy point (~1 per 5 minutes).
- At maximum Stewardship: energyMult ≈ 2.5 → ~120 seconds per point (~1 per 2 minutes).
- Minimum floor: 60 seconds per point.
- Tracked via `energy_regen_base` timestamp.

**Health regen:**
```
healthMult = 1 + (ritual_township_bonus_pct / 100)
secondsPerPoint = max(45, floor(180 / healthMult))
```
- Base (no Ritual): 180 seconds per 1 health point (~1 per 3 minutes).
- At maximum Ritual: healthMult ≈ 2.5 → ~72 seconds per point.
- Minimum floor: 45 seconds per point.
- Tracked via `health_regen_base` timestamp.

**Temple income:** Calculated within the same `regenPlayer()` pass. See Section 11.

### 4.3 Daily Limits

Certain resource actions are capped per UTC day to prevent burst exploitation. The day seed is `floor(Date.now() / 86400000)` — an integer count of days since epoch. When the stored day differs from the current seed, the counter resets.

| Action | Daily Limit | Tracking Column |
|--------|-------------|-----------------|
| Energy potion shop purchases | 5 / day | `energy_potion_reset_day` (day seed) + `energy_potion_uses_today` |
| Energy potion uses (any source) | 10 / day | same columns |
| Health potion uses (any source) | 10 / day | `health_potion_uses_today` |
| Divine Restoration purchases | 1 / day | `divine_restoration_purchases_today` |

Divine Restoration (a glory shop consumable) counts as both an energy-potion use and a health-potion use simultaneously when consumed, consuming one slot from each daily limit.

### 4.4 Level-Up Resource Restoration

On every level-up, energy and health are fully restored to their current maximums.

---

## 5. Quests (PvE)

Quests are the foundational energy sink and the primary source of XP, Drachma, and low-to-mid tier loot.

### 5.1 Tier Structure

The quest catalog contains **40 quests** across 5 tiers. Each tier is thematically distinct and covers a range of energy costs and rewards.

| Tier | Quest Count | Energy Cost Range | Theme |
|------|-------------|-------------------|-------|
| 1 | 8 | 1–2 | Mortal errands, starter content |
| 2 | 8 | 2–4 | Faction outreach, early conflict |
| 3 | 9 | 3–6 | Mid-level divine campaigns |
| 4 | 8 | 5–8 | Epic mythic operations |
| 5 | 7 | 6–10 | Lore-driven endgame quests |

The quest board rotates every 3 hours using a deterministic PRNG (Mulberry32) seeded by `floor(Date.now() / 10800000)`. The seed ensures all players see the same rotation at any given time.

### 5.2 Reward Computation

Quests always succeed — there is no failure state. The only resource at risk is energy. The reward pipeline applies multipliers in sequence:

```
finalXP = baseXP
  × (faction === 'olympians' ? 1.10 : 1)
  × (alignment === 'coalition' ? 1.15 : 1)
  × (quest.faction_bonus === faction && bonus_type === 'xp_pct'
       ? (1 + quest.faction_bonus_value / 100) : 1)
  × (1 + divination_township_pct / 100)

finalDrachma = baseDrachma
  × (faction === 'annunaki' ? 1.05 : 1)
  × (class === 'broker' ? 1.10 : 1)
  × (quest.faction_bonus === faction && bonus_type === 'drachma_pct'
       ? (1 + quest.faction_bonus_value / 100) : 1)
  × (1 + commerce_township_pct / 100)
```

### 5.3 Faction and Class Quest Bonuses

Each quest row carries optional `faction_bonus` and `class_bonus` columns. When the player's faction or class matches, the specified bonus type (XP percentage, Drachma percentage, or loot chance addition) is applied on top of the base reward.

### 5.4 Quest Loot (Post-Overhaul)

Loot is awarded by rolling `loot_chance` first (percentage check). On a hit, the item is selected via weighted random from the `pw_quest_loot` table for that quest.

Post-overhaul changes applied via `loot-overhaul.sql`:
- **Legendary removed from all quest loot tables** — no legendary items drop from quests.
- **Tier 4 (IDs 26–33) epic drop_weight** reduced to 1 (was 5; ~70% reduction).
- **Tier 5 (IDs 34–40) epic drop_weight** reduced to 2 (was 5; ~50% reduction).

This makes epic-rarity quest drops extremely rare even in high-tier content, reserving them for Titan Events and Craftsmanship endgame.

---

## 6. Adventures

Adventures are asynchronous timer-based PvE content. Unlike quests (which take ~5 minutes of real time to claim), adventures take between 45 minutes and 12 hours and run entirely in the background while the player is offline.

### 6.1 Overview

- **12 adventures** total.
- Energy is deducted upfront at departure — the player commits before the timer begins.
- One adventure active per player at a time.
- On completion, the reward is written to `pw_pending_rewards` and surfaced to the player via `AdventureRewardModal` on their next login or page visit.
- The board rotates every 6 hours using Mulberry32 seeded by `floor(Date.now() / 21600000)`.
- **Loot rarity hard cap: Rare.** Adventures never drop Epic or Legendary items, regardless of the `min_loot_rarity` column value on the highest-tier adventures. The cap is enforced at the SQL query level.

### 6.2 Adventure Catalog

| Slug | Duration | Energy | XP | Drachma Base + Bonus | Loot % | Min Rarity | Level Req | Faction Bonus | Class Bonus |
|------|----------|--------|----|----------------------|--------|------------|-----------|---------------|-------------|
| aedons-errand | 45m | 10 | 150 | 250+100 | 30 | common | 1 | — | — |
| the-forgotten-trireme | 1h | 14 | 280 | 400+150 | 35 | common | 5 | — | — |
| night-hunt-cretan-wilds | 1.5h | 16 | 440 | 550+200 | 40 | common | 8 | Olympians: loot_chance +20 | — |
| traverse-the-frost-roads | 2h | 20 | 650 | 750+300 | 45 | uncommon | 12 | Aesir: XP +20% | — |
| the-ziggurat-descent | 2.5h | 18 | 580 | 700+250 | 40 | uncommon | 10 | Annunaki: drachma +25% | — |
| siege-mortal-compact-outpost | 3h | 25 | 900 | 1,100+400 | 50 | uncommon | 20 | — | Slayer: loot_chance +20 |
| the-long-march-to-olympus | 4h | 30 | 1,400 | 1,600+600 | 55 | uncommon | 28 | Olympians: XP +25% | — |
| valhallaas-proving-grounds | 5h | 35 | 1,800 | 2,000+700 | 55 | rare | 35 | Aesir: XP +25% | Slayer: loot_upgrade +50% |
| the-marduk-cipher | 6h | 40 | 2,200 | 2,600+800 | 60 | rare | 40 | Annunaki: drachma +30% | Oracle: loot_upgrade +50% |
| war-council-deep-world | 8h | 50 | 3,500 | 4,000+1,000 | 65 | rare | 50 | — | — |
| seven-gates-of-inanna | 10h | 60 | 5,000 | 6,000+1,500 | 70 | rare (hard cap) | 60 | Annunaki: guaranteed loot | — |
| final-siege-of-asgard | 12h | 70 | 8,000 | 10,000+2,000 | 80 | rare (hard cap) | 75 | Aesir: loot_upgrade +75% | Warden: loot_upgrade +50% |

The `drachma_bonus` column is a random roll in range `[0, bonus]` added to the base reward on completion.

### 6.3 Bonus Type Mechanics

| Bonus Type | Effect |
|------------|--------|
| `loot_chance` | Adds value to the loot roll threshold |
| `xp` / `xp_pct` | Adds percentage to XP reward |
| `drachma_pct` | Adds percentage to Drachma reward |
| `guaranteed_loot` | Loot roll always succeeds regardless of percentage |
| `loot_upgrade` | Increases the rolled rarity tier by value/100 probability of +1 tier |

### 6.4 Exploration Township

The Exploration profession (Section 12) adds an `adventure_reward_pct` multiplier to all adventure XP and Drachma rewards, stacking with faction and class bonuses.

### 6.5 Completion Flow

`checkAndCompleteAdventures()` runs at the top of every authenticated `game.js` handler. If a player's adventure has `completes_at <= NOW()` and `status = 'active'`, the system:
1. Rolls loot (if eligible, applying all bonuses, capped at rare).
2. Writes the full reward payload to `pw_pending_rewards` with `reward_type = 'adventure'`.
3. Sets `status = 'completed'`.

The frontend fetches pending rewards on each load and displays `AdventureRewardModal` for any unacknowledged rewards.

---

## 7. Equipment & Inventory

### 7.1 Equipment Slots

Players have five equippable gear slots. Each slot holds exactly one equipped item at a time. Equipped items add their stat bonuses directly to combat calculations. Slot enforcement is handled in application logic, not via database constraint.

| Slot | Role in Combat |
|------|----------------|
| **Weapon** | Primary source of Attack and Crit bonuses |
| **Armor** | Primary source of Defense and Block/Dodge bonuses |
| **Artifact** | Mixed Attack + Defense + utility stat bonuses |
| **Mount** | Agility-heavy; contributes Dodge; mixed ATK/DEF |
| **Companion** | Varied across all six stats; complements class identity |

### 7.2 Item Stats

Six stats appear on equipment. Each stat feeds a specific combat mechanic:

| Stat Column | Combat Role |
|-------------|-------------|
| `attack_bonus` | Added to effective attack before damage calculation |
| `defense_bonus` | Added to effective defense before mitigation calculation |
| `agility_bonus` | Contributes to dodge chance (agility × 0.5% per point) |
| `crit_chance` | Percentage points added to the player's crit roll threshold |
| `block_chance` | Percentage points added to the player's block roll threshold |
| `dodge_chance` | Percentage points added to the player's dodge roll threshold |

All three chance stats (crit, block, dodge) are capped at **75% total** (identity bonuses + equipment combined).

### 7.3 Weapon Catalog (IDs 1–10)

| ID | Name | Rarity | ATK | AGI | CRIT |
|----|------|--------|-----|-----|------|
| 1 | Iron Gladius | common | 2 | 0 | 0 |
| 2 | Bronze Kopis | uncommon | 3 | 1 | 5 |
| 3 | Legionary Spear | uncommon | 6 | 0 | 5 |
| 4 | Runic Dagger | rare | 5 | 4 | 15 |
| 5 | Blade of Ares | rare | 14 | 0 | 10 |
| 6 | Mjolnir Shard | epic | 16 | 0 | 15 |
| 7 | Spear of Olympus | epic | 28 | 1 | 15 |
| 8 | Enkidu's Axe | epic | 25 | 0 | 20 |
| 9 | Godkiller Blade | legendary | 55 | 0 | 25 |
| 10 | Gungnir | legendary | 60 | 2 | 20 |

### 7.4 Armor Catalog (IDs 11–20)

| ID | Name | Rarity | DEF | AGI | BLOCK | DODGE |
|----|------|--------|-----|-----|-------|-------|
| 11 | Woven Reed Armor | common | 2 | 0 | 5 | 0 |
| 12 | Leather Breastplate | uncommon | 3 | 0 | 5 | 0 |
| 13 | Legionary Shield | uncommon | 7 | 0 | 15 | 0 |
| 14 | Berserker Furs | rare | 6 | 2 | 10 | 0 |
| 15 | Hoplite Greaves | rare | 9 | 0 | 15 | 0 |
| 16 | Ishtar's Veil | epic | 12 | 2 | 10 | 5 |
| 17 | Aegis Breastplate | epic | 16 | 0 | 25 | 0 |
| 18 | Chain of Niflheim | epic | 26 | 0 | 25 | 0 |
| 19 | Olympian Plate | epic | 30 | 0 | 30 | 0 |
| 20 | Shield of Aegis | legendary | 55 | 0 | 40 | 0 |

### 7.5 Artifact Catalog (IDs 21–30)

| ID | Name | Rarity | ATK | DEF | AGI | CRIT | BLOCK | DODGE |
|----|------|--------|-----|-----|-----|------|-------|-------|
| 21 | Carved Idol | common | 1 | 1 | 0 | 5 | 0 | 0 |
| 22 | Bone Amulet | common | 0 | 2 | 0 | 0 | 5 | 0 |
| 23 | Oracle's Eye | uncommon | 3 | 3 | 0 | 10 | 0 | 0 |
| 24 | Runic Compass | uncommon | 4 | 2 | 3 | 0 | 0 | 10 |
| 25 | Celestial Map | rare | 5 | 2 | 0 | 10 | 0 | 5 |
| 26 | Omphalos Stone | rare | 7 | 10 | 0 | 5 | 10 | 0 |
| 27 | Tablet of Destinies | epic | 9 | 9 | 0 | 15 | 0 | 5 |
| 28 | Prometheus' Flame | epic | 12 | 5 | 0 | 20 | 0 | 0 |
| 29 | Pandora's Fragment | epic | 16 | 16 | 2 | 15 | 10 | 5 |
| 30 | Eye of Providence | legendary | 28 | 28 | 0 | 25 | 15 | 10 |

### 7.6 Mount Catalog (IDs 31–40)

| ID | Name | Rarity | ATK | DEF | AGI | CRIT | BLOCK | DODGE |
|----|------|--------|-----|-----|-----|------|-------|-------|
| 31 | Draft Horse | common | 1 | 2 | 2 | 0 | 0 | 5 |
| 32 | Mule of Hermes | common | 0 | 3 | 3 | 0 | 0 | 10 |
| 33 | War Stallion | uncommon | 3 | 5 | 3 | 5 | 0 | 10 |
| 34 | Sleipnir Pup | uncommon | 5 | 3 | 6 | 0 | 0 | 20 |
| 35 | Storm-Born Horse | rare | 4 | 5 | 5 | 5 | 0 | 15 |
| 36 | Pegasus | rare | 9 | 9 | 8 | 5 | 0 | 20 |
| 37 | Lamassu | rare | 7 | 13 | 4 | 0 | 10 | 10 |
| 38 | Chimera Fragment | epic | 11 | 8 | 6 | 10 | 0 | 15 |
| 39 | Fenrir Pup | epic | 22 | 12 | 8 | 15 | 0 | 20 |
| 40 | Divine Chariot | legendary | 35 | 35 | 10 | 10 | 5 | 25 |

### 7.7 Companion Catalog (IDs 41–50)

| ID | Name | Rarity | ATK | DEF | AGI | CRIT | BLOCK | DODGE |
|----|------|--------|-----|-----|-----|------|-------|-------|
| 41 | Minor Sprite | common | 2 | 1 | 0 | 5 | 0 | 0 |
| 42 | Shade of the Dead | common | 3 | 0 | 1 | 10 | 0 | 5 |
| 43 | Einherjar Scout | uncommon | 6 | 3 | 2 | 10 | 0 | 5 |
| 44 | Sacred Hound | uncommon | 4 | 5 | 2 | 5 | 5 | 5 |
| 45 | Temple Guardian | rare | 2 | 8 | 0 | 0 | 20 | 0 |
| 46 | Olympian Herald | rare | 8 | 8 | 1 | 10 | 5 | 0 |
| 47 | Sumerian Sage | rare | 7 | 10 | 0 | 5 | 10 | 0 |
| 48 | Valkyrie Fragment | epic | 13 | 5 | 3 | 15 | 0 | 10 |
| 49 | Divine Emissary | epic | 20 | 20 | 2 | 15 | 10 | 5 |
| 50 | Bound Titan | legendary | 45 | 20 | 0 | 20 | 15 | 5 |

### 7.8 Faction-Exclusive Items

The `faction_exclusive` column on `pw_items` allows items to be locked to a specific faction. As of the current item catalog, faction exclusivity has not been applied to any of the 50 base equipment items (all have `faction_exclusive = NULL`). The column exists for future use.

### 7.9 Inventory Comparison UI

The Inventory page displays equipped items in slot-grouped panels alongside unequipped inventory. Players can compare an item in their bag against the currently equipped piece in the same slot before equipping. Equipping a new item into a slot automatically unequips the previous occupant.

---

## 8. Loot Rarity Distribution

### 8.1 Design Philosophy

The loot economy is shaped by a deliberate scarcity hierarchy. Epic and Legendary items are progression gates, not participation rewards. A player grinding quests should expect to accumulate common and uncommon gear over dozens of hours before seeing their first rare drop. Epic items are rare enough that they represent meaningful milestones. Legendary items are exclusively obtained through the Glory Shop — the only way to earn enough Glory for them is sustained PvP participation.

This hierarchy was tightened by the loot overhaul migration, which removed legendary items from quest loot tables entirely and sharply reduced epic drop weights in high-tier quests.

### 8.2 Drop Rate Table by Source

| Source | Common | Uncommon | Rare | Epic | Legendary |
|--------|--------|----------|------|------|-----------|
| Quests (Tiers 1–3) | ✓ | ✓ | ✓ | Never | Never |
| Quests (Tier 4) | ✓ | ✓ | ✓ | Very rare (weight 1) | Never |
| Quests (Tier 5) | ✓ | ✓ | ✓ | Very rare (weight 2) | Never |
| Adventures (all tiers) | ✓ | ✓ | ✓ | Never (hard cap) | Never |
| Drachma Shop | ✓ | ✓ | ✓ (occasional) | Never | Never |
| Glory Shop | ✓ | ✓ | ✓ | ✓ | ✓ (6 legendary items) |
| Craftsmanship (any level) | ✓ | ✓ | ✓ | ✓ (high levels) | Never |
| Titan: medium | ✓ | ✓ | ✓ | ~1% | Never |
| Titan: hard | ✓ | ✓ | ✓ | ~5% | Never |
| Titan: extreme | ✓ | ✓ | ✓ | ~17% | ~4% |

### 8.3 Titan Rarity Roll Table (`rollTitanLootRarity`)

| Rarity | Medium | Hard | Extreme |
|--------|--------|------|---------|
| Common | 55% | 35% | 12% |
| Uncommon | 32% | 38% | 35% |
| Rare | 12% | 22% | 32% |
| Epic | 1% | 5% | 17% |
| Legendary | 0% | 0% | 4% |

**Rank bumps:** Top contributor (rank 1) always receives +1 rarity tier. Ranks 2–3 have a 50% chance of +1 rarity tier. Medium and hard events cap at epic after rank bumps. Extreme events cap at legendary.

---

## 9. Consumables & Daily Limits

Consumable items occupy the `consumable` slot in `pw_items`. They are used on demand and are not equipped. Four health potion tiers, four energy potion tiers, one full-restore glory item, and two stat-reset items make up the consumable catalog.

### 9.1 Health Potions

| Name | Rarity | Level | Effect | Value | Buy Price | Sell |
|------|--------|-------|--------|-------|-----------|------|
| Minor Healing Tonic | common | 1 | restore_health_pct | 25% of health_max | 150₯ | 30₯ |
| Healing Draught | uncommon | 5 | restore_health_pct | 50% of health_max | 300₯ | 60₯ |
| Greater Healing Potion | rare | 15 | restore_health_pct | 75% of health_max | 600₯ | 120₯ |
| Ambrosia Flask | epic | 25 | restore_health (full) | 9999 (effectively full) | not in shop | 200₯ |

### 9.2 Energy Potions

| Name | Rarity | Level | Effect | Value | Buy Price | Sell |
|------|--------|-------|--------|-------|-----------|------|
| Minor Energy Tonic | common | 1 | restore_energy_pct | 25% of energy_max | 150₯ | 30₯ |
| Energy Draught | uncommon | 5 | restore_energy_pct | 50% of energy_max | 300₯ | 60₯ |
| Greater Energy Potion | rare | 15 | restore_energy_pct | 75% of energy_max | 600₯ | 120₯ |
| Aether Flask | epic | 25 | restore_energy_pct | 100% of energy_max | not in shop | 200₯ |

Energy potions purchased from the Drachma Shop count against the 5/day purchase limit. All energy potion uses (from any source) count against the 10/day use limit.

### 9.3 Stat Reset Consumables

| Name | Rarity | Effect | Buy Price | Sell | Glory Price |
|------|--------|--------|-----------|------|-------------|
| Scroll of Reinvention | uncommon | Reallocates all stat points | not for sale | 750₯ | — |
| Tablet of Reinvention | epic | Reallocates all stat points | not for sale | 0₯ | 50 Glory |

The Scroll of Reinvention is given free to every player at signup. It can be sold but cannot be repurchased with Drachma. The only way to obtain another stat reset is to buy the Tablet of Reinvention from the Glory Shop.

### 9.4 Divine Restoration

| Name | Rarity | Level | Effect | Glory Price | Daily Limit |
|------|--------|-------|--------|-------------|-------------|
| Divine Restoration | legendary | 50 | restore_full (HP + energy to max) | 50 Glory | 1 / day |

Divine Restoration restores both health and energy to their full maximums in a single use. Because it affects both resources, it counts against both the health-potion-uses daily limit and the energy-potion-uses daily limit when used.

### 9.5 Removed Consumable: Divine Surge

Divine Surge was a legendary energy-restoration consumable that previously appeared in the Glory Shop. It was removed via the `craftsmanship-potion-overhaul.sql` migration: its `buy_price` and `glory_price` were set to NULL, and all copies were deleted from player inventories. The item row remains in the database for historical integrity but is no longer obtainable or usable.

### 9.6 Daily Limit Reset Mechanism

All daily counters reset at UTC midnight using an integer day seed (`floor(Date.now() / 86400000)`). If the stored `energy_potion_reset_day` differs from the current seed, the server resets `energy_potion_uses_today` to 0. Health and Divine Restoration counters follow the same pattern.

---

## 10. Shops

Two shops serve different economic tiers of the game. Both rotate daily using a UTC day seed and the Mulberry32 PRNG, ensuring all players see the same rotation on a given day.

### 10.1 Drachma Shop

The Drachma Shop provides a rotating selection of common-to-rare equipment plus always-available consumables. Its purpose is to give players a reliable path to mid-tier gear without depending entirely on quest drop luck.

**Rotation:** Daily. Seed: `floor(Date.now() / 86400000)`. Items are picked from the pool of `pw_items WHERE buy_price IS NOT NULL` (equipment slots only — consumables are always available, not rotated).

A player's level gating applies: items with `level_required` above the player's level are shown but grayed out and unpurchasable.

### 10.2 Glory Shop

The Glory Shop is a prestige economy layer. It provides the only reliable source of legendary equipment and the only renewable source of stat reset items. Glory is earned exclusively through PvP, making the Glory Shop the primary PvP motivation for endgame players.

**Rotation:** Daily. Seed: same UTC day formula. Rotating pool picks from legendary equipment and other high-value items with `glory_price IS NOT NULL`.

**Always-available items in the Glory Shop:**
- Tablet of Reinvention (50 Glory)
- Divine Restoration (50 Glory, 1/day limit)

**Legendary equipment prices (post all migrations):**

| Item | Glory Price |
|------|-------------|
| Godkiller Blade (ID 9) | 300 |
| Gungnir (ID 10) | 480 |
| Shield of Aegis (ID 20) | 360 |
| Eye of Providence (ID 30) | 600 |
| Divine Chariot (ID 40) | 720 |
| Bound Titan (ID 50) | 900 |

### 10.3 Rotation Seed Mechanism

Both shops use `pickRotatedItems(allItems, seed, count)`: Mulberry32-seeded Fisher-Yates shuffle of the eligible item pool, taking the first `count` items. The same seed produces the same rotation deterministically, so the shop resets precisely at UTC midnight without any cron job.

---

## 11. Temples (Passive Income)

Temples are persistent owned properties that generate Drachma income in real time. They are the equivalent of Mafia Wars' "properties" — long-term investments that compound idle income for players who stay logged in across sessions.

### 11.1 Temple Catalog

Five temples are available to all players regardless of faction. Each has a purchase cost, base income per hour, and minimum level requirement.

| Type | Name | Base Cost | Income/hr | Level Req |
|------|------|-----------|-----------|-----------|
| roadside_shrine | Roadside Shrine | 500₯ | 10₯ | 1 |
| minor_temple | Minor Temple | 2,500₯ | 40₯ | 10 |
| grand_temple | Grand Temple | 15,000₯ | 200₯ | 25 |
| divine_fortress | Divine Fortress | 100,000₯ | 1,000₯ | 50 |
| pantheon_citadel | Pantheon Citadel | 500,000₯ | 4,000₯ | 75 |

A player can own at most one of each temple type (`UNIQUE (user_id, temple_id)` constraint in `pw_player_temples`).

### 11.2 Upgrade Levels and Costs

Temples can be upgraded from level 1 to level 25 (maximum level was extended from 10 by the `phase14-temples` migration). Upgrades are instant — there is no timer. The cost per upgrade is tiered by the current level:

| Level Range | Upgrade Cost Per Level |
|-------------|----------------------|
| 0–9 | `0.5 × base_cost` |
| 10–19 | `1.0 × base_cost` |
| 20–24 | `2.0 × base_cost` |

For example, upgrading a Roadside Shrine from level 0 to level 9 costs `9 × 250₯ = 2,250₯`. Upgrading from level 10 to level 19 costs `10 × 500₯ = 5,000₯`. Levels 20–24 cost `5 × 1,000₯ = 5,000₯`.

### 11.3 Income Formula

Temple income is calculated within `regenPlayer()` on every authenticated request:

```
templeIncomeMultiplier(level) = 1 + (0.234 × level^1.03)
income = temple.income_per_hour × templeIncomeMultiplier(level) × hoursElapsed
```

A level-1 Roadside Shrine earns roughly 12.3₯/hr. A level-25 Pantheon Citadel earns roughly 26,000₯/hr.

### 11.4 Faction and Class Multipliers

| Modifier | Effect |
|----------|--------|
| Broker class | ×1.20 to all temple income |
| Annunaki faction | ×1.05 to all temple income |

These multipliers stack multiplicatively.

---

## 12. Township & Professions

Township is the mid-to-endgame upgrade system that applies passive multipliers to nearly every core system in the game. Unlike Temples (which provide raw Drachma), Township Professions provide percentage-based improvements to XP rate, Drachma rate, regen speed, combat stats, and adventure rewards — and unlock the Craftsmanship cycle system at the deepest level.

### 12.1 Overview

Each profession starts at level 0 (unestablished). A player establishes a profession by paying its establishment cost; this sets it to level 1. Subsequent upgrades increase the level, with each upgrade taking real time and costing a scaled amount of Drachma.

`checkAndCompleteUpgrades()` runs at the top of every authenticated `game.js` handler, resolving any completed upgrades silently in the background.

### 12.2 Profession Catalog

| # | Type | Name | Bonus Type | Bonus per Level | Bonus at Max (Lvl 100) | Establish Cost | Level Req |
|---|------|------|------------|-----------------|------------------------|----------------|-----------|
| 1 | stewardship | Stewardship | energy_regen_pct | +10% | +150% | 500₯ | 20 |
| 2 | ritual | Ritual | health_regen_pct | +10% | +150% | 500₯ | 20 |
| 3 | commerce | Commerce | drachma_pct | +3% | +120% | 2,000₯ | 25 |
| 4 | divination | Divination | xp_pct | +1% | +100% | 7,500₯ | 35 |
| 5 | exploration | Exploration | adventure_reward_pct | +1% | +100% | 10,000₯ | 40 |
| 6 | fortification | Fortification | flat_defense | +1 | +100 | 20,000₯ | 45 |
| 7 | warfare | Warfare | flat_attack | +1 | +100 | 20,000₯ | 50 |
| 8 | craftsmanship | Craftsmanship | craft_cycle | — | — | 30,000₯ | 60 |

Professions use a linear interpolation between level 1 and level 100 to determine their current bonus value:
```
pct = (level - 1) / 99
value = bonus_per_level + (bonus_at_max - bonus_per_level) × pct
```
At level 1, a profession provides exactly its `bonus_per_level`. At level 100, it provides `bonus_at_max`. Intermediate levels interpolate linearly.

### 12.3 Upgrade Formulas

```js
// Drachma cost to upgrade from level N to N+1
upgradeCost(initialCost, currentLevel) = floor(initialCost × currentLevel^1.7)

// Real time duration of an upgrade from level N to N+1
upgradeSeconds(currentLevel) = floor(5 × 60 × currentLevel^1.3)
```

Examples for Stewardship (500₯ establish cost):
- Level 1 → 2: 500₯, ~5 minutes
- Level 10 → 11: ~31,000₯, ~1.3 hours
- Level 50 → 51: ~1,400,000₯, ~13.6 hours
- Level 99 → 100: ~28,000,000₯, ~29 hours

### 12.4 Craftsmanship (8th Profession — Special)

Craftsmanship does not add a passive stat bonus. Instead, establishing it at level 60 unlocks the crafting cycle system — a timed production loop that generates equipment items up to epic rarity.

**Cycle Mechanics:**
- One active or ready cycle per player at a time (enforced by unique index on `pw_craftsmanship_cycles WHERE status != 'claimed'`).
- The player starts a cycle manually. Energy is not consumed. Drachma is not consumed per cycle.
- On completion (`checkAndCompleteCrafts`): `status` → `'ready'`, and `rolled_rarity` + `rolled_item_id` are determined and stored.
- The player must actively claim the result — cycles do not auto-collect. On claim, the item is added to inventory and a new cycle starts automatically.
- Legendary items are never produced by Craftsmanship. Maximum rarity is epic.

**Cycle Duration Formula:**
```
getCraftCycleSeconds(level) = 86400 - ((level - 1) × 436)
```
- Level 1: 86,400 seconds (24 hours)
- Level 100: ~43,236 seconds (~12 hours)

**Rarity Probability by Level Band:**

| Craft Level | Common | Uncommon | Rare | Epic |
|-------------|--------|----------|------|------|
| 1–9 | 100% | 0% | 0% | 0% |
| 10–19 | 85% | 15% | 0% | 0% |
| 20–29 | 65% | 35% | 0% | 0% |
| 30–39 | 45% | 45% | 10% | 0% |
| 40–49 | 30% | 50% | 20% | 0% |
| 50–59 | 20% | 55% | 24% | 1% |
| 60–69 | 15% | 50% | 32% | 3% |
| 70–79 | 12% | 45% | 37% | 6% |
| 80–89 | 10% | 40% | 42% | 8% |
| 90–100 | 8% | 35% | 45% | 12% |

---

## 13. PvP Combat

### 13.1 Overview

PvP allows aligned players to attack opponents of the opposing alignment (and any player below level 10). Victory earns Glory. No XP or Drachma transfers hands — PvP is purely a Glory economy.

### 13.2 Initiation Rules

- **Energy cost:** `max(1, ceil(attackerLevel / 10))` — scales with level.
- **Level restriction:** Attackers cannot attack targets more than 4 levels below them. Attacking much-higher-level targets is allowed (a brave choice).
- **Alignment restriction:** Coalition attacks Compact (or unaligned < level 10). Compact attacks Coalition (or unaligned < level 10). Unaligned players can only attack other unaligned players.
- **HP check:** Targets with 0 current health do not appear in the target list.
- **Cooldown:** 5-minute per-target cooldown enforced via the combat log timestamp, preventing repeated farming of the same player.

### 13.3 Round-Based Combat Resolution

`simulateCombat()` runs 5 rounds of simulated combat between the attacker and defender. In each round:
1. The attacker strikes first.
2. If the strike does not fully eliminate virtual HP, the defender counter-strikes.

**Critical mechanic:** The defender's real health is **never modified** by PvP. The defender always fights at a virtual 100 HP. Only the attacker's real health matters in combat — specifically, the attacker's HP is restored on a win.

### 13.4 Per-Round Outcomes

| Outcome | Trigger | Damage |
|---------|---------|--------|
| Miss (dodge) | Defender dodge roll succeeds | 0 |
| Hit (base) | No special roll | `max(1, attack - defenseReduction)` |
| Crit | Attacker crit roll succeeds | `base × 1.5` |
| Block | Defender block roll succeeds | `base × 0.4` (60% reduction) |
| Counter | `defenderAgility × 0.5%` chance | `base × 0.5`; 50% chance this is also a half-crit |

**Defense mitigation:** Curved formula — each point of defense provides diminishing returns at high values. Maximum reduction is capped at ~50%.

### 13.5 Combat Stat Sources

| Stat | Sources | Cap |
|------|---------|-----|
| Crit chance | Slayer class: +10%; Olympian faction: +5%; weapon `crit_chance` | 75% |
| Block chance | Warden class: +10%; Annunaki faction: +5%; armor `block_chance` | 75% |
| Dodge chance | Oracle class: +5%; Aesir faction: +5%; agility (×0.5% per point); item `dodge_chance` | 75% |
| Attack | Base attack + Warfare township + equipment `attack_bonus` | — |
| Defense | Base defense + Fortification township + equipment `defense_bonus` | — |

### 13.6 Combat Outcomes

| Result | Attacker Gains | Defender Gains |
|--------|---------------|----------------|
| Win | Glory (Compact: ×1.10); +30% health_max restore | Compact defender only: consolation Glory = `min(20, floor(defLevel / 5))` |
| Loss | Nothing | — |

No XP or Drachma is earned or transferred in PvP.

### 13.7 The Fatigued State

Fatigued is a debuff applied mid-Titan fight (not in standard PvP) when Enlil's `divine_storm` ability drains a player's energy to 0. A Fatigued player loses access to crit, block, and dodge for the remainder of that Titan encounter — they can still deal and receive damage, but at greatly reduced effectiveness.

### 13.8 Combat Log

Every PvP fight is recorded in `pw_combat_log` with the full `rounds JSONB` array. Players can review their combat history at `/games/pantheon-wars/pvp/log`.

---

## 14. Titan Events

Titan Events are cooperative PvE boss fights that bring the entire player base together against a shared threat. They are the primary source of epic-tier loot and the only source of legendary loot outside the Glory Shop.

### 14.1 Event Lifecycle

Titan events cycle through the pool of 8 Titans using a scheduling function (`scheduleNextTitanEvent`) that queues the next event after each resolution.

1. **Queued:** `status = 'queued'`, `starts_at` is set in the future. Players cannot yet participate.
2. **Active:** `status = 'active'`, players join by committing energy via `handleTitanJoin`. Energy is spent immediately and locked in.
3. **Completed:** `status = 'completed'`, fight resolved, `result JSONB` populated, rewards distributed to `pw_pending_rewards` for each participant.

### 14.2 Cron Schedule

The Titan event system is driven by two Vercel cron jobs that fire at **13:00 UTC** and **01:00 UTC** daily. Both call `processExpiredTitanEvents()`, which:
1. Resolves any active fights whose `ends_at <= NOW()`.
2. Starts any queued fights whose `starts_at <= NOW()`.
3. Persists Enlil-specific energy drain totals.
4. Calls `scheduleNextTitanEvent` to queue the subsequent fight.

The same `processExpiredTitanEvents()` function also runs inline at the top of every authenticated `game.js` handler (protected by a Postgres advisory lock `847391` to prevent concurrent execution).

### 14.3 Admin Trigger

Administrators can force the next queued Titan event to start immediately via `handleTitanAdminTrigger` in `game.js`. This is used for testing and server-side event management.

### 14.4 Titan Roster

| Slug | Name | Pantheon | Difficulty | HP Multiplier | Base ATK | Base DEF | Ability | Loot Floor |
|------|------|----------|-----------|---------------|----------|----------|---------|------------|
| kronos | Kronos, Devourer of Time | Greek | extreme | 2.5 | 80 | 60 | time_dilation | epic |
| tiamat | Tiamat, Mother of Chaos | Mesopotamian | extreme | 2.4 | 75 | 70 | chaos_surge | legendary |
| ymir | Ymir, the Frost Primordial | Norse | hard | 2.0 | 60 | 50 | frost_veil | epic |
| atlas | Atlas, the Sky-Bearer | Greek | medium | 1.6 | 55 | 45 | crushing_weight | rare |
| nergal | Nergal, Lord of the Dead | Mesopotamian | hard | 2.2 | 70 | 55 | death_aura | epic |
| surtr | Surtr, the Black Flame | Norse | extreme | 2.6 | 90 | 50 | ragnarok_flame | legendary |
| hecate | Hecate, Mistress of Magic | Greek | medium | 1.7 | 50 | 60 | arcane_disrupt | rare |
| enlil | Enlil, the Storm Sovereign | Mesopotamian | hard | 2.1 | 65 | 50 | divine_storm | epic |

### 14.5 Titan Abilities

Each Titan has a unique ability that modifies how the fight resolves for participants.

| Ability | Titan | Exact Mechanic |
|---------|-------|----------------|
| `time_dilation` | Kronos | Reduces XP earned from the fight by 20% for all participants. Intended to slow the fastest levelers from using Titan Events as an XP-per-energy farm. |
| `chaos_surge` | Tiamat | Disrupts each player's contribution by 35% (random chance per player). The most punishing ability for underprepared players. |
| `frost_veil` | Ymir | Reduces the top defenders' contribution by 15%. Specifically punishes coordinated tank-heavy groups. |
| `crushing_weight` | Atlas | Reduces all participants' damage by 25%. The most straightforward ability — a flat HP buffer. |
| `death_aura` | Nergal | Deals flat damage to all participants (ability_value = 0 — the value is applied as a divisor to contribution calculations, not direct HP damage). |
| `ragnarok_flame` | Surtr | On the kill round, Surtr explodes for 100% of his total HP as AoE against all participants. The explosion damage is absorbed but noted in the result payload. |
| `arcane_disrupt` | Hecate | Disrupts 20% of each player's artifact and magic-type contribution. Players with low artifact stats are less affected. |
| `divine_storm` | Enlil | Drains `ability_value` (5) energy from each participant per combat phase. Players whose energy reaches 0 become **Fatigued** for the remainder of the fight: no crit, no block, no dodge. Energy drained is tracked in `energy_drained` column on `pw_titan_participants`. |

Fatigued exists because Titans like Enlil can drain a participant's energy mid-fight, forcing them into a weakened state where they lose all defensive and offensive special capabilities until energy returns post-fight.

### 14.6 Fight Simulation

`simulateTitanFight(titan, participants)` runs on the server when an event resolves:

```
totalPlayerPower = Σ calculatePowerRating(stats, equipBonuses) for each participant

calculatePowerRating(stats, equip) =
  stats.attack + stats.defense + stats.agility
  + equip.attack + equip.defense + equip.agility
  + stats.level × 2

titanHP = max(1000, floor(totalPlayerPower × 8 × base_hp_multiplier × count^1.2 / count))
```

The fight duration scales with participant count and difficulty, producing 4–40 simulated rounds.

### 14.7 Reward Distribution

| Metric | Medium | Hard | Extreme |
|--------|--------|------|---------|
| XP (base participant) | 200 | 300 | 500 |
| XP (top contributor) | 300 | 450 | 750 |
| Drachma (base) | 2,000₯ | 3,000₯ | 5,000₯ |
| Drachma (top contributor) | 3,000₯ | 4,500₯ | 7,500₯ |
| Potion drop chance (top) | 100% | 100% | 100% |
| Potion drop chance (base) | 80% | 80% | 80% |
| Loot drop chance (top) | 60% | 60% | 60% |
| Loot drop chance (base) | 25% | 25% | 25% |

Contribution rank is determined by energy committed relative to total energy pool. Rank 1 is the top contributor; ranks 2–3 receive the rank-bump rarity bonus.

---

## 15. Codex

### 15.1 Overview

The Codex is an in-game encyclopedia accessible at `/games/pantheon-wars/codex`. It serves as the canonical reference for lore, mechanics, and game systems. Players consult it to understand faction bonuses, what their class can do, how combat works, and what Titans they'll face. The Codex uses a two-tier navigation: category → entry → detail modal.

### 15.2 Category Index

| ID | Label | Color | Data Source |
|----|-------|-------|-------------|
| lore | LORE | `#9F7AEA` | Static |
| factions | FACTIONS | `#F5C542` | Static |
| classes | CLASSES | `#E07B5C` | Static |
| alignments | ALIGNMENTS | `#A78BFA` | Static |
| professions | PROFESSIONS | `#A8C97A` | API (`?action=codex`) |
| titans | TITANS | `#DC2626` | API (`?action=codex`) |
| loot | LOOT | `#3B82F6` | Static |
| combat | COMBAT | `#FBBF24` | Static |
| quests | QUESTS | `#10B981` | Static |
| adventures | ADVENTURES | `#06B6D4` | Static |

### 15.3 Static Content Inventory

**LORE (5 entries):** Kishar, The Unraveling, The Eternal Accord, Ermanôs The Betrayer, The Three Heritages.

**FACTIONS (3 entries):** Olympians, Aesir, Annunaki — each with lore narrative + mechanical bonuses.

**CLASSES (4 entries):** Warden, Oracle, Slayer, Broker — each with starting bonuses, per-level growth, and combat role summary.

**ALIGNMENTS (2 entries):** Pantheon Coalition, Mortal Compact — each with alignment bonus and PvP economy note.

**LOOT (5 entries):** Common, Uncommon, Rare, Epic, Legendary — each with `drops_from`, approximate `drop_rate`, and flavor note.

**COMBAT (6 entries):** Combat Rounds, Attack & Defense, Crit/Block/Dodge, The Fatigued State, Agility, Victory & Recovery.

**QUESTS (1 entry):** What Are Quests? (includes 3 gameplay tips).

**ADVENTURES (1 entry):** What Are Adventures? (includes 3 gameplay tips).

### 15.4 Dynamic Content

**PROFESSIONS:** All 8 rows from `pw_township_upgrades`, fetched live from the database. Displays `bonus_type`, `bonus_per_level`, `bonus_at_max`, `initial_cost`, `level_required`.

**TITANS:** All 8 rows from `pw_titans`, fetched live. Displays `ability_name`, `ability_description`, full stats grid (difficulty, HP mult, ATK, DEF, loot floor).

Dynamic content ensures the Codex reflects the current state of the database without requiring manual content updates.

### 15.5 Detail Modal

Entry selection opens a portal modal anchored to `document.body`. The modal shows: category label chip, entry title, subtitle, body text (paragraph-split), and a mechanics section whose content varies by category type. ESC key closes.

---

## 16. Live Chat

Live Chat is a Pusher-powered real-time messaging layer integrated into the bottom of every game page. Three channels serve different social contexts.

### 16.1 Channels

| Channel | `channel_type` | Audience | Pusher Channel |
|---------|----------------|----------|----------------|
| General | `general` | All authenticated players | `general` (public Pusher channel) |
| Mod | `mod` | Moderators only | `private-mod` (Pusher private channel) |
| DM | `dm` | Two-player threads | `private-user-{userId}` per recipient |

### 16.2 Pusher Architecture

All real-time delivery uses Pusher (cluster from `PUSHER_CLUSTER` env var, TLS enabled). The server singleton is `lib/pwPusher.js` via `getPusherServer()`. Messages sent via the API are immediately broadcast to the relevant Pusher channel; clients subscribed to that channel receive them within milliseconds.

Private channels (mod, DMs) require Pusher channel authentication via `chat_pusher_auth` — the server verifies the player's session before issuing a Pusher auth token.

### 16.3 Rate Limiting

`checkChatRateLimit()` enforces a maximum of **5 messages per 30 seconds** per player. Rate limits are checked against recent message timestamps in the database, not in memory, so they survive across serverless function cold starts.

### 16.4 Message Buffer

The general channel API returns the last 100 messages on load. Older messages are not paginated — the rolling window is a design choice to keep chat fresh rather than historically exhaustive.

### 16.5 DM Thread Architecture

Direct messages use `pw_chat_dm_threads` — a canonical pairing table with a `CHECK (user_a_id < user_b_id)` constraint that ensures each pair has exactly one thread regardless of who initiates. Read state is tracked per-user per-thread in `pw_chat_dm_read_state` via `last_seen_id`, which drives unread dot indicators in the UI.

### 16.6 The /w Command

Typing `/w username` in any chat input opens a DM thread with the specified player. The same DM can also be initiated by clicking on a player's username in the general channel. Clicking a username auto-fills `/w username` into the input.

### 16.7 UI Layout

The chat bar sits at the bottom of every game page as a collapsible strip. It expands to show the message list and input. Players switch between General and their DM list using tabs. The bar is bottom-anchored and does not interfere with page scroll.

---

## 17. Moderator System

### 17.1 Separate Identity

Moderators are not players. `pw_moderators` is a completely separate table from `pw_users`. A moderator who also plays the game has two distinct identities — their player account in `pw_users` and their mod account in `pw_moderators` — with separate sessions (`pw_session` cookie for the player, `fp_mod` cookie for the moderator).

The `requireUserWithModCheck` middleware in `lib/pwAuth.js` resolves both sessions simultaneously. A player-moderator has both `req.userId` and `req.modId` set on the same request.

### 17.2 Moderator Invitation Flow

1. An administrator generates an invite token via the Admin Panel, which is stored (hashed) in `pw_moderator_invites`.
2. The invite URL is shared out-of-band.
3. The invitee registers at the mod registration endpoint with the token, which creates a `pw_moderators` row.
4. Invites expire and can only be used once.

### 17.3 Moderation Actions

All moderation actions are stored in `pw_chat_moderations`. Lifted actions set `lifted_at` + `lifted_by` without deletion, preserving the audit record.

| Action | Effect | Scope | Reversible |
|--------|--------|-------|------------|
| `mute` | Player cannot send general messages for `duration_minutes` | Channel or global | Yes |
| `timeout` | Player muted globally for duration | Global | Yes |
| `ban` | Player excluded from chat entirely | Global | Yes |
| `kick` | Immediate removal signal sent to client | N/A (instant) | No |
| `delete_msg` | Soft-deletes a specific message (`deleted_at` set) | Single message | No |

**Timeout duration presets** are available in the admin UI: 15 minutes, 1 hour, 24 hours, 7 days, permanent.

### 17.4 System Messages

Moderation events generate system messages broadcast to the relevant channel. System messages use `is_system = TRUE` and display in a distinct visual style. Example: `[MOD] kylo123 has been muted for 1 hour.`

### 17.5 Mod Chat Badge

Moderators have a `show_chat_badge` boolean in `pw_moderators`. When `true`, a `[MOD]` badge is appended to the moderator's username in chat. Moderators can toggle this via `chat_set_mod_badge`.

### 17.6 Audit Log

`pw_moderator_actions` (BIGSERIAL) records every moderation action with `moderator_id`, `target_user_id`, `action_type`, and `details JSONB`. The `moderator_id` foreign key is `ON DELETE SET NULL`, so the audit record survives if a moderator account is later removed.

The Admin Panel exposes active moderations via `chat_list_moderations` and allows lifting them via `chat_lift_moderation`.

---

## 18. Pending Rewards System

### 18.1 The Problem Solved

Adventures and Titan Events both resolve asynchronously — the player may not be online when the reward is calculated. The Pending Rewards system bridges this gap by persisting the fully-computed reward payload until the player acknowledges it, regardless of when they return.

### 18.2 Table Schema

```
pw_pending_rewards:
  id               SERIAL PK
  user_id          UUID REFERENCES pw_users
  reward_type      VARCHAR(30) CHECK IN ('adventure', 'titan')
  source_id        INTEGER          -- adventure ID or titan_event ID
  reward_payload   JSONB            -- complete reward: XP, drachma, loot item, potion, etc.
  created_at       TIMESTAMPTZ
  acknowledged_at  TIMESTAMPTZ      -- NULL until player views the reward
```

An index on `(user_id) WHERE acknowledged_at IS NULL` ensures the "do I have pending rewards?" check is fast on every page load.

### 18.3 Adventure Completion Flow

`checkAndCompleteAdventures()` (runs inline on every authenticated request):
1. Finds adventures with `completes_at <= NOW()` and `status = 'active'`.
2. Computes the reward payload (XP, Drachma, optional loot item).
3. Writes the payload to `pw_pending_rewards`.
4. Sets `pw_player_adventures.status = 'completed'`.

### 18.4 Modal Acknowledgment Flow

1. On every page load, the frontend queries for `acknowledged_at IS NULL` rewards.
2. `AdventureRewardModal` displays the reward breakdown.
3. Player dismisses the modal → frontend calls the acknowledge endpoint → `acknowledged_at = NOW()`.

The XP, Drachma, and items in the payload were already applied to the player's stats at completion time. The modal is a notification, not a claim gate — the reward is already banked.

---

## 19. Leveling

### 19.1 XP Formula

XP required to advance from level N to level N+1:

```
threshold(N) = floor(100 × N^1.5)
```

| Level | XP to Next Level | Cumulative XP to Reach Level |
|-------|-----------------|------------------------------|
| 1 → 2 | 100 | 100 |
| 5 → 6 | 1,118 | ~3,700 |
| 10 → 11 | 3,162 | ~18,000 |
| 25 → 26 | 12,500 | ~155,000 |
| 50 → 51 | 35,355 | ~1,100,000 |
| 75 → 76 | 64,952 | ~3,500,000 |
| 99 → 100 | ~98,000 | ~15,000,000 |

### 19.2 Level-Up Grants

On every level-up:
- +5 Stat Points to allocate.
- +2 Energy Max (permanent).
- +10 Health Max (permanent).
- Full Energy + Health restore.
- Per-class permanent bonus: Warden +1 Defense; Oracle +1 Energy Max; Slayer +1 Attack.

### 19.3 Stat Point Allocation

Stat Points are distributed into three combat stats: Attack, Defense, Agility. One point equals one point in the chosen stat. There is no per-stat cap. All three stats are used in combat calculations:
- **Attack** — raw damage output.
- **Defense** — damage mitigation (curved, max ~50%).
- **Agility** — contributes to dodge chance (`agility × 0.5%` per point).

### 19.4 Starting Stats

Every player begins with the following base stats, modified by class and faction at signup:

```
attack:      5   (Slayer: 10)
defense:     5   (Warden: 10)
agility:     5   (Aesir: 7)
energy_max: 20   (Oracle: 25)
health_max: 100
drachma:   500   (Broker: 750)
stat_points: 0
```

### 19.5 Maximum Level

The soft cap is level 100. XP still accrues beyond level 100 for leaderboard purposes, but no further level-up grants are awarded.

---

## 20. Leaderboards

### 20.1 Overview

Leaderboards are live-queried from `pw_player_stats` on every request — there is no batch job or separate leaderboard table. The `ORDER BY` + `LIMIT` query is fast due to dedicated indexes on the relevant columns.

### 20.2 Sort Axes

| Axis | Column | Notes |
|------|--------|-------|
| Level | `level DESC` | Primary leaderboard; most visible |
| Glory | `glory_lifetime DESC` | Uses `glory_lifetime` (not spendable balance) so spending Glory doesn't drop rank |
| Drachma | `drachma_lifetime DESC` | Lifetime earned, not current balance |

### 20.3 Faction Filters

Each sort axis supports faction filters: All, Olympians, Aesir, Annunaki. The global leaderboard shows all players. Per-faction leaderboards filter by `pw_users.faction`.

---

## 21. Authentication & Account Recovery

### 21.1 Player Authentication

| Property | Value |
|----------|-------|
| Cookie name | `pw_session` |
| Cookie flags | HttpOnly, Secure, SameSite=Strict |
| Session duration | 7 days |
| Session storage | `pw_user_sessions` table |
| Password hashing | bcrypt, 12 rounds |
| Library | `lib/pwAuth.js` |

**Key `pwAuth.js` functions:**
- `hashPassword(password)` → bcrypt hash
- `verifyPassword(password, hash)` → boolean
- `createUserSession(userId, res)` → inserts row, sets cookie
- `validateUserSession(req)` → returns userId or null
- `revokeUserSession(sessionId)` → deletes row
- `requireUser(handler)` → middleware; returns 401 if unauthenticated
- `requireUserWithModCheck(handler)` → middleware; also resolves mod session; sets `req.modId`, `req.modUsername`, `req.modShowBadge`

### 21.2 Security Questions

At signup, players provide a security question and answer. The answer is stored as a bcrypt hash (`security_answer_hash`). Security questions are used as the first authentication factor in the password reset flow.

### 21.3 Password Reset Flow

1. Player submits their username and security question answer on `/forgot-password`.
2. If the answer matches `security_answer_hash`, the server generates a reset token, stores it hashed in `pw_password_reset_tokens`, and sends the reset URL via Resend email delivery.
3. The player visits `/reset-password` with the token in the URL.
4. On submission, the token is validated (must be unused, not expired), the new password is hashed and stored, and `used_at` is set on the token row.

The system enforces a maximum of 3 password reset requests per day per account.

### 21.4 Moderator Authentication

Moderators authenticate through a separate flow managed by `lib/modAuth.js`. The moderator session uses the `fp_mod` cookie and is stored in `pw_moderator_sessions`. Validation of both player and moderator sessions happens simultaneously in `requireUserWithModCheck`.

### 21.5 Site Admin Authentication

The freshprints.dev site admin (distinct from game moderation) uses the `fp_admin` cookie and `admin_sessions` table. The site admin password is the `ADMIN_PASSWORD_HASH` environment variable. This auth layer gates the `/admin` route on freshprints.dev and is unrelated to game moderation.

---

## 22. Admin System

### 22.1 Two Separate Admin Contexts

Pantheon Wars has two distinct administrative surfaces, both accessible to the same person (Kyle) but with different scopes:

**Site Admin (freshprints.dev `/admin`):**
- Auth: `fp_admin` cookie, `ADMIN_PASSWORD_HASH` env var.
- Purpose: freshprints.dev analytics — visitor tracking, page views, top paths, recent events.
- Provides: 4 stat cards, 30-day area chart, top paths table, recent events list.

**Game Admin (In-Game Titan Panel):**
- Auth: either `CRON_SECRET` bearer token or a valid site admin session (verified via `requireAdmin`).
- Purpose: manually trigger the next queued Titan event to start immediately.
- Used for: testing, live server management, ensuring a Titan fight is active during peak hours.

### 22.2 AdminTitanPanel

The AdminTitanPanel is accessible within the Titan Events page to authenticated admins. It exposes a single action: "Force Start" — which calls `handleTitanAdminTrigger` to advance the queued event to active status without waiting for the cron schedule.

### 22.3 AdminModeratorPanel

The AdminModeratorPanel surfaces inside the game admin context and provides:
- List of active (non-expired, non-lifted) moderation actions.
- Ability to lift any active moderation early.
- Moderator invite generation (creates a `pw_moderator_invites` row).
- View of the moderator audit log from `pw_moderator_actions`.

---

## 23. Database Schema

All game tables use the `pw_` prefix. Site analytics tables (`visitors`, `sessions`, `events`, `admin_sessions`) share the same Neon Postgres instance without prefix conflicts.

### 23.1 Site Analytics Tables

```sql
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  page_count INTEGER DEFAULT 0
);

CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions,
  event_type TEXT,
  path TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### 23.2 Player Tables

```sql
CREATE TABLE pw_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  faction VARCHAR(20),         -- 'olympians' | 'aesir' | 'annunaki'
  class VARCHAR(20),           -- 'warden' | 'oracle' | 'slayer' | 'broker'
  alignment VARCHAR(20),       -- 'coalition' | 'compact' | NULL
  security_question TEXT,
  security_answer_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_player_stats (
  user_id UUID PRIMARY KEY REFERENCES pw_users,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  drachma INTEGER DEFAULT 500,
  glory INTEGER DEFAULT 0,
  glory_lifetime INTEGER DEFAULT 0,
  attack INTEGER DEFAULT 5,
  defense INTEGER DEFAULT 5,
  agility INTEGER DEFAULT 5,
  stat_points INTEGER DEFAULT 0,
  energy_current INTEGER DEFAULT 20,
  energy_max INTEGER DEFAULT 20,
  health_current INTEGER DEFAULT 100,
  health_max INTEGER DEFAULT 100,
  energy_regen_base TIMESTAMPTZ DEFAULT NOW(),
  health_regen_base TIMESTAMPTZ DEFAULT NOW(),
  energy_potion_uses_today INTEGER DEFAULT 0,
  energy_potion_reset_day INTEGER DEFAULT 0,
  health_potion_uses_today INTEGER DEFAULT 0,
  divine_restoration_purchases_today INTEGER DEFAULT 0
);

CREATE TABLE pw_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 23.3 Quest Tables

```sql
CREATE TABLE pw_quests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  drachma_reward INTEGER NOT NULL,
  energy_cost INTEGER NOT NULL,
  loot_chance INTEGER,
  duration_minutes INTEGER DEFAULT 5,
  faction_bonus VARCHAR(20),
  faction_bonus_type VARCHAR(30),
  faction_bonus_value INTEGER,
  class_bonus VARCHAR(20),
  class_bonus_type VARCHAR(30),
  class_bonus_value INTEGER
);

CREATE TABLE pw_quest_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  quest_id INTEGER REFERENCES pw_quests,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  completes_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE pw_quest_loot (
  id SERIAL PRIMARY KEY,
  quest_id INTEGER REFERENCES pw_quests,
  item_id INTEGER REFERENCES pw_items,
  drop_weight INTEGER NOT NULL,
  min_rarity VARCHAR(20)
);
```

### 23.4 Item and Inventory Tables

```sql
CREATE TABLE pw_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slot VARCHAR(20) NOT NULL,       -- 'weapon'|'armor'|'artifact'|'mount'|'companion'|'consumable'
  rarity VARCHAR(20) NOT NULL,     -- 'common'|'uncommon'|'rare'|'epic'|'legendary'
  level_required INTEGER DEFAULT 1,
  faction_exclusive VARCHAR(20),
  attack_bonus INTEGER DEFAULT 0,
  defense_bonus INTEGER DEFAULT 0,
  agility_bonus INTEGER DEFAULT 0,
  crit_chance INTEGER DEFAULT 0,
  block_chance INTEGER DEFAULT 0,
  dodge_chance INTEGER DEFAULT 0,
  buy_price INTEGER,
  sell_price INTEGER DEFAULT 0,
  glory_price INTEGER,
  consumable_effect VARCHAR(30),   -- 'restore_energy_pct'|'restore_health_pct'|'restore_health'|'restore_full'|'realloc_stats'
  consumable_value INTEGER
);

CREATE TABLE pw_inventory (
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  item_id INTEGER REFERENCES pw_items,
  equipped BOOLEAN DEFAULT false,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  acquired_from VARCHAR(30),       -- 'quest'|'shop'|'craft'|'titan'|'adventure'|'signup'
  PRIMARY KEY (user_id, item_id)
);
```

### 23.5 Adventure Tables

```sql
CREATE TABLE pw_adventures (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL,
  energy_cost INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  drachma_reward INTEGER NOT NULL,
  drachma_bonus INTEGER DEFAULT 0,
  loot_chance INTEGER NOT NULL,
  min_loot_rarity VARCHAR(20) DEFAULT 'common',
  level_required INTEGER DEFAULT 1,
  faction_bonus VARCHAR(20),
  faction_bonus_type VARCHAR(30),
  faction_bonus_value INTEGER,
  class_bonus VARCHAR(20),
  class_bonus_type VARCHAR(30),
  class_bonus_value INTEGER
);

CREATE TABLE pw_player_adventures (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  adventure_id INTEGER REFERENCES pw_adventures,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completes_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  reward_payload JSONB
);

CREATE TABLE pw_pending_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN ('adventure', 'titan')),
  source_id INTEGER,
  reward_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);
```

### 23.6 Temple and Township Tables

```sql
CREATE TABLE pw_temples (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  faction_exclusive VARCHAR(20),
  income_per_hour INTEGER NOT NULL,
  base_cost INTEGER NOT NULL,
  level_required INTEGER DEFAULT 1
);

CREATE TABLE pw_player_temples (
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  temple_id INTEGER REFERENCES pw_temples,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 0 AND 25),
  last_collected_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, temple_id),
  UNIQUE (user_id, temple_id)
);

CREATE TABLE pw_township_upgrades (
  id SERIAL PRIMARY KEY,
  type VARCHAR(30) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  establish_label TEXT,
  description TEXT,
  lore TEXT,
  bonus_type VARCHAR(30) NOT NULL,
  bonus_per_level NUMERIC(8,2) DEFAULT 0,
  bonus_at_max NUMERIC(8,2) DEFAULT 0,
  initial_cost INTEGER NOT NULL,
  level_required INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE pw_player_townships (
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  upgrade_type VARCHAR(30) REFERENCES pw_township_upgrades(type),
  level INTEGER DEFAULT 0,
  upgrade_started_at TIMESTAMPTZ,
  upgrade_completes_at TIMESTAMPTZ,
  established_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, upgrade_type)
);

CREATE TABLE pw_craftsmanship_cycles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  craft_level INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completes_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ready', 'claimed')),
  rolled_rarity VARCHAR(20),
  rolled_item_id INTEGER REFERENCES pw_items,
  claimed_at TIMESTAMPTZ
  -- UNIQUE INDEX on (user_id) WHERE status != 'claimed' enforced via partial index
);
```

### 23.7 Combat and PvP Tables

```sql
CREATE TABLE pw_combat_log (
  id SERIAL PRIMARY KEY,
  attacker_id UUID REFERENCES pw_users ON DELETE CASCADE,
  defender_id UUID REFERENCES pw_users ON DELETE CASCADE,
  winner_id UUID REFERENCES pw_users ON DELETE SET NULL,
  glory_transferred INTEGER DEFAULT 0,
  rounds JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 23.8 Titan Event Tables

```sql
CREATE TABLE pw_titans (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(30) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  lore TEXT,
  pantheon VARCHAR(20) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,  -- 'medium'|'hard'|'extreme'
  ability_name TEXT,
  ability_description TEXT,
  ability_value NUMERIC(8,2) DEFAULT 0,
  base_hp_multiplier NUMERIC(8,2) DEFAULT 2.0,
  base_attack INTEGER DEFAULT 50,
  base_defense INTEGER DEFAULT 40,
  loot_rarity_floor VARCHAR(20) DEFAULT 'rare'
);

CREATE TABLE pw_titan_events (
  id SERIAL PRIMARY KEY,
  titan_id INTEGER REFERENCES pw_titans,
  status VARCHAR(20) DEFAULT 'queued',  -- 'queued'|'active'|'completed'
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_titan_participants (
  event_id INTEGER REFERENCES pw_titan_events ON DELETE CASCADE,
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  energy_committed INTEGER DEFAULT 0,
  energy_drained INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);
```

### 23.9 Chat Tables

```sql
CREATE TABLE pw_chat_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('general', 'mod', 'dm')),
  channel_id VARCHAR(50),          -- NULL for general/mod; thread ID for DMs
  sender_id UUID REFERENCES pw_users ON DELETE CASCADE,
  sender_username VARCHAR(30) NOT NULL,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by_name VARCHAR(60),
  deleted_by_type VARCHAR(10)      -- 'player'|'moderator'
);

CREATE TABLE pw_chat_dm_threads (
  id SERIAL PRIMARY KEY,
  user_a_id UUID REFERENCES pw_users ON DELETE CASCADE,
  user_b_id UUID REFERENCES pw_users ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_a_lt_user_b CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE pw_chat_dm_read_state (
  user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  thread_id INTEGER REFERENCES pw_chat_dm_threads ON DELETE CASCADE,
  last_seen_id BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

CREATE TABLE pw_chat_user_state (
  user_id UUID PRIMARY KEY REFERENCES pw_users ON DELETE CASCADE,
  last_seen_general_msg_id BIGINT DEFAULT 0,
  last_seen_mod_msg_id BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_chat_moderations (
  id SERIAL PRIMARY KEY,
  target_user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  mod_id UUID REFERENCES pw_moderators ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('mute', 'timeout', 'ban', 'kick', 'delete_msg')),
  channel_type VARCHAR(20),
  duration_minutes INTEGER,
  expires_at TIMESTAMPTZ,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES pw_moderators ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 23.10 Moderator Tables

```sql
CREATE TABLE pw_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  invite_token_id INTEGER REFERENCES pw_moderator_invites ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  show_chat_badge BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_moderator_invites (
  id SERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_moderator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES pw_moderators ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pw_moderator_actions (
  id BIGSERIAL PRIMARY KEY,
  moderator_id UUID REFERENCES pw_moderators ON DELETE SET NULL,
  target_user_id UUID REFERENCES pw_users ON DELETE CASCADE,
  action_type VARCHAR(30),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 24. Infrastructure & Hosting

### 24.1 Vercel (Hobby Tier)

| Resource | Limit | Current Usage |
|----------|-------|---------------|
| Serverless functions | 12 | 9 (3 remaining) |
| Cron jobs | 2 | 2 (both used) |
| Function timeout | 300s | Default |

### 24.2 API Function Inventory

The game's API is consolidated into the minimum number of function files to respect Vercel's 12-function limit:

```
api/contact.js                             ← contact form, newsletter, intake
api/track.js                               ← analytics ingestion
api/auth/admin.js                          ← site admin login
api/auth/check.js                          ← site admin session check
api/auth/logout.js                         ← site admin logout
api/admin/overview.js                      ← analytics dashboard data
api/games/pantheon-wars/auth.js            ← ?action=signup|login|logout|me
api/games/pantheon-wars/game.js            ← ?action=<40+ game actions>
api/games/pantheon-wars/titan-cron.js      ← cron-triggered titan processing
```

The `game.js` file uses `?action=` routing to handle all game API calls in a single function: quests, adventures, inventory, shop, temples, township, craftsmanship, PvP, Titan events, leaderboard, chat, moderation, stat allocation, alignment choice, and more.

### 24.3 Cron Jobs

| Job | File | Schedule (UTC) | Effect |
|-----|------|----------------|--------|
| Titan morning cycle | `titan-cron.js` | 13:00 | `processExpiredTitanEvents` + `scheduleNextTitanEvent` |
| Titan night cycle | `titan-cron.js` | 01:00 | Same as above |

Cron requests carry a `CRON_SECRET` bearer token. The endpoint also accepts requests from authenticated site admins.

### 24.4 Neon Postgres

- **Provider:** Neon (serverless Postgres, `@neondatabase/serverless` driver).
- **Connection:** HTTP-based, cold-start friendly. Connection string via `POSTGRES_DATABASE_URL`.
- **Schema init:** `db/schema.sql` (run once via `npm run db:init`).
- **Seed data:** `db/seed-pantheon-wars.sql` (40 quests, 50 items, quest loot, 5 temples, 8 township professions, 12 adventures, 8 Titans).
- **Migrations:** Manual — applied via Neon SQL Editor console. No migration runner.

### 24.5 Pusher

- **Cluster:** `PUSHER_CLUSTER` env var (current cluster: `us2`).
- **Singleton:** `lib/pwPusher.js` → `getPusherServer()`.
- **TLS:** Enabled.
- **Channel types used:** Public (`general`), Private (`private-mod`, `private-user-{id}`).

### 24.6 Resend (Email)

Used for password reset delivery. Not used for any other game communication. API key via `RESEND_API_KEY`. Sender address from `CONTACT_FROM_EMAIL`.

### 24.7 Cloudflare DNS

Domain `freshprints.dev` is managed via Cloudflare. DNS records point to Vercel. Cloudflare handles DDoS protection and CDN caching for static assets.

### 24.8 Environment Variables

| Variable | Purpose |
|----------|---------|
| `POSTGRES_DATABASE_URL` | Neon Postgres connection (auto-set by Neon integration) |
| `PUSHER_APP_ID` | Pusher application ID |
| `PUSHER_KEY` | Pusher publishable key |
| `PUSHER_SECRET` | Pusher secret key |
| `PUSHER_CLUSTER` | Pusher cluster region (e.g., `us2`) |
| `CRON_SECRET` | Bearer token for cron endpoint authentication |
| `ADMIN_PASSWORD_HASH` | Site admin bcrypt hash |
| `RESEND_API_KEY` | Email delivery for password reset |
| `CONTACT_TO_EMAIL` | Contact form recipient |
| `CONTACT_FROM_EMAIL` | Contact form + email sender |

### 24.9 Shared Libraries

| File | Purpose |
|------|---------|
| `lib/db.js` | Neon SQL client singleton |
| `lib/auth.js` | Site admin session helpers |
| `lib/pwAuth.js` | Player session: create, validate, revoke, require middlewares |
| `lib/modAuth.js` | Moderator session: validate (imported by pwAuth.js) |
| `lib/pwHelpers.js` | All game logic (~1,459 lines): regen, combat, titan, craft, township, XP/drachma compute, PRNG rotations |
| `lib/pwPusher.js` | Pusher singleton via `getPusherServer()` |

### 24.10 Migration History

Applied in chronological order via Neon SQL Editor:

```
db/schema.sql                                  base schema + township seed
db/seed-pantheon-wars.sql                      40 quests, 50 items, quest loot, 5 temples
db/migrations/health-potions.sql               consumable slot column additions
db/migrations/health-potions-seed.sql          5 health potions seeded
db/migrations/quests-pantheon-lore.sql         lore narrative on quests
db/migrations/regen-fix.sql                    regen system fix (separate base timestamps)
db/migrations/round-combat-system.sql          agility_bonus, crit/block/dodge_chance on pw_items
db/migrations/items-combat-overhaul.sql        set all 50 item stats + Tablet of Reinvention
db/migrations/class-faction-catchup.sql        per-level class/faction stat bonuses
db/migrations/scroll-of-reinvention.sql        Scroll of Reinvention + give to existing players
db/migrations/adventures.sql                   pw_adventures + pw_player_adventures + 12 seeds
db/migrations/phase14-potions.sql              health potions → pct-based; energy potion tier system
db/migrations/phase14-temples.sql              temple cap 10→25; legendary glory prices set
db/migrations/energy-potion-limits.sql         daily purchase/use limits for energy potions
db/migrations/titan-event.sql                  pw_titans, pw_titan_events, pw_titan_participants + 8 titans
db/migrations/account-recovery-moderator.sql   security_question, pw_password_reset_tokens, pw_moderators, pw_mod_invites, pw_mod_sessions, pw_mod_actions
db/migrations/township.sql                     township upgrade table (if not in schema.sql)
db/migrations/loot-overhaul.sql                quest loot cleanup + inventory wipe + glory price ×3
db/migrations/pending-rewards.sql              pw_pending_rewards table
db/migrations/glory-price-2x.sql               legendary glory prices ×2 (post Phase D ×3)
db/migrations/titan-combat-parity.sql          titan combat balance fix
db/migrations/titan-energy-tracking.sql        energy_drained column on pw_titan_participants
db/migrations/craftsmanship-potion-overhaul.sql pw_craftsmanship_cycles + craftsmanship township + Divine Surge removal + daily limit columns
db/migrations/live-chat.sql                    pw_chat_messages, pw_chat_dm_threads, pw_chat_moderations, pw_chat_user_state
db/migrations/dm-read-state.sql                pw_chat_dm_read_state
db/migrations/live-chat-mod.sql                is_system on pw_chat_messages; show_chat_badge on pw_moderators
db/migrations/one-temple-per-type.sql          UNIQUE constraint: one temple of each type per player
```

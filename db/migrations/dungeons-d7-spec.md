# Pantheon Wars — D7 Dungeon Content Spec v2 (13 Dungeons)

Updated with REAL item IDs (162-item catalog), themed faction loot, raid abilities using the engine's existing 8 working ability_types. No new engine code needed.
Once locked, this becomes db/migrations/dungeons-d7.sql + a small Codex code change.

---

## Structure

- 2-man: 2 easy, 2 medium, 2 hard
- 5-man: 2 easy, 2 medium, 2 hard
- 10-man raid: 1 expert
- Each difficulty has one Greek, one Norse, one Mesopotamian, one Neutral.
- Encounters: Easy 3, Medium 4, Hard 5, Raid 5.

Themed loot: Greek→Olympian + neutral gear; Norse→Aesir + neutral; Mesopotamian→Annunaki + neutral; Neutral dungeons→neutral only. Faction gear is equip-gated by the engine already; dropping it to anyone is fine.

**Loot ladder by level band (gear slots only):**

- T1 common (lvl 1): 1,2,11,12,21,22,31,32,41,42 + faction 68,72,73,77,78,82,83,87,88 + neutral 93,94,95,107,108,109,121,122,123,135,136,137,149,150,151
- T2 uncommon (lvl 5–15): 3,4,13,14,15,23,24,25,33,34,35,43,44,45 + faction 69,74,76,79,81,84,86,89,91 + neutral 96,97,98,110,111,112,124,125,126,138,139,140,152,153,154
- T3 rare (lvl 15–30): 5,6,16,17,26,27,28,36,37,38,46,47,48 + faction 70,71,75,80,85,90,92 + neutral 99–103,113–116,127–130,141–145,155–158
- T4 epic (lvl 35–55): 7,8,18,19,29,39,49 + neutral 104,105,106,117–120,131–134,146,147,148,159,160,161,162
- T5 legendary (lvl 60–85): 9,10,20,30,40,50 + 63,64,65,66,67

---

## TWO-MAN (6)

### Easy 2-man — 3 enc, no key

**1. The Sunken Palaestra** — Greek · sunken-palaestra · lvl 1 · sort 10
Drowned Greek athletic ground; shades run endless drills.

- E1 trash Drowned Competitors — count 3, hp×0.4, atk 5, def 2
- E2 boss The Pankration Shade — hp×0.8, atk 9, def 4 · indiv: 68 (40%), 1 (40%)
- E3 final Master of the Drowned Games — hp×1.1, atk 12, def 6 · indiv: 21 (35%) · contested: 77
- drops_key: none

**2. The Hollow Barrow** — Neutral · hollow-barrow · lvl 4 · sort 11
Pre-pantheon burial mound; older than the gods.

- E1 trash Barrow Wights — count 3, hp×0.45, atk 6, def 2
- E2 boss The Grave-Warden — hp×0.85, atk 10, def 5 · indiv: 121 (40%), 149 (35%)
- E3 final The First Interred — hp×1.15, atk 13, def 7 · indiv: 135 (30%) · contested: 107
- drops_key: none

### Medium 2-man — 4 enc, drops 2-Man Hard Key

**3. Hall of Frozen Oaths** — Norse · hall-frozen-oaths · lvl 10 · sort 12
Norse mead-hall; oathbreakers frozen mid-feast.

- E1 trash Oathbroken Thralls — count 3, hp×0.5, atk 9, def 4
- E2 trash Frost-Bound Berserkers — count 2, hp×0.6, atk 11, def 4
- E3 boss The Rimewarden — hp×0.9, atk 14, def 7 · indiv: 69 (35%), 14 (35%)
- E4 final Jarl of Broken Vows — hp×1.25, atk 18, def 9 · indiv: 81 (25%) · contested: 75 · ability(flavor) Oathfrost
- drops_key: 2-Man Hard Key

**4. The Reed Labyrinth** — Mesopotamian · reed-labyrinth · lvl 14 · sort 13
Annunaki marsh-maze grown from the first reeds.

- E1 trash Marsh Lurkers — count 3, hp×0.5, atk 9, def 4
- E2 trash Reed-Cutter Constructs — count 2, hp×0.6, atk 12, def 5
- E3 boss The Surveyor — hp×0.9, atk 14, def 8 · indiv: 76 (35%), 24 (30%)
- E4 final Architect of the Maze — hp×1.25, atk 18, def 10 · indiv: 70 (25%) · contested: 85 · ability(flavor) Misdirection
- drops_key: 2-Man Hard Key

### Hard 2-man — 5 enc, requires 2-Man Hard Key, drops it (chain)

**5. The Bronze Tartarus** — Greek · bronze-tartarus · lvl 22 · sort 14
Bronze pit beneath Tartarus where cruel jailers were sealed.

- E1 trash Bronze Jailers — count 3, hp×0.55, atk 14, def 6
- E2 trash Chain-Hounds — count 3, hp×0.6, atk 16, def 6
- E3 boss The Smith of Fetters — hp×0.95, atk 20, def 10 · indiv: 71 (30%), 17 (30%)
- E4 boss Warden Brontes — hp×1.0, atk 22, def 11 · indiv: 26 (25%)
- E5 final The Bronze Colossus — hp×1.4, atk 28, def 14 · indiv: 36 (18%) · contested (EPIC): 19 · ability Molten Core = crushing_weight value 12 (party deals 12% less damage)
- drops_key: 2-Man Hard Key (chain)

**6. The Maw Below** — Neutral · maw-below · lvl 28 · sort 15
A living cave-system with a digestive patience; older than gods.

- E1 trash Gnashing Swarm — count 4, hp×0.55, atk 15, def 5
- E2 trash Acid Crawlers — count 3, hp×0.6, atk 17, def 6
- E3 boss The Peristaltic Horror — hp×0.95, atk 21, def 9 · indiv: 156 (28%), 116 (22%)
- E4 boss Bile-Tongue — hp×1.05, atk 23, def 10 · indiv: 130 (20%)
- E5 final The Maw Itself — hp×1.45, atk 30, def 12 · indiv: 145 (15%) · contested (EPIC): 120 · ability Digest = death_aura value 8 (8 flat unmitigated dmg/round)
- drops_key: 2-Man Hard Key (chain)

---

## FIVE-MAN (6)

### Easy 5-man — 3 enc, no key

**7. The Shattered Bifrost Span** — Norse · shattered-bifrost · lvl 12 · sort 20
Broken length of the rainbow bridge fallen to the mortal world.

- E1 trash Gap-Wraiths — count 4, hp×0.45, atk 12, def 5
- E2 boss Heimdall's Forgotten Sentry — hp×0.85, atk 16, def 8 · indiv: 84 (35%), 14 (35%)
- E3 final The Bridge-Devourer — hp×1.15, atk 20, def 10 · indiv: 34 (25%) · contested: 75
- drops_key: none

**8. The Glass Wastes** — Neutral · glass-wastes · lvl 16 · sort 21
A desert fused to glass by something that fell from the sky.

- E1 trash Mirror-Stalkers — count 4, hp×0.5, atk 13, def 5
- E2 boss The Refracted One — hp×0.85, atk 17, def 8 · indiv: 126 (35%), 154 (30%)
- E3 final What Fell From the Sky — hp×1.15, atk 21, def 10 · indiv: 99 (25%) · contested: 114
- drops_key: none

### Medium 5-man — 4 enc, drops 5-Man Hard Key

**9. The Ziggurat of Silence** — Mesopotamian · ziggurat-silence · lvl 32 · sort 22
Annunaki ziggurat; priests took a vow of silence so total they forgot how to die.

- E1 trash Silent Acolytes — count 4, hp×0.55, atk 20, def 9
- E2 trash Mute Sentinels — count 3, hp×0.65, atk 22, def 10
- E3 boss The Voiceless Priest — hp×0.95, atk 26, def 13 · indiv: 8 (24%), 16 (28%)
- E4 final High Hierophant of Nothing — hp×1.3, atk 32, def 16 · indiv: 27 (22%) · contested: 37 · ability(flavor) Hush
- drops_key: 5-Man Hard Key

**10. The Olympian Reliquary** — Greek · olympian-reliquary · lvl 36 · sort 23
Vault of relics too dangerous to wield; guardians never stood down.

- E1 trash Reliquary Automatons — count 4, hp×0.55, atk 21, def 9
- E2 trash Golden Watchers — count 3, hp×0.65, atk 23, def 11
- E3 boss Keeper Talos-Minor — hp×0.95, atk 27, def 14 · indiv: 7 (24%), 19 (24%)
- E4 final The Relic-Bound Guardian — hp×1.3, atk 33, def 17 · indiv: 46 (20%) · contested: 29 · ability(flavor) Aegis Field
- drops_key: 5-Man Hard Key

### Hard 5-man — 5 enc, requires 5-Man Hard Key, drops RAID KEY

**11. The Drowned Apsu** — Mesopotamian · drowned-apsu · lvl 50 · sort 24
A shard of the primordial freshwater deep, pooled in a sunken temple.

- E1 trash Apsu-Spawn — count 4, hp×0.6, atk 28, def 12
- E2 trash Deep Heralds — count 3, hp×0.7, atk 30, def 13
- E3 boss Tidecaller of the Deep — hp×1.0, atk 34, def 16 · indiv: 8 (22%), 18 (22%)
- E4 boss The Brine Leviathan — hp×1.1, atk 37, def 18 · indiv: 29 (18%)
- E5 final Avatar of the First Water — hp×1.5, atk 44, def 22 · indiv: 159 (14%) · contested (EPIC): 133 · ability Drown = death_aura value 10 (10 flat unmitigated dmg/round)
- drops_key: Raid Key

**12. The Worldforge Ruin** — Neutral · worldforge-ruin · lvl 56 · sort 25
Ruin of a forge predating all three pantheons; machines still run, building nothing.

- E1 trash Forge-Husks — count 4, hp×0.6, atk 29, def 12
- E2 trash Molten Constructs — count 3, hp×0.7, atk 31, def 14
- E3 boss The Overseer-Engine — hp×1.0, atk 35, def 17 · indiv: 106 (20%), 117 (20%)
- E4 boss Hammer of Creation — hp×1.1, atk 38, def 19 · indiv: 159 (16%)
- E5 final The Unfinished God — hp×1.55, atk 46, def 23 · indiv: 147 (12%) · contested (EPIC): 131 · ability Reforge = crushing_weight value 15 (party deals 15% less damage)
- drops_key: Raid Key

---

## THE RAID — 10-man Expert

**13. The Unmaking of Thanas, the Withered End** — Corrupted minor old god
slug: unmaking-of-thanas · bracket 10 · difficulty expert · lvl_req 65 · alliance_required TRUE · treasury_cost 50000 · sort 30 · requires Raid Key (every member, all-consume) · drops_key none · 5 enc

**Lore:** Thanas was a minor death-daemon — a quiet psychopomp who ushered the small and forgotten across. The Unraveling tore something into him; now he spreads unmaking — entropy that erases rather than ends. Both alignments raid him: the Coalition because corruption this deep threatens the Accord; the Compact because an un-making god respects no sovereignty. He is killable precisely because he is corrupted and lesser.

**Encounters + REAL abilities (existing engine ability_types — confirmed mechanical):**

- E1 trash The Erased — count 5, hp×0.7, atk 40, def 18 · no ability
- E2 boss The Withering Herald — hp×1.2, atk 48, def 22 · crushing_weight value 20 (raid deals 20% less damage — DPS check) · indiv: 49 (15%), 18 (15%)
- E3 trash Motes of Unbeing — count 6, hp×0.65, atk 44, def 16 · no ability
- E4 boss Thanas' Hollow Shadow — hp×1.3, atk 52, def 24 · death_aura value 15 (15 flat unmitigated dmg to all raiders/round — heal/potion check) · indiv: 39 (12%), 159 (12%)
- E5 final Thanas, the Withered End — hp×1.8, atk 62, def 30 · ragnarok_flame value 80 (at <15% HP, 80 AoE to whole raid — kill-phase enrage) · indiv: 20 (8%), 50 (10%) · contested (LEGENDARY): 30 (Eye of Providence)

Raid loot floor high — T4/T5 only. Contested prize = legendary artifact.

---

## CODEX ENTRY (small code change: game.js + Codex.jsx)

Dynamic category like Titans: handleCodex adds `SELECT id,slug,name,description,lore,bracket,difficulty,level_required,alliance_required,encounter_count FROM pw_dungeons ORDER BY sort_order`; Codex.jsx adds dungeons category (glyph 🗝), maps rows to entries, mechanics chips (bracket/difficulty/level/encounters/key). ~15–20 lines each side.

---

## SEED NOTES (for the SQL prompt)

- DELETE smoke-test-crypt first (cascades to encounters + boss loot).
- Idempotent: dungeons ON CONFLICT (slug) DO NOTHING; encounters CROSS JOIN VALUES + NOT EXISTS; boss loot NOT EXISTS guard.
- encounter_count per dungeon row = actual encounter rows (3/4/5/5).
- key_item_id / drops_key_item_id resolved by subquery on pw_items name+slot='key', NEVER hardcoded.
- Contested item: is_contested TRUE, individual_chance 0, drop_weight 1. Individual items: is_contested FALSE, individual_chance = % shown.
- Raid abilities + the 4 HARD FINAL bosses use existing ability_type strings (crushing_weight/death_aura/ragnarok_flame) — confirmed mechanical, no engine code. Hard final values are mild (8–15) vs raid (15–80).
- The 2 MEDIUM finals' abilities = cosmetic: set ability_name + ability_description for display, leave ability_type NULL (sim ignores). Easy dungeons have no boss ability.

## STILL OPEN

- Stat ladder is first-pass — seed as-is, tune live with playtesters (your call).
- Ability progression now: easy = none, medium = cosmetic flavor, hard finals = mild real (8–15), raid = full (15–80). Locked.

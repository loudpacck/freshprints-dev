-- ─── Pantheon Wars: Quest Expansion + Tier 6 Endgame ────────────────────────
-- Adds 5 new quests to each existing tier (1-5) = 25 quests, plus a new
-- Tier 6 (7 quests, level 80+, epic-capable loot, no legendary).
-- Idempotent — uses WHERE NOT EXISTS guards on quest name, same pattern as
-- quests-pantheon-lore.sql. Safe to re-run.
--
-- Run AFTER adventures.sql (requires faction_bonus/class_bonus columns to
-- exist on pw_quests, though these new rows don't use them) and AFTER
-- loot-overhaul.sql (current quest_loot convention: drop_weight=1 baseline,
-- legendary items excluded from quest loot entirely).

-- ─── PART 0: Allow tier 6 ────────────────────────────────────────────────────

ALTER TABLE pw_quests DROP CONSTRAINT IF EXISTS pw_quests_tier_check;
ALTER TABLE pw_quests ADD CONSTRAINT pw_quests_tier_check CHECK (tier BETWEEN 1 AND 6);

-- ─── PART 1: +5 quests per existing tier (1-5) ──────────────────────────────
-- Ranges matched to each tier's existing rows (read from seed-pantheon-wars.sql
-- + quests-pantheon-lore.sql). mastery_target matches each tier's existing
-- convention: T1=100, T2=75, T3=50, T4=40, T5=25.

-- ── T1: Mortal Errands (Level 1-9, mastery 100) ──────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Bribe the Harbor Watch',
  'The dockmaster knows which crates hold contraband and which hold something worse. His silence has a price, and you''re the one paying it tonight.',
  1, 4, 26, 37, 22, 3, 3, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Bribe the Harbor Watch');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Recover the Stolen Relic',
  'A minor household idol went missing from the shrine three nights ago. Minor to everyone except the family praying to it.',
  1, 3, 22, 33, 19, 1, 2, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Recover the Stolen Relic');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Quiet the Barking Hounds',
  'The watchdogs guarding the grain cellar haven''t stopped barking in two days. Something out there is circling, and the owners are too frightened to look.',
  1, 4, 30, 42, 24, 4, 4, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Quiet the Barking Hounds');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Chart the Smugglers'' Route',
  'A new path through the hill country has been moving goods past the toll posts for a month. Whoever controls that map controls the trade.',
  1, 5, 34, 48, 28, 5, 6, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Chart the Smugglers'' Route');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Settle the Tavern Debt',
  'A debt collector with divine backing has been making examples of late payers. Today the example is supposed to be you. Change the lesson.',
  1, 3, 24, 34, 20, 2, 3, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Settle the Tavern Debt');

-- ── T2: Faction Warfare (Level 10-24, mastery 75) ────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Disrupt the Forge Lines',
  'Enemy quartermasters are arming three companies a week out of a hidden forge. Cooling iron doesn''t fight back. Make sure it stays cold.',
  2, 7, 70, 100, 44, 13, 13, 75
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Disrupt the Forge Lines');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Capture the Enemy Scout',
  'Their best scout has mapped your camp''s defenses twice this week and slipped away both times. Not a third time.',
  2, 6, 58, 85, 42, 11, 11, 75
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Capture the Enemy Scout');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Burn the Siege Ladders',
  'Tomorrow''s assault depends on ladders stacked behind the enemy lines tonight. Tonight, those ladders become firewood.',
  2, 9, 90, 130, 55, 18, 18, 75
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Burn the Siege Ladders');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Reclaim the Border Shrine',
  'The shrine marking the old treaty line changed hands twice this season. It is changing hands a third time, permanently, in your favor.',
  2, 8, 80, 118, 50, 16, 16, 75
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Reclaim the Border Shrine');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Hunt the Deserter Captain',
  'He took half a garrison''s payroll and the garrison''s battle plans when he fled. Both need to come back. He does not.',
  2, 10, 102, 148, 60, 21, 21, 75
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Hunt the Deserter Captain');

-- ── T3: Divine Conflict (Level 25-49, mastery 50) ────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Storm the Underworld Gate',
  'The gate between worlds is meant to open one direction. Someone propped it ajar from the other side. Close it, with whatever''s come through standing in the way.',
  3, 12, 148, 225, 85, 28, 27, 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Storm the Underworld Gate');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Pacify the Maddened Oracle',
  'A seer who drank too deep of her own visions now screams prophecy at anyone within a mile. Some of what she''s shouting is true. All of it needs to stop.',
  3, 14, 178, 265, 96, 35, 33, 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Pacify the Maddened Oracle');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Sever the Serpent''s Coil',
  'A lesser brood-spawn has wound itself around the aqueduct feeding three garrisons. It will not let go willingly. It will not be given the choice.',
  3, 16, 208, 298, 105, 41, 38, 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Sever the Serpent''s Coil');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Extinguish the Eternal Pyre',
  'A flame consecrated three centuries ago has never gone out — and never stopped granting the enemy''s priests their visions. Tonight it learns what "eternal" actually means.',
  3, 17, 222, 312, 112, 45, 42, 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Extinguish the Eternal Pyre');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Bind the Wandering Specter',
  'A general''s ghost has refused to stay buried since his defeat a generation ago. He still thinks the war is his to win. Disabuse him of the notion.',
  3, 13, 158, 240, 88, 30, 29, 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Bind the Wandering Specter');

-- ── T4: Mythic Campaigns (Level 50-74, mastery 40) ───────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Topple the Iron Colossus',
  'A bronze-age automaton built to guard a forgotten king''s tomb has been reactivated by enemy engineers. It does not tire. It does not negotiate.',
  4, 20, 390, 660, 225, 53, 52, 40
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Topple the Iron Colossus');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Sabotage the Forge of Hephaestus',
  'A satellite forge tied to the divine smith''s workshop has been arming enemy champions with weapons no mortal blade should match. The bellows stop tonight.',
  4, 22, 435, 745, 248, 60, 58, 40
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Sabotage the Forge of Hephaestus');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Cleanse the Cursed Battlefield',
  'Nine thousand dead from three different wars never left the valley they fell in. Their restlessness is starting to spread. Give them a reason to finally lie still.',
  4, 24, 480, 825, 272, 66, 64, 40
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Cleanse the Cursed Battlefield');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Steal the Norns'' Thread',
  'A single spool from the loom of fate has been smuggled out of Yggdrasil''s roots by enemy agents. Whatever they''re planning to weave with it, you''re cutting it short.',
  4, 21, 410, 700, 235, 56, 55, 40
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Steal the Norns'' Thread');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Defy the Court of Shadows',
  'A tribunal of judges who died millennia ago still convenes in the space between worlds, passing sentence on the living. Your name came up. You weren''t invited to speak.',
  4, 25, 515, 890, 296, 71, 70, 40
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Defy the Court of Shadows');

-- ── T5: Endgame / Ascension (Level 75-100, mastery 25) ───────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Outrun the Wild Hunt',
  'Odin''s spectral hunters have chosen you as quarry for reasons no living soul has ever learned. Surviving the night doesn''t end the hunt. It just earns you another one.',
  5, 26, 830, 1550, 515, 76, 76, 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Outrun the Wild Hunt');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Plunder the Vault of Cronos',
  'Before the Titans fell, Cronos hid the first treasury ever assembled somewhere no god thought to look. You found the somewhere. Now survive what''s guarding it.',
  5, 27, 900, 1700, 565, 79, 79, 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Plunder the Vault of Cronos');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Defy the Fates'' Decree',
  'Three sisters wove the end of your story before you were born. You''ve read the ending. You disagree with the author.',
  5, 28, 970, 1850, 610, 82, 82, 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Defy the Fates'' Decree');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Breach the Throne of Tartarus',
  'The deepest prison in existence was built to hold things older than the gods who built it. Its throne room has had one visitor in ten thousand years. Make it two.',
  5, 29, 1040, 2000, 660, 88, 88, 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Breach the Throne of Tartarus');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Claim the Mantle of the Forgotten God',
  'A deity erased from every pantheon''s memory left behind a mantle of pure, unclaimed divine authority. Forgetting a god doesn''t unmake what they left. It just means no one''s watching who picks it up.',
  5, 30, 1130, 2200, 720, 93, 93, 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Claim the Mantle of the Forgotten God');

-- ─── PART 2: Tier 6 — Mythic Ascension (Level 80, mastery 100) ──────────────
-- Locked values per spec: tier 6, level_required 80, energy_cost 50-65,
-- mastery_target 100, xp/drachma scaled ~2x Tier 5's per-energy rate (within
-- the suggested 3000-5000 xp / 4000-7000 drachma_base bands), loot_chance
-- moderate (25-35%), epic-capable loot (see Part 3 — no legendary).

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Slay the Primordial Chaos',
  'Before the gods, before the Titans, before even the void had a name, something existed that simply was. It has noticed you. That is the most dangerous sentence ever written about a mortal.',
  6, 50, 3400, 4800, 800, 25, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Slay the Primordial Chaos');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Breach the Divine Vault of Aion',
  'Time itself keeps a treasury, sealed outside the flow of seconds and centuries alike. The lock has never been picked. You are not picking it. You are tearing the door off its hinges.',
  6, 52, 3550, 5000, 850, 27, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Breach the Divine Vault of Aion');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Unmake the Architect of Fate',
  'Someone — something — draws the blueprints that every prophecy in every pantheon eventually follows. You found the drafting table. The architect is still sitting at it.',
  6, 55, 3800, 5300, 900, 28, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Unmake the Architect of Fate');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Devour the Heart of Erebus',
  'Primordial darkness has a core, and that core has a pulse. Stopping it does not extinguish the dark. It just makes the dark stop pretending it isn''t watching you.',
  6, 58, 4050, 5700, 950, 30, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Devour the Heart of Erebus');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Shatter the Womb of Creation',
  'Every pantheon you''ve fought for or against traces its origin to a single point of first becoming. It is still there. It is still becoming. You are about to interrupt the process.',
  6, 60, 4250, 6000, 1000, 32, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Shatter the Womb of Creation');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Usurp the Throne Beyond Time',
  'A seat exists outside causality itself, reserved for whoever proves they no longer need permission from the gods, the Titans, or the order they imposed. It has been empty for an age. It will not stay empty after tonight.',
  6, 62, 4450, 6300, 1050, 33, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Usurp the Throne Beyond Time');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
SELECT
  'Extinguish the Last Eternal Flame',
  'One fire has burned since before the first pantheon drew breath, feeding every divine spark that came after it. Snuff it out and you don''t just end a war. You end the reason every god ever had to start one.',
  6, 65, 4750, 6700, 1100, 35, 80, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Extinguish the Last Eternal Flame');

-- ─── PART 3: Tier 6 quest loot — epic-capable, no legendary ─────────────────
-- Pool per quest: 2 common (weight 1 each) + 2 uncommon (weight 1 each) +
-- 2 rare (weight 1 each) + 1 epic (weight 4). Total weight 10 → ~40% of any
-- drop is the epic, combined with a 25-35% loot_chance per quest this lands
-- epic gear at roughly a 10-14% chance per completion — "occasional, rare
-- grind reward," not guaranteed, and never legendary (legendary stays
-- Glory-shop/Titan exclusive per existing design).
-- Each of the 7 quests maps to exactly one of the game's 7 epic items.

-- Slay the Primordial Chaos → commons 1,11 / uncommons 3,13 / rares 5,16 / epic 7 (Spear of Olympus)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Slay the Primordial Chaos')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (1,1),(11,1),(3,1),(13,1),(5,1),(16,1),(7,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- Breach the Divine Vault of Aion → commons 2,12 / uncommons 4,14 / rares 6,17 / epic 8 (Enkidu's Axe)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Breach the Divine Vault of Aion')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (2,1),(12,1),(4,1),(14,1),(6,1),(17,1),(8,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- Unmake the Architect of Fate → commons 21,31 / uncommons 23,33 / rares 26,36 / epic 18 (Chain of Niflheim)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Unmake the Architect of Fate')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (21,1),(31,1),(23,1),(33,1),(26,1),(36,1),(18,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- Devour the Heart of Erebus → commons 22,32 / uncommons 24,34 / rares 27,37 / epic 19 (Olympian Plate)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Devour the Heart of Erebus')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (22,1),(32,1),(24,1),(34,1),(27,1),(37,1),(19,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- Shatter the Womb of Creation → commons 41,42 / uncommons 25,43 / rares 28,46 / epic 29 (Pandora's Fragment)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Shatter the Womb of Creation')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (41,1),(42,1),(25,1),(43,1),(28,1),(46,1),(29,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- Usurp the Throne Beyond Time → commons 1,31 / uncommons 35,44 / rares 38,47 / epic 39 (Fenrir Pup)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Usurp the Throne Beyond Time')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (1,1),(31,1),(35,1),(44,1),(38,1),(47,1),(39,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- Extinguish the Last Eternal Flame → commons 11,21 / uncommons 15,45 / rares 16,48 / epic 49 (Divine Emissary)
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Extinguish the Last Eternal Flame')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.item_id, i.w FROM q, (VALUES (11,1),(21,1),(15,1),(45,1),(16,1),(48,1),(49,4)) AS i(item_id, w)
ON CONFLICT (quest_id, item_id) DO NOTHING;

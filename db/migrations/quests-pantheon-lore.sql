-- ─── Pantheon Wars: Lore Quest Expansion (15 quests) ────────────────────────
-- Run AFTER adventures.sql (requires bonus columns on pw_quests).
-- Idempotent — uses WHERE NOT EXISTS guards.
-- Collision check: all 15 names confirmed distinct from existing 40.

-- ── T1: Mortal Errands (3 quests, Level 1–9) ─────────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Mark the Heretic''s Door',
  'A family in the market district speaks openly against the divine order. Their door must be marked before the sun sets. The marking is a warning. What follows is not your concern.',
  1, 4, 26, 38, 20, 3, 2, 100,
  'olympians', 'xp', 15
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Mark the Heretic''s Door');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target)
SELECT
  'Carry the Wounded Home',
  'Three soldiers from the eastern skirmish lie in the road three miles from their village. No one else is coming. You are the road.',
  1, 3, 22, 32, 18, 2, 3, 100
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Carry the Wounded Home');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Raid the Grain House',
  'The city-state''s northern granary holds enough stock to feed the enemy''s garrison through winter. It should not still be standing by morning.',
  1, 5, 35, 48, 28, 6, 6, 100,
  'annunaki', 'drachma', 20
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Raid the Grain House');

-- ── T2: Faction Warfare (3 quests, Level 10–24) ───────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Ambush the Divine Courier',
  'A messenger carrying sealed correspondence between two divine courts crosses this road every eight days. Today is the eighth day. The correspondence must not arrive.',
  2, 8, 78, 115, 48, 15, 12, 75,
  'aesir', 'loot_chance', 20
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Ambush the Divine Courier');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   class_bonus, class_bonus_type, class_bonus_value)
SELECT
  'Burn the Enemy War Maps',
  'The campaign maps being carried to the front are worth more to your enemy than a hundred soldiers. They must not arrive. The courier does not know what he carries.',
  2, 7, 68, 100, 42, 12, 10, 75,
  'broker', 'drachma', 15
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Burn the Enemy War Maps');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   class_bonus, class_bonus_type, class_bonus_value)
SELECT
  'Claim the Sacred Totem',
  'The totem has passed through twelve hands in as many years. Its current holder does not understand what they have. You do. The exchange will not be voluntary.',
  2, 9, 88, 128, 55, 18, 18, 75,
  'oracle', 'xp', 15
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Claim the Sacred Totem');

-- ── T3: Divine Conflict (3 quests, Level 25–49) ───────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target)
SELECT
  'Challenge the Titan''s Avatar',
  'A fragment of Kronos walks the earth in borrowed flesh. Not the full titan — an echo given form. Still the most dangerous entity within forty miles of where you are standing.',
  3, 13, 155, 230, 85, 28, 28, 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Challenge the Titan''s Avatar');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Poison the Bifrost Well',
  'The well where the Bifrost draws its power has stood uncorrupted since the first age. One carefully introduced compound changes that — and the route between realms with it.',
  3, 16, 205, 295, 100, 38, 38, 50,
  'aesir', 'loot_upgrade', 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Poison the Bifrost Well');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   class_bonus, class_bonus_type, class_bonus_value)
SELECT
  'Plunder the River of Souls',
  'The river of Lethe carries more than the dead — ancient weapons, artifacts, and forgotten knowledge flow in its current. Retrieve what you can before the current takes you with it.',
  3, 15, 185, 270, 95, 35, 32, 50,
  'slayer', 'loot_chance', 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Plunder the River of Souls');

-- ── T4: Mythic Campaigns (3 quests, Level 50–74) ─────────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target)
SELECT
  'Fracture the Divine Compact',
  'The treaty between the three pantheons has maintained a false peace for three centuries. One well-placed rupture ends the pretense and begins the war they were all pretending to avoid.',
  4, 20, 380, 650, 220, 55, 52, 40
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Fracture the Divine Compact');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   class_bonus, class_bonus_type, class_bonus_value)
SELECT
  'Silence the Eternal Oracle',
  'She has spoken truth for nine hundred years without a single error. Her next prophecy names the end of your patron''s dynasty. She must not be permitted to speak it.',
  4, 23, 460, 800, 260, 65, 62, 40,
  'oracle', 'xp', 20
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Silence the Eternal Oracle');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Sack the Cosmic Library',
  'The library predates writing itself. Every scroll contains knowledge a deity has decided should not exist. Take what matters most before they remember they left the doors unlocked.',
  4, 24, 500, 850, 275, 70, 68, 40,
  'olympians', 'xp', 25
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Sack the Cosmic Library');

-- ── T5: Endgame / Ascension (3 quests, Level 75–100) ─────────────────────────

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   class_bonus, class_bonus_type, class_bonus_value)
SELECT
  'Shatter the Last Seal',
  'Seven seals held the old god''s prison intact. Six are broken. The seventh requires something the others did not — something alive, willing, and very difficult to kill. You qualify on all counts.',
  5, 26, 870, 1600, 520, 80, 78, 25,
  'warden', 'loot_upgrade', 50
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Shatter the Last Seal');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Eclipse the Divine Sun',
  'Shamash has watched every action, every betrayal, every private moment since creation. What can be seen can be unseen. You are going to blot out the eye that never closes.',
  5, 28, 1050, 2000, 650, 85, 85, 25,
  'annunaki', 'guaranteed_loot', 0
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Eclipse the Divine Sun');

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range,
   loot_chance, level_required, mastery_target,
   faction_bonus, faction_bonus_type, faction_bonus_value)
SELECT
  'Summon the World Serpent',
  'Jormungandr does not come when called. It comes when provoked correctly. You will need to be very specific about what you want from it and very fast about getting out of the way afterward.',
  5, 29, 1100, 2100, 700, 90, 92, 25,
  'aesir', 'loot_upgrade', 75
WHERE NOT EXISTS (SELECT 1 FROM pw_quests WHERE name = 'Summon the World Serpent');

-- ── Quest loot entries for new quests ─────────────────────────────────────────
-- Using subqueries on name so IDs don't need to be hardcoded.
-- T1 → common items (1,2,11,12,21,22,31,41,42)
-- T2 → uncommon items (3,4,13,15,23,25,33,44,45)
-- T3 → uncommon + rare non-faction (4,5,23,25,28,38)
-- T4 → rare + epic non-faction (5,28,29,38,49)
-- T5 → epic + legendary non-faction (9,20,29,30,40,49)

-- T1: Mark the Heretic's Door → items 2,12,22
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Mark the Heretic''s Door')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (2),(12),(22)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T1: Carry the Wounded Home → items 1,11,41
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Carry the Wounded Home')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (1),(11),(41)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T1: Raid the Grain House → items 2,22,42
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Raid the Grain House')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (2),(22),(42)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T2: Ambush the Divine Courier → items 3,13,33
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Ambush the Divine Courier')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (3),(13),(33)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T2: Burn the Enemy War Maps → items 4,15,44
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Burn the Enemy War Maps')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (4),(15),(44)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T2: Claim the Sacred Totem → items 3,23,45
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Claim the Sacred Totem')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (3),(23),(45)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T3: Challenge the Titan's Avatar → items 5,25,38
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Challenge the Titan''s Avatar')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (5),(25),(38)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T3: Poison the Bifrost Well → items 4,28,38
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Poison the Bifrost Well')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (4),(28),(38)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T3: Plunder the River of Souls → items 5,23,28
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Plunder the River of Souls')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (5),(23),(28)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T4: Fracture the Divine Compact → items 5,29,49
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Fracture the Divine Compact')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (5),(29),(49)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T4: Silence the Eternal Oracle → items 28,29,38
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Silence the Eternal Oracle')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (28),(29),(38)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T4: Sack the Cosmic Library → items 5,38,49
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Sack the Cosmic Library')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (5),(38),(49)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T5: Shatter the Last Seal → items 9,20,29
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Shatter the Last Seal')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (9),(20),(29)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T5: Eclipse the Divine Sun → items 9,30,49
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Eclipse the Divine Sun')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (9),(30),(49)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

-- T5: Summon the World Serpent → items 20,40,29
WITH q AS (SELECT id FROM pw_quests WHERE name = 'Summon the World Serpent')
INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight)
SELECT q.id, i.v, 1 FROM q, (VALUES (20),(40),(29)) AS i(v)
ON CONFLICT (quest_id, item_id) DO NOTHING;

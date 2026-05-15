-- Pantheon Wars seed data
-- Re-runnable: clears all catalog data and re-seeds.
-- WARNING: Also clears pw_inventory (player items) and pw_quest_progress (mastery data).
TRUNCATE pw_quests RESTART IDENTITY CASCADE;
-- ↑ cascades to: pw_quest_progress, pw_quest_loot
TRUNCATE pw_items RESTART IDENTITY CASCADE;
-- ↑ cascades to: pw_inventory, pw_quest_loot (already empty from above)

-- ─── pw_quests ───────────────────────────────────────────────────────────────
-- Columns: name, description, tier, energy_cost, xp_reward,
--          drachma_base, drachma_range, loot_chance, level_required, mastery_target
--
-- Tier 1 │ Level  1–9  │ Energy  3–5  │ Mortal errands          (8 quests)
-- Tier 2 │ Level 10–24 │ Energy  6–10 │ Faction warfare         (8 quests)
-- Tier 3 │ Level 25–49 │ Energy 11–18 │ Divine conflict         (9 quests)
-- Tier 4 │ Level 50–74 │ Energy 19–25 │ Mythic campaigns        (8 quests)
-- Tier 5 │ Level 75–100│ Energy 25–30 │ Endgame / Ascension     (7 quests)

INSERT INTO pw_quests
  (name, description, tier, energy_cost, xp_reward, drachma_base, drachma_range, loot_chance, level_required, mastery_target)
VALUES

-- ── Tier 1: Mortal errands ────────────────────────────────────────────────────

  ('Collect the Tribute',
   'Olympian tax collectors were driven off twice. Collect what is owed — by whatever means necessary.',
   1, 3, 20, 30, 20, 0, 1, 100),

  ('Scout the Borderlands',
   'The eastern frontier has gone silent. That silence conceals something. Ride out and find it before your enemies do.',
   1, 3, 20, 30, 20, 0, 1, 100),

  ('Deliver the Divine Message',
   'A sealed scroll bearing Hermes'' seal must reach the oracle at Delphi before the third sunrise or the vision dies with it.',
   1, 4, 28, 40, 25, 2, 2, 100),

  ('Gather Storm-Touched Timber',
   'Wood struck by Mjolnir''s lightning holds a divine charge. The skald''s workshop needs ten such planks before the solstice.',
   1, 4, 28, 40, 25, 2, 3, 100),

  ('Track the Runaway Thrall',
   'A sworn thrall fled northward carrying secrets that cannot reach the frost giants. Retrieve them both.',
   1, 5, 36, 50, 30, 3, 4, 100),

  ('Tithe to the Great Ziggurat',
   'The priests of Marduk grow impatient. Deliver the grain tribute before their patience — and their prayers — run dry.',
   1, 5, 36, 50, 30, 3, 5, 100),

  ('Guard the Silk Road Caravan',
   'A merchant caravan crossing the Fertile Crescent carries more than silk. Ensure it arrives intact.',
   1, 5, 36, 52, 32, 4, 6, 100),

  ('Silence the Street Prophet',
   'A loud-mouthed seer preaches the gods'' downfall in the open market. Such words cannot go unanswered.',
   1, 5, 38, 55, 35, 5, 7, 100),

-- ── Tier 2: Faction warfare ───────────────────────────────────────────────────

  ('Raid the Rival Shrine',
   'The shrine of Ares holds offerings meant for Olympus. Reclaim them before the next moon rises.',
   2, 6, 55, 80, 40, 5, 10, 75),

  ('Escort the Seer to Olympus',
   'A prophet carrying a war-critical vision must cross fifty miles of enemy territory alive. Fifty miles.',
   2, 7, 65, 95, 45, 6, 11, 75),

  ('Sabotage the Winter Stores',
   'An enemy fortress will not survive the season if its grain supply is compromised. Make it so.',
   2, 7, 65, 95, 45, 6, 12, 75),

  ('Silence the War-Skald',
   'His songs double enemy courage and halve their fear of death. The performance ends tonight.',
   2, 8, 76, 110, 50, 7, 14, 75),

  ('Intercept the War Column',
   'A supply column moves through the valley at dawn. Intelligence is only useful if someone acts on it.',
   2, 8, 76, 112, 50, 8, 15, 75),

  ('Defile the Sacred Spring',
   'The healing spring outside the enemy camp has kept their wounded fighting for weeks. Poison the source.',
   2, 9, 87, 125, 55, 8, 17, 75),

  ('Steal the Battle Standard',
   'An army without its divine banner loses more than cloth and dye. Take it before the assault begins.',
   2, 10, 98, 140, 60, 10, 20, 75),

  ('Remove the Enemy Commander',
   'The general planning tomorrow''s offensive must not see tomorrow. Discreet. Decisive.',
   2, 10, 100, 145, 60, 10, 22, 75),

-- ── Tier 3: Divine conflict ───────────────────────────────────────────────────

  ('Breach the Titan''s Gate',
   'The bronze doors sealing Kronos''s prison have held for an age. Something stirs behind them. Find out what — or seal it forever.',
   3, 11, 130, 200, 80, 8, 25, 50),

  ('Steal the Golden Fleece',
   'It hangs in a sacred grove guarded by a dragon that never sleeps. Twelve attempted this before you. You will be the first to return.',
   3, 12, 145, 220, 85, 10, 27, 50),

  ('Infiltrate Valhalla',
   'Walk among the einherjar undetected. Odin''s hall holds intelligence that could shift the entire war in a single night.',
   3, 13, 160, 240, 90, 10, 30, 50),

  ('Break Heimdall''s Watch',
   'The Bifrost guardian''s gaze has not faltered since the first age of the world. Tonight you change that.',
   3, 13, 162, 242, 90, 12, 32, 50),

  ('Drive Back Fenrir''s Brood',
   'The great wolf''s offspring descended from the northern peaks three days ago. The villages below cannot survive another night.',
   3, 14, 175, 260, 95, 12, 34, 50),

  ('Descent into Tartarus',
   'Hades permits no living soul past the Styx. You will go anyway, retrieve what was stolen from the upper world, and leave before he notices.',
   3, 15, 195, 280, 100, 14, 37, 50),

  ('Storm the Hanging Gardens',
   'The Annunaki''s sky-fortress has repelled every assault launched from below. You will not come from below.',
   3, 16, 210, 300, 110, 14, 40, 50),

  ('Seize the Tablet of Destinies',
   'Whoever holds the Tablet of Destinies controls the arc of fate itself. It has been in enemy hands long enough.',
   3, 17, 225, 315, 115, 15, 44, 50),

  ('Slay the Stone Gorgon',
   'The archive''s guardian has turned twelve champions to marble and arranged them as warnings. You are not a warning.',
   3, 18, 240, 330, 120, 15, 47, 50),

-- ── Tier 4: Mythic campaigns ──────────────────────────────────────────────────

  ('Hunt the Serpent''s Children',
   'Jormungandr''s spawn encircle Yggdrasil''s roots, slowly strangling the world tree from below. Each one slain buys another century.',
   4, 19, 350, 600, 200, 12, 50, 40),

  ('Collapse the Dimensional Rift',
   'A tear between realms floods enemy territory with raw divine energy. The rift must be sealed from the inside.',
   4, 20, 380, 650, 220, 14, 53, 40),

  ('Forge the Godkiller Blade',
   'Seven divine bloodlines. Seven drops of ichor. One blade capable of ending an immortal. The forge has been waiting for someone like you.',
   4, 21, 410, 700, 240, 15, 56, 40),

  ('Raid the Vault of Dead Gods',
   'Odin''s armory holds weapons from deities who fell in older wars. They have been waiting for someone worthy enough to use them.',
   4, 22, 440, 750, 250, 16, 59, 40),

  ('Bind the Chaos Spawn',
   'Tiamat''s lesser offspring shattered its celestial chains three nights ago. Rebind it before it breaches the mortal plane.',
   4, 22, 440, 760, 250, 16, 62, 40),

  ('Disrupt the High Pantheon Council',
   'The divine council convenes at the summit to decide the war''s next move. They must not reach consensus.',
   4, 23, 470, 800, 270, 18, 65, 40),

  ('Blind the Pythia''s Vision',
   'The oracle has foreseen your enemy''s victory in vivid detail. Alter her sight before the prophecy can be spoken aloud.',
   4, 24, 490, 850, 280, 18, 68, 40),

  ('Sever the World Tree''s Root',
   'Strike at Yggdrasil itself. The shockwave will reach all nine realms simultaneously and scatter your enemies across every one of them.',
   4, 25, 520, 900, 300, 20, 72, 40),

-- ── Tier 5: Endgame / Ascension ───────────────────────────────────────────────

  ('Dethrone the Olympian Father',
   'Zeus has grown fat on certainty. The father of gods has forgotten what it means to face a real threat. It is time he remembered.',
   5, 25, 800, 1500, 500, 20, 75, 25),

  ('Rewrite the Tablets of Fate',
   'The clay tablets governing all existence have been inscribed by others long enough. Your hand now.',
   5, 26, 870, 1650, 550, 22, 78, 25),

  ('Tear the Mortal Veil',
   'The boundary between divine and mortal was woven as a prison as much as a protection. It has served its purpose. Unmake it.',
   5, 27, 940, 1800, 600, 22, 80, 25),

  ('Free the Bound Titan',
   'Prometheus was chained for giving fire to mortals. His knowledge of divine weakness is worth far more than fire ever was. Free him.',
   5, 28, 1010, 1950, 650, 24, 83, 25),

  ('Sound the First Horn of Ragnarok',
   'The end cannot be stopped — only aimed. Strike the first blow and choose which world burns first.',
   5, 28, 1020, 2000, 650, 24, 86, 25),

  ('Aid the Wolves'' Hunt',
   'Hati and Skoll have chased the sun and moon since the first age. They grow tired. Lend them your strength for the final sprint.',
   5, 29, 1080, 2100, 700, 25, 90, 25),

  ('Unmake the First Temple',
   'The oldest structure in existence predates every god ever worshipped. Reduce it to rubble. What rises from the ruin belongs to no one but you.',
   5, 30, 1150, 2250, 750, 25, 95, 25);

-- ─── pw_items ────────────────────────────────────────────────────────────────
-- Columns: name, description, slot, attack_bonus, defense_bonus, rarity,
--          level_required, faction_exclusive, buy_price, sell_price, glory_price
-- IDs are assigned sequentially:
--   Weapons:   1–10  | Armor: 11–20 | Artifact: 21–30
--   Mounts:   31–40  | Companion: 41–50

INSERT INTO pw_items
  (name, description, slot, attack_bonus, defense_bonus, rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price)
VALUES

-- ── Weapons ───────────────────────────────────────────────────────────────────

  ('Iron Gladius',
   'Standard issue — carries more history than edge.',
   'weapon', 2, 0, 'common', 1, NULL, 200, 40, NULL),

  ('Bronze Kopis',
   'Curved blade favored by light infantry. Gets the job done.',
   'weapon', 3, 0, 'common', 1, NULL, 300, 60, NULL),

  ('Legionary Spear',
   'Eight feet of oak and iron. The backbone of every great army.',
   'weapon', 6, 0, 'uncommon', 5, NULL, 700, 140, NULL),

  ('Runic Dagger',
   'Three runes etched at the forge. Each one a prayer to Odin that still holds.',
   'weapon', 7, 0, 'uncommon', 8, NULL, 900, 180, NULL),

  ('Blade of Ares',
   'Forged in war-fury and quenched in enemy blood. The war god''s mark is permanent.',
   'weapon', 14, 0, 'rare', 15, NULL, 3000, 600, NULL),

  ('Mjolnir Shard',
   'A fragment from the original hammer. Still carries the storm.',
   'weapon', 16, 0, 'rare', 18, 'aesir', 4000, 800, NULL),

  ('Spear of Olympus',
   'Struck by lightning seventeen times. Refuses to bend.',
   'weapon', 28, 0, 'epic', 35, 'olympians', 14000, 2800, NULL),

  ('Enkidu''s Axe',
   'Carved from the first cedar of Mesopotamia. As old as the written word.',
   'weapon', 25, 0, 'epic', 38, 'annunaki', 12000, 2400, NULL),

  ('Godkiller Blade',
   'Seven ichor-drops quenched into the edge. It has already ended three immortals. It knows how.',
   'weapon', 55, 0, 'legendary', 60, NULL, NULL, 5000, 50),

  ('Gungnir',
   'Odin''s spear never misses its mark. Yours now. Don''t waste the throw.',
   'weapon', 65, 0, 'legendary', 75, 'aesir', NULL, 8000, 80),

-- ── Armor ────────────────────────────────────────────────────────────────────

  ('Woven Reed Armor',
   'Cheap, light, and surprisingly resilient against things that aren''t blades.',
   'armor', 0, 2, 'common', 1, NULL, 150, 30, NULL),

  ('Leather Breastplate',
   'Cured in salt and fear. Better than nothing.',
   'armor', 0, 3, 'common', 1, NULL, 220, 44, NULL),

  ('Legionary Shield',
   'The formation is the shield. The shield is the formation.',
   'armor', 0, 7, 'uncommon', 5, NULL, 750, 150, NULL),

  ('Berserker Furs',
   'Soaked in the spirit of the great bears of Jotunheim. Still smells like one.',
   'armor', 0, 8, 'uncommon', 10, 'aesir', 1100, 220, NULL),

  ('Hoplite Greaves',
   'Bronze from Corinth. Polished enough to watch your enemies charge reflected in it.',
   'armor', 0, 9, 'uncommon', 12, NULL, 1300, 260, NULL),

  ('Ishtar''s Veil',
   'The goddess of war wove protection into every thread. The pattern is not decorative.',
   'armor', 0, 14, 'rare', 18, 'annunaki', 3500, 700, NULL),

  ('Aegis Breastplate',
   'Carved from Athena''s sacred shield-leather. Holds when lesser armor shatters.',
   'armor', 0, 16, 'rare', 22, 'olympians', 4500, 900, NULL),

  ('Chain of Niflheim',
   'Forged in the cold realm and worn by its highest warden. Every link is a prayer.',
   'armor', 0, 26, 'epic', 35, 'aesir', 15000, 3000, NULL),

  ('Olympian Plate',
   'Full plate tempered on Mount Olympus. The gods wore lighter armor. You don''t have their advantage.',
   'armor', 0, 30, 'epic', 42, 'olympians', 18000, 3600, NULL),

  ('Shield of Aegis',
   'The original Aegis, not a copy. The Medusa''s head is still etched into the center — still works.',
   'armor', 0, 55, 'legendary', 65, NULL, NULL, 6000, 60),

-- ── Artifacts ────────────────────────────────────────────────────────────────

  ('Carved Idol',
   'Old god, small power. But consistent.',
   'artifact', 1, 1, 'common', 1, NULL, 250, 50, NULL),

  ('Bone Amulet',
   'Whose bones? Nobody who mattered enough to stay dead.',
   'artifact', 0, 2, 'common', 1, NULL, 200, 40, NULL),

  ('Oracle''s Eye',
   'A preserved seer''s eye in amber resin. It still blinks when it sees something you should know.',
   'artifact', 3, 3, 'uncommon', 8, NULL, 1200, 240, NULL),

  ('Runic Compass',
   'Points toward the next enemy worth fighting. Different from a regular compass. More honest.',
   'artifact', 4, 2, 'uncommon', 10, 'aesir', 1500, 300, NULL),

  ('Celestial Map',
   'Every star labeled in a language older than any pantheon. Reading it takes practice.',
   'artifact', 5, 2, 'uncommon', 15, NULL, 2000, 400, NULL),

  ('Omphalos Stone',
   'The navel of the world, removed and carried. The world didn''t notice the surgery.',
   'artifact', 7, 10, 'rare', 20, 'olympians', 6000, 1200, NULL),

  ('Tablet of Destinies',
   'Who controls the tablet controls what''s written. You''ll have to carve your own entry.',
   'artifact', 9, 9, 'rare', 25, 'annunaki', 8000, 1600, NULL),

  ('Prometheus'' Flame',
   'Stolen fire burns hotter than given fire. He paid a price for this. You''re paying a smaller one.',
   'artifact', 12, 5, 'rare', 30, NULL, 9000, 1800, NULL),

  ('Pandora''s Fragment',
   'A shard of the original box. What was inside is gone. What remains is the hinge that held everything.',
   'artifact', 16, 16, 'epic', 45, NULL, 25000, 5000, NULL),

  ('Eye of Providence',
   'It sees the full picture. Every battle, every outcome, every flaw. It has seen yours. Still chose you.',
   'artifact', 28, 28, 'legendary', 70, NULL, NULL, 10000, 100),

-- ── Mounts ───────────────────────────────────────────────────────────────────

  ('Draft Horse',
   'Heavy. Reliable. Will not spook at blood.',
   'mount', 1, 2, 'common', 1, NULL, 500, 100, NULL),

  ('Mule of Hermes',
   'Divine errands require divine persistence. This one has outlasted three pantheons.',
   'mount', 0, 3, 'common', 1, NULL, 400, 80, NULL),

  ('War Stallion',
   'Raised on battlefields and terrified of nothing. The cavalry''s secret weapon.',
   'mount', 3, 5, 'uncommon', 8, NULL, 1800, 360, NULL),

  ('Sleipnir Pup',
   'Eight-legged and curious. Grows into the fastest thing in nine realms.',
   'mount', 5, 3, 'uncommon', 12, 'aesir', 2500, 500, NULL),

  ('Storm-Born Horse',
   'Struck by lightning at birth and survived. Runs faster in thunder.',
   'mount', 4, 5, 'uncommon', 15, NULL, 3000, 600, NULL),

  ('Pegasus',
   'The winged horse of Perseus. Doesn''t fly for everyone. You apparently qualify.',
   'mount', 9, 9, 'rare', 22, 'olympians', 7500, 1500, NULL),

  ('Lamassu',
   'Bull body, eagle wings, human head. Guards all doors. Except yours, now.',
   'mount', 7, 13, 'rare', 25, 'annunaki', 8500, 1700, NULL),

  ('Chimera Fragment',
   'Not the full beast — a fragment, partially tamed. The part that isn''t tamed is the fast half.',
   'mount', 11, 8, 'rare', 30, NULL, 10000, 2000, NULL),

  ('Fenrir Pup',
   'Raised in chains since birth. Loyal to exactly one person. Currently: you.',
   'mount', 22, 12, 'epic', 50, 'aesir', 30000, 6000, NULL),

  ('Divine Chariot',
   'Helios loaned it once. It was returned damaged. He never asked for it back.',
   'mount', 35, 35, 'legendary', 80, NULL, NULL, 12000, 120),

-- ── Companions ───────────────────────────────────────────────────────────────

  ('Minor Sprite',
   'Bound to serve. Not particularly intelligent. Extremely enthusiastic.',
   'companion', 2, 1, 'common', 1, NULL, 300, 60, NULL),

  ('Shade of the Dead',
   'A hero''s ghost, briefly conscripted. Remembers enough of life to be useful.',
   'companion', 3, 0, 'common', 1, NULL, 250, 50, NULL),

  ('Einherjar Scout',
   'A chosen warrior who died well and accepted the offer. Knows every formation Odin ever taught.',
   'companion', 6, 3, 'uncommon', 8, 'aesir', 2000, 400, NULL),

  ('Sacred Hound',
   'Temple-trained to track divine bloodlines. Won''t bark at anything that isn''t worth killing.',
   'companion', 4, 5, 'uncommon', 12, NULL, 2500, 500, NULL),

  ('Temple Guardian',
   'Bound to a shrine for centuries before you freed it. Grateful. Protective.',
   'companion', 2, 8, 'uncommon', 10, NULL, 2200, 440, NULL),

  ('Olympian Herald',
   'Hermes'' second-favorite messenger. Fast, reliable, and knows which doors to open.',
   'companion', 8, 8, 'rare', 20, 'olympians', 6500, 1300, NULL),

  ('Sumerian Sage',
   'Three thousand years of accumulated wisdom. Mostly about which divine mistakes to avoid.',
   'companion', 7, 10, 'rare', 22, 'annunaki', 7000, 1400, NULL),

  ('Valkyrie Fragment',
   'Half of a Valkyrie, split at the moment of choosing. The half that chose you.',
   'companion', 13, 5, 'rare', 28, 'aesir', 9500, 1900, NULL),

  ('Divine Emissary',
   'Technically working for no specific deity right now. Technically available to serve yours.',
   'companion', 20, 20, 'epic', 55, NULL, 35000, 7000, NULL),

  ('Bound Titan',
   'Chained since the first age. The chains broke three minutes ago. Choosing to stay. For now.',
   'companion', 45, 20, 'legendary', 85, NULL, NULL, 15000, 150);

-- ─── pw_quest_loot ───────────────────────────────────────────────────────────
-- Maps quests to droppable items.  drop_weight = 1 (equal probability).
-- Tier 1 quests (IDs 1–8)   → common items only
-- Tier 2 quests (IDs 9–16)  → common + uncommon
-- Tier 3 quests (IDs 17–25) → uncommon + rare
-- Tier 4 quests (IDs 26–33) → rare + epic
-- Tier 5 quests (IDs 34–40) → epic + legendary

INSERT INTO pw_quest_loot (quest_id, item_id, drop_weight) VALUES
-- Tier 1
(1,  1,  1), (1,  11, 1), (1,  41, 1),
(2,  2,  1), (2,  12, 1), (2,  42, 1),
(3,  1,  1), (3,  21, 1), (3,  31, 1),
(4,  2,  1), (4,  22, 1), (4,  32, 1),
(5,  11, 1), (5,  21, 1), (5,  41, 1),
(6,  12, 1), (6,  22, 1), (6,  42, 1),
(7,  1,  1), (7,  12, 1), (7,  31, 1),
(8,  2,  1), (8,  11, 1), (8,  32, 1),
-- Tier 2
(9,  3,  1), (9,  13, 1), (9,  43, 1),
(10, 4,  1), (10, 14, 1), (10, 44, 1),
(11, 3,  1), (11, 23, 1), (11, 33, 1),
(12, 4,  1), (12, 24, 1), (12, 34, 1),
(13, 2,  1), (13, 13, 1), (13, 44, 1),
(14, 3,  1), (14, 15, 1), (14, 45, 1),
(15, 4,  1), (15, 25, 1), (15, 35, 1),
(16, 1,  1), (16, 23, 1), (16, 43, 1),
-- Tier 3
(17, 5,  1), (17, 16, 1), (17, 46, 1),
(18, 6,  1), (18, 17, 1), (18, 36, 1),
(19, 5,  1), (19, 26, 1), (19, 43, 1),
(20, 4,  1), (20, 27, 1), (20, 47, 1),
(21, 6,  1), (21, 16, 1), (21, 46, 1),
(22, 5,  1), (22, 28, 1), (22, 37, 1),
(23, 6,  1), (23, 27, 1), (23, 38, 1),
(24, 4,  1), (24, 26, 1), (24, 48, 1),
(25, 3,  1), (25, 17, 1), (25, 47, 1),
-- Tier 4
(26, 7,  1), (26, 17, 1), (26, 37, 1),
(27, 8,  1), (27, 18, 1), (27, 47, 1),
(28, 7,  1), (28, 28, 1), (28, 38, 1),
(29, 6,  1), (29, 18, 1), (29, 49, 1),
(30, 8,  1), (30, 29, 1), (30, 39, 1),
(31, 7,  1), (31, 27, 1), (31, 48, 1),
(32, 5,  1), (32, 38, 1), (32, 49, 1),
(33, 8,  1), (33, 19, 1), (33, 37, 1),
-- Tier 5
(34, 9,  1), (34, 19, 1), (34, 49, 1),
(35, 10, 1), (35, 20, 1), (35, 50, 1),
(36, 9,  1), (36, 29, 1), (36, 40, 1),
(37, 10, 1), (37, 30, 1), (37, 39, 1),
(38, 9,  1), (38, 20, 1), (38, 50, 1),
(39, 10, 1), (39, 29, 1), (39, 40, 1),
(40, 8,  1), (40, 30, 1), (40, 49, 1);

-- ─── pw_temples ───────────────────────────────────────────────────────────────
-- Re-runnable: clears player-owned temples, then re-seeds the catalog.
-- WARNING: Also clears pw_player_temples (player ownership data).
TRUNCATE pw_temples CASCADE;
-- ↑ cascades to: pw_player_temples

-- Columns: type, name, base_cost, income_per_hour, level_required
INSERT INTO pw_temples (type, name, base_cost, income_per_hour, level_required)
VALUES
  ('roadside_shrine',  'Roadside Shrine',   500,     10,    1),
  ('minor_temple',     'Minor Temple',      2500,    40,    10),
  ('grand_temple',     'Grand Temple',      15000,   200,   25),
  ('divine_fortress',  'Divine Fortress',   100000,  1000,  50),
  ('pantheon_citadel', 'Pantheon Citadel',  500000,  4000,  75);

-- ─── Pantheon Wars: Alliance Dungeons — Phase D7 Migration ───────────────────
-- Seed: 13 dungeons + encounters + boss loot. Removes smoke-test fixture.
-- RUN MANUALLY in Neon SQL Editor against POSTGRES_DATABASE_URL.
-- Idempotent / safe to re-run.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── PART 0: Remove smoke-test dungeon (cascades to encounters + boss loot) ───
-- pw_dungeon_runs.dungeon_id has no ON DELETE CASCADE, so we must remove
-- run history manually before the dungeon row can be deleted.
-- pw_dungeon_party and pw_dungeon_votekicks both CASCADE from pw_dungeon_runs,
-- but we delete them explicitly first so the order is unambiguous.

DELETE FROM pw_dungeon_party
WHERE run_id IN (
  SELECT r.id FROM pw_dungeon_runs r
  JOIN pw_dungeons d ON d.id = r.dungeon_id
  WHERE d.slug = 'smoke-test-crypt');

DELETE FROM pw_dungeon_votekicks
WHERE run_id IN (
  SELECT r.id FROM pw_dungeon_runs r
  JOIN pw_dungeons d ON d.id = r.dungeon_id
  WHERE d.slug = 'smoke-test-crypt');

DELETE FROM pw_dungeon_runs
WHERE dungeon_id IN (
  SELECT id FROM pw_dungeons WHERE slug = 'smoke-test-crypt');

DELETE FROM pw_dungeons WHERE slug = 'smoke-test-crypt';

-- ── PART 1: INSERT 13 dungeons ────────────────────────────────────────────────
-- INSERT...SELECT allows subqueries in key_item_id. WHERE NOT EXISTS = idempotent.

-- ─── 2-MAN EASY ──────────────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'sunken-palaestra',
  'The Sunken Palaestra',
  'Drowned Greek athletic ground; shades run endless drills.',
  'The Palaestra of Aristos sank into the sea during the Unraveling, taking its athletes mid-contest. They do not know they are dead.',
  2, 'easy', 1, FALSE, 0, NULL, 3, 10
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'sunken-palaestra');

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'hollow-barrow',
  'The Hollow Barrow',
  'Pre-pantheon burial mound; older than the gods.',
  'This mound predates all three pantheons. Whatever it contains was buried before gods had names.',
  2, 'easy', 4, FALSE, 0, NULL, 3, 11
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'hollow-barrow');

-- ─── 2-MAN MEDIUM ────────────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'hall-frozen-oaths',
  'Hall of Frozen Oaths',
  'Norse mead-hall; oathbreakers frozen mid-feast.',
  'Twenty jarls swore oaths on the same winter night; all twenty broke them by dawn. The hall froze at the moment of betrayal and has not thawed.',
  2, 'medium', 10, FALSE, 0, NULL, 4, 12
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'hall-frozen-oaths');

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'reed-labyrinth',
  'The Reed Labyrinth',
  'Annunaki marsh-maze grown from the first reeds.',
  'The first reeds of Eridu grew here before the world had cities. Architect-priests spent lifetimes mapping it; none ever reached the center.',
  2, 'medium', 14, FALSE, 0, NULL, 4, 13
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'reed-labyrinth');

-- ─── 2-MAN HARD ──────────────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'bronze-tartarus',
  'The Bronze Tartarus',
  'Bronze pit beneath Tartarus where cruel jailers were sealed.',
  'Below Tartarus'' lowest level, the Cyclopes sealed the cruelest jailers of the Titan War in a bronze pit. The seals still hold. The cruelty does not.',
  2, 'hard', 22, FALSE, 0,
  (SELECT id FROM pw_items WHERE name = '2-Man Hard Key' AND slot = 'key' LIMIT 1),
  5, 14
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'bronze-tartarus');

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'maw-below',
  'The Maw Below',
  'A living cave-system with a digestive patience; older than gods.',
  'A cave system older than any pantheon — not dead, not sleeping. Patient. The fossils in its walls are nothing geological.',
  2, 'hard', 28, FALSE, 0,
  (SELECT id FROM pw_items WHERE name = '2-Man Hard Key' AND slot = 'key' LIMIT 1),
  5, 15
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'maw-below');

-- ─── 5-MAN EASY ──────────────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'shattered-bifrost',
  'The Shattered Bifrost Span',
  'Broken length of the rainbow bridge fallen to the mortal world.',
  'A span of the Bifrost fell to Midgard when Asgard fractured. The bridge does not know it is broken and still tries to open the way between worlds.',
  5, 'easy', 12, FALSE, 0, NULL, 3, 20
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'shattered-bifrost');

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'glass-wastes',
  'The Glass Wastes',
  'A desert fused to glass by something that fell from the sky.',
  'Something fell from the sky before recorded history and fused the sand into a mirror. Whatever it was, pieces of it still walk the glass.',
  5, 'easy', 16, FALSE, 0, NULL, 3, 21
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'glass-wastes');

-- ─── 5-MAN MEDIUM ────────────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'ziggurat-silence',
  'The Ziggurat of Silence',
  'Annunaki ziggurat; priests took a vow of silence so total they forgot how to die.',
  'The priests of this ziggurat swore silence to the absent gods and waited. They are still waiting. They forgot how to die.',
  5, 'medium', 32, FALSE, 0, NULL, 4, 22
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'ziggurat-silence');

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'olympian-reliquary',
  'The Olympian Reliquary',
  'Vault of relics too dangerous to wield; guardians never stood down.',
  'A vault of relics too dangerous to destroy and too volatile to wield. The Olympians sealed guardians inside with them. Neither has stood down.',
  5, 'medium', 36, FALSE, 0, NULL, 4, 23
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'olympian-reliquary');

-- ─── 5-MAN HARD ──────────────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'drowned-apsu',
  'The Drowned Apsu',
  'A shard of the primordial freshwater deep, pooled in a sunken temple.',
  'A shard of the primordial Apsu — the freshwater abyss before all creation — pooled here when the divine order fractured. It remembers nothing. It wants everything.',
  5, 'hard', 50, FALSE, 0,
  (SELECT id FROM pw_items WHERE name = '5-Man Hard Key' AND slot = 'key' LIMIT 1),
  5, 24
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'drowned-apsu');

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'worldforge-ruin',
  'The Worldforge Ruin',
  'Ruin of a forge predating all three pantheons; machines still run, building nothing.',
  'A forge predating all three pantheons still operates here, building toward a design no living mind has seen completed.',
  5, 'hard', 56, FALSE, 0,
  (SELECT id FROM pw_items WHERE name = '5-Man Hard Key' AND slot = 'key' LIMIT 1),
  5, 25
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'worldforge-ruin');

-- ─── 10-MAN RAID (EXPERT) ────────────────────────────────────────────────────

INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
SELECT
  'unmaking-of-thanas',
  'The Unmaking of Thanas, the Withered End',
  'Corrupted minor old god. An all-alliance raid for mortals of 65th level and above.',
  'Thanas was a minor death-daemon — a quiet psychopomp who ushered the small and forgotten across. The Unraveling tore something into him; now he spreads unmaking — entropy that erases rather than ends. Both alignments raid him: the Coalition because corruption this deep threatens the Accord; the Compact because an un-making god respects no sovereignty. He is killable precisely because he is corrupted and lesser.',
  10, 'expert', 65, TRUE, 50000,
  (SELECT id FROM pw_items WHERE name = 'Raid Key' AND slot = 'key' LIMIT 1),
  5, 30
WHERE NOT EXISTS (SELECT 1 FROM pw_dungeons WHERE slug = 'unmaking-of-thanas');

-- ── PART 2: Set drops_key_item_id ────────────────────────────────────────────

-- 2-Man Medium + 2-Man Hard (chain) → drop 2-Man Hard Key
UPDATE pw_dungeons
SET drops_key_item_id = (SELECT id FROM pw_items WHERE name = '2-Man Hard Key' AND slot = 'key' LIMIT 1)
WHERE slug IN ('hall-frozen-oaths', 'reed-labyrinth', 'bronze-tartarus', 'maw-below')
  AND drops_key_item_id IS NULL;

-- 5-Man Medium → drop 5-Man Hard Key
UPDATE pw_dungeons
SET drops_key_item_id = (SELECT id FROM pw_items WHERE name = '5-Man Hard Key' AND slot = 'key' LIMIT 1)
WHERE slug IN ('ziggurat-silence', 'olympian-reliquary')
  AND drops_key_item_id IS NULL;

-- 5-Man Hard → drop Raid Key
UPDATE pw_dungeons
SET drops_key_item_id = (SELECT id FROM pw_items WHERE name = 'Raid Key' AND slot = 'key' LIMIT 1)
WHERE slug IN ('drowned-apsu', 'worldforge-ruin')
  AND drops_key_item_id IS NULL;

-- ── PART 3: INSERT encounters ─────────────────────────────────────────────────
-- Pattern: CROSS JOIN VALUES + NOT EXISTS guard on (dungeon_id, encounter_index).
-- Column order: enc_idx, enc_type, enc_name, enemy_cnt, hp_mult, base_atk,
--               base_def, ab_name, ab_desc, ab_type, ab_val,
--               dr_min, dr_max, gear_pct
-- ability_type NULL  → cosmetic / no-ability (sim ignores)
-- ability_type set   → mechanically active (crushing_weight/death_aura/ragnarok_flame)

-- ─── #1 sunken-palaestra (2-man easy, 3 enc) ─────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Drowned Competitors'::text,        3::smallint,0.40::numeric, 5, 2,NULL::varchar,NULL::text,NULL::varchar,0,10,25,25),
  (2::smallint,'boss'::varchar,      'The Pankration Shade'::text,       1::smallint,0.80::numeric, 9, 4,NULL,         NULL,      NULL,        0, 0, 0, 0),
  (3::smallint,'final_boss'::varchar,'Master of the Drowned Games'::text,1::smallint,1.10::numeric,12, 6,NULL,         NULL,      NULL,        0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'sunken-palaestra'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #2 hollow-barrow (2-man easy, 3 enc) ────────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Barrow Wights'::text,     3::smallint,0.45::numeric, 6, 2,NULL::varchar,NULL::text,NULL::varchar,0,10,25,25),
  (2::smallint,'boss'::varchar,      'The Grave-Warden'::text,  1::smallint,0.85::numeric,10, 5,NULL,         NULL,      NULL,        0, 0, 0, 0),
  (3::smallint,'final_boss'::varchar,'The First Interred'::text,1::smallint,1.15::numeric,13, 7,NULL,         NULL,      NULL,        0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'hollow-barrow'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #3 hall-frozen-oaths (2-man medium, 4 enc) ──────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Oathbroken Thralls'::text,    3::smallint,0.50::numeric, 9, 4,NULL::varchar,NULL::text,                                                                                 NULL::varchar,0,30,70,20),
  (2::smallint,'trash'::varchar,     'Frost-Bound Berserkers'::text,2::smallint,0.60::numeric,11, 4,NULL,         NULL,                                                                                        NULL,        0,30,70,20),
  (3::smallint,'boss'::varchar,      'The Rimewarden'::text,        1::smallint,0.90::numeric,14, 7,NULL,         NULL,                                                                                        NULL,        0, 0, 0, 0),
  (4::smallint,'final_boss'::varchar,'Jarl of Broken Vows'::text,   1::smallint,1.25::numeric,18, 9,'Oathfrost',  'The jarl''s broken oath crystallizes in the air as frost — a spectral chill that fades with the battle.',NULL,0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'hall-frozen-oaths'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #4 reed-labyrinth (2-man medium, 4 enc) ─────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Marsh Lurkers'::text,         3::smallint,0.50::numeric, 9, 4,NULL::varchar,NULL::text,                                                                                NULL::varchar,0,30,70,20),
  (2::smallint,'trash'::varchar,     'Reed-Cutter Constructs'::text,2::smallint,0.60::numeric,12, 5,NULL,         NULL,                                                                                       NULL,        0,30,70,20),
  (3::smallint,'boss'::varchar,      'The Surveyor'::text,          1::smallint,0.90::numeric,14, 8,NULL,         NULL,                                                                                       NULL,        0, 0, 0, 0),
  (4::smallint,'final_boss'::varchar,'Architect of the Maze'::text, 1::smallint,1.25::numeric,18,10,'Misdirection','The Architect weaves the maze around the party — a disorienting cascade of false paths that fades with the battle.',NULL,0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'reed-labyrinth'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #5 bronze-tartarus (2-man hard, 5 enc) ──────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Bronze Jailers'::text,    3::smallint,0.55::numeric,14, 6,NULL::varchar,NULL::text,                                                                           NULL::varchar,  0, 80,180,15),
  (2::smallint,'trash'::varchar,     'Chain-Hounds'::text,      3::smallint,0.60::numeric,16, 6,NULL,         NULL,                                                                                  NULL,           0, 80,180,15),
  (3::smallint,'boss'::varchar,      'The Smith of Fetters'::text,1::smallint,0.95::numeric,20,10,NULL,        NULL,                                                                                  NULL,           0,  0,  0, 0),
  (4::smallint,'boss'::varchar,      'Warden Brontes'::text,    1::smallint,1.00::numeric,22,11,NULL,         NULL,                                                                                  NULL,           0,  0,  0, 0),
  (5::smallint,'final_boss'::varchar,'The Bronze Colossus'::text,1::smallint,1.40::numeric,28,14,'Molten Core','The Colossus superheats its bronze shell, radiating crushing pressure that reduces all party damage by 12%.','crushing_weight',12, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'bronze-tartarus'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #6 maw-below (2-man hard, 5 enc) ────────────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Gnashing Swarm'::text,         4::smallint,0.55::numeric,15, 5,NULL::varchar,NULL::text,                                                         NULL::varchar,0, 80,180,15),
  (2::smallint,'trash'::varchar,     'Acid Crawlers'::text,          3::smallint,0.60::numeric,17, 6,NULL,         NULL,                                                                NULL,        0, 80,180,15),
  (3::smallint,'boss'::varchar,      'The Peristaltic Horror'::text, 1::smallint,0.95::numeric,21, 9,NULL,         NULL,                                                                NULL,        0,  0,  0, 0),
  (4::smallint,'boss'::varchar,      'Bile-Tongue'::text,            1::smallint,1.05::numeric,23,10,NULL,         NULL,                                                                NULL,        0,  0,  0, 0),
  (5::smallint,'final_boss'::varchar,'The Maw Itself'::text,         1::smallint,1.45::numeric,30,12,'Digest',     'The Maw processes its prey continuously, dealing 8 unavoidable damage per round to all party members.','death_aura',8, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'maw-below'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #7 shattered-bifrost (5-man easy, 3 enc) ────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Gap-Wraiths'::text,                  4::smallint,0.45::numeric,12, 5,NULL::varchar,NULL::text,NULL::varchar,0,25,60,25),
  (2::smallint,'boss'::varchar,      'Heimdall''s Forgotten Sentry'::text, 1::smallint,0.85::numeric,16, 8,NULL,         NULL,      NULL,        0, 0, 0, 0),
  (3::smallint,'final_boss'::varchar,'The Bridge-Devourer'::text,          1::smallint,1.15::numeric,20,10,NULL,         NULL,      NULL,        0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'shattered-bifrost'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #8 glass-wastes (5-man easy, 3 enc) ─────────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Mirror-Stalkers'::text,       4::smallint,0.50::numeric,13, 5,NULL::varchar,NULL::text,NULL::varchar,0,25,60,25),
  (2::smallint,'boss'::varchar,      'The Refracted One'::text,     1::smallint,0.85::numeric,17, 8,NULL,         NULL,      NULL,        0, 0, 0, 0),
  (3::smallint,'final_boss'::varchar,'What Fell From the Sky'::text,1::smallint,1.15::numeric,21,10,NULL,         NULL,      NULL,        0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'glass-wastes'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #9 ziggurat-silence (5-man medium, 4 enc) ───────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Silent Acolytes'::text,            4::smallint,0.55::numeric,20, 9,NULL::varchar,NULL::text,                                                   NULL::varchar,0,100,250,20),
  (2::smallint,'trash'::varchar,     'Mute Sentinels'::text,             3::smallint,0.65::numeric,22,10,NULL,         NULL,                                                          NULL,        0,100,250,20),
  (3::smallint,'boss'::varchar,      'The Voiceless Priest'::text,       1::smallint,0.95::numeric,26,13,NULL,         NULL,                                                          NULL,        0,  0,  0, 0),
  (4::smallint,'final_boss'::varchar,'High Hierophant of Nothing'::text, 1::smallint,1.30::numeric,32,16,'Hush',       'The Hierophant''s vow of silence radiates outward as a brief, eerie stillness — felt but not suffered.',NULL,0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'ziggurat-silence'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #10 olympian-reliquary (5-man medium, 4 enc) ────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Reliquary Automatons'::text,    4::smallint,0.55::numeric,21, 9,NULL::varchar,NULL::text,                                                                               NULL::varchar,0,100,250,20),
  (2::smallint,'trash'::varchar,     'Golden Watchers'::text,         3::smallint,0.65::numeric,23,11,NULL,         NULL,                                                                                      NULL,        0,100,250,20),
  (3::smallint,'boss'::varchar,      'Keeper Talos-Minor'::text,      1::smallint,0.95::numeric,27,14,NULL,         NULL,                                                                                      NULL,        0,  0,  0, 0),
  (4::smallint,'final_boss'::varchar,'The Relic-Bound Guardian'::text,1::smallint,1.30::numeric,33,17,'Aegis Field','An ancient Olympian ward flickers into existence — a ghostly shimmer of divine protection long since depleted.',NULL,0, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'olympian-reliquary'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #11 drowned-apsu (5-man hard, 5 enc) ────────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Apsu-Spawn'::text,               4::smallint,0.60::numeric,28,12,NULL::varchar,NULL::text,                                                                       NULL::varchar,  0,250,600,15),
  (2::smallint,'trash'::varchar,     'Deep Heralds'::text,             3::smallint,0.70::numeric,30,13,NULL,         NULL,                                                                               NULL,           0,250,600,15),
  (3::smallint,'boss'::varchar,      'Tidecaller of the Deep'::text,   1::smallint,1.00::numeric,34,16,NULL,         NULL,                                                                               NULL,           0,  0,  0, 0),
  (4::smallint,'boss'::varchar,      'The Brine Leviathan'::text,      1::smallint,1.10::numeric,37,18,NULL,         NULL,                                                                               NULL,           0,  0,  0, 0),
  (5::smallint,'final_boss'::varchar,'Avatar of the First Water'::text,1::smallint,1.50::numeric,44,22,'Drown',      'The Avatar submerges the battlefield in primordial water, dealing 10 unavoidable damage per round to all party members.','death_aura',10, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'drowned-apsu'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #12 worldforge-ruin (5-man hard, 5 enc) ─────────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'Forge-Husks'::text,        4::smallint,0.60::numeric,29,12,NULL::varchar,NULL::text,                                                                              NULL::varchar,  0,250,600,15),
  (2::smallint,'trash'::varchar,     'Molten Constructs'::text,  3::smallint,0.70::numeric,31,14,NULL,         NULL,                                                                                     NULL,           0,250,600,15),
  (3::smallint,'boss'::varchar,      'The Overseer-Engine'::text,1::smallint,1.00::numeric,35,17,NULL,         NULL,                                                                                     NULL,           0,  0,  0, 0),
  (4::smallint,'boss'::varchar,      'Hammer of Creation'::text, 1::smallint,1.10::numeric,38,19,NULL,         NULL,                                                                                     NULL,           0,  0,  0, 0),
  (5::smallint,'final_boss'::varchar,'The Unfinished God'::text, 1::smallint,1.55::numeric,46,23,'Reforge',    'The Unfinished God''s creation field destabilizes mortal weapons, reducing all party damage dealt by 15%.','crushing_weight',15, 0, 0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'worldforge-ruin'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ─── #13 unmaking-of-thanas (10-man raid, 5 enc) ─────────────────────────────
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense,
   ability_name, ability_description, ability_type, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.enc_idx, v.enc_type, v.enc_name, v.enemy_cnt,
       v.hp_mult, v.base_atk, v.base_def,
       v.ab_name, v.ab_desc, v.ab_type, v.ab_val,
       v.dr_min, v.dr_max, v.gear_pct
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint,'trash'::varchar,     'The Erased'::text,              5::smallint,0.70::numeric,40,18,NULL::varchar,  NULL::text,                                                                                              NULL::varchar,    0,500,1200,10),
  (2::smallint,'boss'::varchar,      'The Withering Herald'::text,    1::smallint,1.20::numeric,48,22,'Withering Presence','The Herald''s aura withers mortal weapons on contact, reducing all party damage by 20%.','crushing_weight',20,  0,   0, 0),
  (3::smallint,'trash'::varchar,     'Motes of Unbeing'::text,        6::smallint,0.65::numeric,44,16,NULL,           NULL,                                                                                                    NULL,             0,500,1200,10),
  (4::smallint,'boss'::varchar,      'Thanas'' Hollow Shadow'::text,  1::smallint,1.30::numeric,52,24,'Touch of Unbeing','Each round, the Shadow of Thanas erodes every raider, dealing 15 unavoidable damage.',             'death_aura',    15,  0,   0, 0),
  (5::smallint,'final_boss'::varchar,'Thanas, the Withered End'::text,1::smallint,1.80::numeric,62,30,'Final Unmaking', 'At near-death, Thanas unleashes total entropy — an 80-damage wave that strikes every raider simultaneously.','ragnarok_flame',80,  0,   0, 0)
) AS v(enc_idx,enc_type,enc_name,enemy_cnt,hp_mult,base_atk,base_def,ab_name,ab_desc,ab_type,ab_val,dr_min,dr_max,gear_pct)
WHERE d.slug = 'unmaking-of-thanas'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.enc_idx
  );

-- ── PART 4: INSERT boss loot ──────────────────────────────────────────────────
-- One INSERT per loot row. NOT EXISTS guard on (encounter_id, item_id).
-- Individual: is_contested FALSE, individual_chance = % from spec.
-- Contested:  is_contested TRUE,  individual_chance = 0.

-- ─── #1 sunken-palaestra ─────────────────────────────────────────────────────
-- E2 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 68, 1, FALSE, 40 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'sunken-palaestra'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 68);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 1, 1, FALSE, 40 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'sunken-palaestra'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 1);

-- E3 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 21, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'sunken-palaestra'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 21);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 77, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'sunken-palaestra'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 77);

-- ─── #2 hollow-barrow ────────────────────────────────────────────────────────
-- E2 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 121, 1, FALSE, 40 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hollow-barrow'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 121);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 149, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hollow-barrow'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 149);

-- E3 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 135, 1, FALSE, 30 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hollow-barrow'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 135);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 107, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hollow-barrow'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 107);

-- ─── #3 hall-frozen-oaths ────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 69, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hall-frozen-oaths'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 69);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 14, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hall-frozen-oaths'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 14);

-- E4 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 81, 1, FALSE, 25 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hall-frozen-oaths'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 81);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 75, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'hall-frozen-oaths'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 75);

-- ─── #4 reed-labyrinth ───────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 76, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'reed-labyrinth'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 76);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 24, 1, FALSE, 30 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'reed-labyrinth'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 24);

-- E4 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 70, 1, FALSE, 25 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'reed-labyrinth'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 70);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 85, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'reed-labyrinth'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 85);

-- ─── #5 bronze-tartarus ──────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 71, 1, FALSE, 30 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'bronze-tartarus'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 71);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 17, 1, FALSE, 30 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'bronze-tartarus'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 17);

-- E4 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 26, 1, FALSE, 25 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'bronze-tartarus'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 26);

-- E5 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 36, 1, FALSE, 18 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'bronze-tartarus'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 36);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 19, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'bronze-tartarus'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 19);

-- ─── #6 maw-below ────────────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 156, 1, FALSE, 28 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'maw-below'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 156);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 116, 1, FALSE, 22 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'maw-below'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 116);

-- E4 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 130, 1, FALSE, 20 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'maw-below'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 130);

-- E5 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 145, 1, FALSE, 15 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'maw-below'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 145);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 120, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'maw-below'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 120);

-- ─── #7 shattered-bifrost ────────────────────────────────────────────────────
-- E2 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 84, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'shattered-bifrost'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 84);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 14, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'shattered-bifrost'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 14);

-- E3 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 34, 1, FALSE, 25 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'shattered-bifrost'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 34);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 75, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'shattered-bifrost'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 75);

-- ─── #8 glass-wastes ─────────────────────────────────────────────────────────
-- E2 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 126, 1, FALSE, 35 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'glass-wastes'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 126);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 154, 1, FALSE, 30 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'glass-wastes'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 154);

-- E3 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 99, 1, FALSE, 25 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'glass-wastes'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 99);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 114, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'glass-wastes'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 114);

-- ─── #9 ziggurat-silence ─────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 8, 1, FALSE, 24 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'ziggurat-silence'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 8);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 16, 1, FALSE, 28 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'ziggurat-silence'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 16);

-- E4 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 27, 1, FALSE, 22 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'ziggurat-silence'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 27);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 37, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'ziggurat-silence'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 37);

-- ─── #10 olympian-reliquary ──────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 7, 1, FALSE, 24 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'olympian-reliquary'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 7);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 19, 1, FALSE, 24 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'olympian-reliquary'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 19);

-- E4 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 46, 1, FALSE, 20 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'olympian-reliquary'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 46);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 29, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'olympian-reliquary'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 29);

-- ─── #11 drowned-apsu ────────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 8, 1, FALSE, 22 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'drowned-apsu'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 8);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 18, 1, FALSE, 22 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'drowned-apsu'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 18);

-- E4 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 29, 1, FALSE, 18 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'drowned-apsu'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 29);

-- E5 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 159, 1, FALSE, 14 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'drowned-apsu'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 159);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 133, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'drowned-apsu'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 133);

-- ─── #12 worldforge-ruin ─────────────────────────────────────────────────────
-- E3 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 106, 1, FALSE, 20 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'worldforge-ruin'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 106);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 117, 1, FALSE, 20 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'worldforge-ruin'
WHERE e.encounter_index = 3
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 117);

-- E4 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 159, 1, FALSE, 16 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'worldforge-ruin'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 159);

-- E5 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 147, 1, FALSE, 12 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'worldforge-ruin'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 147);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 131, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'worldforge-ruin'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 131);

-- ─── #13 unmaking-of-thanas ──────────────────────────────────────────────────
-- E2 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 49, 1, FALSE, 15 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 49);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 18, 1, FALSE, 15 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 2
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 18);

-- E4 boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 39, 1, FALSE, 12 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 39);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 159, 1, FALSE, 12 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 4
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 159);

-- E5 final_boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 20, 1, FALSE, 8 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 20);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 50, 1, FALSE, 10 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 50);

INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, 30, 1, TRUE, 0 FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'unmaking-of-thanas'
WHERE e.encounter_index = 5
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id AND bl.item_id = 30);

-- ─── End Phase D7 migration ───────────────────────────────────────────────────

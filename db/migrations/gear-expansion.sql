-- Gear Expansion — +100 items, lifesteal + energy_on_hit gear stats
-- Run via Neon console ONCE, manually. (The ALTERs are idempotent; the INSERT
-- is guarded per-row by a name anti-join so a re-run inserts nothing new.)
--
-- Verified against live DB before authoring: MAX(id)=62, COUNT=62. New rows omit
-- the id column entirely so SERIAL assigns ids starting at 63 — never hardcoded.
-- faction_exclusive uses the live convention: 'olympians' | 'aesir' | 'annunaki'.

-- ── A) Two new gear-only stat columns (percentage points; cap enforced in code) ─

ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS lifesteal     INT DEFAULT 0;
ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS energy_on_hit INT DEFAULT 0;

-- ── B) 100 new items ──────────────────────────────────────────────────────────
-- Composition: 5 legendary (1/slot, neutral, glory-priced, no buy_price)
--            + 25 faction-exclusive (common/uncommon/rare, buy-priced)
--            + 70 faction-neutral (weighted rare/epic).
-- lifesteal/energy_on_hit only on weapon/mount/artifact/companion (never armor).
-- Stat budgets matched to the existing per-rarity power curve (no power-creep).
--
-- The first VALUES row casts its NULL nullable columns so Postgres anchors the
-- column types for the whole list (faction_exclusive→varchar, buy_price→int).

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  lifesteal, energy_on_hit,
  rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price
)
SELECT v.* FROM (VALUES
  -- ═══ 5 LEGENDARY — 1 per slot, neutral, glory shop rotation ═══
  ('Ichor Reaver',          'A blade that drinks the divine blood of those it fells.',           'weapon',    52, 0,  0, 22, 0,  0,  10, 0,  'legendary', 70, NULL::varchar(20), NULL::integer, 7000,  620),
  ('Bulwark of the Ancients','A wall of god-forged bronze that has never been breached.',         'armor',      0, 54, 0,  0, 40, 0,  0,  0,  'legendary', 65, NULL, NULL, 6500,  560),
  ('Heart of Creation',     'A shard of the first spark, pulsing with primordial power.',         'artifact',  28, 28, 0, 25, 15, 10, 0,  0,  'legendary', 70, NULL, NULL, 10000, 720),
  ('Tempest Drake',         'A storm given wings; lightning crackles in its wake.',               'mount',     34, 34, 10,10, 0,  24, 0,  10, 'legendary', 80, NULL, NULL, 12000, 860),
  ('Eternal Revenant',      'A warrior-spirit bound past death, hungry for the fray.',            'companion', 44, 20, 0, 20, 15, 5,  0,  0,  'legendary', 85, NULL, NULL, 14000, 920),

  -- ═══ 25 FACTION-EXCLUSIVE — common/uncommon/rare, buy-priced ═══
  -- Weapons
  ('Laurel Shortsword',     'A ceremonial Olympian blade wreathed in gilded laurel.',             'weapon',     3, 0,  0,  5, 0,  0,  0,  0,  'common',    1,  'olympians', 320,  64,   NULL),
  ('Runed Hand-Axe',        'Aesir steel etched with thirst-runes that bleed the foe.',           'weapon',     6, 0,  2,  8, 0,  0,  2,  0,  'uncommon',  7,  'aesir',     820,  164,  NULL),
  ('Anzu Talon',            'The severed claw of the storm-bird Anzu, ever ravenous.',            'weapon',    15, 0,  0, 12, 0,  0,  5,  0,  'rare',      16, 'annunaki',  3300, 660,  NULL),
  ('Spear of Helios',       'Forged in the sun-chariot''s forge; it hums with stored light.',     'weapon',    16, 0,  1, 10, 0,  0,  0,  4,  'rare',      18, 'olympians', 3500, 700,  NULL),
  ('Seax Blade',            'The trusted short blade of every Aesir raider.',                     'weapon',     4, 0,  1,  3, 0,  0,  0,  0,  'common',    1,  'aesir',     300,  60,   NULL),
  -- Armor
  ('Reed-Woven Mail',       'Annunaki marsh-reed armor, light and surprisingly tough.',           'armor',      0, 3,  0,  0, 5,  0,  0,  0,  'common',    1,  'annunaki',  230,  46,   NULL),
  ('Hoplon Shield',         'The great round shield of the Olympian phalanx.',                    'armor',      0, 8,  0,  0, 15, 0,  0,  0,  'uncommon',  6,  'olympians', 800,  160,  NULL),
  ('Wolfhide Hauberk',      'Stitched from dire-wolf pelts blessed by Aesir skalds.',             'armor',      0, 13, 2,  0, 10, 5,  0,  0,  'rare',      18, 'aesir',     3400, 680,  NULL),
  ('Ziggurat Scale',        'Overlapping plates patterned after the sacred ziggurat.',            'armor',      0, 9,  0,  0, 12, 0,  0,  0,  'uncommon',  12, 'annunaki',  1300, 260,  NULL),
  ('Bronze Cuirass',        'Standard-issue Olympian breastplate of beaten bronze.',              'armor',      0, 3,  0,  0, 5,  0,  0,  0,  'common',    1,  'olympians', 240,  48,   NULL),
  -- Artifacts
  ('Rune-Etched Charm',     'A small Aesir talisman humming with carved galdr.',                  'artifact',   1, 1,  0,  5, 0,  0,  0,  0,  'common',    1,  'aesir',     250,  50,   NULL),
  ('Cuneiform Tablet',      'Annunaki clay inscribed with battle-litanies of old.',               'artifact',   4, 3,  0, 10, 0,  0,  0,  2,  'uncommon',  9,  'annunaki',  1300, 260,  NULL),
  ('Aegis Cameo',           'A carved gorgon-face that wards and empowers its bearer.',            'artifact',   8, 9,  0,  5, 10, 0,  0,  4,  'rare',      20, 'olympians', 6200, 1240, NULL),
  ('Raven Totem',           'Odin''s two ravens carved in bog-oak; they whisper warnings.',       'artifact',   4, 2,  3,  0, 0,  10, 0,  0,  'uncommon',  10, 'aesir',     1500, 300,  NULL),
  ('Clay Effigy',           'A crude Annunaki guardian-figure, fired in temple kilns.',           'artifact',   0, 2,  0,  0, 5,  0,  0,  0,  'common',    1,  'annunaki',  210,  42,   NULL),
  -- Mounts
  ('Temple Pony',           'A gentle Olympian temple steed, sure of foot.',                      'mount',      1, 2,  2,  0, 0,  5,  0,  0,  'common',    1,  'olympians', 520,  104,  NULL),
  ('Frost Elk',             'A great Aesir elk whose breath frosts the air around it.',           'mount',      4, 5,  5,  0, 0,  12, 0,  3,  'uncommon',  12, 'aesir',     2500, 500,  NULL),
  ('Lion of Ishtar',        'A war-lion of the goddess; its roar unmans the enemy.',              'mount',     11, 8,  6, 10, 0,  12, 4,  0,  'rare',      25, 'annunaki',  8800, 1760, NULL),
  ('Winged Sandals',        'Hermes-blessed sandals that let the wearer all but fly.',            'mount',      4, 4,  6,  0, 0,  15, 0,  0,  'uncommon',  15, 'olympians', 3000, 600,  NULL),
  ('Shaggy Pony',           'A stout, shaggy Aesir pony bred for the long fjord roads.',          'mount',      0, 3,  3,  0, 0,  10, 0,  0,  'common',    1,  'aesir',     420,  84,   NULL),
  -- Companions
  ('Clay Golem Sprite',     'A palm-sized Annunaki golem animated by a temple sigil.',            'companion',  2, 2,  0,  5, 0,  0,  0,  0,  'common',    1,  'annunaki',  280,  56,   NULL),
  ('Owl of Athena',         'The grey-eyed goddess''s owl, sharp of sight and counsel.',          'companion',  5, 4,  2, 10, 0,  5,  0,  0,  'uncommon',  10, 'olympians', 2300, 460,  NULL),
  ('Dire Wolf Pup',         'A growing Aesir dire-wolf, already a vicious hunter.',               'companion', 13, 5,  3, 15, 0,  10, 5,  0,  'rare',      28, 'aesir',     9500, 1900, NULL),
  ('Temple Lion Cub',       'A young Annunaki guardian-lion, fierce beyond its size.',            'companion',  4, 6,  0,  5, 10, 0,  0,  0,  'uncommon',  10, 'annunaki',  2200, 440,  NULL),
  ('Herald of Apollo',      'A radiant messenger-spirit that empowers its champion.',             'companion',  9, 8,  1, 12, 0,  5,  0,  4,  'rare',      22, 'olympians', 6800, 1360, NULL),

  -- ═══ 70 FACTION-NEUTRAL — weighted rare/epic ═══
  -- Weapons (3c 3u 5r 3e)
  ('Hunting Knife',         'A simple but wickedly sharp skinning knife.',                        'weapon',     3, 0,  0,  5, 0,  0,  0,  0,  'common',    1,  NULL, 280,   56,   NULL),
  ('War Pick',              'A heavy pick built to punch through plate.',                         'weapon',     4, 0,  0,  0, 0,  0,  0,  0,  'common',    1,  NULL, 240,   48,   NULL),
  ('Bronze Mace',           'A blunt bronze head on a sturdy haft.',                              'weapon',     3, 0,  0,  3, 0,  0,  0,  0,  'common',    1,  NULL, 260,   52,   NULL),
  ('Falcata',               'A forward-curved blade that bites deep on the swing.',               'weapon',     6, 0,  0,  8, 0,  0,  0,  0,  'uncommon',  5,  NULL, 720,   144,  NULL),
  ('Twin Daggers',          'A matched pair, quick to draw blood and quicker to vanish.',         'weapon',     5, 0,  3, 12, 0,  0,  2,  0,  'uncommon',  8,  NULL, 950,   190,  NULL),
  ('Halberd',               'A long polearm pairing an axe-head with a spear-point.',             'weapon',     8, 0,  0,  5, 0,  0,  0,  0,  'uncommon',  10, NULL, 1100,  220,  NULL),
  ('Crescent Glaive',       'A curved glaive that opens wounds the wielder feeds upon.',          'weapon',    14, 0,  0, 12, 0,  0,  4,  0,  'rare',      15, NULL, 3200,  640,  NULL),
  ('Serpent Fang',          'A venom-grooved blade that saps the lifeblood of the foe.',          'weapon',    13, 0,  2, 15, 0,  0,  5,  0,  'rare',      17, NULL, 3400,  680,  NULL),
  ('Warhammer of the Vanguard','A frontline crusher carried by shock troops.',                    'weapon',    16, 0,  0,  8, 0,  0,  0,  0,  'rare',      16, NULL, 3000,  600,  NULL),
  ('Executioner''s Cleaver','A massive cleaver that drinks deep with every decisive blow.',       'weapon',    17, 0,  0, 10, 0,  0,  3,  0,  'rare',      20, NULL, 3600,  720,  NULL),
  ('Stormcaller Trident',   'A trident that returns vigor to its wielder on each strike.',        'weapon',    15, 0,  1, 12, 0,  0,  0,  4,  'rare',      18, NULL, 3500,  700,  NULL),
  ('Bloodthirst Saber',     'A cursed saber that heals its bearer with stolen vitality.',         'weapon',    24, 0,  0, 18, 0,  0,  7,  0,  'epic',      36, NULL, 14000, 2800, NULL),
  ('Voidpiercer',           'A blade of starless metal that drinks the wielder''s fatigue.',      'weapon',    27, 0,  2, 15, 0,  0,  0,  6,  'epic',      40, NULL, 15000, 3000, NULL),
  ('Titanbane Maul',        'A two-handed maul forged to crack a titan''s hide.',                 'weapon',    28, 0,  0, 15, 0,  0,  0,  0,  'epic',      38, NULL, 13000, 2600, NULL),
  -- Armor (3c 3u 4r 4e) — no lifesteal/energy_on_hit
  ('Padded Gambeson',       'Quilted cloth armor, cheap and reliable.',                           'armor',      0, 3,  0,  0, 5,  0,  0,  0,  'common',    1,  NULL, 200,   40,   NULL),
  ('Scale Vest',            'Overlapping metal scales sewn onto a leather backing.',              'armor',      0, 2,  0,  0, 5,  0,  0,  0,  'common',    1,  NULL, 180,   36,   NULL),
  ('Iron Pauldrons',        'Heavy shoulder guards of plain iron.',                               'armor',      0, 3,  0,  0, 0,  0,  0,  0,  'common',    1,  NULL, 220,   44,   NULL),
  ('Brigandine',            'Cloth-and-plate armor offering a solid guard.',                      'armor',      0, 7,  0,  0, 12, 0,  0,  0,  'uncommon',  5,  NULL, 780,   156,  NULL),
  ('Lamellar Cuirass',      'Laced lamellar plates that turn aside heavy blows.',                 'armor',      0, 9,  0,  0, 15, 0,  0,  0,  'uncommon',  12, NULL, 1300,  260,  NULL),
  ('Reinforced Greaves',    'Articulated leg armor that still allows a quick step.',              'armor',      0, 6,  2,  0, 10, 5,  0,  0,  'uncommon',  10, NULL, 1100,  220,  NULL),
  ('Aegis Plate',           'A heavy cuirass renowned for stopping nigh anything.',               'armor',      0, 15, 0,  0, 20, 0,  0,  0,  'rare',      18, NULL, 4200,  840,  NULL),
  ('Dragonscale Mail',      'Mail of overlapping drake-scales, light yet near-impervious.',       'armor',      0, 13, 2,  0, 15, 5,  0,  0,  'rare',      20, NULL, 4400,  880,  NULL),
  ('Warlord''s Harness',    'The battle-harness of a feared general.',                            'armor',      0, 16, 0,  0, 18, 0,  0,  0,  'rare',      22, NULL, 4500,  900,  NULL),
  ('Shadowweave Cloak',     'A shrouding cloak that lets blows slip past unfelt.',                'armor',      0, 11, 3,  0, 8,  12, 0,  0,  'rare',      19, NULL, 4000,  800,  NULL),
  ('Colossus Plate',        'Plate so thick it seems carved from a fortress wall.',               'armor',      0, 28, 0,  0, 28, 0,  0,  0,  'epic',      38, NULL, 16000, 3200, NULL),
  ('Bastion Aegis',         'An immovable wall of layered god-metal.',                            'armor',      0, 30, 0,  0, 30, 0,  0,  0,  'epic',      42, NULL, 18000, 3600, NULL),
  ('Phantom Shroud',        'Spectral armor that is half-there, impossible to pin.',              'armor',      0, 22, 3,  0, 15, 15, 0,  0,  'epic',      40, NULL, 15000, 3000, NULL),
  ('Adamant Bulwark',       'Armor of adamant, the hardest metal known.',                         'armor',      0, 26, 0,  0, 25, 0,  0,  0,  'epic',      39, NULL, 15500, 3100, NULL),
  -- Artifacts (3c 3u 4r 4e)
  ('Worn Talisman',         'A weathered charm that still holds a faint blessing.',               'artifact',   1, 1,  0,  5, 0,  0,  0,  0,  'common',    1,  NULL, 240,   48,   NULL),
  ('Lucky Charm',           'A trinket that seems to nudge fate kindly.',                         'artifact',   0, 2,  0,  0, 0,  5,  0,  0,  'common',    1,  NULL, 200,   40,   NULL),
  ('Ancestral Bead',        'A bead passed down for luck in battle.',                             'artifact',   2, 0,  0,  5, 0,  0,  0,  0,  'common',    1,  NULL, 220,   44,   NULL),
  ('Seer''s Pendant',       'A pendant that sharpens insight and steadies the breath.',           'artifact',   3, 3,  0, 10, 0,  0,  0,  2,  'uncommon',  8,  NULL, 1200,  240,  NULL),
  ('Warding Sigil',         'A protective glyph that turns hostile intent aside.',                'artifact',   0, 5,  0,  0, 10, 5,  0,  0,  'uncommon',  10, NULL, 1400,  280,  NULL),
  ('Diviner''s Lens',       'A crystal lens that reveals the weak point in any guard.',           'artifact',   5, 2,  0, 10, 0,  5,  0,  0,  'uncommon',  14, NULL, 1900,  380,  NULL),
  ('Phoenix Feather',       'A still-warm feather that rekindles the bearer''s second wind.',     'artifact',  10, 6,  0, 15, 0,  0,  0,  5,  'rare',      25, NULL, 8500,  1700, NULL),
  ('Obsidian Heart',        'A black crystal heart that feeds on shed blood.',                    'artifact',  12, 5,  0, 18, 0,  0,  4,  0,  'rare',      28, NULL, 9000,  1800, NULL),
  ('Eternity Sigil',        'A balanced ward-stone, steady in attack and defense alike.',         'artifact',   8, 10, 0,  5, 10, 5,  0,  0,  'rare',      24, NULL, 8000,  1600, NULL),
  ('Stormglass Orb',        'An orb of caged lightning that recharges its holder.',               'artifact',  11, 6,  0, 12, 0,  0,  0,  5,  'rare',      26, NULL, 8800,  1760, NULL),
  ('Worldheart Shard',      'A fragment of the world-tree''s core, brimming with power.',         'artifact',  16, 16, 0, 15, 10, 5,  0,  0,  'epic',      45, NULL, 25000, 5000, NULL),
  ('Crown of Ages',         'A crown worn by forgotten kings, heavy with old magic.',             'artifact',  18, 14, 0, 18, 0,  5,  0,  7,  'epic',      48, NULL, 26000, 5200, NULL),
  ('Soulfire Reliquary',    'A reliquary whose flame mends the bearer as foes fall.',             'artifact',  17, 15, 0, 15, 0,  0,  7,  0,  'epic',      50, NULL, 27000, 5400, NULL),
  ('Voidstone Idol',        'An idol of pure void-stone, equally ward and weapon.',               'artifact',  15, 17, 0, 12, 12, 8,  0,  0,  'epic',      46, NULL, 24000, 4800, NULL),
  -- Mounts (3c 3u 5r 3e)
  ('Pack Mule',             'A patient mule, sturdy if unglamorous.',                             'mount',      0, 2,  2,  0, 0,  5,  0,  0,  'common',    1,  NULL, 400,   80,   NULL),
  ('Plains Pony',           'A hardy pony at home on open ground.',                               'mount',      1, 2,  2,  0, 0,  5,  0,  0,  'common',    1,  NULL, 480,   96,   NULL),
  ('Saddle Donkey',         'Nimble on bad footing, stubborn on good.',                           'mount',      0, 3,  2,  0, 0,  8,  0,  0,  'common',    1,  NULL, 420,   84,   NULL),
  ('Courser Steed',         'A swift riding horse bred for the charge.',                          'mount',      3, 5,  4,  0, 0,  10, 0,  0,  'uncommon',  8,  NULL, 1800,  360,  NULL),
  ('Mountain Ram',          'A surefooted war-ram that hits hard with a head of horn.',           'mount',      4, 6,  3,  5, 0,  8,  0,  0,  'uncommon',  12, NULL, 2400,  480,  NULL),
  ('Swift Charger',         'A tireless charger that keeps its rider in the fight.',              'mount',      4, 4,  6,  0, 0,  15, 0,  3,  'uncommon',  15, NULL, 3000,  600,  NULL),
  ('Gryphon Hatchling',     'A young gryphon, already proud and swift on the wing.',              'mount',     10, 9,  7,  8, 0,  18, 0,  0,  'rare',      25, NULL, 9000,  1800, NULL),
  ('Nightmare Steed',       'A shadow-horse wreathed in cold flame that feeds on fear.',          'mount',     12, 8,  5, 10, 0,  15, 4,  0,  'rare',      28, NULL, 9500,  1900, NULL),
  ('Sabertooth',            'A great fanged cat that runs down the swiftest prey.',               'mount',     13, 7,  6, 12, 0,  12, 0,  0,  'rare',      27, NULL, 9200,  1840, NULL),
  ('Thunderhoof',           'A storm-bred stallion whose gallop renews its rider''s vigor.',      'mount',      9, 10, 6,  5, 0,  15, 0,  5,  'rare',      26, NULL, 8800,  1760, NULL),
  ('Dire Elk',              'A massive elk with a rack like a thicket of spears.',                'mount',     11, 9,  6,  0, 0,  16, 0,  0,  'rare',      24, NULL, 8500,  1700, NULL),
  ('Wyvern',                'A lesser dragon-kin whose talons drain the slain.',                  'mount',     22, 13, 8, 15, 0,  20, 6,  0,  'epic',      50, NULL, 30000, 6000, NULL),
  ('Cerberus Whelp',        'A three-headed hound-pup that keeps its rider relentless.',          'mount',     24, 14, 7, 15, 0,  18, 0,  6,  'epic',      52, NULL, 31000, 6200, NULL),
  ('Storm Phoenix',         'A firebird of the high storms, untouchable in flight.',              'mount',     20, 16, 10,12, 0,  22, 0,  0,  'epic',      48, NULL, 29000, 5800, NULL),
  -- Companions (3c 3u 4r 4e)
  ('Pixie',                 'A flickering sprite that pricks at the enemy''s guard.',             'companion',  2, 1,  0,  5, 0,  0,  0,  0,  'common',    1,  NULL, 300,   60,   NULL),
  ('Wisp',                  'A drifting mote of light, hard for foes to track.',                  'companion',  2, 0,  1,  0, 0,  5,  0,  0,  'common',    1,  NULL, 260,   52,   NULL),
  ('Stone Familiar',        'A small living gargoyle that shields its master.',                   'companion',  0, 3,  0,  0, 5,  0,  0,  0,  'common',    1,  NULL, 280,   56,   NULL),
  ('War Hound',             'A trained battle-dog that harries the enemy line.',                  'companion',  6, 3,  0,  8, 0,  0,  0,  0,  'uncommon',  8,  NULL, 2000,  400,  NULL),
  ('Sentry Construct',      'An automaton that plants itself and guards stoutly.',                'companion',  2, 8,  0,  0, 15, 0,  0,  0,  'uncommon',  10, NULL, 2200,  440,  NULL),
  ('Spirit Falcon',         'A bonded falcon-spirit that returns energy to its keeper.',          'companion',  5, 3,  3, 10, 0,  8,  0,  3,  'uncommon',  14, NULL, 2600,  520,  NULL),
  ('Basilisk Hatchling',    'A young basilisk whose bite saps the life from prey.',               'companion', 13, 6,  0, 15, 0,  0,  5,  0,  'rare',      28, NULL, 9500,  1900, NULL),
  ('Guardian Wraith',       'A protective spirit that interposes itself before harm.',            'companion',  8, 12, 0,  0, 12, 5,  0,  0,  'rare',      24, NULL, 8500,  1700, NULL),
  ('Phoenix Chick',         'A reborn firebird-chick that rekindles its master''s drive.',        'companion', 10, 8,  0, 12, 0,  8,  0,  5,  'rare',      26, NULL, 9000,  1800, NULL),
  ('Shadow Panther',        'A silent stalking cat that strikes from nowhere.',                   'companion', 14, 5,  4, 15, 0,  12, 0,  0,  'rare',      29, NULL, 9600,  1920, NULL),
  ('Lesser Djinn',          'A bound wish-spirit that lends both power and stamina.',             'companion', 20, 18, 0, 15, 8,  5,  0,  6,  'epic',      52, NULL, 35000, 7000, NULL),
  ('Hellhound',             'An infernal hound whose savaging restores its master.',              'companion', 24, 14, 0, 18, 0,  8,  7,  0,  'epic',      50, NULL, 34000, 6800, NULL),
  ('Seraph Construct',      'A radiant guardian-automaton of tremendous resilience.',             'companion', 18, 20, 0, 12, 12, 5,  0,  0,  'epic',      48, NULL, 33000, 6600, NULL),
  ('Manticore Cub',         'A young manticore, all claws, fangs, and barbed tail.',              'companion', 22, 16, 3, 15, 0,  10, 0,  0,  'epic',      54, NULL, 36000, 7200, NULL)
) AS v(
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  lifesteal, energy_on_hit,
  rarity, level_required, faction_exclusive, buy_price, sell_price, glory_price
)
WHERE NOT EXISTS (SELECT 1 FROM pw_items pi WHERE pi.name = v.name);

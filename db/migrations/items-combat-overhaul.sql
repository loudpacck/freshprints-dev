-- Combat Attribute Overhaul — Item Seed Update
-- Sets agility_bonus, crit_chance, block_chance, dodge_chance on all 50 base items.
-- Also rebalances attack_bonus and defense_bonus per new slot identity rules.
-- Requires round-combat-system.sql to have been run first.
-- IDs assume clean sequential seed (Iron Gladius=1 ... Bound Titan=50).

-- ── Weapons (IDs 1–10): primary attack + crit, almost no defense ──────────────

UPDATE pw_items SET attack_bonus=2,  defense_bonus=0, agility_bonus=0, crit_chance=0,  block_chance=0, dodge_chance=0 WHERE id=1;  -- Iron Gladius
UPDATE pw_items SET attack_bonus=3,  defense_bonus=0, agility_bonus=1, crit_chance=5,  block_chance=0, dodge_chance=0 WHERE id=2;  -- Bronze Kopis
UPDATE pw_items SET attack_bonus=6,  defense_bonus=0, agility_bonus=0, crit_chance=5,  block_chance=0, dodge_chance=0 WHERE id=3;  -- Legionary Spear
UPDATE pw_items SET attack_bonus=5,  defense_bonus=0, agility_bonus=4, crit_chance=15, block_chance=0, dodge_chance=0 WHERE id=4;  -- Runic Dagger (fast, high crit)
UPDATE pw_items SET attack_bonus=14, defense_bonus=0, agility_bonus=0, crit_chance=10, block_chance=0, dodge_chance=0 WHERE id=5;  -- Blade of Ares
UPDATE pw_items SET attack_bonus=16, defense_bonus=0, agility_bonus=0, crit_chance=15, block_chance=0, dodge_chance=0 WHERE id=6;  -- Mjolnir Shard
UPDATE pw_items SET attack_bonus=28, defense_bonus=0, agility_bonus=1, crit_chance=15, block_chance=0, dodge_chance=0 WHERE id=7;  -- Spear of Olympus
UPDATE pw_items SET attack_bonus=25, defense_bonus=0, agility_bonus=0, crit_chance=20, block_chance=0, dodge_chance=0 WHERE id=8;  -- Enkidu's Axe
UPDATE pw_items SET attack_bonus=55, defense_bonus=0, agility_bonus=0, crit_chance=25, block_chance=0, dodge_chance=0 WHERE id=9;  -- Godkiller Blade
UPDATE pw_items SET attack_bonus=60, defense_bonus=0, agility_bonus=2, crit_chance=20, block_chance=0, dodge_chance=0 WHERE id=10; -- Gungnir

-- ── Armor (IDs 11–20): primary defense + block, no attack ────────────────────

UPDATE pw_items SET attack_bonus=0, defense_bonus=2,  agility_bonus=0, crit_chance=0, block_chance=5,  dodge_chance=0 WHERE id=11; -- Woven Reed Armor
UPDATE pw_items SET attack_bonus=0, defense_bonus=3,  agility_bonus=0, crit_chance=0, block_chance=5,  dodge_chance=0 WHERE id=12; -- Leather Breastplate
UPDATE pw_items SET attack_bonus=0, defense_bonus=7,  agility_bonus=0, crit_chance=0, block_chance=15, dodge_chance=0 WHERE id=13; -- Legionary Shield
UPDATE pw_items SET attack_bonus=0, defense_bonus=6,  agility_bonus=2, crit_chance=0, block_chance=10, dodge_chance=0 WHERE id=14; -- Berserker Furs (slight mobility)
UPDATE pw_items SET attack_bonus=0, defense_bonus=9,  agility_bonus=0, crit_chance=0, block_chance=15, dodge_chance=0 WHERE id=15; -- Hoplite Greaves
UPDATE pw_items SET attack_bonus=0, defense_bonus=12, agility_bonus=2, crit_chance=0, block_chance=10, dodge_chance=5 WHERE id=16; -- Ishtar's Veil (magic protection)
UPDATE pw_items SET attack_bonus=0, defense_bonus=16, agility_bonus=0, crit_chance=0, block_chance=25, dodge_chance=0 WHERE id=17; -- Aegis Breastplate
UPDATE pw_items SET attack_bonus=0, defense_bonus=26, agility_bonus=0, crit_chance=0, block_chance=25, dodge_chance=0 WHERE id=18; -- Chain of Niflheim
UPDATE pw_items SET attack_bonus=0, defense_bonus=30, agility_bonus=0, crit_chance=0, block_chance=30, dodge_chance=0 WHERE id=19; -- Olympian Plate
UPDATE pw_items SET attack_bonus=0, defense_bonus=55, agility_bonus=0, crit_chance=0, block_chance=40, dodge_chance=0 WHERE id=20; -- Shield of Aegis (legendary)

-- ── Artifacts (IDs 21–30): wildcard — varied combinations ────────────────────

UPDATE pw_items SET attack_bonus=1,  defense_bonus=1,  agility_bonus=0, crit_chance=5,  block_chance=0,  dodge_chance=0  WHERE id=21; -- Carved Idol
UPDATE pw_items SET attack_bonus=0,  defense_bonus=2,  agility_bonus=0, crit_chance=0,  block_chance=5,  dodge_chance=0  WHERE id=22; -- Bone Amulet
UPDATE pw_items SET attack_bonus=3,  defense_bonus=3,  agility_bonus=0, crit_chance=10, block_chance=0,  dodge_chance=0  WHERE id=23; -- Oracle's Eye (foresight)
UPDATE pw_items SET attack_bonus=4,  defense_bonus=2,  agility_bonus=3, crit_chance=0,  block_chance=0,  dodge_chance=10 WHERE id=24; -- Runic Compass (evasion)
UPDATE pw_items SET attack_bonus=5,  defense_bonus=2,  agility_bonus=0, crit_chance=10, block_chance=0,  dodge_chance=5  WHERE id=25; -- Celestial Map
UPDATE pw_items SET attack_bonus=7,  defense_bonus=10, agility_bonus=0, crit_chance=5,  block_chance=10, dodge_chance=0  WHERE id=26; -- Omphalos Stone (balanced)
UPDATE pw_items SET attack_bonus=9,  defense_bonus=9,  agility_bonus=0, crit_chance=15, block_chance=0,  dodge_chance=5  WHERE id=27; -- Tablet of Destinies (prophecy)
UPDATE pw_items SET attack_bonus=12, defense_bonus=5,  agility_bonus=0, crit_chance=20, block_chance=0,  dodge_chance=0  WHERE id=28; -- Prometheus' Flame
UPDATE pw_items SET attack_bonus=16, defense_bonus=16, agility_bonus=2, crit_chance=15, block_chance=10, dodge_chance=5  WHERE id=29; -- Pandora's Fragment (chaos)
UPDATE pw_items SET attack_bonus=28, defense_bonus=28, agility_bonus=0, crit_chance=25, block_chance=15, dodge_chance=10 WHERE id=30; -- Eye of Providence (legendary)

-- ── Mounts (IDs 31–40): agility-focused, some dodge ─────────────────────────

UPDATE pw_items SET attack_bonus=1,  defense_bonus=2,  agility_bonus=2,  crit_chance=0,  block_chance=0, dodge_chance=5  WHERE id=31; -- Draft Horse
UPDATE pw_items SET attack_bonus=0,  defense_bonus=3,  agility_bonus=3,  crit_chance=0,  block_chance=0, dodge_chance=10 WHERE id=32; -- Mule of Hermes
UPDATE pw_items SET attack_bonus=3,  defense_bonus=5,  agility_bonus=3,  crit_chance=5,  block_chance=0, dodge_chance=10 WHERE id=33; -- War Stallion
UPDATE pw_items SET attack_bonus=5,  defense_bonus=3,  agility_bonus=6,  crit_chance=0,  block_chance=0, dodge_chance=20 WHERE id=34; -- Sleipnir Pup (eight-legged speed)
UPDATE pw_items SET attack_bonus=4,  defense_bonus=5,  agility_bonus=5,  crit_chance=5,  block_chance=0, dodge_chance=15 WHERE id=35; -- Storm-Born Horse
UPDATE pw_items SET attack_bonus=9,  defense_bonus=9,  agility_bonus=8,  crit_chance=5,  block_chance=0, dodge_chance=20 WHERE id=36; -- Pegasus (sky mount)
UPDATE pw_items SET attack_bonus=7,  defense_bonus=13, agility_bonus=4,  crit_chance=0,  block_chance=10, dodge_chance=10 WHERE id=37; -- Lamassu (protective)
UPDATE pw_items SET attack_bonus=11, defense_bonus=8,  agility_bonus=6,  crit_chance=10, block_chance=0, dodge_chance=15 WHERE id=38; -- Chimera Fragment
UPDATE pw_items SET attack_bonus=22, defense_bonus=12, agility_bonus=8,  crit_chance=15, block_chance=0, dodge_chance=20 WHERE id=39; -- Fenrir Pup (predator)
UPDATE pw_items SET attack_bonus=35, defense_bonus=35, agility_bonus=10, crit_chance=10, block_chance=5, dodge_chance=25 WHERE id=40; -- Divine Chariot (legendary)

-- ── Companions (IDs 41–50): support — modest stats, varied utility ───────────

UPDATE pw_items SET attack_bonus=2,  defense_bonus=1,  agility_bonus=0, crit_chance=5,  block_chance=0,  dodge_chance=0  WHERE id=41; -- Minor Sprite
UPDATE pw_items SET attack_bonus=3,  defense_bonus=0,  agility_bonus=1, crit_chance=10, block_chance=0,  dodge_chance=5  WHERE id=42; -- Shade of the Dead
UPDATE pw_items SET attack_bonus=6,  defense_bonus=3,  agility_bonus=2, crit_chance=10, block_chance=0,  dodge_chance=5  WHERE id=43; -- Einherjar Scout
UPDATE pw_items SET attack_bonus=4,  defense_bonus=5,  agility_bonus=2, crit_chance=5,  block_chance=5,  dodge_chance=5  WHERE id=44; -- Sacred Hound
UPDATE pw_items SET attack_bonus=2,  defense_bonus=8,  agility_bonus=0, crit_chance=0,  block_chance=20, dodge_chance=0  WHERE id=45; -- Temple Guardian
UPDATE pw_items SET attack_bonus=8,  defense_bonus=8,  agility_bonus=1, crit_chance=10, block_chance=5,  dodge_chance=0  WHERE id=46; -- Olympian Herald
UPDATE pw_items SET attack_bonus=7,  defense_bonus=10, agility_bonus=0, crit_chance=5,  block_chance=10, dodge_chance=0  WHERE id=47; -- Sumerian Sage
UPDATE pw_items SET attack_bonus=13, defense_bonus=5,  agility_bonus=3, crit_chance=15, block_chance=0,  dodge_chance=10 WHERE id=48; -- Valkyrie Fragment
UPDATE pw_items SET attack_bonus=20, defense_bonus=20, agility_bonus=2, crit_chance=15, block_chance=10, dodge_chance=5  WHERE id=49; -- Divine Emissary
UPDATE pw_items SET attack_bonus=45, defense_bonus=20, agility_bonus=0, crit_chance=20, block_chance=15, dodge_chance=5  WHERE id=50; -- Bound Titan (legendary)

-- ── Tablet of Reinvention: glory-shop stat reallocation consumable ────────────
-- Available at level 1, glory shop only (buy_price NULL), cannot be sold (sell_price 0).
-- consumable_effect 'realloc_stats' will be handled in Pass 2's handleConsume.

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Tablet of Reinvention',
  'A divine artifact that erases all allocated stat points, returning them to be redistributed. The hand of the gods rewrites your path.',
  'consumable',
  0, 0, 0, 0, 0, 0,
  'epic',
  1,
  NULL,
  NULL,
  0,
  50,
  'realloc_stats',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM pw_items WHERE name = 'Tablet of Reinvention'
);

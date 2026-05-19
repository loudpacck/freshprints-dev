-- Phase 14: Economy & Shop Overhaul — Potions
-- Run this file FIRST, before phase14-temples.sql.
-- All UPDATEs are idempotent (name-keyed). INSERTs use WHERE NOT EXISTS.

-- ─── Health potions: convert to percentage-based restore ──────────────────────
-- consumable_value now = percentage points (25 = 25% of health_max)

UPDATE pw_items SET
  consumable_effect = 'restore_health_pct',
  consumable_value  = 25,
  description       = 'Get back in the fight! Restores 25% of your maximum health.'
WHERE name = 'Minor Healing Tonic';

UPDATE pw_items SET
  consumable_effect = 'restore_health_pct',
  consumable_value  = 50,
  description       = 'Get back in the fight! Restores 50% of your maximum health.'
WHERE name = 'Healing Draught';

UPDATE pw_items SET
  consumable_effect = 'restore_health_pct',
  consumable_value  = 75,
  description       = 'Get back in the fight! Restores 75% of your maximum health.'
WHERE name = 'Greater Healing Potion';

-- Ambrosia Flask: keep restore_health sentinel (value=9999 → full restore), update description only
UPDATE pw_items SET
  description = 'Get back in the fight! Fully restores your health.'
WHERE name = 'Ambrosia Flask';

-- Divine Restoration: keep restore_full (HP + energy), update description only
UPDATE pw_items SET
  description = 'Get back in the fight! Fully restores both health and energy.'
WHERE name = 'Divine Restoration';

-- ─── Energy potions: 5-tier system (net-new items) ────────────────────────────

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Minor Energy Tonic',
  'Get back in the fight! Restores 25% of your maximum energy.',
  'consumable', 0,0,0,0,0,0,
  'common', 1, NULL,
  150, 30, NULL,
  'restore_energy_pct', 25
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = 'Minor Energy Tonic');

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Energy Draught',
  'Get back in the fight! Restores 50% of your maximum energy.',
  'consumable', 0,0,0,0,0,0,
  'uncommon', 5, NULL,
  300, 60, NULL,
  'restore_energy_pct', 50
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = 'Energy Draught');

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Greater Energy Potion',
  'Get back in the fight! Restores 75% of your maximum energy.',
  'consumable', 0,0,0,0,0,0,
  'rare', 15, NULL,
  600, 120, NULL,
  'restore_energy_pct', 75
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = 'Greater Energy Potion');

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Aether Flask',
  'Get back in the fight! Fully restores your energy.',
  'consumable', 0,0,0,0,0,0,
  'epic', 25, NULL,
  NULL, 200, NULL,
  'restore_energy_pct', 100
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = 'Aether Flask');

INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus, crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Divine Surge',
  'Get back in the fight! Fully restores both health and energy.',
  'consumable', 0,0,0,0,0,0,
  'legendary', 50, NULL,
  NULL, 500, 60,
  'restore_full', NULL
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = 'Divine Surge');

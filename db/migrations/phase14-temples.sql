-- Phase 14: Economy & Shop Overhaul — Temples
-- Run this file SECOND, after phase14-potions.sql.
-- Extends temple upgrade cap from 10 to 25.
-- Adds glory_price to the 6 legendary equipment items.

-- ─── Extend temple upgrade cap ────────────────────────────────────────────────

ALTER TABLE pw_player_temples
  DROP CONSTRAINT IF EXISTS pw_player_temples_upgrade_level_check;

ALTER TABLE pw_player_temples
  ADD CONSTRAINT pw_player_temples_upgrade_level_check
  CHECK (upgrade_level BETWEEN 0 AND 25);

-- ─── Add glory_price to legendary equipment for glory shop rotation ───────────
-- Existing max-level (10) temples continue working — they will now show
-- levels 11-25 as available after this migration.

UPDATE pw_items SET glory_price = 40  WHERE id = 9;   -- Godkiller Blade
UPDATE pw_items SET glory_price = 50  WHERE id = 10;  -- Gungnir
UPDATE pw_items SET glory_price = 45  WHERE id = 20;  -- Shield of Aegis
UPDATE pw_items SET glory_price = 60  WHERE id = 30;  -- Eye of Providence
UPDATE pw_items SET glory_price = 70  WHERE id = 40;  -- Divine Chariot
UPDATE pw_items SET glory_price = 80  WHERE id = 50;  -- Bound Titan

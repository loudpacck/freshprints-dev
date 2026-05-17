-- Health Potions migration
-- Adds consumable_effect / consumable_value columns to pw_items and expands the slot CHECK.
-- Idempotent — safe to run multiple times.

ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS consumable_effect VARCHAR(50);
ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS consumable_value  INTEGER;

ALTER TABLE pw_items DROP CONSTRAINT IF EXISTS pw_items_slot_check;
ALTER TABLE pw_items ADD  CONSTRAINT pw_items_slot_check
  CHECK (slot IN ('weapon', 'armor', 'artifact', 'mount', 'companion', 'consumable'));

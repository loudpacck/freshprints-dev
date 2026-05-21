-- Titan Combat Parity Migration
-- Adds block_chance and dodge_chance to pw_titans, seeds per difficulty,
-- and fixes Nergal's ability_value so death_aura has effect.

ALTER TABLE pw_titans
  ADD COLUMN IF NOT EXISTS block_chance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dodge_chance INTEGER DEFAULT 0;

UPDATE pw_titans SET block_chance = 5,  dodge_chance = 5  WHERE difficulty = 'medium';
UPDATE pw_titans SET block_chance = 8,  dodge_chance = 8  WHERE difficulty = 'hard';
UPDATE pw_titans SET block_chance = 12, dodge_chance = 12 WHERE difficulty = 'extreme';

-- Nergal death_aura was 0; set to 5 so it deals 5 flat damage per round to all participants.
UPDATE pw_titans SET ability_value = 5 WHERE slug = 'nergal';

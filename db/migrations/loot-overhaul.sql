-- ─────────────────────────────────────────────────────────────────────────────
-- Phase D: Loot Rarity Overhaul
-- Run once in Neon SQL Editor. Review the pre-run checks before executing.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── PRE-RUN: Current legendary glory prices (review before running) ──────────
-- SELECT id, name, rarity, glory_price FROM pw_items
-- WHERE rarity = 'legendary' AND slot != 'consumable' AND glory_price IS NOT NULL;
--
-- Expected current values:
--   ID  9  Godkiller Blade  50 glory  → 150 after 3x
--   ID 10  Gungnir          80 glory  → 240 after 3x
--   ID 20  Shield of Aegis  60 glory  → 180 after 3x
--   ID 30  Eye of Providence 100 glory → 300 after 3x
--   ID 40  Divine Chariot   120 glory  → 360 after 3x
--   ID 50  Bound Titan      150 glory  → 450 after 3x
-- If these differ from actual values, adjust the multiplier before running.


-- ─── PART C: Quest loot cleanup ───────────────────────────────────────────────

-- C1. Remove legendary items from all quest loot tables.
-- Adventures have an in-code rare cap; quests need the data removed.
DELETE FROM pw_quest_loot
WHERE item_id IN (SELECT id FROM pw_items WHERE rarity = 'legendary');

-- C2. Reduce epic drop_weight in Tier 4 quests (IDs 26–33) by ~70%.
-- Result: 1 (GREATEST(1, FLOOR(5 * 0.3)) = 1)
UPDATE pw_quest_loot
SET drop_weight = GREATEST(1, FLOOR(drop_weight * 0.3))
WHERE quest_id BETWEEN 26 AND 33
  AND item_id IN (SELECT id FROM pw_items WHERE rarity = 'epic');

-- C3. Reduce epic drop_weight in Tier 5 quests (IDs 34–40) by ~50%.
-- Result: 2 (GREATEST(1, FLOOR(5 * 0.5)) = 2)
UPDATE pw_quest_loot
SET drop_weight = GREATEST(1, FLOOR(drop_weight * 0.5))
WHERE quest_id BETWEEN 34 AND 40
  AND item_id IN (SELECT id FROM pw_items WHERE rarity = 'epic');


-- ─── PART D: Inventory wipe — epic/legendary equipment ────────────────────────

-- D1. Pre-wipe count (informational).
DO $$
DECLARE
  affected_count   INTEGER;
  affected_players INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT user_id)
  INTO affected_count, affected_players
  FROM pw_inventory inv
  JOIN pw_items i ON i.id = inv.item_id
  WHERE i.rarity IN ('epic', 'legendary')
    AND i.slot != 'consumable';
  RAISE NOTICE 'About to wipe % epic/legendary equipment items from % players', affected_count, affected_players;
END $$;

-- D2. Unequip first so equipment_bonuses stay consistent.
UPDATE pw_inventory
SET equipped = false
WHERE item_id IN (
  SELECT id FROM pw_items
  WHERE rarity IN ('epic', 'legendary')
    AND slot != 'consumable'
);

-- D3. Delete the items from inventories.
DELETE FROM pw_inventory
WHERE item_id IN (
  SELECT id FROM pw_items
  WHERE rarity IN ('epic', 'legendary')
    AND slot != 'consumable'
);

-- D4. Verification: potions must survive the wipe.
-- Expected: > 0 if any players have epic/legendary potions (Tablet of Reinvention etc.)
SELECT COUNT(*) AS remaining_epic_legendary_potions
FROM pw_inventory inv
JOIN pw_items i ON i.id = inv.item_id
WHERE i.rarity IN ('epic', 'legendary')
  AND i.slot = 'consumable';


-- ─── PART E: Glory shop — triple legendary equipment prices ───────────────────

UPDATE pw_items
SET glory_price = glory_price * 3
WHERE rarity = 'legendary'
  AND slot != 'consumable'
  AND glory_price IS NOT NULL;

-- Verify the result:
-- SELECT id, name, rarity, glory_price FROM pw_items
-- WHERE rarity = 'legendary' AND slot != 'consumable' AND glory_price IS NOT NULL;

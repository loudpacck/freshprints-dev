-- Pre-migration check: verify current legendary equipment glory prices
-- SELECT id, name, rarity, glory_price FROM pw_items
-- WHERE rarity = 'legendary' AND slot != 'consumable' AND glory_price IS NOT NULL
-- ORDER BY id;
--
-- Expected after this migration (Phase D 3x → now 2x on top):
--   Godkiller Blade:  150 → 300
--   Gungnir:          240 → 480
--   Shield of Aegis:  180 → 360
--   Eye of Providence: 300 → 600
--   Divine Chariot:   360 → 720
--   Bound Titan:      450 → 900

UPDATE pw_items
SET glory_price = glory_price * 2
WHERE rarity = 'legendary'
  AND slot != 'consumable'
  AND glory_price IS NOT NULL;

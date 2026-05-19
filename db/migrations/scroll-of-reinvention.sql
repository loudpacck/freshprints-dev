-- Migration: Scroll of Reinvention
-- A free consumable stat-reset item given to every player once.
-- New players receive it at signup (auth.js). Existing players get it via this migration.
-- Sellable for 750₯. Not purchasable (no buy_price / glory_price).

-- Insert the Scroll of Reinvention item (idempotent — skips if already present)
INSERT INTO pw_items (
  name, description, slot,
  attack_bonus, defense_bonus, agility_bonus,
  crit_chance, block_chance, dodge_chance,
  rarity, level_required, faction_exclusive,
  buy_price, sell_price, glory_price,
  consumable_effect, consumable_value
)
SELECT
  'Scroll of Reinvention',
  'An ancient scroll inscribed with the will of the gods. Erase your path and begin again — all allocated stat points are returned. Can be sold if you have no need of it.',
  'consumable',
  0, 0, 0, 0, 0, 0,
  'uncommon',
  1,
  NULL,
  NULL,   -- not in drachma shop rotation
  750,    -- sellable for 750₯
  NULL,   -- not in glory shop
  'realloc_stats',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM pw_items WHERE name = 'Scroll of Reinvention'
);

-- Give one Scroll to every existing player who doesn't already have one.
-- Uses a subquery for the item ID instead of a hardcoded value — safe regardless of actual ID.
INSERT INTO pw_inventory (user_id, item_id)
SELECT u.id, (SELECT id FROM pw_items WHERE name = 'Scroll of Reinvention')
FROM pw_users u
WHERE NOT EXISTS (
  SELECT 1 FROM pw_inventory inv
  WHERE inv.user_id = u.id
    AND inv.item_id = (SELECT id FROM pw_items WHERE name = 'Scroll of Reinvention')
);

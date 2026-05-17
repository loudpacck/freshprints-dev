-- Health Potions seed — 5 consumable items.
-- Run AFTER health-potions.sql (requires the consumable slot and new columns to exist).
-- ON CONFLICT DO NOTHING makes it safe to re-run.

INSERT INTO pw_items (
  name, description, slot, rarity, level_required,
  buy_price, sell_price, glory_price,
  attack_bonus, defense_bonus,
  consumable_effect, consumable_value
)
VALUES
  (
    'Minor Healing Tonic',
    'Restores 25 HP.',
    'consumable', 'common', 1,
    150, 30, NULL,
    0, 0,
    'restore_health', 25
  ),
  (
    'Healing Draught',
    'Restores 50 HP.',
    'consumable', 'uncommon', 5,
    300, 60, NULL,
    0, 0,
    'restore_health', 50
  ),
  (
    'Greater Healing Potion',
    'Restores 100 HP.',
    'consumable', 'rare', 15,
    600, 120, NULL,
    0, 0,
    'restore_health', 100
  ),
  (
    'Ambrosia Flask',
    'Fully restores all HP.',
    'consumable', 'epic', 25,
    NULL, 200, NULL,
    0, 0,
    'restore_health', 9999
  ),
  (
    'Divine Restoration',
    'Fully restores HP and energy.',
    'consumable', 'legendary', 50,
    NULL, 500, NULL,
    0, 0,
    'restore_full', 0
  )
ON CONFLICT DO NOTHING;

-- Divine Restoration available in the glory shop
UPDATE pw_items SET glory_price = 50 WHERE name = 'Divine Restoration';

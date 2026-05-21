-- Craftsmanship profession (Township #8) + Potion Overhaul
-- Run via Neon console. Idempotent (IF NOT EXISTS / ON CONFLICT).

-- ── A1. Craftsmanship cycle table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pw_craftsmanship_cycles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  craft_level INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completes_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ready', 'claimed')),
  rolled_rarity VARCHAR(20),
  rolled_item_id INTEGER REFERENCES pw_items(id),
  claimed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pw_craftsmanship_user
  ON pw_craftsmanship_cycles(user_id, status);

CREATE INDEX IF NOT EXISTS idx_pw_craftsmanship_active
  ON pw_craftsmanship_cycles(completes_at) WHERE status = 'active';

-- One active-or-ready cycle per player at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_pw_craftsmanship_active_unique
  ON pw_craftsmanship_cycles(user_id) WHERE status != 'claimed';

-- ── A2. Craftsmanship catalog seed ────────────────────────────────────────────

INSERT INTO pw_township_upgrades
  (type, name, establish_label, description, lore,
   bonus_type, bonus_per_level, bonus_at_max, initial_cost, level_required, display_order)
VALUES
  ('craftsmanship', 'Craftsmanship', 'Build the Divine Forge',
   'Master smiths labor in the Forge, producing gear at intervals. Higher levels craft faster and may produce rarer items, though common gear remains the most likely output. Never produces legendary equipment.',
   'The Forge is older than any pantheon. Its flames remember the day the first god struck steel. To raise it again is to call back what mortals were never meant to wield alone.',
   'craft_cycle', 0.0, 0.0, 30000, 60, 8)
ON CONFLICT (type) DO NOTHING;

-- ── A3. New daily counter columns ─────────────────────────────────────────────

ALTER TABLE pw_player_stats
  ADD COLUMN IF NOT EXISTS health_potion_uses_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS divine_restoration_purchases_today INTEGER DEFAULT 0;

-- ── A4. Divine Surge removal ──────────────────────────────────────────────────

-- Null prices make Divine Surge unpurchaseable. Row kept for historical integrity.
UPDATE pw_items SET glory_price = NULL, buy_price = NULL
WHERE name = 'Divine Surge';

-- Log counts before deletion (visible in Neon console output).
DO $$
DECLARE
  ds_count INTEGER;
  ds_players INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT user_id) INTO ds_count, ds_players
  FROM pw_inventory inv
  JOIN pw_items i ON i.id = inv.item_id
  WHERE i.name = 'Divine Surge';
  RAISE NOTICE 'Removing % Divine Surge items from % players', ds_count, ds_players;
END $$;

DELETE FROM pw_inventory
WHERE item_id IN (SELECT id FROM pw_items WHERE name = 'Divine Surge');

-- ── A5. Verification queries (run manually after migration) ───────────────────
-- SELECT * FROM pw_township_upgrades WHERE type = 'craftsmanship';
-- SELECT id, name, glory_price, buy_price FROM pw_items WHERE name = 'Divine Surge';
-- SELECT COUNT(*) FROM pw_inventory inv JOIN pw_items i ON i.id = inv.item_id WHERE i.name = 'Divine Surge';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'pw_player_stats' AND column_name LIKE '%_today';

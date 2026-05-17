-- Round-Based Combat System — Schema Migration
-- Run via Neon console after deploying Pass 1.
-- All statements are idempotent (ADD COLUMN IF NOT EXISTS).

-- ── pw_player_stats: agility stat + free-reset flag ───────────────────────────

ALTER TABLE pw_player_stats ADD COLUMN IF NOT EXISTS agility INTEGER DEFAULT 0;

-- One-time free stat reset for all players (existing and new).
-- Consumed when the player uses their free reallocation.
-- Glory-shop resets (50 glory) do NOT consume this flag.
ALTER TABLE pw_player_stats ADD COLUMN IF NOT EXISTS stat_reset_available BOOLEAN DEFAULT TRUE;

-- ── pw_items: new combat bonus columns ────────────────────────────────────────
-- All chance columns store percentage points (0–100 integer).

ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS agility_bonus INTEGER DEFAULT 0;
ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS crit_chance   INTEGER DEFAULT 0;
ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS block_chance  INTEGER DEFAULT 0;
ALTER TABLE pw_items ADD COLUMN IF NOT EXISTS dodge_chance  INTEGER DEFAULT 0;

-- ── pw_combat_log: store full round-by-round battle data ──────────────────────
-- Also widen the result CHECK to include 'draw' for the new combat engine.

ALTER TABLE pw_combat_log ADD COLUMN IF NOT EXISTS rounds JSONB DEFAULT NULL;

ALTER TABLE pw_combat_log DROP CONSTRAINT IF EXISTS pw_combat_log_result_check;
ALTER TABLE pw_combat_log ADD CONSTRAINT pw_combat_log_result_check
  CHECK (result IN ('win', 'loss', 'draw'));

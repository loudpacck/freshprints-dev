-- ─── Pantheon Wars: Regen base fix ───────────────────────────────────────────
-- Adds per-resource regen base timestamps so energy (300s) and health (180s)
-- accumulate independently. Before this, every health tick reset last_updated
-- which also reset the energy clock, making energy regen nearly impossible.
--
-- Idempotent — safe to run more than once.

ALTER TABLE pw_player_stats ADD COLUMN IF NOT EXISTS energy_regen_base TIMESTAMPTZ;
ALTER TABLE pw_player_stats ADD COLUMN IF NOT EXISTS health_regen_base TIMESTAMPTZ;

-- Seed from existing last_updated so no regen windfall or loss for current players.
UPDATE pw_player_stats SET energy_regen_base = last_updated WHERE energy_regen_base IS NULL;
UPDATE pw_player_stats SET health_regen_base = last_updated WHERE health_regen_base IS NULL;

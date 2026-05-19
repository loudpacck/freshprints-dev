-- Phase 14 addendum: Energy potion rate limiting
-- Adds daily purchase and use counters to pw_player_stats.
-- Run via Neon console. Safe to re-run (IF NOT EXISTS).
-- energy_potion_reset_day stores Math.floor(Date.now() / 86400000) — UTC day seed.
-- When the stored seed differs from the current seed, both counters reset to 0.

ALTER TABLE pw_player_stats
  ADD COLUMN IF NOT EXISTS energy_potion_purchases_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_potion_uses_today      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_potion_reset_day       INTEGER DEFAULT 0;

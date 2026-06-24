-- ─── Pantheon Wars: Alliance Dungeons — Phase D3 Migration ───────────────────
-- Combat-resolution columns. D3 resolves multi-encounter combat and persists the
-- result; loot/keys/rewards are D4 (rewards_distributed stays FALSE until then).
--
-- RUN MANUALLY in the Neon console against POSTGRES_DATABASE_URL.
-- Fully idempotent (ADD COLUMN IF NOT EXISTS) — safe to re-run.

-- Run-level: separates D3 (combat resolved) from D4 (loot distributed), and records
-- how many encounters were fully cleared as a group (drives D4 partial rewards).
ALTER TABLE pw_dungeon_runs ADD COLUMN IF NOT EXISTS rewards_distributed BOOLEAN  NOT NULL DEFAULT FALSE;
ALTER TABLE pw_dungeon_runs ADD COLUMN IF NOT EXISTS encounters_cleared  SMALLINT NOT NULL DEFAULT 0;

-- Per-member combat results (D1 carried damage_dealt only; add final HP + potion usage).
ALTER TABLE pw_dungeon_party ADD COLUMN IF NOT EXISTS final_hp            INTEGER  NOT NULL DEFAULT 0;
ALTER TABLE pw_dungeon_party ADD COLUMN IF NOT EXISTS potions_used_health SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE pw_dungeon_party ADD COLUMN IF NOT EXISTS potions_used_energy SMALLINT NOT NULL DEFAULT 0;

-- ─── End Phase D3 migration ──────────────────────────────────────────────────

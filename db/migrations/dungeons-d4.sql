-- ─── Pantheon Wars: Alliance Dungeons — Phase D4 Migration ───────────────────
-- Loot / key-drop distribution support. D4 turns a RESOLVED run (D3) into per-player
-- rewards in pw_pending_rewards (+ real grants to pw_inventory / pw_player_stats).
--
-- RUN MANUALLY in the Neon console against POSTGRES_DATABASE_URL.
-- Fully idempotent (ADD COLUMN IF NOT EXISTS / guarded UPDATE) — safe to re-run.

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART A — KEY-DROP ENCODING
-- ═══════════════════════════════════════════════════════════════════════════════
-- D1 already has pw_dungeons.key_item_id = the key CONSUMED to ENTER (Hard/Raid).
-- D4 needs the *other* direction: which key this dungeon's final boss DROPS on victory
-- (the key economy: 2-man Med→2-Man Hard Key, 5-man Med→5-Man Hard Key, 5-man Hard→Raid
-- Key; Hard dungeons also drop their own tier key for chaining). NULL = drops no key
-- (easy dungeons + anything not in the key economy). Set per-dungeon in the D7 seed.
ALTER TABLE pw_dungeons
  ADD COLUMN IF NOT EXISTS drops_key_item_id INTEGER REFERENCES pw_items(id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART B — SMOKE-TEST FIXTURE — replaced in D7
-- The D1 smoke-test dungeon is a 2-man EASY crypt (easy drops no key in the real
-- economy). For D4 development we point its drop at the 2-Man Hard Key so the
-- victory key-drop path can actually be exercised end-to-end. Throwaway — real
-- content in D7 follows the key economy (only Medium/Hard dungeons drop keys).
UPDATE pw_dungeons
SET drops_key_item_id = (SELECT id FROM pw_items WHERE name = '2-Man Hard Key' AND slot = 'key' LIMIT 1)
WHERE slug = 'smoke-test-crypt' AND drops_key_item_id IS NULL;

-- ─── End Phase D4 migration ──────────────────────────────────────────────────

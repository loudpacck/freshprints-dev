-- ─── Pantheon Wars: Alliance Dungeons — Phase D1 Migration ───────────────────
-- Schema foundation ONLY: 6 tables + 3 key items + 2 CHECK widenings + a single
-- throwaway smoke-test dungeon fixture. NO combat / queue / loot logic ships in
-- D1 — these tables exist so later phases (D2–D7) have something to populate.
--
-- RUN MANUALLY in the Neon console against POSTGRES_DATABASE_URL.
-- Fully idempotent (IF NOT EXISTS / guarded inserts / DROP..IF EXISTS throughout)
-- — safe to re-run.

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART A — CHECK CONSTRAINT WIDENINGS
-- ═══════════════════════════════════════════════════════════════════════════════

-- A1. pw_items.slot — add 'key' (keys are consumed-on-entry pw_items rows).
--     Current (after health-potions.sql): weapon/armor/artifact/mount/companion/consumable
ALTER TABLE pw_items DROP CONSTRAINT IF EXISTS pw_items_slot_check;
ALTER TABLE pw_items ADD  CONSTRAINT pw_items_slot_check
  CHECK (slot IN ('weapon', 'armor', 'artifact', 'mount', 'companion', 'consumable', 'key'));

-- A2. pw_pending_rewards.reward_type — add 'dungeon' (for the claim-later toast path).
--     Current: ('adventure','titan')
ALTER TABLE pw_pending_rewards DROP CONSTRAINT IF EXISTS pw_pending_rewards_reward_type_check;
ALTER TABLE pw_pending_rewards ADD  CONSTRAINT pw_pending_rewards_reward_type_check
  CHECK (reward_type IN ('adventure', 'titan', 'dungeon'));

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART B — TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- B1. pw_dungeons — the dungeon catalog (13 definitions; only the smoke-test row
--     exists after D1, real content arrives in D7).
CREATE TABLE IF NOT EXISTS pw_dungeons (
  id                SERIAL PRIMARY KEY,
  slug              VARCHAR(60) UNIQUE NOT NULL,
  name              VARCHAR(120) NOT NULL,
  description       TEXT,
  lore              TEXT,
  bracket           SMALLINT NOT NULL CHECK (bracket IN (2, 5, 10)),   -- party size
  difficulty        VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy','medium','hard','expert')),
  level_required    INTEGER NOT NULL DEFAULT 1,
  alliance_required BOOLEAN NOT NULL DEFAULT FALSE,                    -- true only for the 10-man raid
  treasury_cost     INTEGER NOT NULL DEFAULT 0,                        -- drachma from alliance treasury to enter
  key_item_id       INTEGER REFERENCES pw_items(id),                  -- key consumed to enter Hard/Raid; NULL for easy/medium
  encounter_count   SMALLINT NOT NULL DEFAULT 0,                       -- trash waves + bosses
  sort_order        INTEGER NOT NULL DEFAULT 0
);

-- B2. pw_dungeon_encounters — ordered encounters per dungeon. Enemy stat columns
--     mirror the pw_titans vocabulary so simulateTitanFight can consume them
--     identically (base_hp_multiplier / base_attack / base_defense / ability_*).
CREATE TABLE IF NOT EXISTS pw_dungeon_encounters (
  id                  SERIAL PRIMARY KEY,
  dungeon_id          INTEGER NOT NULL REFERENCES pw_dungeons(id) ON DELETE CASCADE,
  encounter_index     SMALLINT NOT NULL,                              -- 1-based order within the dungeon
  encounter_type      VARCHAR(20) NOT NULL CHECK (encounter_type IN ('trash','boss','final_boss')),
  name                VARCHAR(120) NOT NULL,
  enemy_count         SMALLINT NOT NULL DEFAULT 1,                    -- simultaneous enemies this encounter
  -- enemy stat block (mirrors pw_titans) ──────────────────────────────────────
  base_hp_multiplier  NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  base_attack         INTEGER NOT NULL DEFAULT 0,
  base_defense        INTEGER NOT NULL DEFAULT 0,
  ability_name        VARCHAR(100),
  ability_description TEXT,
  ability_type        VARCHAR(50),
  ability_value       INTEGER NOT NULL DEFAULT 0,
  -- trash drops (bosses use pw_dungeon_boss_loot; trash drachma/gear handled here)
  drachma_min         INTEGER NOT NULL DEFAULT 0,
  drachma_max         INTEGER NOT NULL DEFAULT 0,
  common_gear_chance  INTEGER NOT NULL DEFAULT 0,                     -- % trash common-gear drop (0 for bosses)
  UNIQUE (dungeon_id, encounter_index)
);

-- B3. pw_dungeon_boss_loot — per-boss loot tables (boss / final_boss encounters only).
--     is_contested = true marks the single best item on a final boss: rolled once
--     per run, damage-weighted, one winner. Non-contested rows roll per-player via
--     individual_chance.
CREATE TABLE IF NOT EXISTS pw_dungeon_boss_loot (
  id                SERIAL PRIMARY KEY,
  encounter_id      INTEGER NOT NULL REFERENCES pw_dungeon_encounters(id) ON DELETE CASCADE,
  item_id           INTEGER NOT NULL REFERENCES pw_items(id),
  drop_weight       INTEGER NOT NULL DEFAULT 1,
  is_contested      BOOLEAN NOT NULL DEFAULT FALSE,
  individual_chance INTEGER NOT NULL DEFAULT 0                        -- % each player independently rolls (non-contested)
);

-- B4. pw_dungeon_runs — an actual instance of a run (mirrors pw_titan_events).
CREATE TABLE IF NOT EXISTS pw_dungeon_runs (
  id                  SERIAL PRIMARY KEY,
  dungeon_id          INTEGER NOT NULL REFERENCES pw_dungeons(id),
  formation_type      VARCHAR(20) NOT NULL CHECK (formation_type IN ('auto','manual')),
  group_name          VARCHAR(80),                                    -- manual groups only
  leader_user_id      UUID REFERENCES pw_users(id),                  -- manual groups only; NULL for auto
  alliance_id         UUID REFERENCES pw_alliances(id),             -- set for raid / alliance-formed runs (treasury + raid gating)
  status              VARCHAR(20) NOT NULL DEFAULT 'forming'
    CHECK (status IN ('forming','starting','active','resolved')),
  starts_at           TIMESTAMPTZ,                                    -- fill + 30s when party fills
  ends_at             TIMESTAMPTZ,                                    -- set at resolution time
  result              VARCHAR(20) CHECK (result IN ('victory','wipe')),
  wiped_at_encounter  SMALLINT,                                       -- which encounter the party died on (partial rewards)
  fight_log           JSONB,                                          -- full multi-encounter log
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B5. pw_dungeon_party — party membership + queue state (mirrors pw_titan_participants).
CREATE TABLE IF NOT EXISTS pw_dungeon_party (
  id                     SERIAL PRIMARY KEY,
  run_id                 INTEGER NOT NULL REFERENCES pw_dungeon_runs(id) ON DELETE CASCADE,
  user_id                UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  slot_index             SMALLINT NOT NULL DEFAULT 0,
  joined_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                 VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','committed','fought','abandoned')),
  health_loadout_item_id INTEGER REFERENCES pw_items(id),           -- equipped health potion for this run
  health_loadout_qty     SMALLINT NOT NULL DEFAULT 0,
  energy_loadout_item_id INTEGER REFERENCES pw_items(id),           -- equipped energy potion for this run
  energy_loadout_qty     SMALLINT NOT NULL DEFAULT 0,
  damage_dealt           INTEGER NOT NULL DEFAULT 0,                  -- filled at resolution; drives contested-loot weighting
  rewards_claimed        BOOLEAN NOT NULL DEFAULT FALSE
);

-- One active (queued/committed) run per player — partial unique index, the same
-- enforcement pattern pw_alliance_members uses for one-alliance-per-user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pw_dungeon_party_one_active
  ON pw_dungeon_party(user_id)
  WHERE status IN ('queued','committed');

-- B6. pw_dungeon_votekicks — vote-kick tracking (auto-queue).
CREATE TABLE IF NOT EXISTS pw_dungeon_votekicks (
  id              SERIAL PRIMARY KEY,
  run_id          INTEGER NOT NULL REFERENCES pw_dungeon_runs(id) ON DELETE CASCADE,
  voter_user_id   UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  target_user_id  UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, voter_user_id, target_user_id)                    -- one vote per voter per target
);

-- Indexes (mirror the Titan index set).
CREATE INDEX IF NOT EXISTS idx_pw_dungeons_listing
  ON pw_dungeons(bracket, difficulty, sort_order);
CREATE INDEX IF NOT EXISTS idx_pw_dungeon_encounters_dungeon
  ON pw_dungeon_encounters(dungeon_id, encounter_index);
CREATE INDEX IF NOT EXISTS idx_pw_dungeon_boss_loot_encounter
  ON pw_dungeon_boss_loot(encounter_id);
CREATE INDEX IF NOT EXISTS idx_pw_dungeon_runs_status
  ON pw_dungeon_runs(status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_pw_dungeon_party_run
  ON pw_dungeon_party(run_id);
CREATE INDEX IF NOT EXISTS idx_pw_dungeon_party_user
  ON pw_dungeon_party(user_id, rewards_claimed);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART C — KEY ITEMS (3 rows in pw_items, slot='key')
-- Consumed-on-entry, not equipment: buy_price/glory_price NULL, sell_price 0, no
-- stat bonuses. Guarded inserts (no unique constraint on name) → idempotent.
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO pw_items (name, description, slot, rarity, level_required, buy_price, glory_price, sell_price)
SELECT '2-Man Hard Key', 'Unlocks entry to a 2-man Hard dungeon. Consumed on use.', 'key', 'rare', 1, NULL, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = '2-Man Hard Key' AND slot = 'key');

INSERT INTO pw_items (name, description, slot, rarity, level_required, buy_price, glory_price, sell_price)
SELECT '5-Man Hard Key', 'Unlocks entry to a 5-man Hard dungeon. Consumed on use.', 'key', 'epic', 1, NULL, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = '5-Man Hard Key' AND slot = 'key');

INSERT INTO pw_items (name, description, slot, rarity, level_required, buy_price, glory_price, sell_price)
SELECT 'Raid Key', 'Unlocks entry to the 10-man alliance raid. Consumed on use.', 'key', 'legendary', 1, NULL, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM pw_items WHERE name = 'Raid Key' AND slot = 'key');

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART D — SMOKE-TEST FIXTURE — replaced in D7
-- One minimal 2-man easy dungeon so D2–D6 code has something to exercise. NOT
-- balanced content. The entire fixture below is throwaway and will be deleted /
-- overwritten when real dungeon content is seeded in D7.
-- ═══════════════════════════════════════════════════════════════════════════════

-- SMOKE-TEST FIXTURE — replaced in D7
INSERT INTO pw_dungeons
  (slug, name, description, lore, bracket, difficulty, level_required,
   alliance_required, treasury_cost, key_item_id, encounter_count, sort_order)
VALUES
  ('smoke-test-crypt', 'Smoke-Test Crypt',
   'A throwaway fixture dungeon for development. Replaced in D7.',
   'Nothing of myth dwells here — only test data.',
   2, 'easy', 1, FALSE, 0, NULL, 3, 0)
ON CONFLICT (slug) DO NOTHING;

-- SMOKE-TEST FIXTURE — replaced in D7 — 3 encounters (trash → boss → final_boss)
INSERT INTO pw_dungeon_encounters
  (dungeon_id, encounter_index, encounter_type, name, enemy_count,
   base_hp_multiplier, base_attack, base_defense, ability_name, ability_value,
   drachma_min, drachma_max, common_gear_chance)
SELECT d.id, v.encounter_index, v.encounter_type, v.name, v.enemy_count,
       v.base_hp_multiplier, v.base_attack, v.base_defense, v.ability_name, v.ability_value,
       v.drachma_min, v.drachma_max, v.common_gear_chance
FROM pw_dungeons d
CROSS JOIN (VALUES
  (1::smallint, 'trash'::varchar,       'Crypt Rats',          2::smallint, 0.40::numeric, 6,  3, NULL::varchar, 0,  5, 12, 15),
  (2::smallint, 'boss'::varchar,        'Bonepile Brute',      1::smallint, 0.80::numeric, 12, 6, NULL::varchar, 0,  0,  0,  0),
  (3::smallint, 'final_boss'::varchar,  'The Crypt Warden',    1::smallint, 1.20::numeric, 18, 9, 'Decay'::varchar, 5, 0, 0, 0)
) AS v(encounter_index, encounter_type, name, enemy_count,
       base_hp_multiplier, base_attack, base_defense, ability_name, ability_value,
       drachma_min, drachma_max, common_gear_chance)
WHERE d.slug = 'smoke-test-crypt'
  AND NOT EXISTS (
    SELECT 1 FROM pw_dungeon_encounters e
    WHERE e.dungeon_id = d.id AND e.encounter_index = v.encounter_index
  );

-- SMOKE-TEST FIXTURE — replaced in D7 — boss loot: one cheap individual item on the boss
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, i.id, 10, FALSE, 50
FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'smoke-test-crypt'
CROSS JOIN LATERAL (
  SELECT id FROM pw_items WHERE slot IN ('weapon','armor') ORDER BY id ASC LIMIT 1
) i
WHERE e.encounter_type = 'boss'
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id);

-- SMOKE-TEST FIXTURE — replaced in D7 — final boss loot: one contested "best" item
INSERT INTO pw_dungeon_boss_loot (encounter_id, item_id, drop_weight, is_contested, individual_chance)
SELECT e.id, i.id, 10, TRUE, 0
FROM pw_dungeon_encounters e
JOIN pw_dungeons d ON d.id = e.dungeon_id AND d.slug = 'smoke-test-crypt'
CROSS JOIN LATERAL (
  SELECT id FROM pw_items WHERE slot IN ('weapon','armor','artifact') ORDER BY id DESC LIMIT 1
) i
WHERE e.encounter_type = 'final_boss'
  AND NOT EXISTS (SELECT 1 FROM pw_dungeon_boss_loot bl WHERE bl.encounter_id = e.id);

-- ─── End Phase D1 migration ──────────────────────────────────────────────────

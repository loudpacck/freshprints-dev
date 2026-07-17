-- Phase D2a — pw_daily_stats migration
-- Run manually in the Neon SQL Editor. Never auto-executed.
-- Idempotent: CREATE TABLE IF NOT EXISTS — safe to run twice.
-- Schema per docs/PHASE-D-DESIGN.md §2.4. One wide row per UTC day.
-- No secondary indexes: reads are latest-row or a 90-day range, both served by the PK.

CREATE TABLE IF NOT EXISTS pw_daily_stats (
  snapshot_date            DATE PRIMARY KEY,          -- UTC calendar date
  -- population (state)
  total_players            INTEGER  NOT NULL DEFAULT 0,
  active_players_24h       INTEGER  NOT NULL DEFAULT 0,  -- trailing 24h at snapshot time; source known-inflated (D2-6)
  -- economy (state — the irrecoverable core)
  total_drachma            BIGINT   NOT NULL DEFAULT 0,
  avg_drachma              INTEGER  NOT NULL DEFAULT 0,
  median_drachma           INTEGER  NOT NULL DEFAULT 0,  -- percentile_cont(0.5); whale-resistant
  total_drachma_lifetime   BIGINT   NOT NULL DEFAULT 0,  -- ever minted → inflation chart
  total_glory              BIGINT   NOT NULL DEFAULT 0,
  -- activity (running totals; per-day = diff vs previous row)
  quest_completions_total  BIGINT   NOT NULL DEFAULT 0,
  pvp_fights_total         BIGINT   NOT NULL DEFAULT 0,
  chat_messages_24h        INTEGER  NOT NULL DEFAULT 0,  -- trailing-24h sample
  -- distributions (state; JSONB display payloads)
  level_distribution       JSONB    NOT NULL DEFAULT '[]',  -- [{"level":N,"count":N}, ...]
  faction_distribution     JSONB    NOT NULL DEFAULT '[]',
  class_distribution       JSONB    NOT NULL DEFAULT '[]',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BLOBERT BRAIN — Phase 1a migration
-- AI chat mascot for the /hire page. Cache + variants + logs.
--
-- MANUAL MIGRATION: paste this into the Neon SQL Editor and run it.
-- Run this FIRST, then run blobert-seed.sql.
-- Safe to re-run (idempotent: IF NOT EXISTS everywhere).
-- ============================================================================

-- 1. Canonical FAQ answers -- one row per (faq_key, theme, tone).
--    Same facts across every row; only the voice changes.
CREATE TABLE IF NOT EXISTS hire_buddy_faqs (
  id          SERIAL PRIMARY KEY,
  faq_key     VARCHAR(50) NOT NULL,
  theme       VARCHAR(20) NOT NULL,   -- standard | digital | retro | funky
  tone        VARCHAR(10) NOT NULL,   -- serious | funny
  answer      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (faq_key, theme, tone)
);

CREATE INDEX IF NOT EXISTS idx_hire_buddy_faqs_key ON hire_buddy_faqs (faq_key);

-- 2. Normalized question variants -> faq_key.
--    Theme/tone-agnostic: maps a normalized phrasing to a canonical FAQ.
CREATE TABLE IF NOT EXISTS hire_buddy_variants (
  id                  SERIAL PRIMARY KEY,
  variant_normalized  TEXT        NOT NULL UNIQUE,
  faq_key             VARCHAR(50) NOT NULL
);

-- 3. Trigram fuzzy matching over the normalized variants.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_hire_buddy_variants_trgm
  ON hire_buddy_variants USING GIN (variant_normalized gin_trgm_ops);

-- 4. Conversation logs -- analytics + rate limiting + daily global cap.
CREATE TABLE IF NOT EXISTS hire_buddy_logs (
  id          BIGSERIAL PRIMARY KEY,
  session_id  VARCHAR(64),
  role        VARCHAR(10),    -- 'user' | 'blobert'
  content     TEXT,
  answered_by VARCHAR(15),    -- 'cache' | 'fuzzy' | 'ai' | 'ratelimited' | 'capped'
  theme       VARCHAR(20),
  tone        VARCHAR(10),
  ip_hash     VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hire_buddy_logs_ip_created ON hire_buddy_logs (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_hire_buddy_logs_created    ON hire_buddy_logs (created_at);

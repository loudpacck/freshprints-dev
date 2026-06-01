-- Alliance System — Phase A: schema + core lifecycle support
-- Idempotent. Safe to run repeatedly.
--
-- Tables: pw_alliances, pw_alliance_members, pw_alliance_invites (Phase B uses it),
--         pw_alliance_treasury_log (Phase C uses it).
-- Also adds pw_users.last_left_alliance_at for the join cooldown.

-- ── a) Alliances ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pw_alliances (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(30) NOT NULL UNIQUE CHECK (LENGTH(TRIM(name)) >= 3),
  tag              VARCHAR(4)  NOT NULL UNIQUE CHECK (LENGTH(TRIM(tag))  >= 2),
  description      TEXT,
  founder_id       UUID NOT NULL REFERENCES pw_users(id),
  treasury_drachma BIGINT NOT NULL DEFAULT 0,
  treasury_glory   BIGINT NOT NULL DEFAULT 0,
  military_power   BIGINT NOT NULL DEFAULT 0,   -- cached, refreshed on changes (Phase C)
  economic_power   BIGINT NOT NULL DEFAULT 0,   -- cached
  military_tier    SMALLINT NOT NULL DEFAULT 0, -- 0-5
  economic_tier    SMALLINT NOT NULL DEFAULT 0,
  overall_tier     SMALLINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  member_count     SMALLINT NOT NULL DEFAULT 1
);

-- Leaderboard sort indexes
CREATE INDEX IF NOT EXISTS idx_pw_alliances_military_tier ON pw_alliances (military_tier DESC);
CREATE INDEX IF NOT EXISTS idx_pw_alliances_economic_tier ON pw_alliances (economic_tier DESC);
CREATE INDEX IF NOT EXISTS idx_pw_alliances_overall_tier  ON pw_alliances (overall_tier DESC);

-- ── b) Members (one alliance per player) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pw_alliance_members (
  id                  BIGSERIAL PRIMARY KEY,
  alliance_id         UUID NOT NULL REFERENCES pw_alliances(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  rank                VARCHAR(16) NOT NULL CHECK (rank IN ('founder', 'officer', 'veteran', 'member')),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  veteran_eligible_at TIMESTAMPTZ NOT NULL,  -- = joined_at + INTERVAL '30 days'
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_pw_alliance_members_alliance_rank
  ON pw_alliance_members (alliance_id, rank);

-- ── c) Invites (built out in Phase B) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pw_alliance_invites (
  id              BIGSERIAL PRIMARY KEY,
  alliance_id     UUID NOT NULL REFERENCES pw_alliances(id) ON DELETE CASCADE,
  invitee_user_id UUID NOT NULL REFERENCES pw_users(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES pw_users(id),
  status          VARCHAR(16) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- One pending invite per alliance per invitee
CREATE UNIQUE INDEX IF NOT EXISTS idx_pw_alliance_invites_pending_unique
  ON pw_alliance_invites (alliance_id, invitee_user_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pw_alliance_invites_invitee_status
  ON pw_alliance_invites (invitee_user_id, status);

-- ── d) Treasury log (built out in Phase C) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS pw_alliance_treasury_log (
  id                  BIGSERIAL PRIMARY KEY,
  alliance_id         UUID NOT NULL REFERENCES pw_alliances(id) ON DELETE CASCADE,
  donor_user_id       UUID NOT NULL REFERENCES pw_users(id),
  donation_type       VARCHAR(16) NOT NULL CHECK (donation_type IN ('drachma', 'glory', 'item')),
  amount              BIGINT,                 -- drachma/glory amount (NULL for items)
  item_id             INT REFERENCES pw_items(id),  -- NULL for currency donations
  item_rarity         VARCHAR(16),            -- snapshotted at donation time
  item_level_required INT,                    -- snapshotted
  power_value         BIGINT NOT NULL,        -- computed power points granted
  power_track         VARCHAR(16) NOT NULL CHECK (power_track IN ('military', 'economic')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pw_alliance_treasury_log_alliance
  ON pw_alliance_treasury_log (alliance_id, created_at DESC);

-- ── e) Join cooldown column on users ─────────────────────────────────────────────
-- NULL = no cooldown. Set on voluntary leave. Cleared by handler on joining/founding.
-- NOT set on kick (kick = no cooldown).
ALTER TABLE pw_users ADD COLUMN IF NOT EXISTS last_left_alliance_at TIMESTAMPTZ;

-- Migration: pw_pending_rewards table
-- Cross-session adventure reward persistence

CREATE TABLE IF NOT EXISTS pw_pending_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN ('adventure', 'titan')),
  source_id INTEGER,
  reward_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pw_pending_rewards_user_unack
  ON pw_pending_rewards(user_id) WHERE acknowledged_at IS NULL;

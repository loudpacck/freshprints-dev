-- Live Chat v1 — all chat tables for general, DMs, and mod chat
-- Pass 1 activates general only; DM and mod tables are pre-created here for schema-once migration.

-- All chat messages across all channel types
CREATE TABLE IF NOT EXISTS pw_chat_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('general', 'mod', 'dm')),
  channel_id VARCHAR(50),  -- NULL for general/mod, dm_thread_id as string for dms
  sender_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  sender_username VARCHAR(30) NOT NULL,  -- denormalized for delete-cascade safety
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by_name VARCHAR(60),
  deleted_by_type VARCHAR(10)  -- 'player' | 'moderator'
);

CREATE INDEX IF NOT EXISTS idx_pw_chat_messages_channel
  ON pw_chat_messages(channel_type, channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pw_chat_messages_sender
  ON pw_chat_messages(sender_id, created_at DESC);

-- DM threads — canonical pair ordering (user_a_id < user_b_id)
CREATE TABLE IF NOT EXISTS pw_chat_dm_threads (
  id SERIAL PRIMARY KEY,
  user_a_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_a_lt_user_b CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);
CREATE INDEX IF NOT EXISTS idx_pw_chat_dm_threads_users
  ON pw_chat_dm_threads(user_a_id, user_b_id);

-- Moderation actions audit log
CREATE TABLE IF NOT EXISTS pw_chat_moderations (
  id SERIAL PRIMARY KEY,
  target_user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  mod_id UUID REFERENCES pw_moderators(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('mute', 'timeout', 'ban', 'kick', 'delete_msg')),
  channel_type VARCHAR(20),  -- NULL = global
  duration_minutes INTEGER,
  expires_at TIMESTAMPTZ,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES pw_moderators(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pw_chat_mod_active
  ON pw_chat_moderations(target_user_id, expires_at)
  WHERE lifted_at IS NULL;

-- Per-user chat state (read tracking)
CREATE TABLE IF NOT EXISTS pw_chat_user_state (
  user_id UUID PRIMARY KEY REFERENCES pw_users(id) ON DELETE CASCADE,
  last_seen_general_msg_id BIGINT DEFAULT 0,
  last_seen_mod_msg_id BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

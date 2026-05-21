-- DM read state — tracks per-user, per-thread last-seen message for unread counts

CREATE TABLE IF NOT EXISTS pw_chat_dm_read_state (
  user_id   UUID    REFERENCES pw_users(id)          ON DELETE CASCADE,
  thread_id INTEGER REFERENCES pw_chat_dm_threads(id) ON DELETE CASCADE,
  last_seen_id BIGINT DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_pw_chat_dm_read_state_user
  ON pw_chat_dm_read_state(user_id);

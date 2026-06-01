-- Alliance Chat Channel (Alliance System Phase D)
-- Adds a 4th chat channel type, 'alliance', scoped per-alliance via channel_id = alliance UUID.
-- Idempotent: safe to run multiple times.

-- a) Allow channel_type = 'alliance'.
-- The inline CHECK from live-chat.sql is auto-named pw_chat_messages_channel_type_check.
ALTER TABLE pw_chat_messages
  DROP CONSTRAINT IF EXISTS pw_chat_messages_channel_type_check;

ALTER TABLE pw_chat_messages
  ADD CONSTRAINT pw_chat_messages_channel_type_check
  CHECK (channel_type IN ('general', 'dm', 'mod', 'alliance'));

-- b) Fast "last 100 alliance messages for alliance X" lookups.
CREATE INDEX IF NOT EXISTS pw_chat_messages_alliance_idx
  ON pw_chat_messages (channel_type, channel_id, created_at DESC)
  WHERE channel_type = 'alliance';

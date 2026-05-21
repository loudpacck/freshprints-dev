-- Live Chat Pass 3: system message flag + mod badge toggle

ALTER TABLE pw_chat_messages
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

ALTER TABLE pw_moderators
  ADD COLUMN IF NOT EXISTS show_chat_badge BOOLEAN DEFAULT TRUE;

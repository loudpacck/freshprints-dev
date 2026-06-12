-- General-purpose admin config storage (key/value JSONB).
-- First use: Township layout overrides (plots, NPCs, atmosphere positions).

CREATE TABLE IF NOT EXISTS pw_admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

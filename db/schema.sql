-- Visitors: unique people across sessions
CREATE TABLE IF NOT EXISTS visitors (
  id VARCHAR(64) PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_count INT NOT NULL DEFAULT 1,
  country VARCHAR(2)
);

-- Sessions: lifecycle of a visit
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_count INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  country VARCHAR(2),
  region VARCHAR(64),
  city VARCHAR(64),
  device_type VARCHAR(16),
  browser VARCHAR(32),
  os VARCHAR(32),
  ui_theme VARCHAR(32),
  ui_mode VARCHAR(16),
  referrer VARCHAR(500),
  entry_path VARCHAR(255)
);

-- Events: every tracked action
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  visitor_id VARCHAR(64) NOT NULL,
  path VARCHAR(255),
  ui_theme VARCHAR(32),
  ui_mode VARCHAR(16),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);

CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions(visitor_id);

-- Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(128) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Pantheon Wars: User accounts (game players)
CREATE TABLE pw_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    faction VARCHAR(20) NOT NULL CHECK (faction IN ('olympians', 'aesir', 'annunaki')),
    class VARCHAR(20) NOT NULL CHECK (class IN ('warden', 'oracle', 'slayer', 'broker')),
    alignment VARCHAR(20) DEFAULT NULL CHECK (alignment IN ('coalition', 'compact', NULL)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Pantheon Wars: Core player stats (1:1 with pw_users)
CREATE TABLE pw_player_stats (
    user_id UUID PRIMARY KEY REFERENCES pw_users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 20,
    energy_max INTEGER DEFAULT 20,
    health INTEGER DEFAULT 100,
    health_max INTEGER DEFAULT 100,
    drachma INTEGER DEFAULT 500,
    drachma_lifetime INTEGER DEFAULT 500,
    glory INTEGER DEFAULT 0,
    attack INTEGER DEFAULT 5,
    defense INTEGER DEFAULT 5,
    stat_points INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Pantheon Wars: User sessions (game auth, mirrors admin_sessions pattern)
CREATE TABLE pw_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_pw_user_sessions_user ON pw_user_sessions(user_id);
CREATE INDEX idx_pw_users_level ON pw_player_stats(level DESC);
CREATE INDEX idx_pw_users_glory ON pw_player_stats(glory DESC);

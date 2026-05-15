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

-- Pantheon Wars: Quest catalog (seeded)
CREATE TABLE pw_quests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 5),
    energy_cost INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    drachma_base INTEGER NOT NULL,
    drachma_range INTEGER DEFAULT 0,
    loot_chance INTEGER DEFAULT 0,
    level_required INTEGER DEFAULT 1,
    mastery_target INTEGER DEFAULT 100
);

-- Pantheon Wars: Player quest progress / mastery tracking
CREATE TABLE pw_quest_progress (
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    quest_id INTEGER REFERENCES pw_quests(id),
    completions INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, quest_id)
);

CREATE INDEX idx_pw_quest_progress_user ON pw_quest_progress(user_id);

-- Pantheon Wars: Equipment catalog (seeded, not user-generated)
CREATE TABLE pw_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slot VARCHAR(20) NOT NULL CHECK (slot IN ('weapon', 'armor', 'artifact', 'mount', 'companion')),
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    level_required INTEGER DEFAULT 1,
    faction_exclusive VARCHAR(20) DEFAULT NULL,
    buy_price INTEGER DEFAULT NULL,
    sell_price INTEGER DEFAULT 0,
    glory_price INTEGER DEFAULT NULL
);

-- Pantheon Wars: Player inventory (many items per player)
CREATE TABLE pw_inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES pw_items(id),
    equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pantheon Wars: Quest loot tables (which items can drop from which quests)
CREATE TABLE pw_quest_loot (
    quest_id INTEGER REFERENCES pw_quests(id),
    item_id INTEGER REFERENCES pw_items(id),
    drop_weight INTEGER DEFAULT 1,
    PRIMARY KEY (quest_id, item_id)
);

CREATE INDEX idx_pw_inventory_user ON pw_inventory(user_id);

-- Pantheon Wars: Temple catalog (seeded)
CREATE TABLE IF NOT EXISTS pw_temples (
    type VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    base_cost INTEGER NOT NULL,
    income_per_hour INTEGER NOT NULL,
    level_required INTEGER DEFAULT 1
);

-- Pantheon Wars: Player-owned temples (passive income properties)
CREATE TABLE IF NOT EXISTS pw_player_temples (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    temple_type VARCHAR(50) REFERENCES pw_temples(type),
    upgrade_level INTEGER DEFAULT 0 CHECK (upgrade_level BETWEEN 0 AND 10),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pw_player_temples_user ON pw_player_temples(user_id);

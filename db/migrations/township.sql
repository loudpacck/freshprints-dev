-- Township system: profession upgrades that grant passive bonuses

CREATE TABLE IF NOT EXISTS pw_township_upgrades (
  type VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  establish_label VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  lore TEXT,
  bonus_type VARCHAR(50) NOT NULL,
  bonus_per_level NUMERIC(6,3) NOT NULL,
  bonus_at_max NUMERIC(6,3) NOT NULL,
  initial_cost INTEGER NOT NULL,
  level_required INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pw_player_townships (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  upgrade_type VARCHAR(50) REFERENCES pw_township_upgrades(type),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
  established_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  upgrading_to_level INTEGER,
  upgrade_started_at TIMESTAMPTZ,
  upgrade_completes_at TIMESTAMPTZ,
  UNIQUE (user_id, upgrade_type)
);

CREATE INDEX IF NOT EXISTS idx_pw_player_townships_user ON pw_player_townships(user_id);
CREATE INDEX IF NOT EXISTS idx_pw_player_townships_active_upgrade
  ON pw_player_townships(user_id, upgrade_completes_at)
  WHERE upgrade_completes_at IS NOT NULL;

INSERT INTO pw_township_upgrades (type, name, establish_label, description, lore, bonus_type, bonus_per_level, bonus_at_max, initial_cost, level_required, display_order) VALUES
  ('stewardship', 'Stewardship', 'Establish Laborer Guild',
   'Laborers tend the fields and waterways of your township, returning your strength faster after every effort.',
   'Mortal hands keep the divine machine turning. Without them, even gods grow tired.',
   'energy_regen_pct', 10.0, 150.0, 500, 20, 1),

  ('ritual', 'Ritual', 'Consecrate Priesthood',
   'Priests perform the sacred rites that mend wounds and restore vitality to those who serve the township.',
   'Pain is the price of war. Ritual is the answer the gods left us.',
   'health_regen_pct', 10.0, 150.0, 500, 20, 2),

  ('commerce', 'Commerce', 'Open Merchant Bazaar',
   'Merchants negotiate trade routes, increasing all Drachma earned from quests, adventures, and temples.',
   'Wealth is the foundation of power. Even gods bow to a well-stocked treasury.',
   'drachma_pct', 3.0, 120.0, 2000, 25, 3),

  ('divination', 'Divination', 'Found Scribe Archive',
   'Scribes record the wisdom of every battle and journey, accelerating your growth toward greater power.',
   'Knowledge is older than the gods themselves. Those who record it inherit the world.',
   'xp_pct', 1.0, 100.0, 7500, 35, 4),

  ('exploration', 'Exploration', 'Organize Scout Network',
   'Scouts chart hidden paths and forgotten ruins, returning with greater rewards from every adventure.',
   'The world is larger than the maps the gods drew. Those who wander find what was hidden.',
   'adventure_reward_pct', 1.0, 100.0, 10000, 40, 5),

  ('fortification', 'Fortification', 'Raise City Guard',
   'Sworn guardians stand watch over your township, lending their strength to your defenses in battle.',
   'A wall is just stone. A guard is faith made flesh.',
   'flat_defense', 1.0, 100.0, 20000, 45, 6),

  ('warfare', 'Warfare', 'Muster Militia',
   'Trained warriors march under your banner, sharpening every strike you deliver.',
   'The gods bless many things. War is the one mortals perfected without them.',
   'flat_attack', 1.0, 100.0, 20000, 50, 7)
ON CONFLICT (type) DO NOTHING;

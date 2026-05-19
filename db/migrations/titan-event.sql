-- ─── Pantheon Wars: Titan Event System Migration ─────────────────────────────
-- Run via Neon console BEFORE deploying titan-cron.js.
-- Idempotent (IF NOT EXISTS / ON CONFLICT throughout).

-- ── 1. Titan catalog ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pw_titans (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  pantheon VARCHAR(20) NOT NULL CHECK (pantheon IN ('greek','norse','mesopotamian')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('medium','hard','extreme')),
  description TEXT,
  lore TEXT,
  ability_name VARCHAR(100),
  ability_description TEXT,
  ability_type VARCHAR(50),
  ability_value INTEGER DEFAULT 0,
  base_hp_multiplier NUMERIC(4,2) DEFAULT 1.0,
  base_attack INTEGER DEFAULT 50,
  base_defense INTEGER DEFAULT 30,
  loot_rarity_floor VARCHAR(20) DEFAULT 'rare'
    CHECK (loot_rarity_floor IN ('common','uncommon','rare','epic','legendary'))
);

-- ── 2. Titan events ───────────────────────────────────────────────────────────
-- One row per scheduled or manually triggered event.
-- queue_closes_at = fight_starts_at (they are the same moment).
-- fight_ends_at = fight_starts_at + fight_duration_seconds (set during resolution).
-- fight_log JSONB structure:
-- {
--   "titan": { "name", "slug", "ability_name", "ability_type", "starting_hp", "final_hp" },
--   "rounds": [
--     {
--       "round": 1,
--       "attacks": [ { "user_id", "username", "damage_dealt", "attack_type", "is_crit", "is_blocked" } ],
--       "titan_attack": { "target_user_id", "target_username", "damage", "type" },
--       "titan_hp_after": N,
--       "player_hp_after": { "<uuid>": N, ... }
--     }
--   ]
-- }

CREATE TABLE IF NOT EXISTS pw_titan_events (
  id SERIAL PRIMARY KEY,
  titan_id INTEGER REFERENCES pw_titans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'queue'
    CHECK (status IN ('queue','active','resolved','expired')),
  queue_opens_at TIMESTAMPTZ NOT NULL,
  queue_closes_at TIMESTAMPTZ NOT NULL,
  fight_starts_at TIMESTAMPTZ NOT NULL,
  fight_ends_at TIMESTAMPTZ,
  fight_duration_seconds INTEGER,
  titan_starting_hp INTEGER NOT NULL DEFAULT 0,
  titan_final_hp INTEGER,
  result VARCHAR(20),
  fight_log JSONB,
  triggered_by VARCHAR(20) DEFAULT 'cron'
    CHECK (triggered_by IN ('cron','admin')),
  triggered_by_admin_id VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Player participation ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pw_titan_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES pw_titan_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','fought','abandoned')),
  damage_dealt INTEGER DEFAULT 0,
  hp_lost INTEGER DEFAULT 0,
  contribution_rank INTEGER,
  reward_tier VARCHAR(20),
  reward_xp INTEGER DEFAULT 0,
  reward_drachma INTEGER DEFAULT 0,
  reward_potion_id INTEGER,
  reward_loot_id INTEGER,
  rewards_claimed BOOLEAN DEFAULT FALSE,
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pw_titan_events_status
  ON pw_titan_events(status);
CREATE INDEX IF NOT EXISTS idx_pw_titan_events_queue
  ON pw_titan_events(queue_opens_at, queue_closes_at);
CREATE INDEX IF NOT EXISTS idx_pw_titan_participants_event
  ON pw_titan_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_pw_titan_participants_user
  ON pw_titan_participants(user_id, rewards_claimed);

-- ── 4. Titan catalog seed (8 Titans) ─────────────────────────────────────────

INSERT INTO pw_titans
  (slug, name, pantheon, difficulty, description, lore,
   ability_name, ability_description, ability_type, ability_value,
   base_hp_multiplier, base_attack, base_defense, loot_rarity_floor)
VALUES

  ('kronos',
   'Kronos, Devourer of Time',
   'greek', 'extreme',
   'The Titan King returns from the abyss beyond the Veil.',
   'Once ruler of the Titans before Zeus cast him into Tartarus, Kronos consumed his own children to deny prophecy. Now he stirs in the deepest chains, and time itself bends near him.',
   'Time Dilation',
   'Each round, attacking players have a chance to lose their strike to temporal warping.',
   'time_dilation', 20, 2.5, 80, 60, 'epic'),

  ('tiamat',
   'Tiamat, Mother of Chaos',
   'mesopotamian', 'extreme',
   'The primordial dragon-mother whose blood birthed the monsters of the deep.',
   'When the gods slew Tiamat at the dawn of creation, her body became the seas and her tears the rivers. But the Eternal Accord broke, and something stirred beneath the dark waters.',
   'Chaos Surge',
   'Random damage spikes can deal triple damage to a player each round.',
   'chaos_surge', 35, 2.4, 75, 70, 'legendary'),

  ('ymir',
   'Ymir, the Frost Primordial',
   'norse', 'hard',
   'The first being, from whose corpse Odin shaped the nine worlds.',
   'In the beginning there was only Ginnungagap, and from its mists emerged Ymir. The Aesir slew him to make creation. But ice remembers. Ice does not forgive.',
   'Frost Veil',
   'Reduces all players'' crit chance by 15% for the duration of the fight.',
   'frost_veil', 15, 2.0, 60, 50, 'epic'),

  ('atlas',
   'Atlas, the Sky-Bearer',
   'greek', 'medium',
   'The Titan condemned to hold the heavens upon his shoulders for eternity.',
   'For his role in the Titanomachy, Atlas was condemned to bear the sky for eternity. He has stood there since before mortals had names. Now he is tired.',
   'Crushing Weight',
   'Reduces all players'' agility and dodge chance by 25%.',
   'crushing_weight', 25, 1.6, 55, 45, 'rare'),

  ('nergal',
   'Nergal, Lord of the Dead',
   'mesopotamian', 'hard',
   'Ruler of Kurnugia, the Mesopotamian underworld.',
   'Nergal claimed the throne of the dead by force, taking Ereshkigal as his queen. His shadow falls cold across the battlefield, and the dying do not return.',
   'Death Aura',
   'No HP regeneration during the fight. All damage dealt is permanent until resolution.',
   'death_aura', 0, 2.2, 70, 55, 'epic'),

  ('surtr',
   'Surtr, the Black Flame',
   'norse', 'extreme',
   'The fire-giant who will burn the nine worlds at Ragnarok.',
   'Surtr waits at the edge of Muspelheim with his flaming sword, the blade that will set fire to the nine worlds when the end comes. His patience is running out.',
   'Ragnarok Flame',
   'Deals massive area damage to all surviving players in the final round if the Titan survives.',
   'ragnarok_flame', 100, 2.6, 90, 50, 'legendary'),

  ('hecate',
   'Hecate, Mistress of Magic',
   'greek', 'medium',
   'Titaness of crossroads, ghosts, and the edge between worlds.',
   'Hecate walks the threshold between worlds. She is neither living nor dead, neither here nor elsewhere. To attack her is to attack a possibility.',
   'Arcane Disruption',
   'Each round, random players have their attack and defense temporarily reduced by 20%.',
   'arcane_disrupt', 20, 1.7, 50, 60, 'rare'),

  ('enlil',
   'Enlil, the Storm Sovereign',
   'mesopotamian', 'hard',
   'God of wind, air, earth, and storms — architect of the great flood.',
   'Enlil decreed the great flood to silence the noise of mortals. The flood receded. The judgment did not.',
   'Divine Storm',
   'Drains 5 energy from each attacking player per round.',
   'divine_storm', 5, 2.1, 65, 50, 'epic')

ON CONFLICT (slug) DO NOTHING;

-- ── 5. Bootstrap: create first event if none exist ────────────────────────────
-- Creates a queue event 12 hours from migration run time.
-- Idempotent — does nothing if any event already exists.

INSERT INTO pw_titan_events
  (titan_id, status, queue_opens_at, queue_closes_at, fight_starts_at, titan_starting_hp, triggered_by)
SELECT
  (SELECT id FROM pw_titans ORDER BY RANDOM() LIMIT 1),
  'queue',
  NOW() + INTERVAL '11 hours',
  NOW() + INTERVAL '12 hours',
  NOW() + INTERVAL '12 hours',
  0,
  'cron'
WHERE NOT EXISTS (SELECT 1 FROM pw_titan_events);

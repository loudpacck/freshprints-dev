-- ─── Pantheon Wars: Adventures Migration ─────────────────────────────────────
-- Run via Neon console BEFORE deploying the adventure API.
-- Idempotent (IF NOT EXISTS / ON CONFLICT throughout).

-- ── 1. Quest bonus columns ────────────────────────────────────────────────────
ALTER TABLE pw_quests ADD COLUMN IF NOT EXISTS faction_bonus       VARCHAR(20) DEFAULT NULL;
ALTER TABLE pw_quests ADD COLUMN IF NOT EXISTS faction_bonus_type  VARCHAR(20) DEFAULT NULL;
ALTER TABLE pw_quests ADD COLUMN IF NOT EXISTS faction_bonus_value INTEGER     DEFAULT 0;
ALTER TABLE pw_quests ADD COLUMN IF NOT EXISTS class_bonus         VARCHAR(20) DEFAULT NULL;
ALTER TABLE pw_quests ADD COLUMN IF NOT EXISTS class_bonus_type    VARCHAR(20) DEFAULT NULL;
ALTER TABLE pw_quests ADD COLUMN IF NOT EXISTS class_bonus_value   INTEGER     DEFAULT 0;

-- ── 2. Adventure catalog ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pw_adventures (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    energy_cost INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    drachma_base INTEGER NOT NULL,
    drachma_range INTEGER DEFAULT 0,
    loot_chance INTEGER DEFAULT 100,
    min_loot_rarity VARCHAR(20) NOT NULL DEFAULT 'common'
        CHECK (min_loot_rarity IN ('common','uncommon','rare','epic','legendary')),
    level_required INTEGER NOT NULL DEFAULT 1,
    faction_bonus VARCHAR(20) DEFAULT NULL,
    faction_bonus_type VARCHAR(20) DEFAULT NULL,
    faction_bonus_value INTEGER DEFAULT 0,
    class_bonus VARCHAR(20) DEFAULT NULL,
    class_bonus_type VARCHAR(20) DEFAULT NULL,
    class_bonus_value INTEGER DEFAULT 0
);

-- ── 3. Player adventure tracking ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pw_player_adventures (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    adventure_id INTEGER REFERENCES pw_adventures(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completes_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','completed','abandoned')),
    rotation_seed_at_start INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_pw_player_adventures_user_status
  ON pw_player_adventures(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pw_player_adventures_completes
  ON pw_player_adventures(completes_at) WHERE status = 'active';

-- ── 4. Adventure seed data (12 adventures) ───────────────────────────────────
-- duration_seconds: 45min=2700, 1h=3600, 1.5h=5400, 2h=7200, 2.5h=9000,
--                  3h=10800, 4h=14400, 5h=18000, 6h=21600, 8h=28800, 10h=36000, 12h=43200

INSERT INTO pw_adventures
  (slug, name, description, duration_seconds, energy_cost, xp_reward,
   drachma_base, drachma_range, loot_chance, min_loot_rarity, level_required,
   faction_bonus, faction_bonus_type, faction_bonus_value,
   class_bonus, class_bonus_type, class_bonus_value)
VALUES

  ('aedons-errand',
   'Aedon''s Errand',
   'A cloaked stranger at the crossroads presses a sealed package into your hands and names a settlement three hours south. No questions. No explanation. You ask anyway. He''s already gone.',
   2700, 10, 150, 250, 100, 30, 'common', 1,
   NULL, NULL, 0, NULL, NULL, 0),

  ('the-forgotten-trireme',
   'The Forgotten Trireme',
   'A ghost ship drifts into harbor at dusk, oars moving on their own. The crew speaks in an ancient dialect and asks only for escort through the straits before dawn. They do not say what waits on the other side.',
   3600, 14, 280, 400, 150, 35, 'common', 5,
   NULL, NULL, 0, NULL, NULL, 0),

  ('night-hunt-cretan-wilds',
   'Night Hunt in the Cretan Wilds',
   'The minotaur''s descendants still haunt the maze-roads of Crete long after their progenitor''s death. A bounty board in Knossos has twelve names on it. Tonight you take as many as you can before sunrise.',
   5400, 16, 440, 550, 200, 40, 'common', 8,
   'olympians', 'loot_chance', 20, NULL, NULL, 0),

  ('traverse-the-frost-roads',
   'Traverse the Frost Roads',
   'The frost roads between realms open for three days every solstice. The cargo you are carrying is sealed and warded — you are not meant to know what it contains. The destination, you will recognize when you arrive.',
   7200, 20, 650, 750, 300, 45, 'uncommon', 12,
   'aesir', 'xp', 20, NULL, NULL, 0),

  ('the-ziggurat-descent',
   'The Ziggurat Descent',
   'Three levels beneath the great ziggurat of Babylon, a vault was sealed at the city''s founding. The priests deny its existence. The survey records say otherwise. You have three hours before the tide seals the lower chamber.',
   9000, 18, 580, 700, 250, 40, 'uncommon', 10,
   'annunaki', 'drachma', 25, NULL, NULL, 0),

  ('siege-mortal-compact-outpost',
   'Siege of the Mortal Compact Outpost',
   'The Mortal Compact has fortified a border crossing that was not theirs to take. Three dozen soldiers, one gate, and a very short window before reinforcements arrive from the valley road.',
   10800, 25, 900, 1100, 400, 50, 'uncommon', 20,
   NULL, NULL, 0, 'slayer', 'loot_chance', 20),

  ('the-long-march-to-olympus',
   'The Long March to Olympus',
   'Forty miles of sacred road paved with the bones of failed petitioners. You will walk every mile of it. The summit has been waiting for someone like you — though it has been waiting for a very long time.',
   14400, 30, 1400, 1600, 600, 55, 'uncommon', 28,
   'olympians', 'xp', 25, NULL, NULL, 0),

  ('valhallaas-proving-grounds',
   'Valhalla''s Proving Grounds',
   'The einherjar fight every day and die every evening, resurrected to fight again. Today you are scheduled to face them — all of them, at once, in three simultaneous formations. Odin is watching personally.',
   18000, 35, 1800, 2000, 700, 55, 'rare', 35,
   'aesir', 'xp', 25, 'slayer', 'loot_upgrade', 50),

  ('the-marduk-cipher',
   'The Marduk Cipher',
   'An encoded message scattered across seven temples traces back to an event that has not yet occurred. Decode it before someone else acts on it first. The gods do not appreciate being predicted.',
   21600, 40, 2200, 2600, 800, 60, 'rare', 40,
   'annunaki', 'drachma', 30, 'oracle', 'loot_upgrade', 50),

  ('war-council-deep-world',
   'War Council in the Deep World',
   'Three pantheons. One chamber carved from the bones of a dead world. Every faction seated across from every enemy. You have been invited as the neutral party, which means you are the most dangerous person in the room.',
   28800, 50, 3500, 4000, 1000, 65, 'rare', 50,
   NULL, NULL, 0, NULL, NULL, 0),

  ('seven-gates-of-inanna',
   'The Seven Gates of Inanna',
   'Seven checkpoints between the upper world and the dark. Each gate demands something different. Most travelers surrender what is taken from them. You intend to negotiate every single one.',
   36000, 60, 5000, 6000, 1500, 70, 'epic', 60,
   'annunaki', 'guaranteed_loot', 0, NULL, NULL, 0),

  ('final-siege-of-asgard',
   'The Final Siege of Asgard',
   'Asgard''s walls have held since the first age. The siege has been running for three centuries of accumulated failure. Today you carry what finally ends it — not because the walls are weak, but because you are not.',
   43200, 70, 8000, 10000, 2000, 80, 'epic', 75,
   'aesir', 'loot_upgrade', 75, 'warden', 'loot_upgrade', 50)

ON CONFLICT (slug) DO NOTHING;

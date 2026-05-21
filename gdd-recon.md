# Pantheon Wars — GDD Recon Document
**Date:** 2026-05-21  
**Purpose:** Exhaustive current-state capture for GDD rewrite. Every section documents what is actually in code, not what was originally planned.  
**DO NOT use as a GDD — use as raw source material to write one.**

---

## 1. Project Metadata

| Field | Value |
|-------|-------|
| **Game Name** | Pantheon Wars |
| **Type** | Persistent browser MMO — idle/action RPG (Mafia Wars-style progression) |
| **Setting** | Greek / Norse / Mesopotamian mythology, world of Kishar |
| **Base Route** | `/games/pantheon-wars` |
| **Repo Path** | `B:\freshprints-dev` (monorepo with freshprints.dev site) |
| **Status** | Live; all core systems complete |

### Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind v4 + Framer Motion + React Router v6 |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Neon Postgres via `@neondatabase/serverless` |
| Real-time | Pusher (cluster from `PUSHER_CLUSTER` env var) |
| Auth | bcrypt 12 rounds; `pw_session` HttpOnly cookie (players); `fp_mod` cookie (moderators) |
| Styling | Custom CSS variables scoped to Pantheon Wars component tree |
| Fonts | Cinzel Decorative (display), custom mono/body via CSS vars |
| Sound | 33 WAV/MP3 files in `public/sounds/pantheon_wars/`; three-channel audio (SFX/Music/Ambience) |

### Infrastructure Limits
| Resource | Limit | Used |
|----------|-------|------|
| Vercel serverless functions | 12 | 9 |
| Vercel cron jobs | 2 | 2 |

### API Files (9 total)
```
api/contact.js
api/track.js
api/auth/admin.js
api/auth/check.js
api/auth/logout.js
api/admin/overview.js
api/games/pantheon-wars/auth.js      ← ?action=signup|login|logout|me
api/games/pantheon-wars/game.js      ← ?action=... (40+ actions)
api/games/pantheon-wars/titan-cron.js
```

### Cron Jobs (vercel.json)
- `titan-cron.js` fires at **13:00 UTC** and **01:00 UTC** daily.

---

## 2. Complete Database Schema

### Site Analytics Tables
```sql
visitors (id UUID PK, fingerprint, first_seen, last_seen, visit_count)
sessions (id UUID PK, visitor_id, started_at, ended_at, page_count)
events (id BIGSERIAL PK, session_id, event_type, path, data JSONB, created_at)
admin_sessions (id UUID PK, created_at, expires_at)
```

### Game Tables

#### `pw_users`
```
id UUID PK DEFAULT gen_random_uuid()
username VARCHAR(30) UNIQUE NOT NULL
password_hash TEXT NOT NULL
faction VARCHAR(20)          -- 'olympians' | 'aesir' | 'annunaki'
class VARCHAR(20)            -- 'warden' | 'oracle' | 'slayer' | 'broker'
alignment VARCHAR(20)        -- 'coalition' | 'compact'
created_at TIMESTAMPTZ DEFAULT NOW()
security_question TEXT       -- added by account-recovery migration
security_answer_hash TEXT    -- bcrypt-hashed
```

#### `pw_player_stats`
```
user_id UUID PK REFERENCES pw_users
level INTEGER DEFAULT 1
xp INTEGER DEFAULT 0
drachma INTEGER DEFAULT 500
glory INTEGER DEFAULT 0
glory_lifetime INTEGER DEFAULT 0   -- added by schema ALTER
attack INTEGER DEFAULT 5
defense INTEGER DEFAULT 5
agility INTEGER DEFAULT 5
stat_points INTEGER DEFAULT 0
energy_current INTEGER DEFAULT 20
energy_max INTEGER DEFAULT 20
health_current INTEGER DEFAULT 100
health_max INTEGER DEFAULT 100
energy_regen_base TIMESTAMPTZ DEFAULT NOW()
health_regen_base TIMESTAMPTZ DEFAULT NOW()
energy_potion_uses_today INTEGER DEFAULT 0
energy_potion_reset_day INTEGER DEFAULT 0   -- floor(Date.now()/86400000)
health_potion_uses_today INTEGER DEFAULT 0  -- added by craftsmanship migration
divine_restoration_purchases_today INTEGER DEFAULT 0  -- added by craftsmanship migration
```

#### `pw_user_sessions`
```
id UUID PK DEFAULT gen_random_uuid()
user_id UUID REFERENCES pw_users ON DELETE CASCADE
expires_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_quests`
```
id SERIAL PK
name TEXT NOT NULL
description TEXT
tier INTEGER NOT NULL            -- 1–5
xp_reward INTEGER NOT NULL
drachma_reward INTEGER NOT NULL
energy_cost INTEGER NOT NULL
loot_chance INTEGER              -- percentage 0-100
duration_minutes INTEGER DEFAULT 5
faction_bonus VARCHAR(20)        -- faction that gets bonus
faction_bonus_type VARCHAR(30)   -- 'xp_pct' | 'drachma_pct' | 'loot_chance'
faction_bonus_value INTEGER
class_bonus VARCHAR(20)          -- class that gets bonus
class_bonus_type VARCHAR(30)
class_bonus_value INTEGER
```

#### `pw_quest_progress`
```
id SERIAL PK
user_id UUID REFERENCES pw_users ON DELETE CASCADE
quest_id INTEGER REFERENCES pw_quests
starts_at TIMESTAMPTZ DEFAULT NOW()
completes_at TIMESTAMPTZ
status VARCHAR(20) DEFAULT 'pending'  -- 'pending' | 'completed' | 'claimed'
```

#### `pw_items`
```
id SERIAL PK
name TEXT NOT NULL UNIQUE
description TEXT
slot VARCHAR(20) NOT NULL       -- 'weapon'|'armor'|'artifact'|'mount'|'companion'|'consumable'
rarity VARCHAR(20) NOT NULL     -- 'common'|'uncommon'|'rare'|'epic'|'legendary'
level_required INTEGER DEFAULT 1
faction_exclusive VARCHAR(20)   -- faction slug or NULL
attack_bonus INTEGER DEFAULT 0
defense_bonus INTEGER DEFAULT 0
agility_bonus INTEGER DEFAULT 0
crit_chance INTEGER DEFAULT 0   -- percentage points, added by round-combat-system migration
block_chance INTEGER DEFAULT 0
dodge_chance INTEGER DEFAULT 0
buy_price INTEGER               -- NULL = not in drachma shop
sell_price INTEGER DEFAULT 0
glory_price INTEGER             -- NULL = not in glory shop
consumable_effect VARCHAR(30)   -- 'restore_energy_pct'|'restore_health_pct'|'restore_health'|'restore_full'|'realloc_stats'
consumable_value INTEGER        -- meaning depends on effect
```

#### `pw_inventory`
```
user_id UUID REFERENCES pw_users ON DELETE CASCADE
item_id INTEGER REFERENCES pw_items
equipped BOOLEAN DEFAULT false
acquired_at TIMESTAMPTZ DEFAULT NOW()
acquired_from VARCHAR(30)       -- 'quest'|'shop'|'craft'|'titan'|'adventure'|'signup'
PRIMARY KEY (user_id, item_id)
```

#### `pw_quest_loot`
```
id SERIAL PK
quest_id INTEGER REFERENCES pw_quests
item_id INTEGER REFERENCES pw_items
drop_weight INTEGER NOT NULL     -- relative weight for weighted random
min_rarity VARCHAR(20)
```

#### `pw_temples`
```
id SERIAL PK
name TEXT NOT NULL
description TEXT
faction_exclusive VARCHAR(20)   -- NULL = all factions; or specific faction slug
income_per_hour INTEGER NOT NULL
base_cost INTEGER NOT NULL
```

**Seeded temples (5 total):** exact `income_per_hour` values are in `db/seed-pantheon-wars.sql` — not captured in this recon; verify from seed file before writing GDD.

#### `pw_player_temples`
```
user_id UUID REFERENCES pw_users ON DELETE CASCADE
temple_id INTEGER REFERENCES pw_temples
level INTEGER DEFAULT 1 CHECK (level BETWEEN 0 AND 25)   -- 0-25 after phase14-temples migration
last_collected_at TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, temple_id)
UNIQUE (user_id, temple_id)  -- one of each type per player (one-temple-per-type migration)
```

#### `pw_combat_log`
```
id SERIAL PK
attacker_id UUID REFERENCES pw_users ON DELETE CASCADE
defender_id UUID REFERENCES pw_users ON DELETE CASCADE
winner_id UUID REFERENCES pw_users ON DELETE SET NULL
glory_transferred INTEGER DEFAULT 0
rounds JSONB NOT NULL            -- array of round objects from simulateCombat
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_township_upgrades`
```
id SERIAL PK
type VARCHAR(30) UNIQUE NOT NULL   -- profession slug
name TEXT NOT NULL
establish_label TEXT
description TEXT
lore TEXT
bonus_type VARCHAR(30) NOT NULL
bonus_per_level NUMERIC(8,2) DEFAULT 0
bonus_at_max NUMERIC(8,2) DEFAULT 0
initial_cost INTEGER NOT NULL
level_required INTEGER DEFAULT 1
display_order INTEGER DEFAULT 0
```

#### `pw_player_townships`
```
user_id UUID REFERENCES pw_users ON DELETE CASCADE
upgrade_type VARCHAR(30) REFERENCES pw_township_upgrades(type)
level INTEGER DEFAULT 0
upgrade_started_at TIMESTAMPTZ
upgrade_completes_at TIMESTAMPTZ
established_at TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, upgrade_type)
```

#### `pw_craftsmanship_cycles`
```
id SERIAL PK
user_id UUID REFERENCES pw_users ON DELETE CASCADE
craft_level INTEGER NOT NULL
started_at TIMESTAMPTZ DEFAULT NOW()
completes_at TIMESTAMPTZ NOT NULL
status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','ready','claimed'))
rolled_rarity VARCHAR(20)
rolled_item_id INTEGER REFERENCES pw_items
claimed_at TIMESTAMPTZ
UNIQUE INDEX on (user_id) WHERE status != 'claimed'   -- one active/ready per player
```

#### `pw_adventures`
```
id SERIAL PK
slug VARCHAR(60) UNIQUE NOT NULL
name TEXT NOT NULL
description TEXT
duration_seconds INTEGER NOT NULL
energy_cost INTEGER NOT NULL
xp_reward INTEGER NOT NULL
drachma_reward INTEGER NOT NULL
drachma_bonus INTEGER DEFAULT 0     -- random bonus range added to base
loot_chance INTEGER NOT NULL        -- percentage 0-100
min_loot_rarity VARCHAR(20) DEFAULT 'common'
level_required INTEGER DEFAULT 1
faction_bonus VARCHAR(20)
faction_bonus_type VARCHAR(30)
faction_bonus_value INTEGER
class_bonus VARCHAR(20)
class_bonus_type VARCHAR(30)
class_bonus_value INTEGER
```

#### `pw_player_adventures`
```
id SERIAL PK
user_id UUID REFERENCES pw_users ON DELETE CASCADE
adventure_id INTEGER REFERENCES pw_adventures
started_at TIMESTAMPTZ DEFAULT NOW()
completes_at TIMESTAMPTZ NOT NULL
status VARCHAR(20) DEFAULT 'active'   -- 'active'|'completed'|'claimed'
reward_payload JSONB
```

#### `pw_titans`
```
id SERIAL PK
slug VARCHAR(30) UNIQUE NOT NULL
name TEXT NOT NULL
description TEXT
lore TEXT
pantheon VARCHAR(20) NOT NULL        -- 'greek'|'norse'|'mesopotamian'
difficulty VARCHAR(20) NOT NULL      -- 'medium'|'hard'|'extreme'
ability_name TEXT
ability_description TEXT
ability_value NUMERIC(8,2) DEFAULT 0
base_hp_multiplier NUMERIC(8,2) DEFAULT 2.0
base_attack INTEGER DEFAULT 50
base_defense INTEGER DEFAULT 40
loot_rarity_floor VARCHAR(20) DEFAULT 'rare'
```

#### `pw_titan_events`
```
id SERIAL PK
titan_id INTEGER REFERENCES pw_titans
status VARCHAR(20) DEFAULT 'queued'  -- 'queued'|'active'|'completed'
starts_at TIMESTAMPTZ
ends_at TIMESTAMPTZ
result JSONB
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_titan_participants`
```
event_id INTEGER REFERENCES pw_titan_events ON DELETE CASCADE
user_id UUID REFERENCES pw_users ON DELETE CASCADE
energy_committed INTEGER DEFAULT 0
joined_at TIMESTAMPTZ DEFAULT NOW()
energy_drained INTEGER NOT NULL DEFAULT 0   -- added by titan-energy-tracking migration
PRIMARY KEY (event_id, user_id)
```

#### `pw_pending_rewards`
```
id SERIAL PK
user_id UUID REFERENCES pw_users ON DELETE CASCADE
reward_type VARCHAR(30) NOT NULL CHECK (reward_type IN ('adventure','titan'))
source_id INTEGER
reward_payload JSONB NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
acknowledged_at TIMESTAMPTZ
INDEX on (user_id) WHERE acknowledged_at IS NULL
```

#### `pw_chat_messages`
```
id BIGSERIAL PK
channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('general','mod','dm'))
channel_id VARCHAR(50)           -- NULL for general/mod; dm_thread_id as string for DMs
sender_id UUID REFERENCES pw_users ON DELETE CASCADE
sender_username VARCHAR(30) NOT NULL   -- denormalized (safe if user deleted)
content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 500)
is_system BOOLEAN DEFAULT FALSE  -- added by live-chat-mod migration
created_at TIMESTAMPTZ DEFAULT NOW()
deleted_at TIMESTAMPTZ
deleted_by_name VARCHAR(60)
deleted_by_type VARCHAR(10)      -- 'player'|'moderator'
```

#### `pw_chat_dm_threads`
```
id SERIAL PK
user_a_id UUID REFERENCES pw_users ON DELETE CASCADE
user_b_id UUID REFERENCES pw_users ON DELETE CASCADE
last_message_at TIMESTAMPTZ DEFAULT NOW()
created_at TIMESTAMPTZ DEFAULT NOW()
CONSTRAINT user_a_lt_user_b CHECK (user_a_id < user_b_id)  -- canonical ordering
UNIQUE (user_a_id, user_b_id)
```

#### `pw_chat_dm_read_state`
```
user_id UUID REFERENCES pw_users ON DELETE CASCADE
thread_id INTEGER REFERENCES pw_chat_dm_threads ON DELETE CASCADE
last_seen_id BIGINT DEFAULT 0
updated_at TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, thread_id)
```

#### `pw_chat_user_state`
```
user_id UUID PK REFERENCES pw_users ON DELETE CASCADE
last_seen_general_msg_id BIGINT DEFAULT 0
last_seen_mod_msg_id BIGINT DEFAULT 0
updated_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_chat_moderations`
```
id SERIAL PK
target_user_id UUID REFERENCES pw_users ON DELETE CASCADE
mod_id UUID REFERENCES pw_moderators ON DELETE SET NULL
action VARCHAR(20) NOT NULL CHECK (action IN ('mute','timeout','ban','kick','delete_msg'))
channel_type VARCHAR(20)         -- NULL = global
duration_minutes INTEGER
expires_at TIMESTAMPTZ
lifted_at TIMESTAMPTZ
lifted_by UUID REFERENCES pw_moderators ON DELETE SET NULL
reason TEXT
created_at TIMESTAMPTZ DEFAULT NOW()
INDEX on (target_user_id, expires_at) WHERE lifted_at IS NULL
```

#### `pw_moderators`
```
id UUID PK DEFAULT gen_random_uuid()
username VARCHAR(30) UNIQUE NOT NULL
password_hash TEXT NOT NULL
invite_token_id INTEGER REFERENCES pw_moderator_invites ON DELETE SET NULL
is_active BOOLEAN DEFAULT TRUE
show_chat_badge BOOLEAN DEFAULT TRUE   -- added by live-chat-mod migration
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_moderator_invites`
```
id SERIAL PK
token_hash TEXT NOT NULL
created_by UUID
used_at TIMESTAMPTZ
expires_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_moderator_sessions`
```
id UUID PK DEFAULT gen_random_uuid()
moderator_id UUID REFERENCES pw_moderators ON DELETE CASCADE
expires_at TIMESTAMPTZ NOT NULL
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_moderator_actions` (audit log)
```
id BIGSERIAL PK
moderator_id UUID REFERENCES pw_moderators ON DELETE SET NULL
target_user_id UUID REFERENCES pw_users ON DELETE CASCADE
action_type VARCHAR(30)
details JSONB
created_at TIMESTAMPTZ DEFAULT NOW()
```

#### `pw_password_reset_tokens`
```
id UUID PK DEFAULT gen_random_uuid()
user_id UUID REFERENCES pw_users ON DELETE CASCADE
token_hash TEXT NOT NULL
expires_at TIMESTAMPTZ NOT NULL
used_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE INDEX on active tokens per user
```

---

## 3. Resources + Regen Formulas

### Energy
- **What it does:** Consumed by quests, adventures (upfront), PvP, titan participation.
- **Starting value:** 20 (Oracle class adds +5 at signup; +1/level via checkLevelUp).
- **Regen:** Calculated inline every authenticated request via `regenPlayer()`.
  - `energyMult = 1 + (stewardship_bonus_pct / 100)`
  - Seconds per 1 energy point: `max(60, floor(300 / energyMult))`
  - Base: 300s/pt. At max Stewardship: mult ≈ 2.23 → ~134s/pt.
  - Tracked via `energy_regen_base` timestamp.

### Health
- **What it does:** Depleted in PvP (defender only at virtual 100 HP — real HP only for attacker).
  - Note: PvP defender fights at virtual 100 HP. Only **attacker's real HP** is modified.
  - Wait: re-checking notes. "Defender always fights at virtual 100 HP; real HP never modified." This means defender's real HP is NOT changed. Only attacker's real HP is restored on win (+30%).
- **Regen:**
  - `healthMult = 1 + (ritual_bonus_pct / 100)`
  - Seconds per 1 health point: `max(45, floor(180 / healthMult))`
  - Base: 180s/pt. At max Ritual: mult ≈ 2.5 → ~72s/pt.
  - Tracked via `health_regen_base` timestamp.
- **PvP win restore:** +30% of health_max.
- **Level-up restore:** Full energy + health.

### Drachma
- Earned from: quests, adventures, commerce, PvP (none — changed), titan rewards.
- Spent on: shop purchases, temple upgrades, township establishment.
- Broker: +250 starting drachma (total 750); +10% drachma from quests.
- Annunaki: +5% drachma from all sources.
- Commerce township: scales drachma earned.

### Glory
- Earned from: PvP wins (+10% bonus for Compact alignment). Compact earns consolation glory even on loss = `min(20, floor(defenderLevel / 5))`.
- Spent on: glory shop (rotated equipment, Tablet of Reinvention, Divine Restoration).
- No XP or drachma from PvP — glory only.

### XP
- Earned from: quests, adventures, titan fights.
- Level-up threshold: `floor(100 × level^1.5)` XP to next level.
- Level-up grants: +5 stat_points, +2 energy_max, +10 health_max. Full energy + health restore.
- Olympian faction: +10% XP from all sources.
- Coalition alignment: +15% XP from all sources.
- Warden class: +1 defense per level (checkLevelUp).
- Oracle class: +1 energy_max per level (checkLevelUp).
- Slayer class: +1 attack per level (checkLevelUp).
- Divination township: scales XP earned (xp_pct bonus type).

### Stat Points
- Earned: +5 per level-up.
- Allocated: to Attack, Defense, Agility (1 point = +1 stat, no cap).
- Reset via: Scroll of Reinvention (free, given at signup) or Tablet of Reinvention (glory shop).

### Daily Limits (tracked via UTC day seed)
| Resource | Limit | Tracking Column |
|----------|-------|----------------|
| Energy potion shop purchases | 5/day | `energy_potion_reset_day` + `energy_potion_uses_today` |
| Energy potion uses (any source) | 10/day | same |
| Health potion uses | 10/day | `health_potion_uses_today` |
| Divine Restoration purchases | 1/day | `divine_restoration_purchases_today` |

Reset logic: `energy_potion_reset_day = floor(Date.now() / 86400000)` — if stored day ≠ current day, reset counter.

---

## 4. Player Identity

### Faction (Heritage — chosen at signup; permanent)
| Faction | Pantheon | Passive Bonus | Combat Bonus |
|---------|----------|---------------|-------------|
| **Olympians** | Greek | +10% XP from all sources | +5% crit chance |
| **Aesir** | Norse | +2 Agility at signup | +5% dodge chance |
| **Annunaki** | Mesopotamian | +5% drachma all sources; +5% temple income | +5% block chance |

### Class (chosen at signup; permanent)
| Class | Starting Bonus | Per-Level Bonus | Combat Bonus |
|-------|---------------|-----------------|-------------|
| **Warden** | +5 defense | +1 defense/level | +10% block chance |
| **Oracle** | +5 energy_max | +1 energy_max/level | +5% dodge chance |
| **Slayer** | +5 attack | +1 attack/level | +10% crit chance |
| **Broker** | +250 drachma (total 750); +10% quest drachma; +20% temple income | none | none |

### Alignment (chosen at signup; determines PvP economy)
| Alignment | Lore Side | Bonus |
|-----------|-----------|-------|
| **Coalition** (Pantheon Coalition) | Divine loyalists | +15% XP from all sources |
| **Compact** (Mortal Compact) | Sovereignty rebels | +10% glory on PvP win; consolation glory on loss |

### Starting Stats (base + class bonuses applied at signup)
```
attack:      5  (Slayer: 10)
defense:     5  (Warden: 10)
agility:     5  (Aesir: 7)
energy_max: 20  (Oracle: 25)
health_max: 100
drachma:   500  (Broker: 750)
stat_points: 0
```

### Signup Extras
- Free Scroll of Reinvention placed in inventory.
- Class/faction starting stat bonuses applied to `pw_player_stats`.
- Security question + hashed security answer stored for account recovery.

---

## 5. Quests (PvE)

### Overview
- **40 quests** total, 5 tiers (8/8/9/8/7 per tier).
- **Rotation:** 3-hour UTC buckets. Mulberry32 PRNG seeded by `floor(Date.now() / 10800000)`. A random subset from the full 40 is shown each rotation.
- **Completion:** ~5 minutes of real time (duration_minutes field). Player initiates, waits, then claims.
- **No failure state** — quest always succeeds; the only resource cost is energy.

### Tier Summary
| Tier | Count | Energy Cost | XP Range | Drachma Range | Notes |
|------|-------|-------------|----------|---------------|-------|
| 1 | 8 | 1–2 | Low | Low | Starter content |
| 2 | 8 | 2–4 | Moderate | Moderate | |
| 3 | 9 | 3–6 | Mid | Mid | |
| 4 | 8 | 5–8 | High | High | Epic loot weight reduced to 1 (post-overhaul) |
| 5 | 7 | 6–10 | Max | Max | Lore quests; epic weight 2; no legendary |

### Reward Computation
```
finalXP = baseXP
  × (Olympian faction? × 1.10)
  × (Coalition align? × 1.15)
  × (quest faction_bonus match? × (1 + faction_bonus_value/100))
  × (1 + divination_township_pct/100)

finalDrachma = baseDrachma
  × (Annunaki faction? × 1.05)
  × (Broker class? × 1.10)
  × (quest faction_bonus match + type drachma_pct? × ...)
  × (1 + commerce_township_pct/100)
```

### Quest Loot (post loot-overhaul.sql)
- **Legendary:** removed from all quest loot tables.
- **Tier 4 (IDs 26–33) epic:** drop_weight = 1 (was 5; 70% reduction).
- **Tier 5 (IDs 34–40) epic:** drop_weight = 2 (was 5; 50% reduction).
- Loot selection: weighted random from `pw_quest_loot` for the completed quest. Rolls `loot_chance` first; if hit, picks item by drop_weight.

---

## 6. Adventures

### Overview
- **12 adventures** total. One active per player at a time.
- **Rotation:** 6-hour UTC buckets. Mulberry32 PRNG seeded by `floor(Date.now() / 21600000)`.
- Energy paid upfront at departure. Adventure runs in real time. Player claims on return.
- Rewards written to `pw_pending_rewards` on completion. Frontend polls and shows modal.
- **Loot rarity cap:** Adventures NEVER drop epic or legendary. Cap enforced in SQL: `WHERE rarity_idx BETWEEN min_loot_rarity_idx AND 3` (rare = index 3).

### Adventure Catalog
| Slug | Duration | Energy | XP | Drachma | Loot% | Min Rarity | Level | Faction Bonus | Class Bonus |
|------|----------|--------|-----|---------|-------|------------|-------|--------------|------------|
| aedons-errand | 45m | 10 | 150 | 250+100 | 30 | common | 1 | — | — |
| the-forgotten-trireme | 1h | 14 | 280 | 400+150 | 35 | common | 5 | — | — |
| night-hunt-cretan-wilds | 1.5h | 16 | 440 | 550+200 | 40 | common | 8 | Olympians: loot_chance+20 | — |
| traverse-the-frost-roads | 2h | 20 | 650 | 750+300 | 45 | uncommon | 12 | Aesir: xp+20 | — |
| the-ziggurat-descent | 2.5h | 18 | 580 | 700+250 | 40 | uncommon | 10 | Annunaki: drachma+25 | — |
| siege-mortal-compact-outpost | 3h | 25 | 900 | 1100+400 | 50 | uncommon | 20 | — | Slayer: loot_chance+20 |
| the-long-march-to-olympus | 4h | 30 | 1400 | 1600+600 | 55 | uncommon | 28 | Olympians: xp+25 | — |
| valhallaas-proving-grounds | 5h | 35 | 1800 | 2000+700 | 55 | rare | 35 | Aesir: xp+25 | Slayer: loot_upgrade+50 |
| the-marduk-cipher | 6h | 40 | 2200 | 2600+800 | 60 | rare | 40 | Annunaki: drachma+30 | Oracle: loot_upgrade+50 |
| war-council-deep-world | 8h | 50 | 3500 | 4000+1000 | 65 | rare | 50 | — | — |
| seven-gates-of-inanna | 10h | 60 | 5000 | 6000+1500 | 70 | epic (min display only; cap still rare) | 60 | Annunaki: guaranteed_loot | — |
| final-siege-of-asgard | 12h | 70 | 8000 | 10000+2000 | 80 | epic (cap still rare) | 75 | Aesir: loot_upgrade+75 | Warden: loot_upgrade+50 |

> **Note:** min_loot_rarity for the last two rows shows 'epic' in the seed, but the loot query hard-caps at 'rare' (index 3). This means the `min_loot_rarity` column is overridden by the cap. In practice, even the highest adventures drop common–rare.

### Bonus Type Effects
| Bonus Type | Effect |
|------------|--------|
| `loot_chance` | Adds value to loot_chance percentage |
| `xp` or `xp_pct` | Adds percentage to XP reward |
| `drachma_pct` | Adds percentage to drachma reward |
| `guaranteed_loot` | Loot roll always succeeds |
| `loot_upgrade` | Increases rolled rarity by value/100 (probability of +1 tier) |

### Completion Flow (`checkAndCompleteAdventures`)
Runs at the TOP of every authenticated game.js handler call. If `completes_at <= NOW()` and `status = 'active'`:
1. Rolls loot (if eligible).
2. Writes reward_payload to `pw_pending_rewards`.
3. Sets `status = 'completed'`.
4. Frontend fetches pending rewards and shows `AdventureRewardModal`.

---

## 7. Equipment + Loot

### Item Slots
- **Equippable (5):** weapon, armor, artifact, mount, companion — one equipped per slot.
- **Consumable (1):** used on demand; not equipped.

### The 50 Base Items (IDs 1–50)

**Weapons (IDs 1–10)**
| ID | Name | Rarity | ATK | AGI | CRIT |
|----|------|--------|-----|-----|------|
| 1 | Iron Gladius | common | 2 | 0 | 0 |
| 2 | Bronze Kopis | uncommon | 3 | 1 | 5 |
| 3 | Legionary Spear | uncommon | 6 | 0 | 5 |
| 4 | Runic Dagger | rare | 5 | 4 | 15 |
| 5 | Blade of Ares | rare | 14 | 0 | 10 |
| 6 | Mjolnir Shard | epic | 16 | 0 | 15 |
| 7 | Spear of Olympus | epic | 28 | 1 | 15 |
| 8 | Enkidu's Axe | epic | 25 | 0 | 20 |
| 9 | Godkiller Blade | legendary | 55 | 0 | 25 |
| 10 | Gungnir | legendary | 60 | 2 | 20 |

**Armor (IDs 11–20)**
| ID | Name | Rarity | DEF | AGI | BLOCK | DODGE |
|----|------|--------|-----|-----|-------|-------|
| 11 | Woven Reed Armor | common | 2 | 0 | 5 | 0 |
| 12 | Leather Breastplate | uncommon | 3 | 0 | 5 | 0 |
| 13 | Legionary Shield | uncommon | 7 | 0 | 15 | 0 |
| 14 | Berserker Furs | rare | 6 | 2 | 10 | 0 |
| 15 | Hoplite Greaves | rare | 9 | 0 | 15 | 0 |
| 16 | Ishtar's Veil | epic | 12 | 2 | 10 | 5 |
| 17 | Aegis Breastplate | epic | 16 | 0 | 25 | 0 |
| 18 | Chain of Niflheim | epic | 26 | 0 | 25 | 0 |
| 19 | Olympian Plate | epic | 30 | 0 | 30 | 0 |
| 20 | Shield of Aegis | legendary | 55 | 0 | 40 | 0 |

**Artifacts (IDs 21–30)**
| ID | Name | Rarity | ATK | DEF | AGI | CRIT | BLOCK | DODGE |
|----|------|--------|-----|-----|-----|------|-------|-------|
| 21 | Carved Idol | common | 1 | 1 | 0 | 5 | 0 | 0 |
| 22 | Bone Amulet | common | 0 | 2 | 0 | 0 | 5 | 0 |
| 23 | Oracle's Eye | uncommon | 3 | 3 | 0 | 10 | 0 | 0 |
| 24 | Runic Compass | uncommon | 4 | 2 | 3 | 0 | 0 | 10 |
| 25 | Celestial Map | rare | 5 | 2 | 0 | 10 | 0 | 5 |
| 26 | Omphalos Stone | rare | 7 | 10 | 0 | 5 | 10 | 0 |
| 27 | Tablet of Destinies | epic | 9 | 9 | 0 | 15 | 0 | 5 |
| 28 | Prometheus' Flame | epic | 12 | 5 | 0 | 20 | 0 | 0 |
| 29 | Pandora's Fragment | epic | 16 | 16 | 2 | 15 | 10 | 5 |
| 30 | Eye of Providence | legendary | 28 | 28 | 0 | 25 | 15 | 10 |

**Mounts (IDs 31–40)**
| ID | Name | Rarity | ATK | DEF | AGI | CRIT | BLOCK | DODGE |
|----|------|--------|-----|-----|-----|------|-------|-------|
| 31 | Draft Horse | common | 1 | 2 | 2 | 0 | 0 | 5 |
| 32 | Mule of Hermes | common | 0 | 3 | 3 | 0 | 0 | 10 |
| 33 | War Stallion | uncommon | 3 | 5 | 3 | 5 | 0 | 10 |
| 34 | Sleipnir Pup | uncommon | 5 | 3 | 6 | 0 | 0 | 20 |
| 35 | Storm-Born Horse | rare | 4 | 5 | 5 | 5 | 0 | 15 |
| 36 | Pegasus | rare | 9 | 9 | 8 | 5 | 0 | 20 |
| 37 | Lamassu | rare | 7 | 13 | 4 | 0 | 10 | 10 |
| 38 | Chimera Fragment | epic | 11 | 8 | 6 | 10 | 0 | 15 |
| 39 | Fenrir Pup | epic | 22 | 12 | 8 | 15 | 0 | 20 |
| 40 | Divine Chariot | legendary | 35 | 35 | 10 | 10 | 5 | 25 |

**Companions (IDs 41–50)**
| ID | Name | Rarity | ATK | DEF | AGI | CRIT | BLOCK | DODGE |
|----|------|--------|-----|-----|-----|------|-------|-------|
| 41 | Minor Sprite | common | 2 | 1 | 0 | 5 | 0 | 0 |
| 42 | Shade of the Dead | common | 3 | 0 | 1 | 10 | 0 | 5 |
| 43 | Einherjar Scout | uncommon | 6 | 3 | 2 | 10 | 0 | 5 |
| 44 | Sacred Hound | uncommon | 4 | 5 | 2 | 5 | 5 | 5 |
| 45 | Temple Guardian | rare | 2 | 8 | 0 | 0 | 20 | 0 |
| 46 | Olympian Herald | rare | 8 | 8 | 1 | 10 | 5 | 0 |
| 47 | Sumerian Sage | rare | 7 | 10 | 0 | 5 | 10 | 0 |
| 48 | Valkyrie Fragment | epic | 13 | 5 | 3 | 15 | 0 | 10 |
| 49 | Divine Emissary | epic | 20 | 20 | 2 | 15 | 10 | 5 |
| 50 | Bound Titan | legendary | 45 | 20 | 0 | 20 | 15 | 5 |

### Consumable Items (in addition to IDs 1–50)

**Health Potions (seeded, then updated to percentage-based in phase14)**
| Name | Rarity | Level | Effect | Value | Buy Price | Sell |
|------|--------|-------|--------|-------|-----------|------|
| Minor Healing Tonic | common | 1 | restore_health_pct | 25% | 150 | 30 |
| Healing Draught | uncommon | 5 | restore_health_pct | 50% | 300 | 60 |
| Greater Healing Potion | rare | 15 | restore_health_pct | 75% | 600 | 120 |
| Ambrosia Flask | epic | 25 | restore_health (9999 = full) | — | NULL | 200 |
| Divine Restoration | legendary | 50 | restore_full (HP + energy) | — | NULL | 500 |

Divine Restoration: `glory_price = 50`. Max 1 purchase/day.

**Energy Potions (added in phase14)**
| Name | Rarity | Level | Effect | Value | Buy Price | Sell |
|------|--------|-------|--------|-------|-----------|------|
| Minor Energy Tonic | common | 1 | restore_energy_pct | 25% | 150 | 30 |
| Energy Draught | uncommon | 5 | restore_energy_pct | 50% | 300 | 60 |
| Greater Energy Potion | rare | 15 | restore_energy_pct | 75% | 600 | 120 |
| Aether Flask | epic | 25 | restore_energy_pct | 100% | NULL | 200 |
| Divine Surge | legendary | 50 | restore_full | — | NULL (removed) | 500 |

> **Divine Surge** was removed (craftsmanship-potion-overhaul.sql): `buy_price = NULL`, `glory_price = NULL`, all inventory copies deleted. Row kept in DB for historical integrity.

**Stat Reset Consumables**
| Name | Rarity | Level | Effect | Buy | Sell | Glory |
|------|--------|-------|--------|-----|------|-------|
| Scroll of Reinvention | uncommon | 1 | realloc_stats | NULL | 750 | NULL |
| Tablet of Reinvention | epic | 1 | realloc_stats | NULL | 0 | 50 |

### Glory Shop — Legendary Equipment Prices
After all migrations (phase14-temples → loot-overhaul ×3 → glory-price-2x ×2):
| Item | Current Glory Price |
|------|---------------------|
| Godkiller Blade (ID 9) | 300 |
| Gungnir (ID 10) | 480 |
| Shield of Aegis (ID 20) | 360 |
| Eye of Providence (ID 30) | 600 |
| Divine Chariot (ID 40) | 720 |
| Bound Titan (ID 50) | 900 |

### Shop Rotation
- **Drachma shop:** Daily rotation (UTC day seed). Picks from items with `buy_price IS NOT NULL`. Equipment only (not consumables in the rotation — verify in game.js `handleShop`).
- **Glory shop:** Daily rotation. Picks from items with `glory_price IS NOT NULL`. Includes legendary equipment + Tablet of Reinvention + Divine Restoration.

---

## 8. Loot Rarity Overhaul (Post-Phase D)

All changes applied via `db/migrations/loot-overhaul.sql`:

### Changes Applied
1. **Quest loot:** Legendary items deleted from all `pw_quest_loot` rows.
2. **Tier 4 quest epic drop weights** (quest IDs 26–33): `GREATEST(1, FLOOR(weight * 0.3))` → result = 1.
3. **Tier 5 quest epic drop weights** (quest IDs 34–40): `GREATEST(1, FLOOR(weight * 0.5))` → result = 2.
4. **Inventory wipe:** All epic/legendary non-consumable equipment deleted from `pw_inventory` (consumables survived).
5. **Legendary glory prices tripled (×3):** Applied before subsequent ×2 migration.

### Current Rarity Distribution by Source
| Source | Common | Uncommon | Rare | Epic | Legendary |
|--------|--------|----------|------|------|-----------|
| Quests | ✓ | ✓ | Low chance | Very rare (high tiers only) | Never |
| Adventures | ✓ | ✓ | ✓ | Never (capped) | Never |
| Drachma shop | ✓ | — | Occasional | Never | Never |
| Glory shop | ✓ | ✓ | ✓ | ✓ | ✓ (equipment IDs 9,10,20,30,40,50) |
| Craftsmanship | ✓ | ✓ | ✓ | ✓ | Never |
| Titans: medium | ✓ | ✓ | ✓ | ~1% | Never |
| Titans: hard | ✓ | ✓ | ✓ | ~5% | Never |
| Titans: extreme | ✓ | ✓ | ✓ | ~17% | ~4% |

---

## 9. Township + All 8 Professions

### Overview
- Township is a separate system from temples. Player establishes (unlocks) each profession by paying drachma at the required level.
- Each profession is at level 0 (not established) initially. Establishing it sets level to 1.
- Upgrading increases level; upgrade takes real time (`upgrade_completes_at`).
- `checkAndCompleteUpgrades` runs at TOP of every authenticated request.

### Profession Catalog
| # | Type | Name | Bonus Type | Per Level | At Max | Establish Cost | Level Required |
|---|------|------|------------|-----------|--------|----------------|----------------|
| 1 | stewardship | Stewardship | energy_regen_pct | +10% | +150% | 500 | 20 |
| 2 | ritual | Ritual | health_regen_pct | +10% | +150% | 500 | 20 |
| 3 | commerce | Commerce | drachma_pct | +3% | +120% | 2,000 | 25 |
| 4 | divination | Divination | xp_pct | +1% | +100% | 7,500 | 35 |
| 5 | exploration | Exploration | adventure_reward_pct | +1% | +100% | 10,000 | 40 |
| 6 | fortification | Fortification | flat_defense | +1 | +100 | 20,000 | 45 |
| 7 | warfare | Warfare | flat_attack | +1 | +100 | 20,000 | 50 |
| 8 | craftsmanship | Craftsmanship | craft_cycle | — | — | 30,000 | 60 |

> **Bonus at max:** The Codex UI labels this "MAX (LVL 10)". Verify whether max profession level is 10 or higher in the actual game — the hardcoded UI label says 10 but `getTownshipBonusValue` formula interpolates over a 1–100 range. Resolve this before GDD finalization.

### Upgrade Formulas
```js
// Drachma cost to upgrade from level N to N+1
getTownshipUpgradeCost(initialCost, currentLevel) = floor(initialCost * currentLevel^1.7)

// Real-time duration of an upgrade at current level N
getTownshipUpgradeSeconds(currentLevel) = floor(5 * 60 * currentLevel^1.3)

// Current bonus value at level N (linear interpolation)
getTownshipBonusValue(upgrade, level):
  if bonus_type is 'craft_cycle': return craft cycle duration formula
  otherwise: linear from bonus_per_level (at level 1) to bonus_at_max (at level max)
```

### Craftsmanship (8th Profession — Special)
- Does not give a stat bonus. Instead unlocks the crafting cycle system.
- The profession level determines craft speed and rarity tier probability.
- Lore: "The Divine Forge — older than any pantheon."

**Craft Cycle:**
- One active/ready cycle per player at a time (unique index enforces this).
- Duration: `getCraftCycleSeconds(level) = 86400 - ((level-1) * 436)`
  - Level 1: 86,400s (24h).  Level 100: ~43,236s (~12h). 
- On completion (`checkAndCompleteCrafts`): `status` → `'ready'`, `rolled_rarity` and `rolled_item_id` set.
- Player claims via `handleCraftsmanshipClaim`: item added to inventory; new cycle auto-started.

**Craft Rarity Probabilities (`rollCraftRarity`):**
- 10 level bands. Rarity improves with higher craftsmanship level.
- Maximum possible: **epic**. Legendary never crafted.
- Exact probability tables are in `lib/pwHelpers.js` — not fully captured here.

---

## 10. Temples (Passive Income)

### Overview
- Players can own up to one of each temple type (one-temple-per-type constraint).
- Temple income accrues in real time from `last_collected_at`.
- Collection happens automatically inline via `regenPlayer()` on every authenticated request.

### Temple Level & Upgrade
- **Level range:** 0–25 (`MAX_TEMPLE_LEVEL = 25`, extended in phase14-temples migration from 10).
- **Upgrade cost formula:**
  - Levels 0–9: `0.5 × base_cost`
  - Levels 10–19: `1.0 × base_cost`
  - Levels 20–24: `2.0 × base_cost`
- Upgrade is instant (no timer, unlike township). Payment only.

### Income Formula
```js
templeIncomeMultiplier(level) = 1 + (0.234 × level^1.03)
income = temple.income_per_hour × templeIncomeMultiplier(level) × hoursElapsed
```

### Faction Multipliers
- Broker class: temple income ×1.20 (20% bonus)
- Annunaki faction: temple income ×1.05 (5% bonus)

### 5 Seeded Temples
Exact `income_per_hour` and `base_cost` values are in `db/seed-pantheon-wars.sql` — not captured in this recon. Three are available to all factions; two have faction_exclusive locks (believed to be Olympian and Aesir restricted, based on Codex lore, but verify from seed).

---

## 11. PvP Combat (Round-Based)

### Initiation
- Route: `/games/pantheon-wars/pvp`
- Attacker selects target from a list (up to 50 levels above/below, max 20 shown).
- **Energy cost:** `max(1, ceil(attacker.level / 10))` — increases with level.
- **Level restriction:** Cannot attack targets more than 4 levels below. (Attack blocked if `attackerLevel - defenderLevel >= 5`.)
- **Cooldown:** 5-minute per-target cooldown to prevent farming.

### Combat Resolution
`simulateCombat({ attacker, defender, attackerEquip, defenderEquip })` in `lib/pwHelpers.js`:
- **5 rounds** per fight.
- Each round: attacker swings first → defender counter-swings (if attacker is still in action).
- Defender's real HP is **never modified** — defender always fights at virtual 100 HP.

### Per-Round Mechanics
| Outcome | Condition | Damage |
|---------|-----------|--------|
| Miss | dodge roll succeeds | 0 |
| Hit | base hit | `max(1, attack - defReduction)` |
| Crit | crit roll succeeds | `base × 1.5` |
| Block | block roll succeeds | `base × 0.4` (60% reduction) |
| Counter | `defAgility × 0.5%` chance | `base × 0.5`; 50% chance this is also a half-crit |

**Defense formula (damage reduction):** Curved; each point of defense matters more at low values. Max reduction ≈ 50%. Defense never exceeds 50% mitigation.

### Combat Stat Sources
| Stat | Sources |
|------|---------|
| Crit chance | class (Slayer +10%, Olympian +5%) + weapon crit_chance; capped at 75% total |
| Block chance | class (Warden +10%, Annunaki +5%) + armor block_chance; capped at 75% |
| Dodge chance | class (Oracle +5%, Aesir +5%) + item dodge_chance + agility contribution; capped at 75% |
| Attack | base attack + equip attack_bonus + Aesir +5% + Slayer +10% + Warfare township |
| Defense | base defense + equip defense_bonus + Warden +10% block (not defense directly) |

> All identity + equip bonuses capped at 75% combined per mechanic.

### Outcomes
| Result | Attacker | Defender |
|--------|----------|----------|
| Win | +glory (Compact: +10%); +30% health_max restore | (Compact): consolation glory = `min(20, floor(defLevel/5))` |
| Loss | no glory; no health restore | — |
| XP from PvP | 0 | — |
| Drachma from PvP | 0 | — |

### "Fatigued" State
When a player's energy reaches 0 during a Titan fight (via Enlil's divine_storm), they become Fatigued. In this state:
- No crit available.
- No block available.
- No dodge available.
- Titan's defensive mechanics still apply to their weakened attacks.

### Combat Log
Every PvP fight recorded in `pw_combat_log` with full `rounds JSONB` array. Accessible via PvPLog page.

---

## 12. Titan Events (Full Spec)

### Overview
- 8 unique Titans, each with distinct difficulty, stats, and ability.
- One active event at a time. Events cycle through the titan pool (scheduling logic in `scheduleNextTitanEvent`).
- Players join an active fight by committing energy. Fight resolves server-side. Rewards claimed after.

### Titan Roster
| Slug | Name | Pantheon | Difficulty | HP Mult | Base ATK | Base DEF | Ability | Ability Value | Loot Floor |
|------|------|----------|-----------|---------|----------|----------|---------|--------------|------------|
| kronos | Kronos, Devourer of Time | greek | extreme | 2.5 | 80 | 60 | time_dilation | 20 | epic |
| tiamat | Tiamat, Mother of Chaos | mesopotamian | extreme | 2.4 | 75 | 70 | chaos_surge | 35 | legendary |
| ymir | Ymir, the Frost Primordial | norse | hard | 2.0 | 60 | 50 | frost_veil | 15 | epic |
| atlas | Atlas, the Sky-Bearer | greek | medium | 1.6 | 55 | 45 | crushing_weight | 25 | rare |
| nergal | Nergal, Lord of the Dead | mesopotamian | hard | 2.2 | 70 | 55 | death_aura | 0 | epic |
| surtr | Surtr, the Black Flame | norse | extreme | 2.6 | 90 | 50 | ragnarok_flame | 100 | legendary |
| hecate | Hecate, Mistress of Magic | greek | medium | 1.7 | 50 | 60 | arcane_disrupt | 20 | rare |
| enlil | Enlil, the Storm Sovereign | mesopotamian | hard | 2.1 | 65 | 50 | divine_storm | 5 | epic |

### Titan Ability Effects
| Ability | Titan | Effect |
|---------|-------|--------|
| time_dilation | Kronos | Reduces XP earned from the fight by `ability_value`% for all participants |
| chaos_surge | Tiamat | Disrupts each player's contribution by `ability_value`% (random chance) |
| frost_veil | Ymir | Reduces top defenders' contribution by `ability_value`% |
| crushing_weight | Atlas | Reduces all participants' damage by `ability_value`% |
| death_aura | Nergal | Deals flat `ability_value` damage to all participants (not energy-based) |
| ragnarok_flame | Surtr | On kill round, deals `ability_value`% of total titan HP as AoE to all |
| arcane_disrupt | Hecate | Disrupts `ability_value`% of each player's artifact/magic contribution |
| divine_storm | Enlil | Drains `ability_value` energy from all participants; tracked in `energy_drained` column |

### HP + Fight Simulation
```js
// simulateTitanFight(titan, participants)
totalPlayerPower = sum of calculatePowerRating(stats, equipBonuses) for each participant
titanHP = max(1000, floor(totalPlayerPower × 8 × base_hp_multiplier × count^1.2 / count))
duration = max(60, min(600, floor((90 + count×15) × diffMult)))
rounds = max(4, min(40, floor(duration / 15)))
```

### Reward Distribution
| Metric | Medium | Hard | Extreme |
|--------|--------|------|---------|
| XP (base) | 200 | 300 | 500 |
| XP (top contributor) | 300 | 450 | 750 |
| Drachma (base) | 2,000 | 3,000 | 5,000 |
| Drachma (top) | 3,000 | 4,500 | 7,500 |
| Potion drop chance (top) | 100% | 100% | 100% |
| Potion drop chance (base) | 80% | 80% | 80% |
| Loot drop chance (top) | 60% | 60% | 60% |
| Loot drop chance (base) | 25% | 25% | 25% |

### Loot Rarity Roll (`rollTitanLootRarity`)
| Rarity | Medium | Hard | Extreme |
|--------|--------|------|---------|
| Common | 55% | 35% | 12% |
| Uncommon | 32% | 38% | 35% |
| Rare | 12% | 22% | 32% |
| Epic | 1% | 5% | 17% |
| Legendary | 0% | 0% | 4% |

**Rank bonuses:**
- Rank 1 (top contributor): always +1 rarity tier.
- Ranks 2–3: 50% chance of +1 rarity tier.
- Medium/hard: capped at epic. Extreme: capped at legendary.

### Event Lifecycle
1. **Queued:** `status='queued'`, fight not started, `starts_at` set.
2. **Active:** `status='active'`, players join by committing energy via `handleTitanJoin`.
3. **Completed:** `status='completed'`, `result JSONB` populated, rewards distributed to `pw_pending_rewards`.

### Cron Flow (`processExpiredTitanEvents`)
- Protected by Postgres advisory lock `847391` (prevents concurrent cron runs).
- Steps:
  1. Find active fights where `ends_at <= NOW()` → resolve + distribute rewards.
  2. Start queued fights where `starts_at <= NOW()`.
  3. Persist energy drain (Enlil).
- Then `scheduleNextTitanEvent` queues the next titan.
- Called by cron AND inline at TOP of every authenticated game.js handler.

### Power Rating Formula
```js
calculatePowerRating(stats, equipBonuses) =
  stats.attack + stats.defense + stats.agility
  + equipBonuses.attack + equipBonuses.defense + equipBonuses.agility
  + stats.level × 2
```

---

## 13. Codex

### Overview
In-game encyclopedia at `/games/pantheon-wars/codex`. Two-tier navigation: categories → entries → detail modal.

### Categories (10 total)
| ID | Label | Color | Data Source |
|----|-------|-------|-------------|
| lore | LORE | #9F7AEA | Static (Codex.jsx) |
| factions | FACTIONS | #F5C542 | Static |
| classes | CLASSES | #E07B5C | Static |
| alignments | ALIGNMENTS | #A78BFA | Static |
| professions | PROFESSIONS | #A8C97A | API: `?action=codex` |
| titans | TITANS | #DC2626 | API: `?action=codex` |
| loot | LOOT | #3B82F6 | Static |
| combat | COMBAT | #FBBF24 | Static |
| quests | QUESTS | #10B981 | Static |
| adventures | ADVENTURES | #06B6D4 | Static |

### Static Entries

**LORE (5 entries):** Kishar, The Unraveling, The Eternal Accord, Ermanôs The Betrayer, The Three Heritages.

**FACTIONS (3):** Olympians (bonus + color lore), Aesir, Annunaki.

**CLASSES (4):** Warden, Oracle, Slayer, Broker — each with bonuses list.

**ALIGNMENTS (2):** Pantheon Coalition, Mortal Compact — each with alignment bonus + PvP note.

**LOOT (5):** Common, Uncommon, Rare, Epic, Legendary — each with drops_from, drop_rate, note.

**COMBAT (6):** Combat Rounds, Attack & Defense, Crit/Block/Dodge, The Fatigued State, Agility, Victory & Recovery.

**QUESTS (1):** What Are Quests? (includes 3 tips).

**ADVENTURES (1):** What Are Adventures? (includes 3 tips).

### Dynamic Entries (from API)
- **PROFESSIONS:** All 8 rows from `pw_township_upgrades` — displays bonus_type, bonus_per_level, bonus_at_max, initial_cost, level_required.
- **TITANS:** All 8 rows from `pw_titans` — displays ability_name, ability_description, stats grid.

### Detail Modal
Portal to `document.body`. Shows: category label, entry title/subtitle, body text (paragraph-split), mechanics section (varies by category type). ESC key closes.

---

## 14. Pending Rewards

### Table: `pw_pending_rewards`
- Stores unclaimed adventure and titan rewards between sessions.
- `reward_type`: `'adventure'` or `'titan'`.
- `source_id`: adventure ID or titan event ID.
- `reward_payload`: Full JSONB reward (XP, drachma, items, potion, rarity, name, etc.).
- `acknowledged_at`: NULL until player views the reward notification.

### Written By
- **Adventures:** `checkAndCompleteAdventures` (inline, every authenticated request).
- **Titans:** `handleTitanClaim` (player-initiated after event completes).

### Consumed By
- Frontend polls for `acknowledged_at IS NULL` rewards.
- `AdventureRewardModal` shows the reward breakdown.
- Player dismisses → API call sets `acknowledged_at = NOW()`.

---

## 15. Live Chat (3 Channels)

### Channels
| Channel | `channel_type` | `channel_id` | Pusher Channel | Audience |
|---------|---------------|-------------|---------------|----------|
| General | `general` | NULL | `general` (public) | All players |
| Mod | `mod` | NULL | `private-mod` (auth required) | Moderators only |
| DM | `dm` | `'{thread_id}'` (string) | `private-user-{userId}` | Two-user thread |

### Message Schema
- Content: 1–500 characters.
- `is_system`: Boolean for system-generated messages (e.g., "X has been muted").
- `sender_username`: Denormalized — survives user deletion.
- Soft-delete: `deleted_at`, `deleted_by_name`, `deleted_by_type`.

### Rate Limiting
`checkChatRateLimit`: max 5 messages per 30 seconds per user.

### DM Thread Architecture
- `pw_chat_dm_threads`: canonical pair (`user_a_id < user_b_id`), UNIQUE.
- Initiated via `/w username` command in UI or by clicking a username.
- `pw_chat_dm_read_state`: per-user, per-thread `last_seen_id` for unread dot indicators.

### Read Tracking
| Channel | Tracking Table | Column |
|---------|---------------|--------|
| General | `pw_chat_user_state` | `last_seen_general_msg_id` |
| Mod | `pw_chat_user_state` | `last_seen_mod_msg_id` |
| DM | `pw_chat_dm_read_state` | `last_seen_id` per thread |

### Chat API Actions (all via `game.js`)
| Action | Description |
|--------|-------------|
| `chat_send` | Post to general channel; Pusher broadcast |
| `chat_fetch` | Fetch recent general messages (last N) |
| `chat_pusher_auth` | Authenticate Pusher private channels |
| `chat_dm_threads` | List DM thread list for current user |
| `chat_dm_fetch` | Fetch messages in a specific DM thread |
| `chat_dm_send` | Send a DM; Pusher broadcast to `private-user-{recipientId}` |
| `chat_state` | Get/update general read state |
| `chat_mod_send` | Post to mod channel (requires mod session) |
| `chat_mod_fetch` | Fetch mod channel messages |
| `chat_moderate` | Apply mute/timeout/ban/kick/delete_msg |
| `chat_lift_moderation` | Lift an active moderation action |
| `chat_list_moderations` | List active (non-expired, non-lifted) moderation actions |
| `chat_set_mod_badge` | Toggle `show_chat_badge` for authenticated moderator |

### Pusher Integration
- Singleton: `lib/pwPusher.js` → `getPusherServer()`.
- Config via env: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`.
- TLS enabled.

---

## 16. Moderator System

### Moderator Identity (Separate from Players)
- `pw_moderators` table: UUID PK, username, password_hash, is_active, show_chat_badge.
- Moderators are NOT in `pw_users`. Separate identity system.
- `show_chat_badge`: when true, `[MOD]` badge displayed next to moderator's username in chat.

### Moderator Invitation Flow
1. Existing admin creates invite token → stored in `pw_moderator_invites`.
2. Invite URL shared out-of-band.
3. Invitee registers with token → creates `pw_moderators` row.

### Moderator Auth
- Cookie: `fp_mod` (separate from player `pw_session`).
- Session stored in `pw_moderator_sessions`.
- Validated in `lib/modAuth.js` → `validateModeratorSession(req)`.
- `requireUserWithModCheck` in `pwAuth.js` loads both user session AND moderator session simultaneously — a player who is also a moderator has both `req.userId` and `req.modId` set.

### Moderation Actions
Stored in `pw_chat_moderations`:
| Action | Effect | Reversible? |
|--------|--------|-------------|
| `mute` | Player cannot send general messages for `duration_minutes` | Yes (lift) |
| `timeout` | Player muted globally for duration | Yes |
| `ban` | Player excluded from chat | Yes |
| `kick` | Immediate removal signal (UI-side) | No (instant) |
| `delete_msg` | Soft-deletes a specific message | No |

- `expires_at`: computed from `duration_minutes`.
- `lifted_at` + `lifted_by`: set when moderator lifts the action early.
- `channel_type`: NULL = global; specific channel = channel-scoped.

### Audit Log
`pw_moderator_actions` (BIGSERIAL) keeps records of all mod actions. `moderator_id` is `ON DELETE SET NULL` so audit survives mod account deletion.

### Admin Panel Extensions (In-Game)
Game admin panel can view and lift active moderations via `chat_list_moderations` / `chat_lift_moderation` API actions.

---

## 17. Auth & Account Recovery

### Player Authentication
| Property | Value |
|----------|-------|
| Cookie name | `pw_session` |
| Cookie flags | HttpOnly, Secure, SameSite=Strict |
| Session duration | 7 days |
| Session storage | `pw_user_sessions` table |
| Password hashing | bcrypt, 12 rounds |
| Library | `lib/pwAuth.js` |

**Key functions in `pwAuth.js`:**
- `hashPassword(password)` → bcrypt hash
- `verifyPassword(password, hash)` → boolean
- `createUserSession(userId, res)` → inserts row, sets cookie
- `validateUserSession(req)` → returns userId or null
- `revokeUserSession(sessionId)` → deletes row
- `requireUser(handler)` → middleware; 401 if unauthenticated
- `requireUserWithModCheck(handler)` → middleware; also resolves mod session; sets `req.modId`, `req.modUsername`, `req.modShowBadge`

### Account Recovery Flow
1. Player submits security question answer on `/forgot-password`.
2. If answer matches hashed `security_answer_hash`: generate token → store in `pw_password_reset_tokens`.
3. Token URL sent (or displayed — verify actual delivery mechanism in `auth.js`).
4. Player visits `/reset-password` with token → sets new password, marks token `used_at`.

### Security Questions
Set at signup. Question stored as plaintext; answer stored as bcrypt hash.

### Moderator Auth
See Section 16. Handled by `lib/modAuth.js` (separate from player auth).

### Site Admin Auth
- Cookie: `fp_admin`.
- Session in `admin_sessions` table.
- Password hash: `ADMIN_PASSWORD_HASH` env var.
- Used for freshprints.dev admin dashboard (`/admin` route), not for game moderation.

---

## 18. Admin System

### Two Separate Admin Contexts

**1. Site Admin (freshprints.dev)**
- Route: `/admin`
- Auth: `fp_admin` cookie, `ADMIN_PASSWORD_HASH` env var.
- API: `POST /api/auth/admin` (login), `GET /api/admin/overview` (stats).
- Dashboard: 4 stat cards, 30-day area chart, top paths, recent events.
- Unrelated to game content.

**2. Game Admin (In-Game Titan Trigger)**
- `handleTitanAdminTrigger` in `game.js`: forces the next queued titan event to start immediately.
- Auth: either CRON_SECRET bearer token OR admin session (site admin cookie also accepted via `requireAdmin`).
- Accessible from game UI by players who have admin credentials — mechanism is in the Titan page's admin-only controls.

### Moderator Admin (See Section 16)
Separate — moderators have their own panel inside the game chat system.

---

## 19. UI / Frontend Architecture

### Page Structure
```
src/pages/games/pantheon-wars/
  Dashboard.jsx         — Main hub: resources, nav buttons, status
  Quests.jsx            — Quest board: rotated list, start/claim flow
  Adventures.jsx        — Adventure board: start, active timer, claim
  Inventory.jsx         — Slot grid, filter by slot/rarity, equip/sell
  Shop.jsx              — Drachma tab + Glory tab; rotated items
  Temples.jsx           — Buy/upgrade temples; income display
  PvP.jsx               — Target list, attack, combat playback
  PvPLog.jsx            — Historical combat log
  Profile.jsx           — Stat allocation (Attack/Defense/Agility)
  Leaderboard.jsx       — Rankings by power/glory/level; faction filter
  Titan.jsx             — Active titan event; join, history, claim
  Township.jsx          — 8 professions; establish, upgrade, craft
  Codex.jsx             — Encyclopedia (10 categories; static + API-fed)
  Signup.jsx            — Multi-step: faction → class → alignment → account
  Login.jsx             — Username + password
  ForgotPassword.jsx    — Security question flow
  ResetPassword.jsx     — New password via token
  ComingSoon.jsx        — Generic placeholder (now unused; all pages built)
```

### Shell + Context
```
src/components/games/pantheon-wars/
  PWPageShell.jsx         — Standard page wrapper: nav bar, background, padding
  PWBackButton.jsx        — Back to dashboard nav button
  PWHubLink.jsx           — Link back to freshprints.dev hub
  PWTitleCardSequence.jsx — Cinematic title card shown on first visit
  PWBackground.jsx        — Animated background (variant per page)
  AdventureRewardModal.jsx — Popup for returned adventure rewards
  PWAudioControls.jsx     — SFX/Music/Ambience volume controls
  ChatContext.jsx         — Chat state provider (messages, DMs, channel selection)
  ChatBar.jsx             — Sticky bottom chat bar: general ↔ DM, /w command
```

### Route Tree
All routes under `PantheonWarsShell` (provides `PantheonWarsContext`):
```
/games/pantheon-wars             → Dashboard
/games/pantheon-wars/quests      → Quests
/games/pantheon-wars/adventures  → Adventures
/games/pantheon-wars/inventory   → Inventory
/games/pantheon-wars/shop        → Shop
/games/pantheon-wars/temples     → Temples
/games/pantheon-wars/pvp         → PvP (target list)
/games/pantheon-wars/pvp/log     → PvPLog
/games/pantheon-wars/profile     → Profile + stat allocation
/games/pantheon-wars/leaderboard → Leaderboard
/games/pantheon-wars/titan       → Titan events
/games/pantheon-wars/township    → Township + Craftsmanship
/games/pantheon-wars/codex       → Codex
/games/pantheon-wars/signup      → Signup
/games/pantheon-wars/login       → Login
/games/pantheon-wars/forgot-password  → ForgotPassword
/games/pantheon-wars/reset-password   → ResetPassword
```

### Request Flow (game.js)
Every authenticated game.js handler runs this preamble:
1. `validateUserSession` → get userId (401 if invalid).
2. `checkAndCompleteAdventures(sql, userId)` — resolve expired adventures.
3. `checkAndCompleteUpgrades(sql, userId)` — resolve completed township upgrades.
4. `checkAndCompleteCrafts(sql, userId)` — resolve completed craftsmanship cycles.
5. `processExpiredTitanEvents(sql)` — resolve global titan state (advisory lock).
6. Route to specific handler via `?action=` param.

### Rotation Seeds (Deterministic PRNG)
All rotations use Mulberry32 PRNG seeded by UTC time buckets:
| Content | Bucket | Seed Formula |
|---------|--------|-------------|
| Quests | 3h | `floor(Date.now() / 10800000)` |
| Adventures | 6h | `floor(Date.now() / 21600000)` |
| Drachma shop | 24h (UTC day) | `floor(Date.now() / 86400000)` |
| Glory shop | 24h (UTC day) | `floor(Date.now() / 86400000)` |

**`pickRotatedItems(allItems, seed, count)`:** Mulberry32-seeded Fisher-Yates shuffle, take first `count` items.

### Sound System
33 audio files in `public/sounds/pantheon_wars/`. Three channels:
- **SFX:** combat, UI interactions.
- **Music:** ambient background music.
- **Ambience:** environmental loops.

File names: combatLose, levelUp, combatWin, questComplete, intro, alignmentChoose, temple_upgrade, ambience, sword_hit, attack_initiate, sword_crit, shield_block, dodge, township_establish, upgrade_complete, temple_buy, titan_horn, titan_appears, titan_defeated, unequip_item, equip_item, loot_drop, rare_loot, purchase, sell_item, insufficient_funds, toast_notification, error, adventure_depart, adventure_return, quest_accept, stat_allocate.

---

## 20. Infrastructure

### Vercel Configuration
- **Plan:** Hobby.
- **Function limit:** 12. Currently 9 used (3 remaining).
- **Cron limit:** 2. Both used.
- **Default timeout:** 300s (Vercel Hobby default now 300s on all plans).

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `POSTGRES_DATABASE_URL` | Neon Postgres connection (auto-set by Neon integration) |
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_KEY` | Pusher publishable key |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | Pusher cluster (e.g., `us2`) |
| `CRON_SECRET` | Bearer token for cron endpoint auth |
| `ADMIN_PASSWORD_HASH` | Site admin bcrypt hash |
| `RESEND_API_KEY` | Email delivery (contact form, not game) |
| `CONTACT_TO_EMAIL` | Contact form recipient |
| `CONTACT_FROM_EMAIL` | Contact form sender |

### Database
- **Provider:** Neon (serverless Postgres).
- **Driver:** `@neondatabase/serverless` — HTTP-based, cold-start friendly.
- **Schema initialization:** `db/schema.sql` (run via `npm run db:init`).
- **Migrations:** Manual — run via Neon SQL Editor console. No migration runner. Applied in rough chronological order; see `db/migrations/` directory.

### Migration History (in rough application order)
```
db/schema.sql                          — base schema + township seed
db/seed-pantheon-wars.sql              — 40 quests, 50 items, quest loot, 5 temples
db/migrations/health-potions.sql       — consumable slot column additions
db/migrations/health-potions-seed.sql  — 5 health potions seeded
db/migrations/quests-pantheon-lore.sql — lore narrative on quests
db/migrations/regen-fix.sql            — regen system fix (separate base timestamps)
db/migrations/round-combat-system.sql  — agility_bonus, crit/block/dodge_chance on pw_items
db/migrations/items-combat-overhaul.sql — set all 50 item stats + Tablet of Reinvention
db/migrations/class-faction-catchup.sql — per-level class/faction stat bonuses
db/migrations/scroll-of-reinvention.sql — Scroll of Reinvention item + give to existing players
db/migrations/adventures.sql           — pw_adventures + pw_player_adventures + 12 seeds
db/migrations/phase14-potions.sql      — health potions → pct-based; energy potion tier system
db/migrations/phase14-temples.sql      — temple cap 10→25; legendary glory prices set
db/migrations/energy-potion-limits.sql — daily purchase/use limits for energy potions
db/migrations/titan-event.sql          — pw_titans, pw_titan_events, pw_titan_participants + 8 titans
db/migrations/account-recovery-moderator.sql — security_question, pw_password_reset_tokens, pw_moderators, pw_mod_invites, pw_mod_sessions, pw_mod_actions
db/migrations/township.sql             — township upgrade table (if not in schema.sql)
db/migrations/loot-overhaul.sql        — quest loot cleanup + inventory wipe + glory price ×3
db/migrations/pending-rewards.sql      — pw_pending_rewards table
db/migrations/glory-price-2x.sql       — legendary glory prices ×2 (post Phase D ×3)
db/migrations/titan-combat-parity.sql  — titan combat balance fix
db/migrations/titan-energy-tracking.sql — energy_drained column on pw_titan_participants
db/migrations/craftsmanship-potion-overhaul.sql — pw_craftsmanship_cycles + craftsmanship township + Divine Surge removal + daily limit columns
db/migrations/live-chat.sql            — pw_chat_messages, pw_chat_dm_threads, pw_chat_moderations, pw_chat_user_state
db/migrations/dm-read-state.sql        — pw_chat_dm_read_state
db/migrations/live-chat-mod.sql        — is_system on pw_chat_messages; show_chat_badge on pw_moderators
db/migrations/one-temple-per-type.sql  — UNIQUE constraint: one temple of each type per player
```

### Cron Jobs
| Job | File | Schedule | Auth | Effect |
|-----|------|----------|------|--------|
| Titan cycle | `api/games/pantheon-wars/titan-cron.js` | 13:00 UTC + 01:00 UTC | `CRON_SECRET` bearer token (fallback: admin session) | `processExpiredTitanEvents` → `scheduleNextTitanEvent` |

### Shared Libraries
| File | Purpose |
|------|---------|
| `lib/db.js` | Neon SQL client singleton |
| `lib/auth.js` | Site admin session helpers |
| `lib/pwAuth.js` | Player session: create, validate, revoke, require middlewares |
| `lib/modAuth.js` | Moderator session: validate (imported by pwAuth.js) |
| `lib/pwHelpers.js` | All game logic (~1459 lines): regen, combat, titan, craft, township, XP/drachma compute, PRNG rotations |
| `lib/pwPusher.js` | Pusher singleton via `getPusherServer()` |

---

*End of recon document. All data sourced from actual code, migrations, and seed files as of 2026-05-21.*

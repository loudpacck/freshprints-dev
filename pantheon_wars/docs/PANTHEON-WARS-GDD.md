# Pantheon Wars — Game Design Document

> **Project**: freshprints.dev idle browser game
> **Genre**: Idle / incremental RPG (Mafia Wars clone)
> **Stack**: React + Vite + Tailwind / Vercel Serverless Functions / Vercel Postgres (Neon)
> **Repo**: github.com/loudpacck/freshprints-dev
> **Location in repo**: `pantheon_wars/docs/PANTHEON-WARS-GDD.md`
> **Last updated**: 2026-05-13

---

## 1. Concept

Pantheon Wars is a text-and-UI-driven idle RPG played in the browser at freshprints.dev/games/pantheon-wars. It is a direct mechanical clone of Facebook-era Mafia Wars, reskinned with the Pantheon universe — a mythological power struggle between divine factions (Greek, Norse, Mesopotamian) and two warring ideologies (the Pantheon Coalition and the Mortal Compact).

Players create an account, pick a faction and class, complete quests to earn resources, buy equipment, level up, and attack other players. All progress is server-side. There is no real-time gameplay — every action is a discrete API call with server-calculated outcomes.

This game lives alongside other future games on freshprints.dev. All game routes are namespaced under `/games/pantheon-wars/*`, all API endpoints under `/api/games/pantheon-wars/*`, and all database tables prefixed with `pw_` to avoid collisions.

---

## 2. Core Loop

```
1. Spend Energy → Complete Quests → Earn XP, Drachma, Loot
2. Level Up → Unlock harder quests, stat points, equipment tiers
3. Spend Drachma → Buy equipment, upgrade temples
4. Attack other players → Earn Drachma + Glory (PvP currency)
5. Temples generate passive Drachma over time
6. Energy regenerates over time (1 per 5 minutes, server-calculated)
7. Repeat
```

---

## 3. Player Identity

### 3.1 Factions

Players choose one faction at signup. Faction is permanent and determines quest flavor text, available faction-exclusive equipment, and PvP allegiance brackets.

| Faction | Theme | Stat Bonus |
|---|---|---|
| **Olympians** | Greek mythology | +5% XP from quests |
| **Aesir** | Norse mythology | +5% Attack power |
| **Annunaki** | Mesopotamian mythology | +5% Drachma from quests |

### 3.2 Classes

Players choose one class at signup. Class determines stat growth curve and unlocks class-specific abilities at certain levels.

| Class | Role | Primary Stat |
|---|---|---|
| **Warden** | Tank / defender | Defense |
| **Oracle** | Support / utility | Energy max + regen |
| **Slayer** | Offense / DPS | Attack |
| **Broker** | Economy / income | Drachma multiplier |

### 3.3 Alignment

At level 10, players choose an alignment that unlocks a second quest chain and determines PvP matchmaking pools:

- **Pantheon Coalition** — divine loyalists, order-aligned
- **Mortal Compact** — mortal-sovereignty rebels, chaos-aligned

Players can only attack players of the opposing alignment (or unaligned players below level 10). Same-alignment players cannot attack each other.

---

## 4. Resources

| Resource | How earned | What it's spent on |
|---|---|---|
| **Energy** | Regenerates 1 per 5 min (max scales with level + Oracle bonus). Capped. | Quests cost energy |
| **Health** | Regenerates 1 per 3 min (max scales with level). Capped. | Lost when attacked. At 0 HP you can't attack others but CAN still do quests. |
| **Drachma** (₯) | Quests, temples (passive), PvP wins, selling loot | Equipment, temples, healing items |
| **XP** | Quests, PvP wins | Levels (automatic thresholds) |
| **Glory** | PvP wins only | Leaderboard ranking, prestige shop items |
| **Stat Points** | 5 per level up | Distributed manually into Attack, Defense, Energy Max, Health Max |

### 4.1 Energy & Health Regen (Server-Side Calculation)

There are NO background jobs or cron. Regen is calculated on every API request:

```
elapsed = now() - player.last_updated
energy_gained = floor(elapsed_seconds / 300)  // 1 per 5 min
health_gained = floor(elapsed_seconds / 180)  // 1 per 3 min
player.energy = min(player.energy + energy_gained, player.energy_max)
player.health = min(player.health + health_gained, player.health_max)
player.last_updated = now()
```

This runs at the top of every game API handler before processing the actual request.

---

## 5. Quests (PvE)

Quests are the primary energy sink. They are organized into tiers unlocked by level.

### 5.1 Structure

Each quest has:
- **Name** and **flavor text** (themed to faction)
- **Energy cost** (3–30 depending on tier)
- **XP reward** (scales with cost)
- **Drachma reward** (base + random bonus range)
- **Loot table** (% chance to drop equipment)
- **Mastery track** (complete a quest N times to master it → permanent stat bonus)
- **Required level** to unlock

### 5.2 Tiers

| Tier | Level | Theme | Energy Range | Example Quests |
|---|---|---|---|---|
| 1 | 1–9 | Mortal errands | 3–5 | Collect tribute, Scout the borderlands, Deliver divine message |
| 2 | 10–24 | Faction warfare | 6–10 | Raid a rival shrine, Escort a prophet, Sabotage enemy supply lines |
| 3 | 25–49 | Divine conflict | 11–18 | Siege a titan's fortress, Steal the golden fleece, Infiltrate Valhalla |
| 4 | 50–74 | Mythic campaigns | 19–25 | Slay a world serpent, Collapse a dimensional rift, Forge a godkiller blade |
| 5 | 75–100 | Endgame / Ascension | 25–30 | Dethrone a pantheon elder, Rewrite the divine code, Breach the mortal veil |

### 5.3 Mastery

Each quest has a mastery counter. Every completion increments it. Mastery milestones at 25%, 50%, 75%, 100% (of a set target per quest) award a small permanent stat boost and a bronze/silver/gold/diamond badge.

### 5.4 Quest Outcome Calculation

Quests always succeed (like Mafia Wars). The outcome is:
```
base_xp = quest.xp_reward
base_drachma = quest.drachma_base + random(0, quest.drachma_range)
faction_bonus = 1.05 if faction matches   // Annunaki for drachma, Olympians for XP
class_bonus = broker_multiplier if class is Broker

final_xp = floor(base_xp * faction_bonus)
final_drachma = floor(base_drachma * faction_bonus * class_bonus)

loot_roll = random(0, 100)
if loot_roll <= quest.loot_chance:
    award random item from quest.loot_table
```

---

## 6. Equipment & Inventory

### 6.1 Equipment Slots

Players have fixed gear slots. Each slot holds one item. Equipped items add to Attack and Defense stats.

| Slot | Example Items |
|---|---|
| Weapon | Sword of Ares, Mjolnir Shard, Blade of Marduk |
| Armor | Aegis Breastplate, Berserker Furs, Ishtar's Veil |
| Artifact | Oracle's Eye, Runic Compass, Tablet of Destinies |
| Mount | Pegasus, Sleipnir Pup, Lamassu |
| Companion | Minor deity, Einherjar, Temple Guardian |

### 6.2 Item Properties

Each item has:
- `name`, `description`, `slot`
- `attack_bonus`, `defense_bonus`
- `rarity`: Common, Uncommon, Rare, Epic, Legendary
- `level_required`
- `faction_exclusive` (nullable — some items are faction-locked)
- `buy_price` (if purchasable from shop), `sell_price`

### 6.3 Shops

- **Drachma Shop** — basic and mid-tier gear, healing items
- **Glory Shop** — prestige / cosmetic items, top-tier gear (PvP currency)
- Shops are just static item catalogs with level gating. No NPC logic.

---

## 7. Temples (Passive Income)

Temples are the equivalent of Mafia Wars "properties." They generate passive Drachma over time, calculated on every API request (same pattern as energy regen).

| Temple | Cost | Income per hour | Level Required |
|---|---|---|---|
| Roadside Shrine | 500₯ | 10₯/hr | 1 |
| Minor Temple | 2,500₯ | 40₯/hr | 10 |
| Grand Temple | 15,000₯ | 200₯/hr | 25 |
| Divine Fortress | 100,000₯ | 1,000₯/hr | 50 |
| Pantheon Citadel | 500,000₯ | 4,000₯/hr | 75 |

Each temple can be upgraded 10 times. Each upgrade costs 50% of base price and adds 25% more income. Income is calculated:

```
for each temple:
    hours_elapsed = (now() - player.last_updated) / 3600
    income += temple.income_per_hour * (1 + 0.25 * temple.upgrade_level) * hours_elapsed
```

---

## 8. PvP Combat

### 8.1 Rules

- Players can attack any player of the opposing alignment (or any unaligned player under level 10)
- Same-alignment players cannot attack each other
- Attacking costs 1 Health (attacker) — NOT energy
- Being attacked reduces the defender's Health by damage dealt
- Attacker and defender must both have > 0 Health to initiate
- There is a 5-minute cooldown between attacks on the SAME target
- No cooldown for attacking different targets

### 8.2 Combat Formula

```
attacker_power = player.attack + equipment_attack_total + random(0, player.level)
defender_power = target.defense + equipment_defense_total + random(0, target.level)

aesir_bonus: if attacker is Aesir, attacker_power *= 1.05
slayer_bonus: if attacker class is Slayer, attacker_power *= 1.10

if attacker_power > defender_power:
    WIN → attacker earns:
        xp: 10 + (target.level * 2)
        drachma: random(target.level * 5, target.level * 15)
        glory: 1 + floor(target.level / 10)
    defender loses:
        health: max(1, floor((attacker_power - defender_power) / 10))
        drachma: same amount attacker gained (stolen)
else:
    LOSS → attacker earns nothing
    attacker loses 1 extra health
    defender earns 1 glory (successfully defended)
```

### 8.3 Combat Log

Every attack (win or loss) is recorded in the `pw_combat_log` table with:
- attacker_id, defender_id, timestamp
- attacker_power_roll, defender_power_roll
- result (win/loss)
- xp_earned, drachma_transferred, glory_earned
- health_lost (for both sides)

Players can view their last 50 combat entries (attacks they made + attacks against them).

---

## 9. Leveling

XP thresholds follow a quadratic curve:

```
xp_to_next_level = 100 * (current_level ^ 1.5)
```

| Level | Total XP Needed |
|---|---|
| 1→2 | 100 |
| 5→6 | 1,118 |
| 10→11 | 3,162 |
| 25→26 | 12,500 |
| 50→51 | 35,355 |
| 100 | ~100,000 |

On level up:
- Energy and Health fully restore
- Player receives 5 stat points to distribute
- New quests/equipment/temples may unlock
- A level-up notification appears on next login

Max level: 100 (soft cap — XP still accrues for leaderboard purposes).

---

## 10. Leaderboards

Global leaderboards ranked by:

1. **Level** (primary)
2. **Glory** (PvP ranking)
3. **Total Drachma earned** (lifetime, not current balance)
4. **Quest mastery** (total mastery points across all quests)

Leaderboards are per-faction and global. Top 100 displayed. Updated on every relevant API call (no batch job needed — just query with `ORDER BY` and `LIMIT`).

---

## 11. Database Schema

All tables live in the existing Vercel Postgres instance alongside `visitors`, `sessions`, `events`, and `admin_sessions`. All game tables are prefixed with `pw_` to avoid collisions with other future games.

```sql
-- User accounts (game players)
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

-- Core player stats (1:1 with pw_users)
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

-- Equipment catalog (seeded, not user-generated)
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

-- Player inventory (many items per player)
CREATE TABLE pw_inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES pw_items(id),
    equipped BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ DEFAULT NOW()
);
-- NOTE: "One equipped per slot" is enforced in application logic, NOT via database constraint.
-- Before equipping, query for any currently-equipped item in that slot and unequip it first.

-- Quest catalog (seeded)
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

-- Quest loot tables (which items can drop from which quests)
CREATE TABLE pw_quest_loot (
    quest_id INTEGER REFERENCES pw_quests(id),
    item_id INTEGER REFERENCES pw_items(id),
    drop_weight INTEGER DEFAULT 1,
    PRIMARY KEY (quest_id, item_id)
);

-- Player quest progress / mastery tracking
CREATE TABLE pw_quest_progress (
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    quest_id INTEGER REFERENCES pw_quests(id),
    completions INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, quest_id)
);

-- Player temples (owned properties)
CREATE TABLE pw_player_temples (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    temple_type VARCHAR(50) NOT NULL,
    upgrade_level INTEGER DEFAULT 0 CHECK (upgrade_level BETWEEN 0 AND 10),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temple catalog (seeded)
CREATE TABLE pw_temples (
    type VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    base_cost INTEGER NOT NULL,
    income_per_hour INTEGER NOT NULL,
    level_required INTEGER DEFAULT 1
);

-- Combat log
CREATE TABLE pw_combat_log (
    id SERIAL PRIMARY KEY,
    attacker_id UUID REFERENCES pw_users(id) ON DELETE SET NULL,
    defender_id UUID REFERENCES pw_users(id) ON DELETE SET NULL,
    attacker_power INTEGER NOT NULL,
    defender_power INTEGER NOT NULL,
    result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'loss')),
    xp_earned INTEGER DEFAULT 0,
    drachma_transferred INTEGER DEFAULT 0,
    glory_earned INTEGER DEFAULT 0,
    attacker_health_lost INTEGER DEFAULT 0,
    defender_health_lost INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (game auth, mirrors admin_sessions pattern)
CREATE TABLE pw_user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES pw_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX idx_pw_combat_log_attacker ON pw_combat_log(attacker_id, created_at DESC);
CREATE INDEX idx_pw_combat_log_defender ON pw_combat_log(defender_id, created_at DESC);
CREATE INDEX idx_pw_inventory_user ON pw_inventory(user_id);
CREATE INDEX idx_pw_player_temples_user ON pw_player_temples(user_id);
CREATE INDEX idx_pw_quest_progress_user ON pw_quest_progress(user_id);
CREATE INDEX idx_pw_user_sessions_user ON pw_user_sessions(user_id);
CREATE INDEX idx_pw_users_level ON pw_player_stats(level DESC);
CREATE INDEX idx_pw_users_glory ON pw_player_stats(glory DESC);
```

---

## 12. API Endpoints

All endpoints go in `/api/games/pantheon-wars/`. Every game endpoint except signup/login must validate the user session (mirror the `requireAdmin` pattern from `lib/auth.js`). Every game endpoint must run the regen calculation (energy, health, temple income) before processing.

### 12.1 Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/games/pantheon-wars/signup` | Create account. Body: `{ username, email, password, faction, class }`. Hash password with bcrypt (12 rounds). Create pw_users + pw_player_stats rows. Set session cookie. |
| POST | `/api/games/pantheon-wars/login` | Body: `{ email, password }`. Verify bcrypt hash. Create session. Set cookie. |
| POST | `/api/games/pantheon-wars/logout` | Clear session cookie, delete from pw_user_sessions. |
| GET | `/api/games/pantheon-wars/me` | Return current user profile + stats + equipped items. Runs regen first. |

### 12.2 Quests

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games/pantheon-wars/quests` | Return all quests the player's level qualifies for, grouped by tier, with mastery progress. |
| POST | `/api/games/pantheon-wars/quests/complete` | Body: `{ quest_id }`. Deduct energy, award XP + Drachma + possible loot. Increment mastery. Check level-up. |

### 12.3 Inventory & Equipment

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games/pantheon-wars/inventory` | Return all items owned by player with equipped status. |
| POST | `/api/games/pantheon-wars/equip` | Body: `{ inventory_id }`. Equip item, unequip current item in that slot. |
| POST | `/api/games/pantheon-wars/unequip` | Body: `{ inventory_id }`. Unequip item. |
| POST | `/api/games/pantheon-wars/sell` | Body: `{ inventory_id }`. Sell item for sell_price. Remove from inventory. |

### 12.4 Shop

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games/pantheon-wars/shop` | Return all buyable items player qualifies for (level + faction). Separate drachma and glory shops. |
| POST | `/api/games/pantheon-wars/shop/buy` | Body: `{ item_id, currency: 'drachma' | 'glory' }`. Deduct cost, add to inventory. |

### 12.5 Temples

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games/pantheon-wars/temples` | Return temple catalog + player's owned temples with upgrade levels and income rates. |
| POST | `/api/games/pantheon-wars/temples/buy` | Body: `{ temple_type }`. Deduct cost, create pw_player_temples row. |
| POST | `/api/games/pantheon-wars/temples/upgrade` | Body: `{ player_temple_id }`. Deduct upgrade cost, increment upgrade_level. |

### 12.6 PvP

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games/pantheon-wars/pvp/targets` | Return list of attackable players (opposite alignment or unaligned, within ±10 levels, not on cooldown). Paginated. |
| POST | `/api/games/pantheon-wars/pvp/attack` | Body: `{ target_user_id }`. Run combat formula. Record in pw_combat_log. Update stats for both players. |
| GET | `/api/games/pantheon-wars/pvp/log` | Return last 50 combat log entries involving the player. |

### 12.7 Stats & Leveling

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/games/pantheon-wars/stats/allocate` | Body: `{ attack, defense, energy_max, health_max }`. Sum must equal available stat_points. Apply to pw_player_stats. |

### 12.8 Leaderboards

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/games/pantheon-wars/leaderboard` | Query params: `type=level|glory|drachma|mastery`, `faction=all|olympians|aesir|annunaki`. Return top 100. |

### 12.9 Alignment

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/games/pantheon-wars/alignment/choose` | Body: `{ alignment: 'coalition' | 'compact' }`. Only works if player is level >= 10 and alignment is currently NULL. Sets permanently. |

---

## 13. Frontend Routes & Pages

All game UI lives under `/games/pantheon-wars/*` using React Router. Tailwind for layout, Framer Motion for transitions.

| Route | Page | Description |
|---|---|---|
| `/games/pantheon-wars` | Dashboard | Player stats overview, energy/health bars, drachma balance, quick actions, level-up notification. This is the hub. |
| `/games/pantheon-wars/quests` | Quest Board | Quests grouped by tier. Click to complete. Mastery progress bars. |
| `/games/pantheon-wars/inventory` | Inventory | All owned items. Equip/unequip/sell buttons. Equipped items highlighted. |
| `/games/pantheon-wars/shop` | Shop | Two tabs: Drachma Shop, Glory Shop. Items with level requirements grayed out. |
| `/games/pantheon-wars/temples` | Temples | Owned temples with income rates. Buy new temples. Upgrade existing. |
| `/games/pantheon-wars/pvp` | Arena | Target list. Attack button. Combat results modal. |
| `/games/pantheon-wars/pvp/log` | Combat Log | Scrollable log of attacks made/received. |
| `/games/pantheon-wars/leaderboard` | Leaderboard | Tabs for level/glory/drachma/mastery. Faction filter. |
| `/games/pantheon-wars/profile` | Profile | View own profile. Stat allocation. Alignment choice (once). |
| `/games/pantheon-wars/signup` | Signup | Username, email, password, faction picker, class picker. |
| `/games/pantheon-wars/login` | Login | Email + password. |

### 13.1 UI Guidelines

- Dark theme, mythological aesthetic — consistent with the Pantheon lore
- Faction colors: Olympians = gold/white, Aesir = ice-blue/silver, Annunaki = deep red/bronze
- Energy and Health displayed as animated bars (Framer Motion)
- Drachma displayed with ₯ symbol
- Toast notifications for quest completions, level-ups, loot drops, attack results
- Mobile-first responsive — many players will be on phones
- All data fetched via `fetch()` to `/api/games/pantheon-wars/*` endpoints
- Loading skeletons while API calls are in-flight
- Session stored as httpOnly cookie (same pattern as admin auth)

---

## 14. Seed Data

The game needs seeded data for items, quests, quest loot tables, and temples. This should be a SQL seed file or a seed script that runs after `db:init`.

Seed data volumes:
- ~50 items across 5 slots, 5 rarities, 3 factions
- ~40 quests across 5 tiers
- ~30 quest-loot mappings
- 5 temple types (already defined in Section 7)

Seed data should be created as `db/seed-pantheon-wars.sql` and added to the init pipeline.

---

## 15. Shared Utilities

Create `lib/pwAuth.js` — mirrors `lib/auth.js` but operates on `pw_users` and `pw_user_sessions` tables:
- `hashPassword(password)` — bcrypt 12 rounds
- `verifyPassword(password, hash)` — bcrypt compare
- `createUserSession(userId, res)` — insert into pw_user_sessions, set httpOnly cookie (`pw_session`)
- `validateUserSession(req)` — read cookie, check pw_user_sessions, return user_id or null
- `requireUser(handler)` — middleware wrapper that 401s if no valid session
- `revokeUserSession(sessionId)` — delete from pw_user_sessions

Create `lib/pwHelpers.js`:
- `regenPlayer(playerStats)` — calculates energy, health, temple income based on elapsed time, returns updated stats object
- `calculateCombat(attacker, defender)` — runs the combat formula, returns result object
- `checkLevelUp(playerStats)` — checks if XP exceeds threshold, returns new level and stat points if so
- `getEquipmentBonuses(userId)` — queries equipped items, returns total attack/defense bonuses

---

## 16. Build Phases

### Phase 1 — Auth & Foundation
- [ ] Create `pw_users`, `pw_user_sessions`, and `pw_player_stats` tables
- [ ] Create `lib/pwAuth.js`
- [ ] Build `/api/games/pantheon-wars/signup`, `/api/games/pantheon-wars/login`, `/api/games/pantheon-wars/logout`, `/api/games/pantheon-wars/me`
- [ ] Build `/games/pantheon-wars/signup` and `/games/pantheon-wars/login` pages
- [ ] Build `/games/pantheon-wars` dashboard (shows stats, placeholder for other sections)
- [ ] Verify session cookie flow works end-to-end via Vercel deploy

### Phase 2 — Quests
- [ ] Create `pw_quests`, `pw_quest_progress` tables
- [ ] Write seed data for quests (all 5 tiers)
- [ ] Create `lib/pwHelpers.js` with `regenPlayer` and `checkLevelUp`
- [ ] Build `/api/games/pantheon-wars/quests` and `/api/games/pantheon-wars/quests/complete`
- [ ] Build `/games/pantheon-wars/quests` page
- [ ] Energy deduction, XP/Drachma rewards, level-up logic

### Phase 3 — Equipment & Shop
- [ ] Create `pw_items`, `pw_inventory`, `pw_quest_loot` tables
- [ ] Write seed data for items
- [ ] Build `/api/games/pantheon-wars/inventory`, `/api/games/pantheon-wars/equip`, `/api/games/pantheon-wars/unequip`, `/api/games/pantheon-wars/sell`
- [ ] Build `/api/games/pantheon-wars/shop`, `/api/games/pantheon-wars/shop/buy`
- [ ] Build `/games/pantheon-wars/inventory` and `/games/pantheon-wars/shop` pages
- [ ] Hook loot drops into quest completion

### Phase 4 — Temples
- [ ] Create `pw_temples`, `pw_player_temples` tables
- [ ] Write seed data for temple catalog
- [ ] Add temple income calculation to `regenPlayer`
- [ ] Build `/api/games/pantheon-wars/temples`, `/api/games/pantheon-wars/temples/buy`, `/api/games/pantheon-wars/temples/upgrade`
- [ ] Build `/games/pantheon-wars/temples` page

### Phase 5 — PvP
- [ ] Create `pw_combat_log` table
- [ ] Build `calculateCombat` in pwHelpers
- [ ] Build `/api/games/pantheon-wars/pvp/targets`, `/api/games/pantheon-wars/pvp/attack`, `/api/games/pantheon-wars/pvp/log`
- [ ] Build `/games/pantheon-wars/pvp` and `/games/pantheon-wars/pvp/log` pages
- [ ] Add alignment choice logic at level 10

### Phase 6 — Leaderboards & Polish
- [ ] Build `/api/games/pantheon-wars/leaderboard`
- [ ] Build `/games/pantheon-wars/leaderboard` page
- [ ] Build `/api/games/pantheon-wars/stats/allocate` and stat allocation UI on profile
- [ ] Add toast notifications system
- [ ] Add loading skeletons
- [ ] Mobile responsiveness pass
- [ ] Final balancing pass on numbers (XP curve, drachma economy, combat formula)

---

## 17. Technical Notes for Claude Code

1. **Local dev**: Use `vercel dev`, NOT `npm run dev`. Vite's dev server does not serve `/api/` routes.
2. **Database driver**: Use `@neondatabase/serverless`. Connection string is `process.env.POSTGRES_DATABASE_URL`.
3. **Auth cookie name**: Use `pw_session` (distinct from the admin `session` cookie).
4. **No TypeScript**: The entire project is plain JSX. Do not introduce TypeScript.
5. **No Redux/Zustand**: Use React Context for game state (current user, stats). Create a `PantheonWarsProvider` context.
6. **Session validation**: Every `/api/games/pantheon-wars/*` endpoint (except signup/login) must call `requireUser()` first.
7. **Regen on every request**: Every endpoint that reads player stats must call `regenPlayer()` first and save the updated stats before proceeding.
8. **Equipped item constraint**: Enforce "one equipped per slot" in application logic, not via database constraint (the functional index is unreliable). Before equipping, query for any currently-equipped item in that slot and unequip it.
9. **Vercel function size**: Each API file should be self-contained. Shared code goes in `lib/`. Don't create barrel exports that bundle everything.
10. **No cron, no websockets, no real-time**: Everything is request/response. Idle mechanics are calculated on read.
11. **Seed data**: Keep seed SQL separate from schema SQL. Schema in `db/schema.sql`, seeds in `db/seed-pantheon-wars.sql`.
12. **Environment variables needed**: Only `POSTGRES_DATABASE_URL` (already exists). No new env vars required for the game itself.
13. **Testing**: After each phase, deploy to Vercel preview branch and test. The CI is GitHub push → Vercel auto-deploy (~90 seconds).
14. **Table prefix**: All game tables use the `pw_` prefix. Do not create tables without this prefix.
15. **API path**: All game API files go in `/api/games/pantheon-wars/`. Do not use `/api/game/`.
16. **Frontend path**: All game React routes go under `/games/pantheon-wars/*`. Do not use `/game/`.
17. **Utility files**: Auth helpers in `lib/pwAuth.js`, game logic helpers in `lib/pwHelpers.js`. Do not use `gameAuth` or `gameHelpers` naming.

---

## 18. Future Considerations (Post-MVP)

These are NOT in scope for the initial build but are natural extensions:

- **Alliances/Guilds** — groups of players within a faction
- **Boss raids** — cooperative PvE events
- **Seasonal events** — limited-time quests and exclusive loot
- **Prestige/Rebirth** — reset to level 1 with permanent bonuses
- **Achievement system** — badges for milestones
- **Chat/messaging** — player-to-player communication
- **Password reset flow** — email-based via Resend (already integrated)
- **Email notifications** — "You were attacked while offline" via Resend
- **Games hub page** — `/games` landing page listing all available games on freshprints.dev

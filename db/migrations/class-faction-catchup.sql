-- Retroactive class/faction starting bonus catch-up for existing players
-- Safe to run multiple times; guards ensure we only apply missed bonuses.
-- PostgreSQL syntax: UPDATE ... FROM ... WHERE (no JOIN in UPDATE)

-- Warden: +5 defense at creation (guard: defense still at default 5)
UPDATE pw_player_stats ps
SET    defense = ps.defense + 5
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'warden'
  AND  ps.defense = 5;

-- Oracle: +5 energy_max at creation (guard: energy_max still at default 20)
UPDATE pw_player_stats ps
SET    energy_max = ps.energy_max + 5,
       energy     = LEAST(ps.energy + 5, ps.energy_max + 5)
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'oracle'
  AND  ps.energy_max = 20;

-- Slayer: +5 attack at creation (guard: attack still at default 5)
UPDATE pw_player_stats ps
SET    attack = ps.attack + 5
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'slayer'
  AND  ps.attack = 5;

-- Broker: +250 drachma at creation (guard: drachma still at starting 500)
UPDATE pw_player_stats ps
SET    drachma = ps.drachma + 250
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'broker'
  AND  ps.drachma = 500;

-- Aesir: +2 agility at creation (guard: agility still at default 0)
UPDATE pw_player_stats ps
SET    agility = ps.agility + 2
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.faction = 'aesir'
  AND  ps.agility = 0;

-- Per-level class bonuses (applied for levels gained beyond 1)
-- Guard: only apply if stat is still at the post-starting-bonus baseline,
-- meaning no manual allocation has been spent on that stat yet.

-- Warden: baseline after starting bonus = 10; missing per-level = (level-1)
UPDATE pw_player_stats ps
SET    defense = 10 + (ps.level - 1)
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'warden'
  AND  ps.level > 1
  AND  ps.defense = 10;

-- Oracle: baseline after starting bonus = 25; missing per-level = (level-1)
UPDATE pw_player_stats ps
SET    energy_max = 25 + (ps.level - 1)
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'oracle'
  AND  ps.level > 1
  AND  ps.energy_max = 25;

-- Slayer: baseline after starting bonus = 10; missing per-level = (level-1)
UPDATE pw_player_stats ps
SET    attack = 10 + (ps.level - 1)
FROM   pw_users u
WHERE  u.id = ps.user_id
  AND  u.class = 'slayer'
  AND  ps.level > 1
  AND  ps.attack = 10;

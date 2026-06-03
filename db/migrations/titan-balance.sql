-- Titan balance rebalance for dynamic combat.
-- Dynamic (run-until-decisive) fights run longer than fixed-round, which broke balance
-- in two directions: passive titans became too easy (more HP needed), per-round AoE
-- titans became deadlier (more ticks).  These are conservative first-pass adjustments.
-- Safe to re-run (UPDATE is idempotent).

-- Atlas: crushing_weight (-25% player damage) — too easy to grind, increase HP mult
UPDATE pw_titans SET base_hp_multiplier = 2.0 WHERE slug = 'atlas';

-- Hecate: arcane_disrupt (50% chance -20% attack) — same grind problem, match Atlas
UPDATE pw_titans SET base_hp_multiplier = 2.1 WHERE slug = 'hecate';

-- Nergal: death_aura was 5 HP/round — more rounds = more total drain, reduce to 3
UPDATE pw_titans SET ability_value = 3 WHERE slug = 'nergal';

-- Enlil: divine_storm was 5 energy/round — more rounds = more Fatigued time, reduce to 3
UPDATE pw_titans SET ability_value = 3 WHERE slug = 'enlil';

-- Surtr: ragnarok_flame now triggers mid-fight (HP threshold) instead of a fixed
-- finale round, so compensate with a slightly higher HP mult
UPDATE pw_titans SET base_hp_multiplier = 2.8 WHERE slug = 'surtr';

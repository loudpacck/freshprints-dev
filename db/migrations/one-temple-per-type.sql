-- One Temple Per Type migration
-- Run this once via Neon console after deploying the temple-uniqueness patch.
-- Idempotent — running again does nothing if no duplicates exist.
--
-- For each (user_id, temple_type) pair with multiple rows:
--   1. Keep the row with the highest upgrade_level (tiebreaker: lowest id = oldest).
--   2. Refund full base_cost per deleted row regardless of upgrade_level.
--   3. Delete the extra rows.
--
-- Note on refund policy: base_cost is refunded at 100% even for upgraded temples.
-- The upgrade investment is consumed; only the original purchase is returned.

BEGIN;

WITH ranked AS (
  -- Rank all player temple rows per (user_id, temple_type).
  -- Rank 1 = the keeper: highest upgrade_level, oldest id as tiebreaker.
  SELECT
    pt.id,
    pt.user_id,
    pt.temple_type,
    pt.upgrade_level,
    t.base_cost,
    ROW_NUMBER() OVER (
      PARTITION BY pt.user_id, pt.temple_type
      ORDER BY pt.upgrade_level DESC, pt.id ASC
    ) AS rn
  FROM pw_player_temples pt
  JOIN pw_temples t ON t.type = pt.temple_type
),
extras AS (
  SELECT id, user_id, base_cost
  FROM ranked
  WHERE rn > 1
),
refunds AS (
  SELECT user_id, SUM(base_cost) AS total_refund
  FROM extras
  GROUP BY user_id
),
apply_refunds AS (
  UPDATE pw_player_stats ps
  SET drachma = ps.drachma + r.total_refund
  FROM refunds r
  WHERE ps.user_id = r.user_id
  RETURNING r.user_id, r.total_refund
),
deleted AS (
  DELETE FROM pw_player_temples
  WHERE id IN (SELECT id FROM extras)
  RETURNING id
)
-- Verification: shows count of affected players, total refunded, temples removed.
-- All three operations happen atomically. On a clean DB this returns (0, 0, 0).
SELECT
  (SELECT COUNT(DISTINCT user_id) FROM apply_refunds) AS players_affected,
  (SELECT COALESCE(SUM(total_refund), 0)              FROM apply_refunds) AS total_drachma_refunded,
  (SELECT COUNT(*)                                    FROM deleted)       AS temples_removed;

COMMIT;

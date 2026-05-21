-- Adds energy_drained to pw_titan_participants so Enlil fights can report
-- how much energy the Storm Sovereign drained from each warrior.
ALTER TABLE pw_titan_participants
  ADD COLUMN IF NOT EXISTS energy_drained INTEGER NOT NULL DEFAULT 0;

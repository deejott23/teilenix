-- Add group_id to trip_participants so individual participants can be assigned to a group.
-- Grouped participants are "absorbed" into their group for expense splitting.

ALTER TABLE trip_participants
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES trip_participants(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_trip_participants_group_id ON trip_participants(group_id);

NOTIFY pgrst, 'reload schema';

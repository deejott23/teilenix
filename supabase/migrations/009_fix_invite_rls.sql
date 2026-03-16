-- Fix invite flow: non-members can't read trips due to RLS → invite link always shows "not found"
-- Solution: SECURITY DEFINER functions bypass RLS for the two invite-specific lookups

-- Used by join/[code]/page.tsx to render the trip info before the user joins
CREATE OR REPLACE FUNCTION get_trip_by_invite_code(p_code TEXT)
RETURNS TABLE(
  id          UUID,
  name        TEXT,
  description TEXT,
  status      TEXT,
  start_date  DATE,
  end_date    DATE
) AS $$
  SELECT id, name, description, status, start_date, end_date
  FROM trips
  WHERE invite_code = UPPER(p_code)
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Used by /api/trips/[tripId]/join to verify the trip exists and is joinable
-- (user is not a member yet, so direct SELECT is blocked by RLS)
CREATE OR REPLACE FUNCTION get_trip_for_join(p_trip_id UUID)
RETURNS TABLE(id UUID, status TEXT) AS $$
  SELECT id, status FROM trips WHERE id = p_trip_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

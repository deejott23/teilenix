-- Fix infinite recursion in family_members RLS policy
-- The old policy queried family_members from within family_members → recursion

-- Helper function: returns the current user's family_id without triggering RLS
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS UUID AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: returns all family_ids the current user belongs to
CREATE OR REPLACE FUNCTION get_my_family_ids()
RETURNS SETOF UUID AS $$
  SELECT family_id FROM family_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop the recursive policy
DROP POLICY IF EXISTS "family_members: view own family and trip members" ON family_members;

-- Recreate without recursion (uses SECURITY DEFINER functions)
CREATE POLICY "family_members: view own family and trip members" ON family_members
  FOR SELECT USING (
    family_id IN (SELECT get_my_family_ids())
    OR family_id IN (
      SELECT tf.family_id FROM trip_families tf
      WHERE user_in_trip(tf.trip_id)
    )
  );

-- Also fix families SELECT policy which has the same pattern
DROP POLICY IF EXISTS "families: members can view" ON families;

CREATE POLICY "families: members can view" ON families
  FOR SELECT USING (
    id IN (SELECT get_my_family_ids())
    OR id IN (
      SELECT tf.family_id FROM trip_families tf
      WHERE user_in_trip(tf.trip_id)
    )
  );

-- Fix families UPDATE policy
DROP POLICY IF EXISTS "families: admin can update" ON families;

CREATE POLICY "families: admin can update" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

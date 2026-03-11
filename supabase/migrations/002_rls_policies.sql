-- TeileniX RLS Policies
-- Run after 001_initial_schema.sql

-- =============================================
-- HELPER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION user_in_trip(trip_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_families tf
    JOIN family_members fm ON fm.family_id = tf.family_id
    WHERE tf.trip_id = trip_uuid AND fm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- profiles
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own access" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "profiles: trip members can see each other" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT fm.user_id FROM family_members fm
      WHERE fm.family_id IN (
        SELECT tf.family_id FROM trip_families tf
        WHERE tf.trip_id IN (
          SELECT tf2.trip_id FROM trip_families tf2
          WHERE tf2.family_id IN (
            SELECT fm2.family_id FROM family_members fm2 WHERE fm2.user_id = auth.uid()
          )
        )
      )
    )
  );

-- =============================================
-- families
-- =============================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "families: members can view" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
    OR id IN (
      SELECT tf.family_id FROM trip_families tf
      WHERE user_in_trip(tf.trip_id)
    )
  );

CREATE POLICY "families: admin can update" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "families: authenticated can create" ON families
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =============================================
-- family_members
-- =============================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_members: view own family and trip members" ON family_members
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
    OR family_id IN (
      SELECT tf.family_id FROM trip_families tf
      WHERE user_in_trip(tf.trip_id)
    )
  );

CREATE POLICY "family_members: join family" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "family_members: admin can remove members" ON family_members
  FOR DELETE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

-- =============================================
-- trips
-- =============================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips: members can view" ON trips
  FOR SELECT USING (user_in_trip(id));

CREATE POLICY "trips: authenticated can create" ON trips
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "trips: creator can update" ON trips
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "trips: creator can delete" ON trips
  FOR DELETE USING (created_by = auth.uid());

-- =============================================
-- trip_families
-- =============================================
ALTER TABLE trip_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_families: visible to trip members" ON trip_families
  FOR SELECT USING (user_in_trip(trip_id));

CREATE POLICY "trip_families: family members can join trip" ON trip_families
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "trip_families: trip creator can manage" ON trip_families
  FOR ALL USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

CREATE POLICY "trip_families: own family can update shares" ON trip_families
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- expenses
-- =============================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: trip members can view" ON expenses
  FOR SELECT USING (user_in_trip(trip_id));

CREATE POLICY "expenses: trip members can create" ON expenses
  FOR INSERT WITH CHECK (
    user_in_trip(trip_id) AND auth.uid() = paid_by_user
  );

CREATE POLICY "expenses: creator or trip owner can update" ON expenses
  FOR UPDATE USING (
    paid_by_user = auth.uid()
    OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

CREATE POLICY "expenses: creator or trip owner can delete" ON expenses
  FOR DELETE USING (
    paid_by_user = auth.uid()
    OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- =============================================
-- expense_splits
-- =============================================
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_splits: trip members can view" ON expense_splits
  FOR SELECT USING (
    expense_id IN (
      SELECT id FROM expenses WHERE user_in_trip(trip_id)
    )
  );

CREATE POLICY "expense_splits: expense creator can manage" ON expense_splits
  FOR ALL USING (
    expense_id IN (SELECT id FROM expenses WHERE paid_by_user = auth.uid())
    OR expense_id IN (
      SELECT e.id FROM expenses e
      JOIN trips t ON t.id = e.trip_id
      WHERE t.created_by = auth.uid()
    )
  );

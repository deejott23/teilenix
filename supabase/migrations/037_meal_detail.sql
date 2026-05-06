-- Upgrade meal votes to 3-way (yes/maybe/no) + add meal comments

-- 1. Add vote column to trip_meal_votes
ALTER TABLE trip_meal_votes
  ADD COLUMN IF NOT EXISTS vote text NOT NULL DEFAULT 'yes'
  CHECK (vote IN ('yes', 'maybe', 'no'));

-- 2. Allow UPDATE on meal votes (needed for vote-change without delete+insert)
CREATE POLICY "meal_votes_update" ON trip_meal_votes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM trip_participants WHERE id = participant_id AND user_id = auth.uid())
  );

-- 3. Meal comments table
CREATE TABLE IF NOT EXISTS trip_meal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_idea_id uuid NOT NULL REFERENCES trip_meal_ideas(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_comments_meal_id ON trip_meal_comments(meal_idea_id);

ALTER TABLE trip_meal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_comments_select" ON trip_meal_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_meal_ideas mi
      JOIN trip_participants tp ON tp.trip_id = mi.trip_id
      WHERE mi.id = trip_meal_comments.meal_idea_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_comments_insert" ON trip_meal_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM trip_participants WHERE id = participant_id AND user_id = auth.uid())
  );

CREATE POLICY "meal_comments_delete" ON trip_meal_comments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM trip_participants WHERE id = participant_id AND user_id = auth.uid())
  );

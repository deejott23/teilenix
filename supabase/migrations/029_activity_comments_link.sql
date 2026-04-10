-- Add link field to activities
ALTER TABLE trip_activities ADD COLUMN IF NOT EXISTS link text;

-- Activity comments table
CREATE TABLE IF NOT EXISTS trip_activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES trip_activities(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON trip_activity_comments(activity_id);

ALTER TABLE trip_activity_comments ENABLE ROW LEVEL SECURITY;

-- Anyone in the trip can read comments
CREATE POLICY "activity_comments_select" ON trip_activity_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_activities ta
      JOIN trip_participants tp ON tp.trip_id = ta.trip_id
      WHERE ta.id = trip_activity_comments.activity_id
        AND tp.user_id = auth.uid()
    )
  );

-- Only the comment author (via participant) can insert
CREATE POLICY "activity_comments_insert" ON trip_activity_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_participants
      WHERE id = participant_id
        AND user_id = auth.uid()
    )
  );

-- Only the comment author can delete their own comments
CREATE POLICY "activity_comments_delete" ON trip_activity_comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM trip_participants
      WHERE id = participant_id
        AND user_id = auth.uid()
    )
  );

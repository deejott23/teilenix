-- Add category and detail_text fields to feedback_comments
ALTER TABLE feedback_comments
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS detail_text text;

-- Feedback likes table — testers can upvote feedback to signal priority
CREATE TABLE IF NOT EXISTS feedback_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid NOT NULL REFERENCES feedback_comments(id) ON DELETE CASCADE,
  tester_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, tester_email)
);

ALTER TABLE feedback_likes ENABLE ROW LEVEL SECURITY;

-- Any tester can like any feedback entry
CREATE POLICY "feedback_likes_insert" ON feedback_likes
  FOR INSERT
  WITH CHECK (auth.jwt()->>'email' = tester_email);

CREATE POLICY "feedback_likes_delete" ON feedback_likes
  FOR DELETE
  USING (auth.jwt()->>'email' = tester_email);

-- All testers can read all likes (to see vote counts)
CREATE POLICY "feedback_likes_select" ON feedback_likes
  FOR SELECT
  USING (true);

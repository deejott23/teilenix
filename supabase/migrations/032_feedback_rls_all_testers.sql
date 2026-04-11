-- Allow all testers to read all feedback comments (not just their own)
DROP POLICY IF EXISTS "feedback_select_own" ON feedback_comments;

CREATE POLICY "feedback_select_testers" ON feedback_comments
  FOR SELECT
  USING (
    auth.jwt()->>'email' IN (
      'tobimail@gmail.com',
      'simon.schwenk@gmail.com'
    )
  );

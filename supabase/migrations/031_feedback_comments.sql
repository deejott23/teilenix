-- Feedback comments for test phase
CREATE TABLE IF NOT EXISTS feedback_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  page_path text NOT NULL,
  feature_label text,
  comment text NOT NULL,
  tester_email text NOT NULL,
  tester_name text,
  status text NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'in_arbeit', 'umgesetzt')),
  developer_note text
);

ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Testers can insert their own comments
CREATE POLICY "feedback_insert" ON feedback_comments
  FOR INSERT
  WITH CHECK (auth.jwt()->>'email' = tester_email);

-- Testers can read their own comments
CREATE POLICY "feedback_select_own" ON feedback_comments
  FOR SELECT
  USING (auth.jwt()->>'email' = tester_email);

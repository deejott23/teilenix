-- Add 'nicht_relevant' as valid feedback status
ALTER TABLE feedback_comments DROP CONSTRAINT IF EXISTS feedback_comments_status_check;
ALTER TABLE feedback_comments ADD CONSTRAINT feedback_comments_status_check
  CHECK (status IN ('offen', 'in_arbeit', 'umgesetzt', 'nicht_relevant'));

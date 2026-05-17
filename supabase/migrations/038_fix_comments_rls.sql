-- Fix activity_comments SELECT policy to use consistent user_is_trip_participant() helper.
-- Also adds SELECT policy for the trip creator (created_by) who may not have a trip_participant row.

DROP POLICY IF EXISTS "activity_comments_select" ON trip_activity_comments;

CREATE POLICY "activity_comments_select" ON trip_activity_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_activities ta
      WHERE ta.id = trip_activity_comments.activity_id
        AND (
          user_is_trip_participant(ta.trip_id)
          OR EXISTS (SELECT 1 FROM trips WHERE id = ta.trip_id AND created_by = auth.uid())
        )
    )
  );

-- Note: If a user's comment is not appearing, check that their trip_participants row
-- has user_id set to their auth.uid(). A guest participant (user_id IS NULL) cannot
-- post comments because the INSERT policy requires:
--   EXISTS (SELECT 1 FROM trip_participants WHERE id = participant_id AND user_id = auth.uid())
-- Fix: UPDATE trip_participants SET user_id = '<auth_uid>' WHERE id = '<participant_id>';

NOTIFY pgrst, 'reload schema';

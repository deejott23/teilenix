-- =============================================
-- Ausflüge (Trip Activities) Feature
-- =============================================

CREATE TABLE IF NOT EXISTS trip_activities (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                   uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by_participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  title                     text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  activity_type             text NOT NULL DEFAULT 'activity'
                              CHECK (activity_type IN ('activity','boat','food','culture','swimming','shopping','other')),
  description               text,
  activity_date             date,
  departure_time            time,
  duration_label            text,
  meeting_point             text,
  cost_per_person_cents     integer CHECK (cost_per_person_cents >= 0),
  status                    text NOT NULL DEFAULT 'idea'
                              CHECK (status IN ('idea', 'confirmed', 'cancelled')),
  cover_emoji               text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_activity_votes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id    uuid NOT NULL REFERENCES trip_activities(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  vote           text NOT NULL CHECK (vote IN ('yes', 'maybe', 'no')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(activity_id, participant_id)
);

CREATE INDEX IF NOT EXISTS trip_activities_trip_id_idx ON trip_activities(trip_id);
CREATE INDEX IF NOT EXISTS trip_activity_votes_activity_id_idx ON trip_activity_votes(activity_id);

CREATE OR REPLACE FUNCTION touch_trip_activity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trip_activities_updated_at
  BEFORE UPDATE ON trip_activities
  FOR EACH ROW EXECUTE FUNCTION touch_trip_activity();

ALTER TABLE trip_activities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON trip_activities FOR SELECT
USING (user_is_trip_participant(trip_id));

CREATE POLICY "activities_insert" ON trip_activities FOR INSERT
WITH CHECK (
  created_by_participant_id IN (
    SELECT id FROM trip_participants
    WHERE trip_id = trip_activities.trip_id AND user_id = auth.uid()
  )
);

CREATE POLICY "activities_update" ON trip_activities FOR UPDATE
USING (user_is_trip_participant(trip_id));

CREATE POLICY "activities_delete" ON trip_activities FOR DELETE
USING (
  created_by_participant_id IN (
    SELECT id FROM trip_participants
    WHERE trip_id = trip_activities.trip_id AND user_id = auth.uid()
  )
);

CREATE POLICY "activity_votes_select" ON trip_activity_votes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trip_activities a
    JOIN trip_participants tp ON tp.trip_id = a.trip_id
    WHERE a.id = trip_activity_votes.activity_id AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "activity_votes_insert" ON trip_activity_votes FOR INSERT
WITH CHECK (
  participant_id IN (SELECT id FROM trip_participants WHERE user_id = auth.uid())
);

CREATE POLICY "activity_votes_update" ON trip_activity_votes FOR UPDATE
USING (
  participant_id IN (SELECT id FROM trip_participants WHERE user_id = auth.uid())
);

CREATE POLICY "activity_votes_delete" ON trip_activity_votes FOR DELETE
USING (
  participant_id IN (SELECT id FROM trip_participants WHERE user_id = auth.uid())
);

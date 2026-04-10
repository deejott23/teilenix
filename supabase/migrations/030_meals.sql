-- Meal ideas (Zettelwand)
CREATE TABLE IF NOT EXISTS trip_meal_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by_participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  emoji text NOT NULL DEFAULT '🍽️',
  description text CHECK (description IS NULL OR char_length(description) <= 300),
  tags text[] NOT NULL DEFAULT '{}',
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_ideas_trip_id ON trip_meal_ideas(trip_id);

-- Fire votes (each participant can vote once per idea)
CREATE TABLE IF NOT EXISTS trip_meal_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_idea_id uuid NOT NULL REFERENCES trip_meal_ideas(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meal_idea_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_meal_votes_meal_id ON trip_meal_votes(meal_idea_id);

-- Meal plan slots (lunch/dinner per day)
CREATE TABLE IF NOT EXISTS trip_meal_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  meal_idea_id uuid REFERENCES trip_meal_ideas(id) ON DELETE SET NULL,
  slot_date date NOT NULL,
  slot_type text NOT NULL CHECK (slot_type IN ('lunch', 'dinner')),
  UNIQUE(trip_id, slot_date, slot_type)
);

CREATE INDEX IF NOT EXISTS idx_meal_slots_trip_id ON trip_meal_slots(trip_id);

ALTER TABLE trip_meal_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_meal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_meal_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_ideas_select" ON trip_meal_ideas FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE trip_id = trip_meal_ideas.trip_id AND user_id = auth.uid())
);
CREATE POLICY "meal_ideas_insert" ON trip_meal_ideas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trip_participants WHERE id = created_by_participant_id AND user_id = auth.uid())
);
CREATE POLICY "meal_ideas_delete" ON trip_meal_ideas FOR DELETE USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE id = created_by_participant_id AND user_id = auth.uid())
);
CREATE POLICY "meal_ideas_update" ON trip_meal_ideas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE id = created_by_participant_id AND user_id = auth.uid())
);

CREATE POLICY "meal_votes_select" ON trip_meal_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_participants tp JOIN trip_meal_ideas mi ON mi.trip_id = tp.trip_id WHERE mi.id = trip_meal_votes.meal_idea_id AND tp.user_id = auth.uid())
);
CREATE POLICY "meal_votes_insert" ON trip_meal_votes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trip_participants WHERE id = participant_id AND user_id = auth.uid())
);
CREATE POLICY "meal_votes_delete" ON trip_meal_votes FOR DELETE USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE id = participant_id AND user_id = auth.uid())
);

CREATE POLICY "meal_slots_select" ON trip_meal_slots FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE trip_id = trip_meal_slots.trip_id AND user_id = auth.uid())
);
CREATE POLICY "meal_slots_all" ON trip_meal_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM trip_participants WHERE trip_id = trip_meal_slots.trip_id AND user_id = auth.uid())
);

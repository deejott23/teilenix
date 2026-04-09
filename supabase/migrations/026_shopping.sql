-- =============================================
-- Einkaufszettel (Shopping List) Feature
-- =============================================

CREATE TABLE IF NOT EXISTS shopping_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                 uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  added_by_participant_id uuid REFERENCES trip_participants(id) ON DELETE SET NULL,
  title                   text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  category                text NOT NULL DEFAULT 'Sonstiges',
  quantity                integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  is_bought               boolean NOT NULL DEFAULT false,
  bought_at               timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shopping_items_trip_id_idx ON shopping_items(trip_id);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_select" ON shopping_items FOR SELECT
USING (user_is_trip_participant(trip_id));

CREATE POLICY "shopping_insert" ON shopping_items FOR INSERT
WITH CHECK (user_is_trip_participant(trip_id));

CREATE POLICY "shopping_update" ON shopping_items FOR UPDATE
USING (user_is_trip_participant(trip_id));

CREATE POLICY "shopping_delete" ON shopping_items FOR DELETE
USING (user_is_trip_participant(trip_id));

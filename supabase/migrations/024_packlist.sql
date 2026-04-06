-- =============================================
-- Mitbringliste (Packlist) Feature
-- =============================================

-- Items table
CREATE TABLE IF NOT EXISTS packlist_items (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                   uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by_participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  item_type                 text NOT NULL CHECK (item_type IN ('bringing', 'group_need', 'group_private')),
  title                     text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  quantity_needed           integer NOT NULL DEFAULT 1 CHECK (quantity_needed >= 1),
  -- For group_private: which sub-group (is_group=true participant) this belongs to.
  -- NULL = truly private (only creator sees it)
  group_id                  uuid REFERENCES trip_participants(id) ON DELETE SET NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Personal check-off status (packed / done)
CREATE TABLE IF NOT EXISTS packlist_checks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid NOT NULL REFERENCES packlist_items(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, participant_id)
);

-- Claims for group_need items (who brings how many)
CREATE TABLE IF NOT EXISTS packlist_claims (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id          uuid NOT NULL REFERENCES packlist_items(id) ON DELETE CASCADE,
  participant_id   uuid NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  quantity_claimed integer NOT NULL DEFAULT 1 CHECK (quantity_claimed >= 1),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, participant_id)
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS packlist_items_trip_id_idx ON packlist_items(trip_id);
CREATE INDEX IF NOT EXISTS packlist_checks_item_id_idx ON packlist_checks(item_id);
CREATE INDEX IF NOT EXISTS packlist_claims_item_id_idx ON packlist_claims(item_id);

-- ── updated_at trigger ──
CREATE OR REPLACE FUNCTION touch_packlist_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER packlist_items_updated_at
  BEFORE UPDATE ON packlist_items
  FOR EACH ROW EXECUTE FUNCTION touch_packlist_item();

-- =============================================
-- RLS
-- =============================================
ALTER TABLE packlist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE packlist_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE packlist_claims ENABLE ROW LEVEL SECURITY;

-- Helper: is auth user a participant in a trip?
CREATE OR REPLACE FUNCTION user_is_trip_participant(trip_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_participants
    WHERE trip_id = trip_uuid AND user_id = auth.uid()
  );
$$;

-- Helper: get current user's participant ids in a trip
CREATE OR REPLACE FUNCTION my_participant_ids(trip_uuid uuid)
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM trip_participants
  WHERE trip_id = trip_uuid AND user_id = auth.uid();
$$;

-- ── packlist_items: SELECT ──
-- Non-private: any trip participant
-- group_private: creator OR same-group members
CREATE POLICY "packlist_items_select" ON packlist_items FOR SELECT
USING (
  user_is_trip_participant(trip_id)
  AND (
    item_type != 'group_private'
    -- creator always sees their own private item
    OR created_by_participant_id IN (SELECT id FROM trip_participants WHERE trip_id = packlist_items.trip_id AND user_id = auth.uid())
    -- group members see group-private items of their group
    OR (
      group_id IS NOT NULL
      AND group_id IN (
        SELECT tp.group_id FROM trip_participants tp
        WHERE tp.trip_id = packlist_items.trip_id
          AND tp.user_id = auth.uid()
          AND tp.group_id IS NOT NULL
        UNION
        -- the group leader/participant with id = group_id also sees it
        SELECT id FROM trip_participants
        WHERE trip_id = packlist_items.trip_id AND user_id = auth.uid() AND id = packlist_items.group_id
      )
    )
  )
);

-- ── packlist_items: INSERT ──
CREATE POLICY "packlist_items_insert" ON packlist_items FOR INSERT
WITH CHECK (
  created_by_participant_id IN (
    SELECT id FROM trip_participants WHERE trip_id = packlist_items.trip_id AND user_id = auth.uid()
  )
);

-- ── packlist_items: UPDATE ──
-- Creator can update anything; any participant can update quantity_needed on group_need items
CREATE POLICY "packlist_items_update" ON packlist_items FOR UPDATE
USING (
  user_is_trip_participant(trip_id)
  AND (
    -- creator can update their own items
    created_by_participant_id IN (SELECT id FROM trip_participants WHERE trip_id = packlist_items.trip_id AND user_id = auth.uid())
    -- any participant can adjust quantity on group_need
    OR item_type = 'group_need'
  )
);

-- ── packlist_items: DELETE (creator only) ──
CREATE POLICY "packlist_items_delete" ON packlist_items FOR DELETE
USING (
  created_by_participant_id IN (
    SELECT id FROM trip_participants WHERE trip_id = packlist_items.trip_id AND user_id = auth.uid()
  )
);

-- ── packlist_checks: own records only ──
CREATE POLICY "packlist_checks_select" ON packlist_checks FOR SELECT
USING (
  participant_id IN (
    SELECT tp.id FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_checks.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "packlist_checks_insert" ON packlist_checks FOR INSERT
WITH CHECK (
  participant_id IN (
    SELECT tp.id FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_checks.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "packlist_checks_delete" ON packlist_checks FOR DELETE
USING (
  participant_id IN (
    SELECT tp.id FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_checks.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

-- ── packlist_claims: SELECT all trip participants see all claims ──
CREATE POLICY "packlist_claims_select" ON packlist_claims FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_claims.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

-- ── packlist_claims: write own records only ──
CREATE POLICY "packlist_claims_insert" ON packlist_claims FOR INSERT
WITH CHECK (
  participant_id IN (
    SELECT tp.id FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_claims.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "packlist_claims_update" ON packlist_claims FOR UPDATE
USING (
  participant_id IN (
    SELECT tp.id FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_claims.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "packlist_claims_delete" ON packlist_claims FOR DELETE
USING (
  participant_id IN (
    SELECT tp.id FROM trip_participants tp
    JOIN packlist_items pi ON pi.id = packlist_claims.item_id
    WHERE tp.trip_id = pi.trip_id AND tp.user_id = auth.uid()
  )
);

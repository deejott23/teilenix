-- Drop old structure (cascade)
DROP TABLE IF EXISTS expense_splits CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS trip_families CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families CASCADE;

-- New tables
CREATE TABLE trip_participants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  shares       INT NOT NULL DEFAULT 1 CHECK (shares >= 1 AND shares <= 50),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_group     BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id) -- each registered user only once per trip
);

CREATE TABLE trip_participant_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES trip_participants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name   TEXT NOT NULL,
  is_guest       BOOLEAN NOT NULL DEFAULT FALSE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate expenses with new participant reference
CREATE TABLE expenses (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by_participant_id UUID NOT NULL REFERENCES trip_participants(id) ON DELETE RESTRICT,
  title                  TEXT NOT NULL,
  description            TEXT,
  amount_cents           INT NOT NULL CHECK (amount_cents > 0),
  currency               TEXT NOT NULL DEFAULT 'EUR',
  category               expense_category NOT NULL DEFAULT 'other',
  expense_date           DATE NOT NULL,
  split_mode             TEXT NOT NULL DEFAULT 'proportional',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expense_splits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id     UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES trip_participants(id) ON DELETE RESTRICT,
  shares         INT NOT NULL DEFAULT 1 CHECK (shares >= 1),
  UNIQUE(expense_id, participant_id)
);

-- Update trips: drop enabled_categories (keep simple for now)
ALTER TABLE trips DROP COLUMN IF EXISTS enabled_categories;

-- Helper function (define before use in policies)
CREATE OR REPLACE FUNCTION created_by_user(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM trips WHERE id = p_trip_id AND created_by = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop dependent policies first, then drop and recreate user_in_trip
DROP POLICY IF EXISTS "trips: members can view" ON trips;
DROP FUNCTION IF EXISTS user_in_trip(UUID) CASCADE;

-- Update user_in_trip function for new schema
CREATE OR REPLACE FUNCTION user_in_trip(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_participants
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM trip_participant_members tpm
    JOIN trip_participants tp ON tp.id = tpm.participant_id
    WHERE tp.trip_id = p_trip_id AND tpm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM trips WHERE id = p_trip_id AND created_by = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS for trip_participants
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_participants: trip members can view" ON trip_participants
  FOR SELECT USING (user_in_trip(trip_id));

CREATE POLICY "trip_participants: trip members can insert" ON trip_participants
  FOR INSERT WITH CHECK (user_in_trip(trip_id) OR created_by_user(trip_id));

CREATE POLICY "trip_participants: trip creator can update" ON trip_participants
  FOR UPDATE USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "trip_participants: trip creator can delete" ON trip_participants
  FOR DELETE USING (
    trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- RLS for trip_participant_members
ALTER TABLE trip_participant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_participant_members: trip members can view" ON trip_participant_members
  FOR SELECT USING (
    participant_id IN (
      SELECT id FROM trip_participants WHERE user_in_trip(trip_id)
    )
  );

CREATE POLICY "trip_participant_members: creator can manage" ON trip_participant_members
  FOR ALL USING (
    participant_id IN (
      SELECT tp.id FROM trip_participants tp
      JOIN trips t ON t.id = tp.trip_id
      WHERE t.created_by = auth.uid()
    )
  );

-- RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: trip members can view" ON expenses
  FOR SELECT USING (user_in_trip(trip_id));

CREATE POLICY "expenses: trip members can create" ON expenses
  FOR INSERT WITH CHECK (user_in_trip(trip_id));

CREATE POLICY "expenses: trip members can update" ON expenses
  FOR UPDATE USING (user_in_trip(trip_id));

CREATE POLICY "expenses: trip members can delete" ON expenses
  FOR DELETE USING (user_in_trip(trip_id));

-- RLS for expense_splits
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_splits: trip members can view" ON expense_splits
  FOR SELECT USING (
    expense_id IN (SELECT id FROM expenses WHERE user_in_trip(trip_id))
  );

CREATE POLICY "expense_splits: trip members can manage" ON expense_splits
  FOR ALL USING (
    expense_id IN (SELECT id FROM expenses WHERE user_in_trip(trip_id))
  );

-- Updated auto_setup_user: just profile, no family
CREATE OR REPLACE FUNCTION auto_setup_user(
  p_display_name TEXT,
  p_email        TEXT,
  p_avatar_url   TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, avatar_url)
  VALUES (auth.uid(), p_display_name, p_email, p_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email        = EXCLUDED.email,
    avatar_url   = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a trip and auto-add creator as participant
CREATE OR REPLACE FUNCTION create_trip_with_participant(
  p_name       TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date   DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_trip_id    UUID;
  v_invite     TEXT;
  v_disp_name  TEXT;
BEGIN
  -- Generate unique invite code
  LOOP
    v_invite := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM trips WHERE invite_code = v_invite);
  END LOOP;

  INSERT INTO trips (name, start_date, end_date, created_by, invite_code, status)
  VALUES (p_name, p_start_date, p_end_date, auth.uid(), v_invite, 'active')
  RETURNING id INTO v_trip_id;

  -- Get creator display name
  SELECT display_name INTO v_disp_name FROM profiles WHERE id = auth.uid();

  -- Add creator as first participant
  INSERT INTO trip_participants (trip_id, user_id, name, shares)
  VALUES (v_trip_id, auth.uid(), COALESCE(v_disp_name, 'Unbekannt'), 1);

  RETURN v_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a trip via invite code
CREATE OR REPLACE FUNCTION join_trip_by_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_trip_id    UUID;
  v_trip_status TEXT;
  v_disp_name  TEXT;
BEGIN
  SELECT id, status INTO v_trip_id, v_trip_status
  FROM trips WHERE upper(invite_code) = upper(p_code);

  IF v_trip_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Einladungscode ungültig');
  END IF;

  IF v_trip_status = 'ended' THEN
    RETURN jsonb_build_object('error', 'Reise bereits beendet');
  END IF;

  -- Already joined?
  IF EXISTS (SELECT 1 FROM trip_participants WHERE trip_id = v_trip_id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('trip_id', v_trip_id, 'already_joined', true);
  END IF;

  SELECT display_name INTO v_disp_name FROM profiles WHERE id = auth.uid();

  INSERT INTO trip_participants (trip_id, user_id, name, shares)
  VALUES (v_trip_id, auth.uid(), COALESCE(v_disp_name, 'Unbekannt'), 1);

  RETURN jsonb_build_object('trip_id', v_trip_id, 'already_joined', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all old functions with exact signatures
-- update_expense_with_splits (old: 9 params, new: 10 params)
DROP FUNCTION IF EXISTS update_expense_with_splits(UUID, TEXT, TEXT, INT, TEXT, expense_category, DATE, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS update_expense_with_splits(UUID, TEXT, TEXT, INT, TEXT, expense_category, DATE, TEXT, JSONB, UUID) CASCADE;
-- create_expense_with_splits (old: 11 params)
DROP FUNCTION IF EXISTS create_expense_with_splits(UUID, UUID, UUID, TEXT, TEXT, INT, TEXT, expense_category, DATE, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_expense_with_splits(UUID, UUID, TEXT, TEXT, INT, TEXT, expense_category, DATE, TEXT, JSONB) CASCADE;
-- Other old functions
DROP FUNCTION IF EXISTS create_trip_for_user(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS join_trip(UUID, INT) CASCADE;
DROP FUNCTION IF EXISTS auto_setup_user(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_setup_user(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_trip_by_invite_code(TEXT) CASCADE;
DROP FUNCTION IF EXISTS join_trip_by_code(TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_trip_with_participant(TEXT, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS created_by_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_trip_for_join(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_my_family_id() CASCADE;
DROP FUNCTION IF EXISTS get_my_family_ids() CASCADE;

-- Function to update expense with splits atomically
CREATE OR REPLACE FUNCTION update_expense_with_splits(
  p_expense_id           UUID,
  p_title                TEXT,
  p_description          TEXT,
  p_amount_cents         INT,
  p_currency             TEXT,
  p_category             expense_category,
  p_expense_date         DATE,
  p_split_mode           TEXT,
  p_splits               JSONB,
  p_paid_by_participant_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE expenses SET
    title                  = p_title,
    description            = p_description,
    amount_cents           = p_amount_cents,
    currency               = p_currency,
    category               = p_category,
    expense_date           = p_expense_date,
    split_mode             = p_split_mode,
    paid_by_participant_id = COALESCE(p_paid_by_participant_id, paid_by_participant_id),
    updated_at             = NOW()
  WHERE id = p_expense_id;

  DELETE FROM expense_splits WHERE expense_id = p_expense_id;

  INSERT INTO expense_splits (expense_id, participant_id, shares)
  SELECT p_expense_id, (s->>'participant_id')::UUID, (s->>'shares')::INT
  FROM jsonb_array_elements(p_splits) s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create expense with splits atomically
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_trip_id              UUID,
  p_paid_by_participant_id UUID,
  p_title                TEXT,
  p_description          TEXT,
  p_amount_cents         INT,
  p_currency             TEXT,
  p_category             expense_category,
  p_expense_date         DATE,
  p_split_mode           TEXT,
  p_splits               JSONB
) RETURNS UUID AS $$
DECLARE
  v_expense_id UUID;
BEGIN
  INSERT INTO expenses (
    trip_id, paid_by_participant_id, title, description,
    amount_cents, currency, category, expense_date, split_mode
  )
  VALUES (
    p_trip_id, p_paid_by_participant_id, p_title, p_description,
    p_amount_cents, p_currency, p_category, p_expense_date, p_split_mode
  )
  RETURNING id INTO v_expense_id;

  INSERT INTO expense_splits (expense_id, participant_id, shares)
  SELECT v_expense_id, (s->>'participant_id')::UUID, (s->>'shares')::INT
  FROM jsonb_array_elements(p_splits) s;

  RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trip by invite code (for join page preview)
CREATE OR REPLACE FUNCTION get_trip_by_invite_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT, status TEXT, participant_count BIGINT) AS $$
  SELECT t.id, t.name, t.status,
    (SELECT COUNT(*) FROM trip_participants WHERE trip_id = t.id)
  FROM trips t
  WHERE upper(t.invite_code) = upper(p_code);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update trips RLS to use new user_in_trip function
DROP POLICY IF EXISTS "trips: members can view" ON trips;
CREATE POLICY "trips: members can view" ON trips
  FOR SELECT USING (user_in_trip(id) OR created_by = auth.uid());

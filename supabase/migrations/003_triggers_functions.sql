-- TeileniX Triggers and Functions
-- Run after 002_rls_policies.sql

-- =============================================
-- updated_at trigger
-- =============================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================
-- Auto-create profile on Google sign-in
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- Atomic expense creation with splits
-- =============================================

CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_trip_id       UUID,
  p_paid_by_family UUID,
  p_paid_by_user  UUID,
  p_title         TEXT,
  p_description   TEXT,
  p_amount_cents  INT,
  p_currency      TEXT,
  p_category      expense_category,
  p_expense_date  DATE,
  p_split_mode    TEXT,
  p_splits        JSONB  -- [{family_id: uuid, shares: int}, ...]
) RETURNS UUID AS $$
DECLARE
  v_expense_id UUID;
  v_split      JSONB;
BEGIN
  INSERT INTO expenses (
    trip_id, paid_by_family, paid_by_user, title, description,
    amount_cents, currency, category, expense_date, split_mode
  )
  VALUES (
    p_trip_id, p_paid_by_family, p_paid_by_user, p_title, p_description,
    p_amount_cents, p_currency, p_category, p_expense_date, p_split_mode
  )
  RETURNING id INTO v_expense_id;

  FOR v_split IN SELECT * FROM jsonb_array_elements(p_splits)
  LOOP
    INSERT INTO expense_splits (expense_id, family_id, shares)
    VALUES (
      v_expense_id,
      (v_split->>'family_id')::UUID,
      (v_split->>'shares')::INT
    );
  END LOOP;

  RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Update expense with splits (atomic)
-- =============================================

CREATE OR REPLACE FUNCTION update_expense_with_splits(
  p_expense_id    UUID,
  p_title         TEXT,
  p_description   TEXT,
  p_amount_cents  INT,
  p_currency      TEXT,
  p_category      expense_category,
  p_expense_date  DATE,
  p_split_mode    TEXT,
  p_splits        JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE expenses SET
    title        = p_title,
    description  = p_description,
    amount_cents = p_amount_cents,
    currency     = p_currency,
    category     = p_category,
    expense_date = p_expense_date,
    split_mode   = p_split_mode,
    updated_at   = NOW()
  WHERE id = p_expense_id;

  DELETE FROM expense_splits WHERE expense_id = p_expense_id;

  INSERT INTO expense_splits (expense_id, family_id, shares)
  SELECT p_expense_id, (s->>'family_id')::UUID, (s->>'shares')::INT
  FROM jsonb_array_elements(p_splits) s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

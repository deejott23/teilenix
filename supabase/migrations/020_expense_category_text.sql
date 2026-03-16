-- Drop old expense functions that use expense_category enum type
DROP FUNCTION IF EXISTS create_expense_with_splits(UUID, UUID, TEXT, TEXT, INT, TEXT, expense_category, DATE, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS update_expense_with_splits(UUID, TEXT, TEXT, INT, TEXT, expense_category, DATE, TEXT, JSONB, UUID) CASCADE;

-- Recreate create_expense_with_splits with TEXT category
CREATE OR REPLACE FUNCTION create_expense_with_splits(
  p_trip_id              UUID,
  p_paid_by_participant_id UUID,
  p_title                TEXT,
  p_description          TEXT,
  p_amount_cents         INT,
  p_currency             TEXT,
  p_category             TEXT,
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
  SELECT
    v_expense_id,
    (split->>'participant_id')::UUID,
    (split->>'shares')::INT
  FROM jsonb_array_elements(p_splits) AS split;

  RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate update_expense_with_splits with TEXT category
CREATE OR REPLACE FUNCTION update_expense_with_splits(
  p_expense_id           UUID,
  p_title                TEXT,
  p_description          TEXT,
  p_amount_cents         INT,
  p_currency             TEXT,
  p_category             TEXT,
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
  SELECT
    p_expense_id,
    (split->>'participant_id')::UUID,
    (split->>'shares')::INT
  FROM jsonb_array_elements(p_splits) AS split;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';

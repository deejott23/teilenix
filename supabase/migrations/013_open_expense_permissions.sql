-- Allow all trip members to update and delete any expense in their trip
-- Previously restricted to expense creator or trip owner only

DROP POLICY IF EXISTS "expenses: creator or trip owner can update" ON expenses;
DROP POLICY IF EXISTS "expenses: creator or trip owner can delete" ON expenses;

CREATE POLICY "expenses: trip members can update" ON expenses
  FOR UPDATE USING (user_in_trip(trip_id));

CREATE POLICY "expenses: trip members can delete" ON expenses
  FOR DELETE USING (user_in_trip(trip_id));

-- Update update_expense_with_splits to also handle paid_by_family changes
CREATE OR REPLACE FUNCTION update_expense_with_splits(
  p_expense_id      UUID,
  p_title           TEXT,
  p_description     TEXT,
  p_amount_cents    INT,
  p_currency        TEXT,
  p_category        expense_category,
  p_expense_date    DATE,
  p_split_mode      TEXT,
  p_splits          JSONB,
  p_paid_by_family  UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE expenses SET
    title            = p_title,
    description      = p_description,
    amount_cents     = p_amount_cents,
    currency         = p_currency,
    category         = p_category,
    expense_date     = p_expense_date,
    split_mode       = p_split_mode,
    paid_by_family   = COALESCE(p_paid_by_family, paid_by_family),
    updated_at       = NOW()
  WHERE id = p_expense_id;

  DELETE FROM expense_splits WHERE expense_id = p_expense_id;

  INSERT INTO expense_splits (expense_id, family_id, shares)
  SELECT p_expense_id, (s->>'family_id')::UUID, (s->>'shares')::INT
  FROM jsonb_array_elements(p_splits) s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trip management SECURITY DEFINER functions
-- Bypass RLS circular dependency when updating/removing trip_families

-- Update shares for a family in a trip, optionally recalculate proportional splits
CREATE OR REPLACE FUNCTION update_trip_family_shares(
  p_trip_id    UUID,
  p_family_id  UUID,
  p_shares     INT,
  p_recalculate BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_creator UUID;
  v_expense_ids  UUID[];
  v_family_rec   RECORD;
BEGIN
  SELECT created_by INTO v_trip_creator FROM trips WHERE id = p_trip_id;

  IF v_trip_creator IS NULL THEN
    RETURN jsonb_build_object('error', 'Reise nicht gefunden');
  END IF;

  IF v_trip_creator != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Keine Berechtigung');
  END IF;

  IF p_shares < 1 OR p_shares > 20 THEN
    RETURN jsonb_build_object('error', 'Ungültige Personenanzahl (1–20)');
  END IF;

  UPDATE trip_families
  SET shares = p_shares
  WHERE trip_id = p_trip_id AND family_id = p_family_id;

  IF p_recalculate THEN
    -- Collect all proportional expense IDs in this trip
    SELECT ARRAY(
      SELECT id FROM expenses
      WHERE trip_id = p_trip_id AND split_mode = 'proportional'
    ) INTO v_expense_ids;

    IF v_expense_ids IS NOT NULL AND array_length(v_expense_ids, 1) > 0 THEN
      -- Update each family's splits to their current trip shares
      FOR v_family_rec IN
        SELECT family_id, shares FROM trip_families WHERE trip_id = p_trip_id
      LOOP
        UPDATE expense_splits
        SET shares = v_family_rec.shares
        WHERE expense_id = ANY(v_expense_ids)
          AND family_id = v_family_rec.family_id;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Remove a family from a trip (only if they have no expenses)
CREATE OR REPLACE FUNCTION remove_trip_family(
  p_trip_id   UUID,
  p_family_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_creator UUID;
  v_count        INT;
BEGIN
  SELECT created_by INTO v_trip_creator FROM trips WHERE id = p_trip_id;

  IF v_trip_creator IS NULL THEN
    RETURN jsonb_build_object('error', 'Reise nicht gefunden');
  END IF;

  IF v_trip_creator != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Keine Berechtigung');
  END IF;

  -- Check paid expenses
  SELECT COUNT(*) INTO v_count
  FROM expenses
  WHERE trip_id = p_trip_id AND paid_by_family = p_family_id;

  IF v_count > 0 THEN
    RETURN jsonb_build_object('error', 'Diese Gruppe hat bereits Ausgaben erfasst und kann nicht entfernt werden.');
  END IF;

  -- Check expense splits
  SELECT COUNT(*) INTO v_count
  FROM expense_splits es
  JOIN expenses e ON e.id = es.expense_id
  WHERE e.trip_id = p_trip_id AND es.family_id = p_family_id;

  IF v_count > 0 THEN
    RETURN jsonb_build_object('error', 'Diese Gruppe ist an Ausgaben beteiligt und kann nicht entfernt werden.');
  END IF;

  DELETE FROM trip_families
  WHERE trip_id = p_trip_id AND family_id = p_family_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

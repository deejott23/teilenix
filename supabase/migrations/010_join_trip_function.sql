-- Fix recursive RLS when joining a trip:
-- trip_families INSERT policy → family_members SELECT → trip_families SELECT → user_in_trip → trip_families → ...
-- Solution: atomic SECURITY DEFINER function that bypasses all RLS

CREATE OR REPLACE FUNCTION join_trip(p_trip_id UUID, p_shares INT)
RETURNS JSONB AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_family_id UUID;
  v_status   TEXT;
BEGIN
  -- Verify trip exists and is joinable
  SELECT status INTO v_status FROM trips WHERE id = p_trip_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Reise nicht gefunden');
  END IF;
  IF v_status = 'ended' THEN
    RETURN jsonb_build_object('error', 'Diese Reise ist bereits beendet');
  END IF;

  -- Get user's family
  SELECT family_id INTO v_family_id FROM family_members WHERE user_id = v_user_id LIMIT 1;
  IF v_family_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Keine Familie gefunden. Erstelle zuerst eine Familie.');
  END IF;

  -- Check if already joined
  IF EXISTS (SELECT 1 FROM trip_families WHERE trip_id = p_trip_id AND family_id = v_family_id) THEN
    RETURN jsonb_build_object('error', 'Deine Familie ist bereits in dieser Reise');
  END IF;

  -- Join
  INSERT INTO trip_families (trip_id, family_id, shares)
  VALUES (p_trip_id, v_family_id, p_shares);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

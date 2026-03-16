-- Force PostgREST schema cache reload by recreating all custom RPC functions

-- get_trip_by_invite_code
DROP FUNCTION IF EXISTS get_trip_by_invite_code(TEXT);
CREATE OR REPLACE FUNCTION get_trip_by_invite_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT, status TEXT, participant_count BIGINT) AS $$
  SELECT t.id, t.name, t.status,
    (SELECT COUNT(*) FROM trip_participants WHERE trip_id = t.id)
  FROM trips t
  WHERE upper(t.invite_code) = upper(p_code);
$$ LANGUAGE sql SECURITY DEFINER STABLE;
GRANT EXECUTE ON FUNCTION get_trip_by_invite_code(TEXT) TO authenticated, anon;

-- join_trip_by_code
DROP FUNCTION IF EXISTS join_trip_by_code(TEXT);
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

  IF EXISTS (SELECT 1 FROM trip_participants WHERE trip_id = v_trip_id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('trip_id', v_trip_id, 'already_joined', true);
  END IF;

  SELECT display_name INTO v_disp_name FROM profiles WHERE id = auth.uid();

  INSERT INTO trip_participants (trip_id, user_id, name, shares)
  VALUES (v_trip_id, auth.uid(), COALESCE(v_disp_name, 'Unbekannt'), 1);

  RETURN jsonb_build_object('trip_id', v_trip_id, 'already_joined', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION join_trip_by_code(TEXT) TO authenticated;

-- user_in_trip (use CREATE OR REPLACE, cannot drop due to policy dependencies)
CREATE OR REPLACE FUNCTION user_in_trip(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_participants
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
GRANT EXECUTE ON FUNCTION user_in_trip(UUID) TO authenticated;

-- auto_setup_user
DROP FUNCTION IF EXISTS auto_setup_user(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION auto_setup_user(
  p_user_id    TEXT,
  p_email      TEXT,
  p_full_name  TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email)
  VALUES (p_user_id::UUID, p_full_name, p_email)
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email        = EXCLUDED.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION auto_setup_user(TEXT, TEXT, TEXT) TO authenticated, service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

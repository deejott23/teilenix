-- Re-create functions to force PostgREST schema cache reload

DROP FUNCTION IF EXISTS create_trip_with_participant(TEXT, DATE, DATE);

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
  LOOP
    v_invite := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM trips WHERE invite_code = v_invite);
  END LOOP;

  INSERT INTO trips (name, start_date, end_date, created_by, invite_code, status)
  VALUES (p_name, p_start_date, p_end_date, auth.uid(), v_invite, 'active')
  RETURNING id INTO v_trip_id;

  SELECT display_name INTO v_disp_name FROM profiles WHERE id = auth.uid();

  INSERT INTO trip_participants (trip_id, user_id, name, shares)
  VALUES (v_trip_id, auth.uid(), COALESCE(v_disp_name, 'Unbekannt'), 1);

  RETURN v_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_trip_with_participant(TEXT, DATE, DATE) TO authenticated;

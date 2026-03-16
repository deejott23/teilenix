-- Fix create_trip_for_user: use TEXT for date params so empty string → NULL works

CREATE OR REPLACE FUNCTION create_trip_for_user(
  p_name        TEXT,
  p_description TEXT,
  p_start_date  TEXT,
  p_end_date    TEXT,
  p_invite_code TEXT,
  p_family_id   UUID,
  p_shares      INT
) RETURNS UUID AS $$
DECLARE
  v_trip_id UUID;
BEGIN
  INSERT INTO trips (name, description, start_date, end_date, invite_code, created_by)
  VALUES (
    p_name,
    NULLIF(p_description, ''),
    NULLIF(p_start_date, '')::DATE,
    NULLIF(p_end_date, '')::DATE,
    p_invite_code,
    auth.uid()
  )
  RETURNING id INTO v_trip_id;

  INSERT INTO trip_families (trip_id, family_id, shares)
  VALUES (v_trip_id, p_family_id, p_shares);

  RETURN v_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

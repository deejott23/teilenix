-- Auto-setup function: creates profile + family for new users
-- Runs as SECURITY DEFINER so it bypasses RLS (auth.uid() is always valid inside)

CREATE OR REPLACE FUNCTION auto_setup_user(
  p_display_name TEXT,
  p_email        TEXT,
  p_avatar_url   TEXT,
  p_group_name   TEXT,
  p_invite_code  TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_family_id  UUID;
BEGIN
  -- Upsert profile
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (v_user_id, p_email, p_display_name, p_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    avatar_url   = EXCLUDED.avatar_url;

  -- Check if user already has a family
  SELECT family_id INTO v_family_id
  FROM family_members
  WHERE user_id = v_user_id
  LIMIT 1;

  -- Create family if none exists
  IF v_family_id IS NULL THEN
    INSERT INTO families (name, default_shares, invite_code, created_by)
    VALUES (p_group_name, 1, p_invite_code, v_user_id)
    RETURNING id INTO v_family_id;

    INSERT INTO family_members (family_id, user_id, role)
    VALUES (v_family_id, v_user_id, 'admin');
  END IF;

  RETURN v_family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

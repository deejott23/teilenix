-- Remove the old DATE-signature version, keep only the TEXT version
DROP FUNCTION IF EXISTS create_trip_for_user(TEXT, TEXT, DATE, DATE, TEXT, UUID, INT);

-- Add cover image URL to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create public storage bucket for trip cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-covers',
  'trip-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
DO $$ BEGIN
  CREATE POLICY "trip_covers_insert"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'trip-covers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Public read access
DO $$ BEGIN
  CREATE POLICY "trip_covers_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'trip-covers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow authenticated users to delete (for replacing images)
DO $$ BEGIN
  CREATE POLICY "trip_covers_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'trip-covers');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Re-add enabled_categories as text array to trips
-- Default: all categories enabled
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS enabled_categories TEXT[] DEFAULT ARRAY[
    'food','transport','accommodation','activities','shopping','health','other'
  ];

NOTIFY pgrst, 'reload schema';

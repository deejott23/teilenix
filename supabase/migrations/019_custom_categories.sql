-- Add custom_categories to trips
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS custom_categories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Change expenses.category from enum to TEXT so custom category keys can be stored
ALTER TABLE expenses
  ALTER COLUMN category TYPE TEXT;

NOTIFY pgrst, 'reload schema';

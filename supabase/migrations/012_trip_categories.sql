-- Add enabled_categories column to trips
-- NULL = all categories enabled (default behaviour)
-- Populated array = only those categories shown in expense form

ALTER TABLE trips ADD COLUMN IF NOT EXISTS enabled_categories text[];

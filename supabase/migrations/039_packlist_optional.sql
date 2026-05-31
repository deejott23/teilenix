-- Make Packliste an optional feature, hidden by default
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS show_packlist boolean NOT NULL DEFAULT false;

-- TeileniX Database Schema
-- Run this in Supabase SQL Editor

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE trip_status AS ENUM ('active', 'ended');
CREATE TYPE expense_category AS ENUM (
  'food', 'transport', 'accommodation', 'activities',
  'shopping', 'health', 'other'
);

-- =============================================
-- TABLES
-- =============================================

-- User profiles (mirrors auth.users, auto-created by trigger)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Families (a group of users that share one "seat" in a trip)
CREATE TABLE families (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  default_shares INT NOT NULL DEFAULT 1 CHECK (default_shares > 0),
  invite_code    TEXT UNIQUE NOT NULL,
  created_by     UUID NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users <-> Families (a user belongs to exactly one family)
CREATE TABLE family_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trips
CREATE TABLE trips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  start_date    DATE,
  end_date      DATE,
  status        trip_status NOT NULL DEFAULT 'active',
  invite_code   TEXT UNIQUE NOT NULL,
  created_by    UUID NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Families participating in a trip
CREATE TABLE trip_families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  shares      INT NOT NULL CHECK (shares > 0),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, family_id)
);

-- Expenses (amounts stored as integer cents to avoid floating point errors)
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by_family  UUID NOT NULL REFERENCES families(id),
  paid_by_user    UUID NOT NULL REFERENCES profiles(id),
  title           TEXT NOT NULL,
  description     TEXT,
  amount_cents    INT NOT NULL CHECK (amount_cents > 0),
  currency        TEXT NOT NULL DEFAULT 'EUR',
  category        expense_category NOT NULL DEFAULT 'other',
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  split_mode      TEXT NOT NULL DEFAULT 'proportional' CHECK (split_mode IN ('proportional', 'custom')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-expense family participation
CREATE TABLE expense_splits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL REFERENCES families(id),
  shares      INT NOT NULL CHECK (shares > 0),
  UNIQUE(expense_id, family_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_family_members_user_id    ON family_members(user_id);
CREATE INDEX idx_family_members_family_id  ON family_members(family_id);
CREATE INDEX idx_trip_families_trip_id     ON trip_families(trip_id);
CREATE INDEX idx_trip_families_family_id   ON trip_families(family_id);
CREATE INDEX idx_expenses_trip_id          ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by_family   ON expenses(paid_by_family);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_family_id  ON expense_splits(family_id);

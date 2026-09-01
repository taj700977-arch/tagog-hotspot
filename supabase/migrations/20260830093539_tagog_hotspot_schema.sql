/*
# TAGOG HOTSPOT - Core schema (single-tenant, no auth)

1. Purpose
- Persist generated Wi-Fi vouchers/cards and connection profiles for the TAGOG HOTSPOT
  MikroTik hotspot management app. The app has no sign-in screen (operator tool), so data
  is intentionally shared and accessed via the anon key.

2. New Tables
- `vouchers`: generated hotspot / user-manager cards.
  - id (uuid pk), username, password, profile (text, speed/profile name),
    time_limit_minutes (int), data_limit_mb (int), price (numeric),
    status (text: active/used/expired/purged), ssid (text),
    mode (text: hotspot / usermanager), expires_at (timestamptz, nullable),
    used_at (timestamptz, nullable), created_at (timestamptz default now()).
- `connection_profiles`: saved router connection settings.
  - id (uuid pk), name (text), host (text), port (int), username (text),
    password (text - stored for operator reuse; operator tool), use_https (bool),
    mode (text: rest / radius), created_at (timestamptz default now()).

3. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD because this is a single-tenant operator
  application with no sign-in screen; all data is intentionally shared.

4. Notes
- No user_id columns and no auth.uid() checks (no auth flow).
- Indexes on frequently-filtered columns (status, created_at).
*/

CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password text NOT NULL,
  profile text NOT NULL DEFAULT 'default',
  time_limit_minutes integer NOT NULL DEFAULT 0,
  data_limit_mb integer NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  ssid text NOT NULL DEFAULT 'TAGOG-HOTSPOT',
  mode text NOT NULL DEFAULT 'hotspot',
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers (status);
CREATE INDEX IF NOT EXISTS idx_vouchers_created ON vouchers (created_at DESC);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vouchers" ON vouchers;
CREATE POLICY "anon_select_vouchers" ON vouchers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vouchers" ON vouchers;
CREATE POLICY "anon_insert_vouchers" ON vouchers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vouchers" ON vouchers;
CREATE POLICY "anon_update_vouchers" ON vouchers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vouchers" ON vouchers;
CREATE POLICY "anon_delete_vouchers" ON vouchers FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS connection_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 443,
  username text NOT NULL DEFAULT 'admin',
  password text NOT NULL DEFAULT '',
  use_https boolean NOT NULL DEFAULT true,
  mode text NOT NULL DEFAULT 'rest',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE connection_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON connection_profiles;
CREATE POLICY "anon_select_profiles" ON connection_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON connection_profiles;
CREATE POLICY "anon_insert_profiles" ON connection_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON connection_profiles;
CREATE POLICY "anon_update_profiles" ON connection_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_profiles" ON connection_profiles;
CREATE POLICY "anon_delete_profiles" ON connection_profiles FOR DELETE
  TO anon, authenticated USING (true);

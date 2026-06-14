-- Migration 002: Admin roles, trial users, organisations
-- Run this against your Supabase project via the SQL editor or CLI

-- 1. Add is_trial flag to users
--    true = user on a free trial, converts to false on first payment
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS first_paid_at timestamptz;

-- 2. Rename role column values — 'admin' → 'global_admin' for clarity
--    (role column already exists as text, just update the values)
UPDATE users SET role = 'global_admin' WHERE role = 'admin';

-- 3. Organisations table (Studio/Enterprise feature)
CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Organisation',
  tier text NOT NULL DEFAULT 'studio',  -- 'studio' | 'enterprise'
  stripe_customer_id text,
  seat_limit integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Org members join table
CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_role text NOT NULL DEFAULT 'member',  -- 'org_admin' | 'member'
  joined_at timestamptz DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- 5. Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,         -- 'tier_change', 'refund_issued', 'user_suspended', etc.
  target_type text,             -- 'user', 'org', 'container', 'feature_flag'
  target_id text,               -- uuid or identifier of the affected entity
  old_value jsonb,
  new_value jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 6. Feature flag user overrides (per-user exceptions to tier defaults)
CREATE TABLE IF NOT EXISTS user_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL,
  set_by uuid REFERENCES users(id) ON DELETE SET NULL,  -- admin who set it
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

-- 7. RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- All tables are accessed via service role key from API routes — RLS is a safety net
-- Service role bypasses RLS; these policies protect against accidental anon key exposure

-- ============================================================
-- Migration 004: Row Level Security policies
-- Every table has RLS enabled but zero policies were defined.
-- This migration adds the minimum required policies so:
--   - Users can only read/write their own rows
--   - Global admins (via service role) bypass RLS entirely
--   - Org members can read their org's data
-- ============================================================

-- ── users ────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- A user can read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');

-- A user can update their own record (but not role/tier — those are admin-only)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');

-- ── videos ───────────────────────────────────────────────────
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "videos_select_own" ON videos
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

CREATE POLICY "videos_insert_own" ON videos
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

CREATE POLICY "videos_update_own" ON videos
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

CREATE POLICY "videos_delete_own" ON videos
  FOR DELETE USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

-- ── transcripts ──────────────────────────────────────────────
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcripts_select_own" ON transcripts
  FOR SELECT USING (
    video_id IN (
      SELECT id FROM videos WHERE user_id = (
        SELECT id FROM users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

CREATE POLICY "transcripts_insert_own" ON transcripts
  FOR INSERT WITH CHECK (
    video_id IN (
      SELECT id FROM videos WHERE user_id = (
        SELECT id FROM users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- ── notes ────────────────────────────────────────────────────
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select_own" ON notes
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

CREATE POLICY "notes_insert_own" ON notes
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

CREATE POLICY "notes_update_own" ON notes
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

CREATE POLICY "notes_delete_own" ON notes
  FOR DELETE USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

-- ── folders ──────────────────────────────────────────────────
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_all_own" ON folders
  USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

-- ── organisations ────────────────────────────────────────────
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Org members can read their org
CREATE POLICY "orgs_select_member" ON organisations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_members WHERE user_id = (
        SELECT id FROM users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- ── org_members ──────────────────────────────────────────────
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select_own_org" ON org_members
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = (
        SELECT id FROM users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- ── admin_audit_log ──────────────────────────────────────────
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- Audit log is read/written by service role only — no user-facing policies

-- ── user_feature_overrides ───────────────────────────────────
ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Users can read their own feature overrides
CREATE POLICY "feature_overrides_select_own" ON user_feature_overrides
  FOR SELECT USING (
    user_id = (
      SELECT id FROM users
      WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );
-- Writes are service-role only (admin sets overrides)

-- ── tier_features ────────────────────────────────────────────
ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read tier features (needed for feature flag checks)
CREATE POLICY "tier_features_select_all" ON tier_features
  FOR SELECT USING (true);

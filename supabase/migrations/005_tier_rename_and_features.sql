-- ============================================================
-- Migration 005: Rename tiers + expand feature flags
-- explorer → starter, creator → pro
-- Add config JSONB column for per-tier limits
-- Add new feature keys from the product spec
-- ============================================================

-- ── 1. Add config column for limits ─────────────────────────
ALTER TABLE tier_features ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- ── 2. Rename tiers in users table ──────────────────────────
UPDATE users SET tier = 'starter' WHERE tier = 'explorer';
UPDATE users SET tier = 'pro'     WHERE tier = 'creator';

-- ── 3. Rename tiers in tier_features ────────────────────────
UPDATE tier_features SET tier = 'starter' WHERE tier = 'explorer';
UPDATE tier_features SET tier = 'pro'     WHERE tier = 'creator';

-- ── 4. Update users.tier CHECK constraint ───────────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tier_check;
ALTER TABLE users ADD CONSTRAINT users_tier_check
  CHECK (tier IN ('starter', 'pro', 'studio', 'enterprise'));

-- ── 5. Clear and re-seed tier_features with full spec ───────
DELETE FROM tier_features;

INSERT INTO tier_features (tier, feature_key, enabled, config) VALUES

-- ── STARTER (free trial, 5 videos total lifetime) ───────────
('starter', 'transcribe',              true,  '{"monthly_credits": 5, "credit_type": "lifetime"}'),
('starter', 'credit_rollover',         false, '{}'),
('starter', 'transcript_viewer',       true,  '{}'),
('starter', 'timestamped_sentences',   true,  '{}'),
('starter', 'transcript_search',       true,  '{}'),
('starter', 'notes',                   false, '{}'),
('starter', 'export_txt',              true,  '{}'),
('starter', 'export_pdf',              false, '{}'),
('starter', 'export_audio_video',      false, '{}'),
('starter', 'link_screenshots',        false, '{}'),
('starter', 'folders',                 false, '{}'),
('starter', 'share_links',             false, '{}'),
('starter', 'ai_chapters',             false, '{}'),
('starter', 'scheduled_transcription', false, '{}'),
('starter', 'transcript_correction',   false, '{}'),
('starter', 'priority_processing',     false, '{}'),
('starter', 'organisations',           false, '{}'),
('starter', 'api_access',              false, '{}'),
('starter', 'team_seats',              false, '{}'),

-- ── PRO (10 videos/month, 1-month rollover) ──────────────────
('pro', 'transcribe',              true,  '{"monthly_credits": 10, "credit_type": "monthly"}'),
('pro', 'credit_rollover',         true,  '{"rollover_months": 1}'),
('pro', 'transcript_viewer',       true,  '{}'),
('pro', 'timestamped_sentences',   true,  '{}'),
('pro', 'transcript_search',       true,  '{}'),
('pro', 'notes',                   false, '{}'),
('pro', 'export_txt',              true,  '{}'),
('pro', 'export_pdf',              true,  '{}'),
('pro', 'export_audio_video',      false, '{}'),
('pro', 'link_screenshots',        true,  '{"limit": 5}'),
('pro', 'folders',                 true,  '{}'),
('pro', 'share_links',             true,  '{"expiry_days": 10}'),
('pro', 'ai_chapters',             false, '{}'),
('pro', 'scheduled_transcription', false, '{}'),
('pro', 'transcript_correction',   false, '{}'),
('pro', 'priority_processing',     false, '{}'),
('pro', 'organisations',           false, '{}'),
('pro', 'api_access',              false, '{}'),
('pro', 'team_seats',              false, '{}'),

-- ── STUDIO (40 videos/month, 1-month rollover) ───────────────
('studio', 'transcribe',              true,  '{"monthly_credits": 40, "credit_type": "monthly"}'),
('studio', 'credit_rollover',         true,  '{"rollover_months": 1}'),
('studio', 'transcript_viewer',       true,  '{}'),
('studio', 'timestamped_sentences',   true,  '{}'),
('studio', 'transcript_search',       true,  '{}'),
('studio', 'notes',                   true,  '{}'),
('studio', 'export_txt',              true,  '{}'),
('studio', 'export_pdf',              true,  '{}'),
('studio', 'export_audio_video',      true,  '{}'),
('studio', 'link_screenshots',        true,  '{"limit": null}'),
('studio', 'folders',                 true,  '{"limit": 10}'),
('studio', 'share_links',             true,  '{"expiry_days": 30}'),
('studio', 'ai_chapters',             true,  '{}'),
('studio', 'scheduled_transcription', true,  '{}'),
('studio', 'transcript_correction',   true,  '{}'),
('studio', 'priority_processing',     false, '{"addon": true}'),
('studio', 'organisations',           true,  '{}'),
('studio', 'api_access',              false, '{}'),
('studio', 'team_seats',              false, '{}'),

-- ── ENTERPRISE (custom per client — base flags only) ─────────
('enterprise', 'transcribe',              true,  '{"monthly_credits": null, "credit_type": "custom"}'),
('enterprise', 'credit_rollover',         true,  '{"rollover_months": null}'),
('enterprise', 'transcript_viewer',       true,  '{}'),
('enterprise', 'timestamped_sentences',   true,  '{}'),
('enterprise', 'transcript_search',       true,  '{}'),
('enterprise', 'notes',                   true,  '{}'),
('enterprise', 'export_txt',              true,  '{}'),
('enterprise', 'export_pdf',              true,  '{}'),
('enterprise', 'export_audio_video',      true,  '{}'),
('enterprise', 'link_screenshots',        true,  '{"limit": null}'),
('enterprise', 'folders',                 true,  '{"limit": null}'),
('enterprise', 'share_links',             true,  '{"expiry_days": null}'),
('enterprise', 'ai_chapters',             true,  '{}'),
('enterprise', 'scheduled_transcription', true,  '{}'),
('enterprise', 'transcript_correction',   true,  '{}'),
('enterprise', 'priority_processing',     true,  '{}'),
('enterprise', 'organisations',           true,  '{}'),
('enterprise', 'api_access',              true,  '{}'),
('enterprise', 'team_seats',              true,  '{}');

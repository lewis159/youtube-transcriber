-- ============================================================
-- Migration 010: Whisper transcription + AI summary foundation
-- Created: 2026-06-17
--
-- ADDITIVE / FULLY REVERSIBLE. This migration only:
--   * adds nullable columns to existing tables (no data rewritten),
--   * creates brand-new tables,
--   * seeds three NEW, default-OFF tier feature flags.
-- It does NOT drop, rename, or change the meaning of any existing
-- column, value, table, or flag. Idempotent via IF NOT EXISTS.
--
-- Rollback: see 010_whisper_summary_down.sql
-- ============================================================

-- ── 1. transcripts: provenance + engine metadata ────────────
-- Existing rows keep working: every column is nullable and the only
-- defaulted column (source) defaults to 'youtube', i.e. the current
-- behaviour. Whisper-produced transcripts set source = 'whisper'.
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS source             TEXT DEFAULT 'youtube';
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS engine             TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS detected_language  TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS confidence         REAL;

-- Document the allowed values for `source` without forcing a hard
-- constraint on legacy rows. (No CHECK added so existing/NULL rows
-- and future values stay valid — additive only.)
COMMENT ON COLUMN transcripts.source IS 'Transcript provenance: ''youtube'' (caption scrape) | ''whisper'' (in-house STT). Default ''youtube''.';
COMMENT ON COLUMN transcripts.engine IS 'STT engine identifier, e.g. ''faster-whisper-base''. NULL for youtube captions.';

-- ── 2. videos.status: allow new pipeline states ─────────────
-- videos.status is a plain TEXT column with DEFAULT 'pending' and NO
-- CHECK constraint / enum (see migration 001), so the new states
-- 'queued', 'extracting_audio', 'transcribing' are ALREADY permitted
-- by the schema. Nothing to alter; comment documents the extension so
-- the additive intent is recorded and the rollback is a no-op here.
COMMENT ON COLUMN videos.status IS 'Lifecycle: pending|processing|completed|failed plus whisper pipeline states queued|extracting_audio|transcribing. Free-text (no CHECK).';

-- ── 3. transcription_jobs: worker job ledger ────────────────
-- One row per STT attempt for a video. Service/worker-owned table.
CREATE TABLE IF NOT EXISTS transcription_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'queued',   -- queued|extracting_audio|transcribing|completed|failed
  engine      TEXT,
  error       TEXT,
  cost_usd    NUMERIC(10,4),
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcription_jobs_video_id ON transcription_jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_status   ON transcription_jobs(status);

-- ── 4. video_summaries: one AI summary per video ────────────
CREATE TABLE IF NOT EXISTS video_summaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id    UUID NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  summary     TEXT,
  key_points  JSONB DEFAULT '[]',
  chapters    JSONB DEFAULT '[]',
  model       TEXT,
  created_at  TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_summaries_video_id ON video_summaries(video_id);

-- ── 5. RLS — mirror existing transcripts ownership model ────
-- Both new public tables scope to the owning user via videos.user_id,
-- exactly like the transcripts_*_own policies in migration 004.
ALTER TABLE transcription_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcription_jobs_select_own" ON transcription_jobs
  FOR SELECT USING (
    video_id IN (
      SELECT id FROM videos WHERE user_id = (
        SELECT id FROM users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_summaries_select_own" ON video_summaries
  FOR SELECT USING (
    video_id IN (
      SELECT id FROM videos WHERE user_id = (
        SELECT id FROM users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- (Writes happen via the service-role client in the worker / API, which
--  bypasses RLS — same pattern the rest of the app uses for inserts.)

-- ── 6. Feature flags — NEW keys, OFF for every tier ─────────
-- Registered in the DB-driven tier_features table (the same system the
-- export route reads via checkUserFeature('export_pdf')). All three are
-- seeded enabled=false for every tier so behaviour is unchanged until a
-- tier is explicitly switched on. ON CONFLICT keeps this idempotent and
-- non-destructive to any manually-set values.
INSERT INTO tier_features (tier, feature_key, enabled, config) VALUES
  ('starter',    'stt_fallback', false, '{}'),
  ('pro',        'stt_fallback', false, '{}'),
  ('studio',     'stt_fallback', false, '{}'),
  ('enterprise', 'stt_fallback', false, '{}'),

  ('starter',    'ai_summary',   false, '{}'),
  ('pro',        'ai_summary',   false, '{}'),
  ('studio',     'ai_summary',   false, '{}'),
  ('enterprise', 'ai_summary',   false, '{}'),

  ('starter',    'summary_chat', false, '{}'),
  ('pro',        'summary_chat', false, '{}'),
  ('studio',     'summary_chat', false, '{}'),
  ('enterprise', 'summary_chat', false, '{}')
ON CONFLICT (tier, feature_key) DO NOTHING;

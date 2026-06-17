-- ============================================================
-- Migration 011: Event logs + per-user local transcription opt-in
-- Created: 2026-06-17
--
-- ADDITIVE / FULLY REVERSIBLE. This migration only:
--   * creates a brand-new table (event_logs) for lifecycle/error logs,
--   * adds one nullable-safe column (default false) to existing users.
-- It does NOT drop, rename, or change the meaning of any existing
-- column, value, table, or flag. Idempotent via IF NOT EXISTS.
--
-- Rollback: see 011_event_logs_down.sql
-- ============================================================

-- ── 1. event_logs: transcription lifecycle + error logging ──
-- One row per logged event from the app or worker. Service/worker-owned
-- table: writes happen via the service-role client (which bypasses RLS),
-- and the admin Log Viewer reads via the service client server-side.
-- video_id uses ON DELETE SET NULL (not CASCADE like 010's job tables)
-- so logs survive deletion of the video they reference.
CREATE TABLE IF NOT EXISTS event_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT now(),
  level       TEXT NOT NULL DEFAULT 'info',      -- info|warn|error
  source      TEXT NOT NULL,                      -- app|worker
  event       TEXT NOT NULL,                      -- video_added|queued|extracting_audio|captions_found|whisper_fallback|transcribing|completed|error|...
  video_id    UUID REFERENCES videos(id) ON DELETE SET NULL,
  user_id     UUID,
  message     TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb
);

COMMENT ON COLUMN event_logs.level  IS 'Severity: ''info'' | ''warn'' | ''error''. Default ''info''.';
COMMENT ON COLUMN event_logs.source IS 'Origin of the event: ''app'' | ''worker''.';
COMMENT ON COLUMN event_logs.event  IS 'Lifecycle event key, e.g. video_added, queued, extracting_audio, captions_found, whisper_fallback, transcribing, completed, error.';

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_video_id   ON event_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_level      ON event_logs(level);
CREATE INDEX IF NOT EXISTS idx_event_logs_event      ON event_logs(event);
CREATE INDEX IF NOT EXISTS idx_event_logs_source     ON event_logs(source);

-- ── 2. RLS — service-role write, admin-read server-side ─────
-- Mirrors 010's posture: RLS is enabled and no permissive policy is
-- granted to end users, so all access flows through the service-role
-- client (worker writes + admin Log Viewer reads), which bypasses RLS.
-- Unlike 010's transcription_jobs / video_summaries, event logs are NOT
-- owner-scoped: there is intentionally no per-user SELECT policy here
-- because the Log Viewer is admin-only and reads via the service client.
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- (Writes happen via the service-role client in the worker / API, and
--  reads happen via the service-role client in the admin Log Viewer —
--  both bypass RLS, same pattern the rest of the app uses.)

-- ── 3. users.local_transcription_enabled: per-user opt-in ───
-- Additive, defaults false so every existing row keeps current
-- behaviour (opt-in only, within an allowed tier).
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_transcription_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.local_transcription_enabled IS 'Per-user opt-in for in-house local transcription (within an allowed tier). Default false.';

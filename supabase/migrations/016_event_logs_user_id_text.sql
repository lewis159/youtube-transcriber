-- ============================================================
-- Migration 016: event_logs.user_id  uuid -> text
--
-- Both the app (lib/event-log.ts) and the worker log events with the CLERK user
-- id (e.g. "user_3FAz...") as user_id, but the column was typed `uuid` with NO
-- foreign key. So EVERY event_logs insert failed with:
--    invalid input syntax for type uuid: "user_3FAz..."  (SQLSTATE 22P02)
-- → event_logs stayed empty → the admin Logs / Security page showed nothing.
--
-- user_id has no FK and the admin viewer (/api/admin/logs) reads it raw, so the
-- correct, minimal fix is to widen it to text. No app/worker code change needed.
--
-- Rollback: 016_event_logs_user_id_text_down.sql
-- ============================================================
ALTER TABLE public.event_logs
  ALTER COLUMN user_id TYPE text USING user_id::text;

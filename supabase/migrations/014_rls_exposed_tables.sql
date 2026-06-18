-- ============================================================
-- Migration 014: Enable RLS on exposed tables (security advisor finding)
--
-- These 3 tables had Row-Level Security DISABLED, so anyone with the public
-- anon key (which ships in the browser bundle) could read/write every row.
--
-- The app + worker access these SERVER-SIDE via the service-role key, which
-- BYPASSES RLS — so enabling RLS here does NOT break server-side access. The
-- policies below only govern direct anon/authenticated access (which today is
-- effectively none for these tables → they become locked to the service role,
-- except video_transcript_text which gets a proper owner-scoped read policy).
--
-- (The bsn_* public-news tables are handled separately in migration 015 because
--  they belong to the Springsteen news project and need public READ preserved.)
--
-- Rollback: 014_rls_exposed_tables_down.sql
-- ============================================================

-- ── video_transcript_text — user content (full-text search store) ───────────
-- Owner-scoped via video_id → videos.user_id, mirroring the `transcripts`
-- policy in migration 004. Writes come from the worker (service role) so no
-- anon write policy is needed.
ALTER TABLE public.video_transcript_text ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vtt_select_own" ON public.video_transcript_text
  FOR SELECT USING (
    video_id IN (
      SELECT id FROM public.videos WHERE user_id = (
        SELECT id FROM public.users
        WHERE clerk_user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- ── organizations — LEGACY DUPLICATE of `organisations` (British spelling, ──
-- which already has RLS in migration 004). Only the stale root app/ ever
-- referenced this; canonical app-ha uses `organisations`. Lock to service-role
-- only (no user policy). TODO: confirm nothing live uses it, then DROP.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ── ha_test — throwaway HA connectivity-test table. Lock down. ──────────────
-- TODO: safe to DROP entirely once confirmed unused.
ALTER TABLE public.ha_test ENABLE ROW LEVEL SECURITY;

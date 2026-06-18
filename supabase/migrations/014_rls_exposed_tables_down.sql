-- Rollback for 014_rls_exposed_tables.sql — restores the prior (RLS-off) state.
DROP POLICY IF EXISTS "vtt_select_own" ON public.video_transcript_text;
ALTER TABLE public.video_transcript_text DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ha_test DISABLE ROW LEVEL SECURITY;

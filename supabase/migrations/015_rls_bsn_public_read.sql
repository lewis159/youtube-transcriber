-- ============================================================
-- Migration 015: RLS for the Springsteen-news (bsn_*) tables — HELD
--
-- ⚠️ DO NOT APPLY until the Springsteen-news project's write path is confirmed.
--
-- bsn_sources / bsn_articles belong to the SEPARATE `springsteen-news` project
-- (parked in this same Supabase project). They hold PUBLIC news data — no user
-- ownership — so the fix is: enable RLS, keep PUBLIC READ, and restrict WRITES
-- to the service role (the scraper).
--
-- ASSUMPTION: the Springsteen scraper writes via the SERVICE-ROLE key (which
-- bypasses RLS). If that app instead writes via the ANON key, these policies
-- will BLOCK its inserts/updates — confirm before applying. springsteen-news is
-- not checked out locally and has no references in this repo, so it could not
-- be verified here.
--
-- Rollback: 015_rls_bsn_public_read_down.sql
-- ============================================================

ALTER TABLE public.bsn_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bsn_articles_public_read" ON public.bsn_articles
  FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy → writes only via service role.

ALTER TABLE public.bsn_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bsn_sources_public_read" ON public.bsn_sources
  FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy → writes only via service role.

-- Rollback for 015_rls_bsn_public_read.sql — restores the prior (RLS-off) state.
DROP POLICY IF EXISTS "bsn_articles_public_read" ON public.bsn_articles;
DROP POLICY IF EXISTS "bsn_sources_public_read" ON public.bsn_sources;
ALTER TABLE public.bsn_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsn_sources DISABLE ROW LEVEL SECURITY;

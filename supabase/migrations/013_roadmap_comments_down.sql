-- ============================================================
-- Migration 013 — ROLLBACK / TEARDOWN
-- Reverts 013_roadmap_comments.sql completely and cleanly.
-- Removes the roadmap item update threads (comments).
-- Safe to run more than once (guarded with IF EXISTS).
--
-- NOTE: This restores the schema to its pre-013 shape. It does NOT
-- touch any pre-existing column, table, flag, or status value beyond
-- the objects this migration created. Reverse order of creation:
-- index → table → unique constraint.
-- ============================================================

-- ── drop index ──────────────────────────────────────────────
DROP INDEX IF EXISTS public.roadmap_comments_item_idx;

-- ── drop table (cascades the FKs it owns) ───────────────────
DROP TABLE IF EXISTS public.roadmap_comments;

-- ── drop the UNIQUE constraint added to roadmap_items ───────
ALTER TABLE public.roadmap_items
  DROP CONSTRAINT IF EXISTS roadmap_items_item_key_key;

-- ============================================================
-- Migration 013: Roadmap item update threads (comments)
-- Created: 2026-06-18
--
-- ADDITIVE / FULLY REVERSIBLE. Adds an admin-only "updates" thread
-- to each roadmap item — global admins post timestamped, attributed
-- progress updates per item. Modelled on the Sentinel ops.comments
-- pattern (009_ops_sentinel.sql).
--
-- This migration does NOT drop, rename, or change the meaning of any
-- existing column, value, table, or flag. It adds one UNIQUE constraint
-- to roadmap_items(item_key) (so it can be an FK target) plus one new
-- table. Idempotent via IF NOT EXISTS guards.
--
-- RLS is ENABLED on the new table with NO public policies — reads/writes
-- go through the service-role client (supabaseAdmin), which bypasses RLS,
-- exactly matching roadmap_items (migration 006).
--
-- Rollback: see 013_roadmap_comments_down.sql
-- ============================================================

-- ── roadmap_items.item_key UNIQUE ───────────────────────────
-- item_key is the human-facing # (1..74) and is already unique in the
-- seed data. Promote it to a UNIQUE constraint so roadmap_comments can
-- reference it as an FK target. Guarded so re-running is a no-op.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'roadmap_items_item_key_key'
  ) THEN
    ALTER TABLE public.roadmap_items
      ADD CONSTRAINT roadmap_items_item_key_key UNIQUE (item_key);
  END IF;
END $$;

-- ── roadmap_comments ────────────────────────────────────────
-- One row per posted update. item_key (not the uuid id) is the join key
-- because the UI identifies items by item_key. author_user_id is nullable
-- + ON DELETE SET NULL so deleting a user never deletes their updates.
CREATE TABLE IF NOT EXISTS public.roadmap_comments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key       int NOT NULL REFERENCES public.roadmap_items(item_key) ON DELETE CASCADE,
  author_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  body           text NOT NULL,
  kind           text NOT NULL DEFAULT 'update' CHECK (kind IN ('update', 'status_change', 'system')),
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_comments_item_idx
  ON public.roadmap_comments (item_key, created_at DESC);

ALTER TABLE public.roadmap_comments ENABLE ROW LEVEL SECURITY;
-- No policies: read/write server-side via service-role client (bypasses RLS).

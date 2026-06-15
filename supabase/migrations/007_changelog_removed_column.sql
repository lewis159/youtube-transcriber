-- ============================================================
-- Migration 007: add a "removed" section to changelog entries
-- Follows the Keep a Changelog convention (Added / Changed / Removed).
-- ============================================================

ALTER TABLE changelog_entries
  ADD COLUMN IF NOT EXISTS removed text[] NOT NULL DEFAULT '{}';

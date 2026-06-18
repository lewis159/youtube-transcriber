#!/usr/bin/env bash
# =============================================================================
# 05-verify.sh — Runbook Step 6 (Verify the migrated data).
# =============================================================================
# READ-ONLY against BOTH databases. Per-table row-count comparison cloud vs
# self-hosted for the public + ops tables the runbook lists. Exits NON-ZERO on
# any mismatch (or any table that fails to count), so it is safe to gate the
# orchestrator on its exit code.
#
# The deeper Step-6 checks the runbook also lists (FK integrity spot-checks,
# jsonb round-trip, the PostgREST embedded-join curl) are interactive/judgement
# calls and are NOT automated here — they remain manual operator checks. This
# script covers the mechanical, automatable part: row-count parity.
#
# ENV REQUIRED:
#   CLOUD_DSN     read-only DSN to the cloud source
#   TARGET_DSN    DSN to the self-hosted target
#
# USAGE:
#   ./05-verify.sh
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "Verify migrated data — row-count parity (Runbook Step 6)"

require_env CLOUD_DSN TARGET_DSN
require_tool psql

# Table lists copied verbatim from the runbook's Step 6 loops.
PUBLIC_TABLES=(
  users videos transcripts notes folders video_folders share_links
  credit_transactions tier_features organisations org_members
  admin_audit_log user_feature_overrides changelog_entries roadmap_items
)
OPS_TABLES=(
  components findings tickets comments links container_snapshots rules alerts
)

# count_rows DSN SCHEMA TABLE -> echoes the integer count, or empty on failure.
count_rows() {
  local dsn="$1" schema="$2" table="$3"
  psql "$dsn" -tAc "select count(*) from ${schema}.${table};" 2>/dev/null | tr -d '[:space:]'
}

mismatches=0
errors=0

compare_table() {
  local schema="$1" table="$2" cloud local_
  cloud="$(count_rows "$CLOUD_DSN" "$schema" "$table")"
  local_="$(count_rows "$TARGET_DSN" "$schema" "$table")"
  if [[ -z "$cloud" || -z "$local_" ]]; then
    err  "${schema}.${table}  cloud=${cloud:-ERR}  local=${local_:-ERR}  (count failed)"
    errors=$((errors + 1))
    return
  fi
  if [[ "$cloud" == "$local_" ]]; then
    log "${schema}.${table}  cloud=$cloud  local=$local_  OK"
  else
    err "${schema}.${table}  cloud=$cloud  local=$local_  MISMATCH"
    mismatches=$((mismatches + 1))
  fi
}

log "Comparing public.* tables..."
for t in "${PUBLIC_TABLES[@]}"; do compare_table public "$t"; done

log "Comparing ops.* tables..."
for t in "${OPS_TABLES[@]}"; do compare_table ops "$t"; done

echo >&2
if [[ "$mismatches" -gt 0 || "$errors" -gt 0 ]]; then
  err "Verification FAILED: $mismatches mismatch(es), $errors count error(s)."
  err "Do NOT proceed to the app cutover (Step 7) until counts match."
  exit 1
fi

log "Row-count parity PASSED for all listed tables."
warn "Reminder: still run the MANUAL Step-6 checks (FK spot-checks, jsonb round-trip, PostgREST embedded-join curl) before cutover — see DB_MIGRATION_RUNBOOK.md."

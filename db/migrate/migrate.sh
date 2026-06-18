#!/usr/bin/env bash
# =============================================================================
# migrate.sh — orchestrator for the cloud -> self-hosted DB migration.
# =============================================================================
# Runs, in the runbook's order:
#   00-preflight   (Step 0)  -> read-only checks
#   01-load-schema (Step 2)  -> roles + schema + migrations onto SELF-HOSTED
#   02-mint-jwt    (Step 3)  -> mint anon + service_role JWTs (printed)
#   03-export-cloud(Step 4)  -> pg_dump --data-only from CLOUD (read-only)
#   04-restore     (Steps 4b+5) -> TRUNCATE tier_features + restore (DESTRUCTIVE)
#   05-verify      (Step 6)  -> row-count parity, read-only
#
# It NEVER runs:
#   * Step 1 (docker stack deploy) — infra stand-up is operator-driven.
#   * Step 7 (the app env-var flip / cutover) — stays MANUAL by design.
#   * Step 8/9 (smoke test, soak, decommission) — manual.
#
# SAFETY MODEL:
#   * DEFAULT = --dry-run: prints exactly what it WOULD run, touches nothing.
#   * --execute is REQUIRED to actually run.
#   * The destructive restore additionally needs --confirm (passed through),
#     otherwise 04-restore.sh falls back to its interactive typed-target guard.
#
# ENV REQUIRED (see each sub-script; preflight checks them all):
#   TARGET_DSN  CLOUD_DSN  PG_AUTHENTICATOR_PASSWORD  PGRST_JWT_SECRET
#
# USAGE:
#   ./migrate.sh                    # dry-run (default) — prints the plan
#   ./migrate.sh --execute --confirm
#   ./migrate.sh --execute          # restore step will prompt for typed target
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

DRY_RUN=1
CONFIRM=0
for arg in "$@"; do
  case "$arg" in
    --execute) DRY_RUN=0 ;;
    --dry-run) DRY_RUN=1 ;;
    --confirm) CONFIRM=1 ;;
    -h|--help)
      grep -E '^#( |$)' "$0" | sed 's/^# \{0,1\}//' >&2
      exit 0 ;;
    *) die "Unknown argument: $arg (accepted: --execute, --dry-run, --confirm, --help)" ;;
  esac
done
export CONFIRM

CONFIRM_FLAG=()
[[ "$CONFIRM" == "1" ]] && CONFIRM_FLAG=(--confirm)

# run_step "Label" script.sh [args...]
# In dry-run, only prints. In execute, runs and aborts the orchestrator on
# failure (set -e + explicit check).
run_step() {
  local label="$1"; shift
  local script="$1"; shift
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '  [DRY-RUN] would run: %s %s   (%s)\n' "$script" "$*" "$label" >&2
    return 0
  fi
  step "$label"
  bash "$MIGRATE_DIR/$script" "$@"
}

if [[ "$DRY_RUN" == "1" ]]; then
  warn "DRY-RUN (default). Nothing will be executed. Re-run with --execute to perform the migration."
  echo >&2
  echo "Planned sequence:" >&2
fi

# --- the sequence ------------------------------------------------------------
run_step "Step 0 — preflight"        00-preflight.sh
run_step "Step 2 — load schema"      01-load-schema.sh   "${CONFIRM_FLAG[@]}"

# Mint step prints tokens on stdout. In execute mode, surface them clearly.
if [[ "$DRY_RUN" == "1" ]]; then
  printf '  [DRY-RUN] would run: 02-mint-jwt.sh   (Step 3 — mint JWTs; prints anon + service_role)\n' >&2
else
  step "Step 3 — mint JWTs"
  warn "The two lines below are the anon and service_role keys. Capture them into your secret store."
  bash "$MIGRATE_DIR/02-mint-jwt.sh"
fi

# Export prints the dump path on its last stdout line; capture it for restore.
if [[ "$DRY_RUN" == "1" ]]; then
  printf '  [DRY-RUN] would run: 03-export-cloud.sh   (Step 4 — pg_dump --data-only from CLOUD)\n' >&2
  printf '  [DRY-RUN] would run: 04-restore.sh --confirm <dump>   (Steps 4b+5 — DESTRUCTIVE restore)\n' >&2
  printf '  [DRY-RUN] would run: 05-verify.sh   (Step 6 — row-count parity)\n' >&2
else
  step "Step 4 — export cloud data"
  DUMP_PATH="$(bash "$MIGRATE_DIR/03-export-cloud.sh" | tail -n1)"
  [[ -n "$DUMP_PATH" && -f "$DUMP_PATH" ]] || die "Export did not yield a dump file."
  log "Dump file: $DUMP_PATH"

  step "Steps 4b+5 — restore into self-hosted"
  bash "$MIGRATE_DIR/04-restore.sh" "${CONFIRM_FLAG[@]}" "$DUMP_PATH"

  run_step "Step 6 — verify row counts" 05-verify.sh
fi

echo >&2
if [[ "$DRY_RUN" == "1" ]]; then
  warn "End of dry-run plan. No changes were made."
else
  log "Data migration sequence complete (Steps 0,2,3,4,4b,5,6)."
  warn "NEXT (MANUAL): Step 7 app cutover (flip the 3 env vars), Step 8 smoke test, Step 9 soak. See DB_MIGRATION_RUNBOOK.md. The cutover is intentionally NOT automated."
fi

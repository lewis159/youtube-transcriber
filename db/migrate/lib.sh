#!/usr/bin/env bash
# =============================================================================
# lib.sh — shared helpers for the db/migrate/* cutover scripts.
# =============================================================================
# Sourced by every 0x-*.sh script and migrate.sh. NOT meant to be run directly.
# Provides: coloured logging, env-var assertions, tool checks, and a typed
# confirmation guard for destructive operations.
# =============================================================================
set -euo pipefail

# --- logging -----------------------------------------------------------------
# All log output goes to stderr so that scripts which print a "value" on stdout
# (e.g. 02-mint-jwt.sh printing tokens) keep stdout clean and capturable.
_ts() { date -u +'%Y-%m-%dT%H:%M:%SZ'; }
log()  { printf '%s [INFO ] %s\n'  "$(_ts)" "$*" >&2; }
warn() { printf '%s [WARN ] %s\n'  "$(_ts)" "$*" >&2; }
err()  { printf '%s [ERROR] %s\n'  "$(_ts)" "$*" >&2; }
step() { printf '\n%s [STEP ] === %s ===\n' "$(_ts)" "$*" >&2; }
die()  { err "$*"; exit 1; }

# --- env assertions ----------------------------------------------------------
# require_env VAR [VAR ...] — die if any named env var is unset OR empty.
require_env() {
  local missing=0 v
  for v in "$@"; do
    if [[ -z "${!v:-}" ]]; then
      err "Required env var not set: $v"
      missing=1
    fi
  done
  [[ "$missing" -eq 0 ]] || die "Set the missing env var(s) above and re-run."
}

# --- tool checks -------------------------------------------------------------
# require_tool NAME [NAME ...] — die if any command is not on PATH.
require_tool() {
  local missing=0 t
  for t in "$@"; do
    if ! command -v "$t" >/dev/null 2>&1; then
      err "Required tool not found on PATH: $t"
      missing=1
    fi
  done
  [[ "$missing" -eq 0 ]] || die "Install the missing tool(s) above and re-run."
}

# --- read-only DB reachability ----------------------------------------------
# db_reachable LABEL DSN — run a trivial read-only query; return non-zero on
# failure. Does NOT write to the database.
db_reachable() {
  local label="$1" dsn="$2"
  if psql "$dsn" -tAc 'SELECT 1;' >/dev/null 2>&1; then
    log "Reachable: $label"
    return 0
  fi
  err "NOT reachable: $label"
  return 1
}

# --- destructive-op guard ----------------------------------------------------
# confirm_target TARGET_DSN — extract the host[:port]/db from a DSN and require
# the operator to type it back. Bypassed when CONFIRM=1 is exported (set by a
# --confirm flag). Refuses to proceed otherwise. STDIN must be a TTY for the
# interactive path.
confirm_target() {
  local dsn="$1" shown
  # Strip credentials for display: postgres://user:pass@host:port/db -> host:port/db
  shown="$(printf '%s' "$dsn" | sed -E 's#^[a-zA-Z]+://([^@]*@)?##')"
  if [[ "${CONFIRM:-0}" == "1" ]]; then
    warn "Destructive step auto-confirmed via --confirm flag. Target: $shown"
    return 0
  fi
  if [[ ! -t 0 ]]; then
    die "Destructive step needs confirmation but STDIN is not a TTY. Re-run with --confirm (only if you are certain of the target: $shown)."
  fi
  warn "About to perform a DESTRUCTIVE operation against: $shown"
  printf 'Type the target identifier shown above EXACTLY to proceed: ' >&2
  local typed
  IFS= read -r typed
  [[ "$typed" == "$shown" ]] || die "Confirmation mismatch ('$typed' != '$shown'). Aborting; nothing changed."
  log "Target confirmed: $shown"
}

# --- repo paths --------------------------------------------------------------
# MIGRATE_DIR is the directory containing this lib (db/migrate). REPO_ROOT is
# two levels up. Set once; reused by sourcing scripts.
MIGRATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$MIGRATE_DIR/../.." && pwd)"
export MIGRATE_DIR REPO_ROOT

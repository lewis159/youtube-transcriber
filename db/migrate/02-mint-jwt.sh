#!/usr/bin/env bash
# =============================================================================
# 02-mint-jwt.sh — Runbook Step 3 (Mint the app keys).
# =============================================================================
# Implements db/mint-jwt.md: sign two long-lived HS256 JWTs with
# PGRST_JWT_SECRET. Claims match Supabase's GoTrue-issued keys so supabase-js is
# happy:
#     anon         -> { "role": "anon",         "iss": "supabase" }
#     service_role -> { "role": "service_role", "iss": "supabase" }
# No `exp` (unexpiring, matching Supabase defaults).
#
# These tokens become the app's:
#     anon         -> NEXT_PUBLIC_SUPABASE_ANON_KEY
#     service_role -> SUPABASE_SERVICE_ROLE_KEY
#
# Tokens are printed to STDOUT (one per line, anon then service_role) so they
# can be captured into the operator's secret store. They are NEVER written to
# disk by this script. All logging goes to stderr.
#
# Prefers Node (jsonwebtoken, per the doc's Option A); falls back to Python
# (pyjwt, Option B). NOTE: db/mint-jwt.md does NOT describe an openssl path, so
# this script does not invent one.
#
# ENV REQUIRED:
#   PGRST_JWT_SECRET   the EXACT stack secret (min 32 chars)
#
# USAGE:
#   ./02-mint-jwt.sh            # prints: <anon-jwt>\n<service-jwt>
#   ANON=$(./02-mint-jwt.sh | sed -n 1p); SVC=$(./02-mint-jwt.sh | sed -n 2p)
# =============================================================================
set -euo pipefail
# shellcheck source=db/migrate/lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

step "Mint anon + service_role JWTs (Runbook Step 3)"

require_env PGRST_JWT_SECRET
if [[ "${#PGRST_JWT_SECRET}" -lt 32 ]]; then
  die "PGRST_JWT_SECRET must be at least 32 characters (got ${#PGRST_JWT_SECRET})."
fi

mint_with_node() {
  # $1 = role claim. Prints token on stdout.
  node -e "console.log(require('jsonwebtoken').sign({role:process.argv[1],iss:'supabase'}, process.env.PGRST_JWT_SECRET, {algorithm:'HS256'}))" "$1"
}

mint_with_python() {
  python3 -c "import jwt,os,sys;print(jwt.encode({'role':sys.argv[1],'iss':'supabase'},os.environ['PGRST_JWT_SECRET'],algorithm='HS256'))" "$1"
}

if command -v node >/dev/null 2>&1; then
  log "Minting with node (jsonwebtoken)."
  MINT=mint_with_node
elif command -v python3 >/dev/null 2>&1; then
  log "Minting with python3 (pyjwt)."
  MINT=mint_with_python
else
  die "Neither 'node' nor 'python3' available — cannot mint JWTs (see db/mint-jwt.md)."
fi

log "Signing anon token..."
ANON_JWT="$("$MINT" anon)" || die "Failed to mint anon token (is jsonwebtoken / pyjwt installed? see db/mint-jwt.md)."
log "Signing service_role token..."
SERVICE_JWT="$("$MINT" service_role)" || die "Failed to mint service_role token."

[[ -n "$ANON_JWT" && -n "$SERVICE_JWT" ]] || die "Minting produced an empty token."

warn "Treat the service_role token like a root password (it BYPASSRLS). Do not log or commit it."
log  "Output below: line 1 = anon (NEXT_PUBLIC_SUPABASE_ANON_KEY), line 2 = service_role (SUPABASE_SERVICE_ROLE_KEY)."

# The ONLY things on stdout — capturable, never persisted by this script.
printf '%s\n' "$ANON_JWT"
printf '%s\n' "$SERVICE_JWT"

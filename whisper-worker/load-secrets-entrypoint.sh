#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# whisper-worker secrets→env bridge.
#
# Mirror of deploy/load-secrets-entrypoint.sh, kept local because the worker's
# Docker build context is ./whisper-worker (it cannot COPY from ../deploy).
#
# Loads Docker Swarm secrets mounted at /run/secrets/<name> into the matching
# environment variables, then execs the real worker command. The worker reads its
# config from os.environ (REDIS_PASSWORD, SUPABASE_SERVICE_ROLE_KEY), so no Python
# code changes are required.
#
# BACKWARD COMPATIBLE: a missing secret file is skipped, leaving any existing env
# value untouched — safe to run with or without secrets present.
# ─────────────────────────────────────────────────────────────────────────────
set -e

# The worker only needs these two secrets, but listing the full map is harmless
# (absent files are skipped) and keeps the two scripts in lockstep.
SECRET_MAP="
redis_password:REDIS_PASSWORD
supabase_service_role_key:SUPABASE_SERVICE_ROLE_KEY
anthropic_api_key:ANTHROPIC_API_KEY
"

SECRETS_DIR="${SECRETS_DIR:-/run/secrets}"

for pair in $SECRET_MAP; do
  [ -z "$pair" ] && continue
  file_name="${pair%%:*}"
  var_name="${pair##*:}"
  secret_path="$SECRETS_DIR/$file_name"
  if [ -f "$secret_path" ]; then
    export "$var_name=$(cat "$secret_path")"
  fi
done

exec "$@"

# `db/migrate/` — Cloud Supabase → Self-Hosted DB migration scripts

> # ⚠️ THIS TOUCHES PRODUCTION DATA — READ `DB_MIGRATION_RUNBOOK.md` FIRST ⚠️
>
> These scripts package the operator runbook into runnable form. They are
> **gated and reversible**, but the restore step **writes to (and truncates a
> table on) the self-hosted target**, and the whole flow reads your **live
> cloud Supabase** project. Nothing here flips the app (Step 7) — that stays
> manual. Do a `--dry-run` first. The runbook is the source of truth; if a
> script and the runbook ever disagree, the runbook wins.

## What these are

The repo BUILD never connected to the cloud DB. This directory is the **only**
place the cloud project is read, and only the self-hosted target is written.
Auth is Clerk; the app talks to Supabase purely as Postgres-via-PostgREST, so
the cutover itself is just **3 env vars** on the app.

## Files → runbook steps

| Script             | Runbook step(s)            | Reads        | Writes              | Guard                         |
| ------------------ | -------------------------- | ------------ | ------------------- | ----------------------------- |
| `lib.sh`           | (shared helpers)           | —            | —                   | sourced only, not run         |
| `00-preflight.sh`  | Step 0 (pre-flight)        | both DBs (RO)| —                   | none (read-only)              |
| `01-load-schema.sh`| Step 2 (roles+schema+migrations) | —      | **self-hosted** DDL | `--confirm` / typed target    |
| `02-mint-jwt.sh`   | Step 3 (mint app keys)     | —            | — (prints to stdout)| none                          |
| `03-export-cloud.sh`| Step 4 (pg_dump --data-only)| cloud (RO) | local dump file     | none (read-only on cloud)     |
| `04-restore.sh`    | Steps 4b + 5 (TRUNCATE + restore) | dump  | **self-hosted** data| `--confirm` / typed target    |
| `05-verify.sh`     | Step 6 (row-count parity)  | both DBs (RO)| —                   | none (read-only)              |
| `migrate.sh`       | orchestrates 0,2,3,4,4b,5,6| both DBs     | self-hosted         | `--dry-run` default; `--execute` required |
| `99-rollback.md`   | Rollback (Step 7 reversed) | —            | — (doc only)        | n/a                           |

**Not scripted (manual, by design):**
- Step 1 — `docker stack deploy -c docker-compose.db.yml ytdb` (infra stand-up).
- Step 7 — the app env-var flip (the cutover). `migrate.sh` never runs it.
- Steps 8/9 — full-app smoke test, soak (~2 weeks), cloud decommission.
- The pgBackRest restore test (Step 0 item 1) — see `db/pgbackrest/README.md`.
  `00-preflight.sh` reminds you but cannot verify it.

`01-load-schema.sh` is a thin wrapper that calls the existing
`db/bootstrap/load-schema.sh` (the authoritative loader for `00_roles.sql` →
`supabase/schema.sql` → `supabase/migrations/*.sql`). It is not re-implemented.

## Required environment variables

Set these in your shell before running (names match the runbook /
`docker-compose.db.yml`). **No credentials are hardcoded — everything comes
from the environment.**

| Env var                     | Needed by                                  | Purpose |
| --------------------------- | ------------------------------------------ | ------- |
| `TARGET_DSN`                | preflight, load-schema, restore, verify    | **superuser** DSN to the SELF-HOSTED db, e.g. `postgres://postgres:$PG_SUPERUSER_PASSWORD@<haproxy-host>:5432/$PG_DB` |
| `CLOUD_DSN`                 | preflight, export, verify                  | read-only DSN to the cloud Supabase project (`...@db.<ref>.supabase.co:5432/postgres`) |
| `PG_AUTHENTICATOR_PASSWORD` | preflight, load-schema                     | password for the `authenticator` login role (must match stack env) |
| `PGRST_JWT_SECRET`          | preflight, mint-jwt                        | HS256 secret used to sign the anon/service JWTs (min 32 chars) |

Optional for `03-export-cloud.sh`: `DUMP_DIR` (default `db/migrate/dumps`) or
`DUMP_FILE` (explicit path). Optional for `04-restore.sh`: `REPLICATION_ROLE=1`
(FK-ordering fallback), `SKIP_TRUNCATE=1` (if you filtered `tier_features` out
of the dump instead).

> The minted tokens become the app's `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
> `SUPABASE_SERVICE_ROLE_KEY`. `02-mint-jwt.sh` prints them to stdout and never
> writes them to disk.

## Safety guards (destructive steps)

- **`01-load-schema.sh`** and **`04-restore.sh`** write to the self-hosted DB.
  Each requires either a `--confirm` flag **or** typing the target
  `host:port/db` exactly when prompted (`confirm_target` in `lib.sh`). If stdin
  is not a TTY and `--confirm` was not given, they abort without touching
  anything.
- Every write-capable script refuses to run if `TARGET_DSN` points at a
  `*.supabase.co` host (defends against pointing a destructive op at cloud).
- **`migrate.sh` defaults to `--dry-run`** and prints the plan only; `--execute`
  is required to run, and it still never performs Step 7.
- Read-only scripts (`00-preflight.sh`, `03-export-cloud.sh`, `05-verify.sh`)
  have no guard — they cannot mutate the target.

## Typical run

```bash
# 0. set env
export TARGET_DSN="postgres://postgres:$PG_SUPERUSER_PASSWORD@<haproxy-host>:5432/$PG_DB"
export CLOUD_DSN="postgres://postgres:<cloud-pass>@db.<ref>.supabase.co:5432/postgres"
export PG_AUTHENTICATOR_PASSWORD="<stack value>"
export PGRST_JWT_SECRET="<stack value, >=32 chars>"

# 1. see the plan (touches nothing)
./db/migrate/migrate.sh

# 2. run it for real (restore step auto-confirmed)
./db/migrate/migrate.sh --execute --confirm

# ...or run phases individually:
./db/migrate/00-preflight.sh
./db/migrate/01-load-schema.sh --confirm
./db/migrate/02-mint-jwt.sh                 # capture the 2 printed tokens
DUMP=$(./db/migrate/03-export-cloud.sh | tail -n1)
./db/migrate/04-restore.sh --confirm "$DUMP"
./db/migrate/05-verify.sh

# 3. MANUAL: flip the 3 app env vars (Step 7), smoke test (Step 8), soak (Step 9).
# 4. Rollback if needed: see 99-rollback.md (env-var change only).
```

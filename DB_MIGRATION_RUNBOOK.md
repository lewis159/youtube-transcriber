# DB Migration Runbook — Cloud Supabase → Self-Hosted Postgres + PostgREST

**Status: NOT YET EXECUTED. This is the gated, operator-run procedure.** Nothing
here runs automatically. Every step is manual and reversible. The cutover itself
is a **3-environment-variable change** on the app — no app code changes.

- **Source (cloud):** Supabase project `ygfxzkpkwyqqvibljxpw` (`*.supabase.co`).
- **Target (self-hosted):** the `docker-compose.db.yml` stack
  (Patroni HA Postgres 16 → HAProxy → PgBouncer → PostgREST).
- **App contract:** the app talks to Supabase **only** as Postgres-via-PostgREST
  (auth is Clerk). Confirmed `app-ha/lib/supabase.ts`, `admin-auth.ts`,
  `audit.ts` read exactly these vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

> **CRITICAL — read before touching anything**
> - This runbook is the **only** place the cloud project is read. The BUILD that
>   produced these files never connected to, dumped, or modified the cloud DB.
> - `pg_dump` from cloud is **`--data-only`** (schema comes from our own
>   `schema.sql` + migrations, so the self-hosted schema is authoritative).
> - **`NEXT_PUBLIC_SUPABASE_URL` must NOT contain the string `placeholder`.**
>   `admin-auth.ts` and `audit.ts` treat any URL containing `placeholder` as
>   "not configured" and SKIP the admin role check / audit writes (a dev bypass).
>   The self-hosted URL (e.g. `https://yt-db.bentech.dev` or `http://host:3001`)
>   naturally satisfies this — just don't accidentally use a placeholder value.

---

## Required stack env (set before deploying `docker-compose.db.yml`)

| Env var                     | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `PG_DB`                      | DB PostgREST connects to (e.g. `postgres`)                    |
| `PG_SUPERUSER_PASSWORD`      | Spilo superuser (`postgres`) password                          |
| `PG_ADMIN_PASSWORD`          | Spilo admin role password                                      |
| `PG_STANDBY_PASSWORD`        | Spilo replication/standby password                             |
| `PG_AUTHENTICATOR_PASSWORD`  | password for the PostgREST `authenticator` login role          |
| `PGRST_JWT_SECRET`           | HS256 secret signing the anon/service JWTs (min 32 chars)      |
| `PGBACKREST_S3_BUCKET` …     | OVH Object Storage backup creds — see `db/pgbackrest/README.md`|
| `PGBACKREST_REPO_CIPHER_PASS`| backup encryption-at-rest passphrase                           |

---

## Step 0 — Pre-flight

1. Backups configured + a **restore tested** (`db/pgbackrest/README.md`). Do not
   proceed until a `pgbackrest restore` has succeeded once.
2. Maintenance window agreed. Decide the soak period (default **~2 weeks** with
   the cloud project kept live for instant rollback).
3. All stack env vars above are set.

## Step 1 — Stand up the self-hosted stack

```bash
# Create the HAProxy Swarm config (immutable) from the cfg artifact
docker config create ytdb_haproxy_v1 deploy/haproxy-db.cfg

# (optional) hard anti-affinity + spread labels — see docker-compose.db.yml header
docker node update --label-add pgnode=a <host-1-id>
# docker node update --label-add pgnode=b <host-2-id>   # at 2-host stage

docker stack deploy -c docker-compose.db.yml ytdb
```

Wait for Patroni to elect a leader and HAProxy to mark `/primary` healthy:

```bash
docker service ls | grep ytdb
# exec into a patroni container and check the cluster:
docker exec -it $(docker ps -qf name=ytdb_patroni-a) patronictl list
# expect one Leader + one Replica (or just a Leader on single-node launch)
```

## Step 2 — Load roles + schema + migrations (into the SELF-HOSTED DB only)

```bash
export TARGET_DSN="postgres://postgres:${PG_SUPERUSER_PASSWORD}@<haproxy-host>:5432/${PG_DB}"
export PG_AUTHENTICATOR_PASSWORD="<same as stack env>"
./db/bootstrap/load-schema.sh
```

This runs `00_roles.sql` (creates `anon` / `authenticated` / `service_role` /
`authenticator`) → `schema.sql` → migrations `001..012` in order (skips
`*_down.sql`), then `NOTIFY pgrst, 'reload schema'`. Verify:

```bash
psql "$TARGET_DSN" -c "\dt public.*"   # users, videos, transcripts, notes, ...
psql "$TARGET_DSN" -c "\dn"            # public + ops schemas
psql "$TARGET_DSN" -c "\dg"            # anon, authenticated, service_role, authenticator
```

## Step 3 — Mint the app keys

Per `db/mint-jwt.md`, sign two HS256 JWTs with `PGRST_JWT_SECRET`:

- anon → becomes `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role → becomes `SUPABASE_SERVICE_ROLE_KEY`

Smoke-test PostgREST before importing data:

```bash
curl -s "http://<postgrest-host>:3001/users?select=id&limit=1" \
  -H "Authorization: Bearer $SERVICE_KEY"     # should return [] (empty, no error)
```

## Step 4 — Export data from cloud (`--data-only`)

> Read-only on the cloud side; we never write to it.

```bash
# Connection string from Supabase: Project Settings → Database → Connection string
CLOUD_DSN="postgres://postgres:<cloud-db-pass>@db.ygfxzkpkwyqqvibljxpw.supabase.co:5432/postgres"

pg_dump "$CLOUD_DSN" \
  --data-only \
  --schema=public --schema=ops \
  --no-owner --no-privileges \
  --disable-triggers \
  -f cloud-data.sql
```

Notes:
- `--data-only` because our `schema.sql`+migrations own the structure.
- `--disable-triggers` so the `ops` ref-sequence triggers (SEC-/OPS- numbering)
  don't re-fire and renumber on insert — we want the cloud values verbatim.
- `--no-owner --no-privileges` so cloud role names don't leak in.

### ⚠ `tier_features` seed collision — TRUNCATE before restore

Both `schema.sql` **and** migration `005` seed `public.tier_features`
(005 does `DELETE FROM tier_features` then reseeds `starter/pro/studio/
enterprise`). After Step 2 the self-hosted `tier_features` is ALREADY correctly
seeded by migration 005. The cloud dump will also contain `tier_features` rows.
To avoid duplicate/conflicting rows, **truncate it on the target before restore**
and let the cloud data (the live source of truth) win:

```bash
psql "$TARGET_DSN" -c "TRUNCATE public.tier_features;"
```

(If you'd rather KEEP the migration-005 seed and DROP the cloud copy instead,
filter `tier_features` out of `cloud-data.sql` before Step 5. Pick one.)

## Step 5 — Restore into the self-hosted DB

```bash
psql "$TARGET_DSN" -v ON_ERROR_STOP=1 -f cloud-data.sql
```

If FK ordering errors appear (data-only dumps usually order correctly, but
`--disable-triggers` requires superuser — `TARGET_DSN` is the `postgres`
superuser, so this is fine), re-run inside a single transaction with
`SET session_replication_role = replica;` wrapping the file.

## Step 6 — Verify the migrated data

```bash
# Per-table row counts — compare cloud vs self-hosted (must match)
for t in users videos transcripts notes folders video_folders share_links \
         credit_transactions tier_features organisations org_members \
         admin_audit_log user_feature_overrides changelog_entries roadmap_items; do
  echo -n "$t  cloud="; psql "$CLOUD_DSN"  -tAc "select count(*) from public.$t";
  echo -n "$t  local="; psql "$TARGET_DSN" -tAc "select count(*) from public.$t";
done
# ops schema
for t in components findings tickets comments links container_snapshots rules alerts; do
  echo -n "ops.$t  cloud="; psql "$CLOUD_DSN"  -tAc "select count(*) from ops.$t";
  echo -n "ops.$t  local="; psql "$TARGET_DSN" -tAc "select count(*) from ops.$t";
done
```

- **FK integrity:** `psql "$TARGET_DSN" -c "SELECT conrelid::regclass FROM pg_constraint WHERE contype='f';"`
  then spot-check a few joins (e.g. `videos.user_id` all resolve to `users.id`).
- **jsonb round-trip:** `psql "$TARGET_DSN" -c "SELECT id, jsonb_typeof(content) FROM transcripts LIMIT 3;"`
  and `SELECT new_features FROM changelog_entries LIMIT 3;` — confirm arrays/objects intact.
- **PostgREST embedded join:** the audit-log page uses
  `users:admin_user_id(email, full_name)` (see `audit.ts`). This relies on the
  real FK `admin_audit_log.admin_user_id → users.id` (confirmed present in
  migration 002), which PostgREST auto-detects. Verify:
  ```bash
  curl -s "http://<postgrest-host>:3001/admin_audit_log?select=action,users:admin_user_id(email,full_name)&limit=1" \
    -H "Authorization: Bearer $SERVICE_KEY"
  ```
  Expect a nested `users` object, not an error. (supabase-js `^2.108.1` ↔
  PostgREST v12 — embedded-resource syntax is compatible.)

## Step 7 — Flip the app (the only change)

Set these **3 vars** on the app stack (and the whisper-worker if it reads them)
and redeploy:

```
NEXT_PUBLIC_SUPABASE_URL=http(s)://<postgrest-host>:3001   # NO "placeholder"
NEXT_PUBLIC_SUPABASE_ANON_KEY=<minted anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<minted service_role JWT>
```

```bash
# example, Swarm:
docker service update \
  --env-add NEXT_PUBLIC_SUPABASE_URL=... \
  --env-add NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --env-add SUPABASE_SERVICE_ROLE_KEY=... \
  yt-prod_app
```

## Step 8 — Smoke test (full app)

Run signed in as a real user **and** as a `global_admin`:

- [ ] **Sign in** (Clerk) — lands on dashboard; `getSupabaseUserId` resolves
      (user row read from new DB).
- [ ] **Transcribe** a video — create video row, worker writes status, transcript
      saved (`videos`, `transcripts` insert/update path).
- [ ] **Notes** — create/edit a note on a video; reload persists (`notes` upsert).
- [ ] **Folders / share links** (if on a tier that allows) — create + list.
- [ ] **Changelog page** — entries render (`changelog_entries`, jsonb arrays).
- [ ] **Roadmap page** — items render (`roadmap_items`).
- [ ] **Admin: audit log** — loads with admin email/name resolved (the embedded
      `users:admin_user_id(...)` join — the highest-risk read; verify explicitly).
- [ ] **Admin: perform an admin action** (e.g. credit adjust / tier change) →
      confirm a new `admin_audit_log` row appears AND the admin role check
      actually gates (i.e. URL is not treated as placeholder).
- [ ] **Announcements** (migration 008) render if used.

## Step 9 — Soak & decommission

- Keep cloud Supabase live, untouched, for the soak (~2 weeks).
- Run pgBackRest backups on the self-hosted DB throughout (Step 0 already on).
- After the soak with no issues, decommission the cloud project.

---

## Rollback (instant)

The cutover is env-only, so rollback is too: set the **same 3 vars back to the
cloud values** and redeploy the app.

```
NEXT_PUBLIC_SUPABASE_URL=https://ygfxzkpkwyqqvibljxpw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<original cloud anon key>
SUPABASE_SERVICE_ROLE_KEY=<original cloud service key>
```

Because the cloud project stays live and unmodified during the soak, this is a
zero-data-loss rollback for anything written before cutover. **Data written to
the self-hosted DB during the soak is NOT mirrored back to cloud** — if you roll
back after writes have landed locally, those rows must be re-exported from the
self-hosted DB and loaded into cloud (reverse of Steps 4–5). Keep the window
short and watch the smoke checklist closely right after Step 7.
```

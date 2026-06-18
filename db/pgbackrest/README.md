# pgBackRest — backups for the self-hosted Postgres (OVH Object Storage)

WAL archiving + base backups for the Patroni/Spilo cluster, stored in OVH
Object Storage (S3-compatible), encrypted client-side, with 7-daily / 4-weekly
retention.

> **THIS MUST BE CONFIGURED AND A RESTORE TESTED BEFORE CUTOVER.** A self-hosted
> primary DB with no proven restore is a single point of data loss. Do not flip
> the app's env to the self-hosted DB until `pgbackrest restore` has been
> verified at least once (see "Restore test" below).

`pgbackrest.conf` in this folder is the config; all secrets are
`${PGBACKREST_S3_*}` / `${PGBACKREST_REPO_CIPHER_PASS}` placeholders.

## Required creds / env (set these — never commit real values)

| Env var                        | What                                                |
| ------------------------------ | --------------------------------------------------- |
| `PGBACKREST_S3_BUCKET`         | OVH Object Storage bucket name                      |
| `PGBACKREST_S3_ENDPOINT`       | e.g. `s3.gra.io.cloud.ovh.net` (region-specific)    |
| `PGBACKREST_S3_REGION`         | e.g. `gra`                                          |
| `PGBACKREST_S3_KEY`            | S3 access key id                                    |
| `PGBACKREST_S3_KEY_SECRET`     | S3 secret access key                                |
| `PGBACKREST_REPO_CIPHER_PASS`  | strong passphrase for AES-256 encryption-at-rest    |

## Wiring into Spilo / Patroni

Spilo can drive pgBackRest as its WAL archiver. On the `patroni-a` / `patroni-b`
services in `docker-compose.db.yml`, add (after creds are ready):

```yaml
    environment:
      <<: *spilo-env
      USE_WALG_BACKUP: "false"          # use pgBackRest, not WAL-G
      USE_WALG_RESTORE: "false"
      # Spilo bootstrap hook: install/point pgBackRest at this stanza.
      # (Spilo ships pgbackrest; supply the conf via a mount + render.)
    volumes:
      - patroni-a-data:/home/postgres/pgdata
      - ./db/pgbackrest/pgbackrest.conf:/etc/pgbackrest/pgbackrest.conf:ro
```

Then set Postgres `archive_command` (via Patroni DCS config) to:

```
archive_command = 'pgbackrest --stanza=ytdb archive-push %p'
restore_command = 'pgbackrest --stanza=ytdb archive-get %f "%p"'
```

> Spilo also supports WAL-G out of the box (`USE_WALG_BACKUP=true`,
> `WAL_S3_BUCKET`, `AWS_*` env). WAL-G is the lower-friction path on Spilo; we
> default the **documentation** to pgBackRest for its richer retention/verify
> and explicit encryption-at-rest. Pick ONE — do not run both archivers.

## One-time stanza create

Run once against the **leader** (exec into the leader Spilo container, or a
sidecar that shares the PGDATA + conf):

```bash
pgbackrest --stanza=ytdb stanza-create
pgbackrest --stanza=ytdb check        # validates archiving + repo access
```

## Backups (cron)

```bash
# Weekly FULL (e.g. Sun 02:00)
pgbackrest --stanza=ytdb --type=full backup

# Daily DIFF (e.g. 02:00 Mon-Sat)
pgbackrest --stanza=ytdb --type=diff backup
```

Retention (`repo1-retention-full=4`, `repo1-retention-diff=7`) auto-expires old
backups + WAL after each backup. Check status:

```bash
pgbackrest --stanza=ytdb info
```

## Restore test (MANDATORY before cutover)

Restore into a SCRATCH path/instance — never over the live PGDATA:

```bash
# 1. Restore the latest backup into a throwaway dir
pgbackrest --stanza=ytdb --delta \
  --pg1-path=/tmp/restore-test restore

# 2. Start a temporary Postgres on it and sanity-check
#    (e.g. count rows in a known table)
#    pg_ctl -D /tmp/restore-test -o "-p 5599" start
#    psql -p 5599 -c "select count(*) from public.users;"
```

A successful restore + a sane row count = backups are trustworthy. Record the
date you last verified a restore.

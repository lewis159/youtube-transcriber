# Object Storage (MinIO) — Notes

S3-compatible object storage for YT Transcriber, deployed as a **separate Swarm
stack** (`docker-compose.storage.yml`). This is **infrastructure + an integration
path only** — the app does **not** use object storage yet. Transcripts still live
in Postgres/Supabase. Moving them to object storage is a **future, separate
change** (sketched under "Integration path" below — not implemented).

---

## What runs

| Service       | Image                                      | Role |
|---------------|--------------------------------------------|------|
| `minio`       | `minio/minio:RELEASE.2025-04-22T22-12-26Z` | S3-compatible object store. `server /data --console-address :9001`. S3 API on **:9000**, web console on **:9001**. Named volume `minio-data:/data`. `replicas: 1`, soft `spread` placement, `restart_policy: on-failure`, mem limit **512M**. |
| `minio-init`  | `minio/mc:RELEASE.2025-04-16T18-13-26Z`    | Short-lived bootstrap job. Waits for MinIO, sets the `local` alias, creates buckets idempotently (`mc mb --ignore-existing`), sets them private (`mc anonymous set none`). Exits 0 when done. mem limit **64M**. |

Both carry the standard labels: `project=YT_Transcription`,
`project.component=<svc>`, `project.env=prod`.

**Networks:** `minio` joins its own `storage` overlay **and** the existing
external `yt-prod` overlay, so the app/worker can reach S3 at
`http://minio:9000` by service name — **no host port is published**. `minio-init`
sits on `storage` only.

### Required env

Export in the deploying shell (or set as Portainer stack env vars):

| Var                   | Purpose |
|-----------------------|---------|
| `MINIO_ROOT_USER`     | MinIO root **access key**. Treat as a credential. |
| `MINIO_ROOT_PASSWORD` | MinIO root **secret key**. Use a strong value (≥ 8 chars). |

Deploy:

```bash
MINIO_ROOT_USER=... MINIO_ROOT_PASSWORD=... \
  docker stack deploy -c docker-compose.storage.yml yt-storage
```

> The root credentials are admin-level. For app integration, create a **scoped
> service account / access key** in the MinIO console (limited to the buckets it
> needs) rather than handing the app the root keys. See "Integration path".

### Buckets created

| Bucket           | Intended use | Policy |
|------------------|--------------|--------|
| `yt-transcripts` | Transcript JSON / artifacts (future) | private |
| `yt-exports`     | Generated exports — PDF / SRT / ZIP (future) | private |
| `yt-backups`     | **Optional, non-offsite.** Could host a local pgBackRest repo. **Not** a substitute for offsite backups — local-only object store on the same estate is not disaster recovery. | private |

All buckets are private (`mc anonymous set none`). Object access for the app is
via authenticated S3 calls (or short-lived presigned URLs), never anonymous.

### Console access via NPM

Ports 9000/9001 are **not** published to the host. To reach the web console:

1. Add an **Nginx Proxy Manager → Proxy Host** forwarding to service `minio`,
   port **9001**, on an internal-only / admin hostname (e.g. `minio.bentech.dev`).
2. Gate it behind an NPM **Access List** (basic auth / IP allowlist) — and/or
   Cloudflare Access — since the console is an admin surface.
3. NPM must share a network with `minio` to route to it: attach NPM to the
   `storage` (or `yt-prod`) overlay, or add an `npm`/`proxy` external network to
   the stack and to the `minio` service.

**Do not expose 9001 broadly.** Never expose the **9000 S3 API** publicly unless
you deliberately want MinIO serving presigned-URL downloads to the internet —
that's a separate decision with its own auth/abuse considerations.

---

## HA / multi-host

**Honest status: single-node MinIO is NOT highly available today.** One `minio`
replica, one node, one node-local `minio-data` volume — that volume is the
durability boundary. This matches the rest of the estate being single-node now
(Redis, Postgres soft-spread on one box until hosts 2–3 land). Until then:
**back up / replicate `minio-data`** (volume snapshot, or `mc mirror` to another
target) so a node loss isn't data loss.

### Path to real HA (do at the 3-node stage)

True MinIO HA uses **distributed mode with erasure coding**, which wants **≥ 4
drives** spread so it can tolerate drive/node failure:

- **Minimum for erasure coding:** 4 drives. MinIO splits objects into data +
  parity shards across them; with the default scheme it tolerates losing up to
  N/2 drives while staying readable, and up to N/2 for writes.
- **Across nodes:** put those drives on different physical hosts so a node
  failure loses at most one shard set. With 3 nodes you'd typically run multiple
  drives per node (e.g. 2 drives × 2–3 nodes ≥ 4 total) or a 4-node × 1-drive
  layout.
- **Swarm shape change:** distributed MinIO is launched as a server pool, e.g.
  `minio server http://minio-{1...4}/data{1...2}`, where each backend is a fixed
  node+drive. That means **hard placement constraints** (one MinIO task pinned
  per node, each with its own drive mount) — not the soft `spread` used now — and
  identical config across all members. It is effectively a different deploy spec,
  so plan it as its own stack revision when hosts 2–3 are in.
- **Front it with a load balancer** (NPM / the existing proxy) across the MinIO
  members so clients hit a single endpoint.

**Decision: design the distributed layout at the 3-node stage.** Don't try to
half-build it on one node — single-node now, distributed (≥4 drives, erasure
coded, hard placement, LB) when the hardware exists. Migrating data from the
standalone bucket into a new distributed cluster is an `mc mirror` job at that
time.

---

## Integration path (FUTURE — not done now)

How the app *would* use MinIO once we move transcripts/exports out of Postgres.
This is a **plan**, not an implementation. Nothing below is wired up.

### Idea

Store the large/blobby data (transcript JSON, generated PDF/SRT/ZIP exports) as
**objects keyed by id** in MinIO, and keep only a **pointer** (bucket + key +
size + content-type + checksum) in Postgres. Postgres rows shrink to metadata;
the heavy payload moves to object storage.

### Client + env

Use the AWS SDK v3 S3 client (`@aws-sdk/client-s3`) pointed at the MinIO endpoint
in path-style mode:

```ts
// (future) lib/s3.ts
import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,        // http://minio:9000 (in-cluster)
  region: 'us-east-1',                       // arbitrary; MinIO ignores it
  forcePathStyle: true,                      // required for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
})
```

Proposed env (add to the app service in `docker-compose.prod.yml` and `.env`
**when** this is implemented — not now):

| Var           | Example (in-cluster) | Notes |
|---------------|----------------------|-------|
| `S3_ENDPOINT` | `http://minio:9000`  | Service-name DNS on the `yt-prod`/`storage` overlay. |
| `S3_BUCKET`   | `yt-transcripts`     | (or `yt-exports` for export artifacts) |
| `S3_ACCESS_KEY` | *(scoped key)*     | A **service account** key scoped to the needed buckets — not the root user. |
| `S3_SECRET_KEY` | *(scoped secret)*  | Paired secret for the service account. |

### Which app code would change

- **New:** `app-ha/lib/s3.ts` — the S3 client + small `putObject` / `getObject` /
  `getSignedDownloadUrl` helpers.
- **`app-ha/lib/transcript.ts`** — on save, write transcript JSON to
  `yt-transcripts/<videoId>.json` (or `<userId>/<videoId>.json`) and persist the
  returned key in Postgres instead of the full payload; on read, fetch by key
  (with an in-memory/Redis cache for hot transcripts).
- **`app-ha/lib/export.ts`** — `generateZIP` / `generatePDF` already produce
  blobs; store the generated artifact in `yt-exports/<id>.<ext>` and hand the
  client a **presigned GET URL** instead of streaming bytes through the app.
- **DB / Supabase schema** — add `storage_key` (+ `storage_bucket`, `size_bytes`,
  `content_type`, optional `checksum`) columns to the transcript/export tables;
  migrate existing rows by uploading their current payloads and backfilling keys.
- **Worker** (`whisper-worker`) — when it finishes a transcription, it would
  upload the transcript object to MinIO and write only the pointer to the DB
  (same env vars, reachable on `yt-prod`).

### Migration considerations (for the future change)

- Backfill: one-off job to push existing Postgres transcript blobs into MinIO and
  set `storage_key`, then drop the heavy column once verified.
- Lifecycle: consider an `mc ilm` expiry rule on `yt-exports` (exports are
  regenerable) to avoid unbounded growth.
- Auth: create the scoped MinIO service account before flipping the app over;
  never ship root creds to the app tier.
- Keep it behind a feature flag so read/write can fall back to Postgres during
  rollout.

---

## Validation

`docker compose -f docker-compose.storage.yml config -q` — see the build report
for the result on this machine. Note: `config` validates against the **external**
`yt-prod` network only if it can be resolved; for a pure syntax check it parses
fine, and the external-network reference is resolved at `docker stack deploy`
time against the live Swarm.

# Whisper Transcription Worker

A **fully self-contained, separately-deployable** worker that consumes
transcription jobs from Redis, transcribes them locally with
[faster-whisper](https://github.com/SYSTRAN/faster-whisper), and writes the
results directly to Supabase.

It shares only two things with the main app: the **Redis queue** and the
**Supabase database**. There are no imports from, or edits to, the Next.js app —
delete this directory and one compose file to remove it entirely (see
[Clean removal](#clean-removal)).

> `benchmark.py` / `BENCHMARK_README.md` in this dir are a standalone model
> benchmarking tool — unrelated to the worker runtime, left intact.

---

## Architecture

- **Language:** Python (faster-whisper is Python).
- **Queue:** the official **Python BullMQ** client (`pip install bullmq`) consumes
  the same `transcription` queue that the Node/Next.js app enqueues to with the
  **JS BullMQ** client, over the **same Redis**. Producer and consumer are
  protocol-compatible — no custom queue format.
- **Concurrency:** 1 (one job at a time; the box is shared with Ollama).
- **Model:** loaded **once at startup** (`WhisperModel(device="cpu",
  compute_type="int8", cpu_threads=…)`), reused for every job.
- **DB writes:** the `supabase` Python client with the **service-role key**
  (bypasses RLS — the same pattern the app uses for server-side writes).

### Pipeline (per job)
1. `videos.status = extracting_audio`; **try YouTube captions first** (fast path,
   via yt-dlp `json3` subtitles). If captions exist → save them with
   `source='youtube'` and finish.
2. No captions → yt-dlp pulls bestaudio → ffmpeg to **16kHz mono WAV** in a
   size-capped temp dir; enforce `MAX_AUDIO_SECONDS`; `videos.status = transcribing`;
   run faster-whisper; normalise segments to `{text, start, duration}` (seconds);
   save with `source='whisper'`, `engine='faster-whisper-<model>'`,
   `detected_language`, `confidence`.
3. Save `transcripts.content` + new columns; `videos.status = completed`; write a
   `transcription_jobs` ledger row. **On any error:** `videos.status = error`,
   record the error on the job row, and **always** delete temp audio (finally
   block).

---

## Job payload contract

The app enqueues a BullMQ job to queue **`transcription`** with `job.data`:

```json
{
  "videoId":    "uuid-of-videos.id",
  "youtubeUrl": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "userId":     "uuid-of-users.id",
  "tier":       "pro"
}
```

| Field        | Type   | Meaning                                                        |
|--------------|--------|---------------------------------------------------------------|
| `videoId`    | string | Supabase **`videos.id`** (UUID primary key) — NOT `youtube_id` |
| `youtubeUrl` | string | Full YouTube URL                                              |
| `userId`     | string | Supabase `users.id` (UUID) of the owner (logging/auditing)    |
| `tier`       | string | Requesting user's subscription tier                          |

The worker matches the existing app convention: `videoId` is the videos table
UUID (the app calls `processVideo(video.id, youtubeUrl)`).

---

## Database columns written (migration 010)

- **`videos`** — `status` set to `extracting_audio` → `transcribing` →
  `completed` (or `error`).
- **`transcripts`** — `video_id`, `content` (JSONB `{text,start,duration}[]`,
  seconds), `language`, `source` (`youtube`|`whisper`), `engine`,
  `detected_language`, `confidence`.
- **`transcription_jobs`** — `video_id`, `status`
  (`queued`→`extracting_audio`→`transcribing`→`completed`|`failed`), `engine`,
  `error`, `updated_at`.

---

## Environment variables

| Variable                    | Default            | Purpose                                                            |
|-----------------------------|--------------------|-------------------------------------------------------------------|
| `REDIS_URL`                 | _(unset)_          | Full Redis URL; **takes precedence** over host/port               |
| `REDIS_HOST`                | `redis-master`     | Redis host (matches `docker-compose.redis.yml` master)            |
| `REDIS_PORT`                | `6379`             | Redis port                                                        |
| `SUPABASE_URL`              | _(required)_       | Supabase project URL                                              |
| `SUPABASE_SERVICE_KEY`      | _(required)_       | Service-role key (`SUPABASE_SERVICE_ROLE_KEY` also accepted)      |
| `SUPABASE_SERVICE_ROLE_KEY` | _(alias)_          | Alias for the above (matches the app's env var name)             |
| `WHISPER_MODEL`             | `base`             | faster-whisper model name                                         |
| `WHISPER_CPU_THREADS`       | `2`                | CPU threads (low because box shared with Ollama; raise on dedicated HW) |
| `MAX_AUDIO_SECONDS`         | `7200`             | Hard per-video audio length cap (2h)                              |
| `HF_HOME`                   | `/cache/huggingface` | Model-weight cache dir (mount as a volume)                      |
| `WHISPER_TEMP_DIR`          | `/cache/tmp`       | Scratch dir for extracted audio                                   |

Compose-only knobs (in `docker-compose.whisper.yml`): `WHISPER_CPU_LIMIT`
(default `2.0`) and `WHISPER_MEM_LIMIT` (default `4G`) cap the container; raise
both at go-live on dedicated hardware.

---

## Reaching Redis

The worker joins the **existing external Docker network**
`youtube-transcriber-network` (created by `docker-compose.redis.yml`) and connects
to the **existing** Redis master service **`redis-master:6379`**. It does **not**
define or modify any Redis service. Override with `REDIS_HOST`/`REDIS_PORT` or
`REDIS_URL` if your Redis lives elsewhere.

---

## Build & run (Docker, recommended)

From the worktree root (`C:\dev\yt-whisper-summary`):

```bash
# 1. Ensure the shared Redis + network are up first.
docker compose -f docker-compose.redis.yml up -d

# 2. Provide Supabase creds (env file or shell). Required:
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_KEY="<service-role-key>"
# Optional overrides: WHISPER_MODEL, WHISPER_CPU_THREADS, MAX_AUDIO_SECONDS, ...

# 3. Build + start the worker.
docker compose -f docker-compose.whisper.yml up -d --build

# Logs (structured state transitions)
docker compose -f docker-compose.whisper.yml logs -f whisper-worker
```

First run downloads the model weights into the `whisper-cache` volume; later runs
reuse them.

## Run standalone (no Docker)

```bash
# System deps
sudo apt-get update && sudo apt-get install -y ffmpeg
# Python deps
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Config
export REDIS_HOST=localhost REDIS_PORT=6379
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_KEY="<service-role-key>"
export WHISPER_MODEL=base WHISPER_CPU_THREADS=2
# Run
python worker.py
```

---

## Clean removal

This worker is purely additive. To remove it completely:

```bash
# 1. Stop + remove the worker container, its image, and its cache volume.
docker compose -f docker-compose.whisper.yml down -v --rmi local

# 2. Delete the worker code and its compose file.
rm -rf whisper-worker/
rm docker-compose.whisper.yml

# 3. (Optional) Revert the DB schema added by migration 010.
#    Run the down migration against Supabase:
#       supabase/migrations/010_whisper_summary_down.sql
```

No app code, Redis config, or other compose files are touched by removal.

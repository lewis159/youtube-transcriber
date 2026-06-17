#!/usr/bin/env python3
"""
Self-contained Whisper transcription worker.

Consumes jobs from the `transcription` BullMQ queue on Redis, transcribes each
video (YouTube captions first, faster-whisper fallback), and writes the result
directly to Supabase using the service-role key (bypasses RLS — same pattern the
Next.js app uses for server-side writes).

This worker is fully self-contained and separately deployable. It shares ONLY
the Redis queue and the Supabase database with the main app. The Node/Next.js
app enqueues jobs with the JS BullMQ client to the SAME `transcription` queue on
the SAME Redis; this worker consumes them with the official Python BullMQ client,
so producer and consumer stay protocol-compatible.

────────────────────────────────────────────────────────────────────────────
JOB PAYLOAD CONTRACT (BullMQ job.data) — keep producer (app) and consumer (here)
in sync:

    {
      "videoId":    string,   # Supabase videos.id (UUID, primary key) — NOT youtube_id
      "youtubeUrl": string,   # full YouTube URL, e.g. https://www.youtube.com/watch?v=XXXX
      "userId":     string,   # Supabase users.id (UUID) of the owner — for logging/auditing
      "tier":       string    # subscription tier of the requesting user, e.g. "pro"
    }

Queue name: "transcription"   |   Concurrency: 1
────────────────────────────────────────────────────────────────────────────

ENVIRONMENT VARIABLES (all read here):

  Redis (one of REDIS_URL, or REDIS_HOST/REDIS_PORT):
    REDIS_URL            connection URL (takes precedence). Two shapes supported:
                           - redis://host:port            single-redis (local dev)
                           - sentinel://h1:p1,h2:p2/<db>?sentinelName=<name>
                             HA prod: discover current master via Redis Sentinel.
                             See _redis_connection() for the failover limitation.
    REDIS_HOST           Redis host (default: redis-master)
    REDIS_PORT           Redis port (default: 6379)

  Supabase:
    SUPABASE_URL                  Supabase project URL (required)
    SUPABASE_SERVICE_KEY          service-role key (required; SUPABASE_SERVICE_ROLE_KEY also accepted)
    SUPABASE_SERVICE_ROLE_KEY     alias for SUPABASE_SERVICE_KEY (matches the app's env name)

  Whisper / transcription:
    WHISPER_MODEL        faster-whisper model name (default: base)
    WHISPER_CPU_THREADS  CPU threads for CTranslate2 (default: 2 — box shared with Ollama)
    MAX_AUDIO_SECONDS    hard cap on per-video audio length (default: 7200 = 2h)

  Caching (model weights):
    HF_HOME              Hugging Face cache dir (default: /cache/huggingface)
    WHISPER_TEMP_DIR     size-capped scratch dir for extracted audio (default: /cache/tmp)
"""

import json
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import wave
from datetime import datetime, timezone

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [whisper-worker] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("whisper-worker")


# ── Config (read once at import) ─────────────────────────────────────────────
QUEUE_NAME = "transcription"

WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")
WHISPER_CPU_THREADS = int(os.environ.get("WHISPER_CPU_THREADS", "2"))
MAX_AUDIO_SECONDS = int(os.environ.get("MAX_AUDIO_SECONDS", "7200"))

# DRY_RUN: run the full queue → audio → whisper pipeline but DO NOT touch
# Supabase. Results are logged instead of written. Lets the worker be tested
# locally against a throwaway Redis with no DB and no service-role key.
DRY_RUN = os.environ.get("DRY_RUN", "").lower() in ("1", "true", "yes", "on")

# FORCE_WHISPER: skip the YouTube caption fast path and always run faster-whisper.
# Test-only lever to exercise the Whisper engine on videos that do have captions.
FORCE_WHISPER = os.environ.get("FORCE_WHISPER", "").lower() in ("1", "true", "yes", "on")

# Default the HF cache to a mounted volume path so weights survive container
# restarts and are not re-downloaded on every boot.
os.environ.setdefault("HF_HOME", "/cache/huggingface")
WHISPER_TEMP_DIR = os.environ.get("WHISPER_TEMP_DIR", "/cache/tmp")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = (
    os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or ""
)


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _check_tool(name):
    return shutil.which(name)


# ── Caption fast path (mirrors app-ha/lib/transcript.ts output shape) ────────
def fetch_youtube_captions(youtube_url):
    """
    Try to pull existing YouTube captions via yt-dlp's subtitle download
    (auto + manual). Returns a list of {text, start, duration} in SECONDS, or
    None if no usable captions exist.

    Output shape matches app-ha/lib/transcript.ts (TranscriptItem):
        { "text": str, "start": float (s), "duration": float (s) }
    yt-dlp is already a dependency for the audio fallback, so this keeps the
    worker self-contained (no separate youtube-transcript package).
    """
    ytdlp = _check_tool("yt-dlp")
    if not ytdlp:
        log.warning("yt-dlp not on PATH; cannot attempt caption fast path")
        return None

    tmp_dir = tempfile.mkdtemp(prefix="captions_", dir=_ensure_temp_root())
    try:
        out_template = os.path.join(tmp_dir, "subs")
        cmd = [
            ytdlp,
            "--skip-download",
            "--write-subs",
            "--write-auto-subs",
            "--sub-langs", "en.*,en",
            "--sub-format", "json3",
            "--no-playlist",
            "-o", out_template,
            youtube_url,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            log.info("caption fast path: yt-dlp returned %s (no captions?)",
                     result.returncode)
            return None

        # Find any json3 subtitle file yt-dlp wrote.
        sub_file = None
        for fn in os.listdir(tmp_dir):
            if fn.endswith(".json3"):
                sub_file = os.path.join(tmp_dir, fn)
                break
        if not sub_file:
            return None

        with open(sub_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        events = data.get("events") or []
        items = []
        for ev in events:
            segs = ev.get("segs") or []
            text = "".join(s.get("utf8", "") for s in segs).strip()
            if not text:
                continue
            start_ms = ev.get("tStartMs", 0) or 0
            dur_ms = ev.get("dDurationMs", 0) or 0
            items.append({
                "text": text,
                "start": round(start_ms / 1000.0, 3),
                "duration": round(dur_ms / 1000.0, 3),
            })

        if not items:
            return None
        log.info("caption fast path: found %d caption segments", len(items))
        return items
    except Exception as exc:  # noqa: BLE001
        log.info("caption fast path failed (%s); falling back to whisper", exc)
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ── Audio extraction (yt-dlp -> 16kHz mono WAV via ffmpeg) ───────────────────
def _ensure_temp_root():
    """Ensure the size-capped scratch root exists and return it."""
    try:
        os.makedirs(WHISPER_TEMP_DIR, exist_ok=True)
        return WHISPER_TEMP_DIR
    except OSError:
        # Fall back to the system temp dir if the configured one is unavailable.
        return tempfile.gettempdir()


def extract_wav_from_url(url, out_path):
    """
    yt-dlp bestaudio -> ffmpeg postprocessor -> 16kHz mono PCM WAV.
    Identical extraction recipe to benchmark.py so behaviour matches what we
    benchmarked.
    """
    ytdlp = _check_tool("yt-dlp")
    if not ytdlp:
        raise RuntimeError("yt-dlp is not installed or not on PATH")
    if not _check_tool("ffmpeg"):
        raise RuntimeError("ffmpeg is not installed or not on PATH")

    out_template = out_path[:-4] if out_path.endswith(".wav") else out_path
    cmd = [
        ytdlp,
        "-f", "bestaudio/best",
        "--extract-audio",
        "--audio-format", "wav",
        "--postprocessor-args", "ffmpeg:-ar 16000 -ac 1",
        "--no-playlist",
        "-o", out_template + ".%(ext)s",
        url,
    ]
    log.info("extracting audio with yt-dlp -> %s", out_path)
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            "yt-dlp failed (exit {}): {}".format(result.returncode, result.stderr)
        )
    if not os.path.exists(out_path):
        raise RuntimeError(
            "Expected WAV at {} but yt-dlp produced none".format(out_path)
        )
    return out_path


def wav_duration_seconds(wav_path):
    with wave.open(wav_path, "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        return frames / float(rate) if rate else 0.0


def normalise_segments(segments):
    """faster-whisper segments -> app schema {text, start, duration} (seconds)."""
    out = []
    for seg in segments:
        out.append({
            "text": seg.text.strip(),
            "start": round(seg.start, 3),
            "duration": round(seg.end - seg.start, 3),
        })
    return out


# ── faster-whisper model: loaded ONCE at startup ─────────────────────────────
_MODEL = None


def load_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    from faster_whisper import WhisperModel
    log.info(
        "loading faster-whisper model=%s device=cpu compute_type=int8 cpu_threads=%d",
        WHISPER_MODEL, WHISPER_CPU_THREADS,
    )
    _MODEL = WhisperModel(
        os.environ.get("WHISPER_MODEL", "base"),
        device="cpu",
        compute_type="int8",
        cpu_threads=int(os.environ.get("WHISPER_CPU_THREADS", "2")),
    )
    log.info("model loaded")
    return _MODEL


def transcribe_wav(wav_path):
    """
    Run faster-whisper over a WAV. Returns
        (segments[{text,start,duration}], detected_language, confidence).
    """
    model = load_model()
    segments_gen, info = model.transcribe(wav_path, beam_size=5)
    segments = normalise_segments(segments_gen)  # consuming runs inference
    detected_language = getattr(info, "language", None)
    confidence = getattr(info, "language_probability", None)
    return segments, detected_language, confidence


# ── Supabase writes (service-role client; matches migration 010 columns) ─────
def get_supabase():
    from supabase import create_client
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) "
            "must be set"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def log_event(sb, level, event, video_id=None, user_id=None,
              message=None, metadata=None):
    """
    Insert a lifecycle/error row into event_logs (source='worker'), mirroring the
    app-side logger in app-ha/lib/event-log.ts. Fully fail-safe: a logging
    failure must NEVER break the pipeline, so all errors are swallowed.

    Honours DRY_RUN: when sb is None we only echo to stdout and never touch the
    database (same posture as the other write helpers here).
    """
    try:
        if sb is None:
            log.info("[DRY_RUN] event_log level=%s event=%s video=%s msg=%s meta=%s",
                     level, event, video_id, message,
                     json.dumps(metadata or {}, ensure_ascii=False))
            return
        sb.table("event_logs").insert({
            "level": level,
            "source": "worker",
            "event": event,
            "video_id": video_id,
            "user_id": user_id,
            "message": message,
            "metadata": metadata or {},
        }).execute()
    except Exception as exc:  # noqa: BLE001
        # Never let logging break the job; just note it on stdout.
        log.warning("event_log write failed (event=%s): %s", event, exc)


def update_video_status(sb, video_id, status):
    if sb is None:
        log.info("[DRY_RUN] would set video %s -> status=%s", video_id, status)
        return
    log.info("video %s -> status=%s", video_id, status)
    sb.table("videos").update({"status": status}).eq("id", video_id).execute()


def create_job_row(sb, video_id):
    """Insert a transcription_jobs ledger row, return its id (or None)."""
    if sb is None:
        return None
    res = sb.table("transcription_jobs").insert({
        "video_id": video_id,
        "status": "queued",
    }).execute()
    try:
        return res.data[0]["id"]
    except (IndexError, KeyError, TypeError):
        return None


def update_job(sb, job_id, **fields):
    if sb is None or not job_id:
        return
    fields["updated_at"] = _now_iso()
    sb.table("transcription_jobs").update(fields).eq("id", job_id).execute()


def save_transcript(sb, video_id, segments, source, engine,
                    detected_language, confidence, language="en"):
    """
    Write transcripts row. Columns match migration 010 + existing schema:
      content (JSONB {text,start,duration}[]), language, source, engine,
      detected_language, confidence.
    """
    row = {
        "video_id": video_id,
        "content": segments,
        "language": detected_language or language,
        "source": source,
        "engine": engine,
        "detected_language": detected_language,
        "confidence": confidence,
    }
    if sb is None:
        sample = segments[:3]
        log.info("[DRY_RUN] would save transcript video=%s source=%s engine=%s "
                 "lang=%s segments=%d; first 3=%s",
                 video_id, source, engine, detected_language, len(segments),
                 json.dumps(sample, ensure_ascii=False))
        return
    log.info("saving transcript for video %s (source=%s, segments=%d)",
             video_id, source, len(segments))
    sb.table("transcripts").insert(row).execute()


# ── Per-job pipeline ─────────────────────────────────────────────────────────
def process_job(payload):
    """
    payload: dict with keys videoId, youtubeUrl, userId, tier (see contract).
    Runs the full pipeline; raises on unrecoverable error (caller records it).
    """
    video_id = payload.get("videoId")
    youtube_url = payload.get("youtubeUrl")
    user_id = payload.get("userId")
    tier = payload.get("tier")

    if not video_id or not youtube_url:
        raise ValueError(
            "job payload missing required videoId/youtubeUrl: {!r}".format(payload)
        )

    log.info("START job videoId=%s userId=%s tier=%s url=%s%s",
             video_id, user_id, tier, youtube_url,
             " [DRY_RUN]" if DRY_RUN else "")

    sb = None if DRY_RUN else get_supabase()
    job_id = create_job_row(sb, video_id)

    tmp_dir = None
    try:
        # (a) caption fast path
        update_video_status(sb, video_id, "extracting_audio")
        update_job(sb, job_id, status="extracting_audio")
        log_event(sb, "info", "extracting_audio", video_id=video_id,
                  user_id=user_id)

        captions = None if FORCE_WHISPER else fetch_youtube_captions(youtube_url)
        # Record that the caption fast path was evaluated and what it found, so the
        # branch decision (captions vs. whisper) is traceable even when none exist.
        log_event(sb, "info", "captions_checked", video_id=video_id,
                  user_id=user_id,
                  metadata={
                      "forced_whisper": bool(FORCE_WHISPER),
                      "found": bool(captions),
                      "segment_count": len(captions) if captions else 0,
                  })
        if captions:
            save_transcript(
                sb, video_id, captions,
                source="youtube", engine=None,
                detected_language=None, confidence=None,
            )
            log_event(sb, "info", "captions_found", video_id=video_id,
                      user_id=user_id,
                      metadata={"segment_count": len(captions), "source": "youtube"})
            update_video_status(sb, video_id, "completed")
            update_job(sb, job_id, status="completed", engine=None)
            log_event(sb, "info", "completed", video_id=video_id, user_id=user_id,
                      metadata={
                          "engine": None,
                          "segment_count": len(captions),
                          "audio_duration": None,
                          "source": "youtube",
                          "detected_language": None,
                      })
            log.info("DONE job videoId=%s via youtube captions", video_id)
            return

        # (b) whisper fallback — pull audio
        log_event(sb, "info", "whisper_fallback", video_id=video_id,
                  user_id=user_id,
                  metadata={"forced": bool(FORCE_WHISPER)})
        tmp_dir = tempfile.mkdtemp(prefix="whisper_job_", dir=_ensure_temp_root())
        wav_path = os.path.join(tmp_dir, "audio.wav")
        extract_wav_from_url(youtube_url, wav_path)

        duration = wav_duration_seconds(wav_path)
        # Audio is on disk — record extraction success + measured length so the
        # transition into transcription is fully traceable.
        log_event(sb, "info", "audio_extracted", video_id=video_id,
                  user_id=user_id,
                  metadata={"audio_duration": round(duration, 1),
                            "max_audio_seconds": MAX_AUDIO_SECONDS})
        log.info("video %s audio duration=%.1fs (cap=%ds)",
                 video_id, duration, MAX_AUDIO_SECONDS)
        if duration > MAX_AUDIO_SECONDS:
            raise RuntimeError(
                "audio {:.0f}s exceeds MAX_AUDIO_SECONDS={}".format(
                    duration, MAX_AUDIO_SECONDS)
            )

        update_video_status(sb, video_id, "transcribing")
        update_job(sb, job_id, status="transcribing")
        log_event(sb, "info", "transcribing", video_id=video_id, user_id=user_id,
                  metadata={"audio_duration": round(duration, 1)})

        segments, detected_language, confidence = transcribe_wav(wav_path)
        engine = "faster-whisper-{}".format(WHISPER_MODEL)

        # (c) save results
        save_transcript(
            sb, video_id, segments,
            source="whisper", engine=engine,
            detected_language=detected_language, confidence=confidence,
        )
        update_video_status(sb, video_id, "completed")
        update_job(sb, job_id, status="completed", engine=engine)
        log_event(sb, "info", "completed", video_id=video_id, user_id=user_id,
                  metadata={
                      "engine": engine,
                      "segment_count": len(segments),
                      "audio_duration": round(duration, 1),
                      "source": "whisper",
                      "detected_language": detected_language,
                  })
        log.info("DONE job videoId=%s via whisper (engine=%s, segments=%d)",
                 video_id, engine, len(segments))

    except Exception as exc:  # noqa: BLE001
        log.exception("ERROR job videoId=%s: %s", video_id, exc)
        log_event(sb, "error", "error", video_id=video_id, user_id=user_id,
                  message=str(exc),
                  metadata={"stage": "worker", "exc_type": type(exc).__name__})
        try:
            update_video_status(sb, video_id, "error")
        except Exception as e2:  # noqa: BLE001
            log.error("failed to set video error status for %s: %s", video_id, e2)
        update_job(sb, job_id, status="failed", error=str(exc))
        raise
    finally:
        # ALWAYS clean up temp audio.
        if tmp_dir and os.path.isdir(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)
            log.info("cleaned up temp dir %s", tmp_dir)


# ── BullMQ consumer ──────────────────────────────────────────────────────────
async def _bull_process(job, job_token):
    """BullMQ worker callback. job.data carries the payload contract."""
    payload = job.data if isinstance(job.data, dict) else json.loads(job.data)
    process_job(payload)
    return {"ok": True}


def _parse_sentinel_url(url):
    """
    Parse the HA prod Sentinel URL shape:

        sentinel://host1:port1,host2:port2,host3:port3/<db>?sentinelName=<masterName>

    e.g. sentinel://sentinel-1:26379,sentinel-2:26380,sentinel-3:26381/0?sentinelName=mymaster

    Returns (sentinels, master_name, db) where sentinels is a list of
    (host, port) tuples. Hand-parsed (not urllib) because the comma-separated
    host list in the authority is not valid for a standard URL parser.
    """
    from urllib.parse import parse_qs

    body = url[len("sentinel://"):]
    authority, _, rest = body.partition("/")

    sentinels = []
    for hp in authority.split(","):
        hp = hp.strip()
        if not hp:
            continue
        host, _, port = hp.partition(":")
        sentinels.append((host, int(port) if port else 26379))

    db_str, _, query = rest.partition("?")
    db = int(db_str) if db_str else 0
    qs = parse_qs(query)
    # Support the documented `sentinelName`; also accept `name` as an alias.
    name = (qs.get("sentinelName") or qs.get("name") or ["mymaster"])[0]
    return sentinels, name, db


def _redis_connection():
    """
    Build the connection opts dict BullMQ expects. Topology-flexible:
      - REDIS_URL=sentinel://...  → discover the CURRENT master via Redis
        Sentinel and connect to it (HA prod).
      - REDIS_URL=redis://...     → passed straight through (single-redis dev).
      - else                      → REDIS_HOST/REDIS_PORT (defaults match the
        docker-compose.redis.yml master `redis-master:6379`).

    ⚠️ SENTINEL FAILOVER LIMITATION (be honest about this):
    The Python BullMQ client (bullmq==2.14.0) does NOT speak Sentinel. It only
    accepts a redis URL / plain options dict and builds a single direct
    `redis.asyncio.Redis` connection — it cannot follow a master that moves.
    So for the `sentinel://` case we resolve the *current* master address at
    connect time (via redis-py's `redis.sentinel.Sentinel.discover_master`,
    part of the already-pinned `redis` dep — no new dependency) and hand BullMQ
    a concrete `redis://<current-master>:<port>` URL.

    Consequence: this gives correct master selection AT STARTUP and after any
    restart, but it is NOT transparent live failover. If Sentinel promotes a new
    master while the worker is running, the worker's existing connection breaks
    and the worker must RECONNECT/RESTART to pick up the new master. In prod the
    service runs under `restart_policy: on-failure`, so a dropped connection that
    crashes the worker is auto-restarted and re-discovers the new master on boot.
    That is the pragmatic mitigation until/unless the Python BullMQ client gains
    native Sentinel support.
    """
    url = os.environ.get("REDIS_URL")
    if url and url.startswith("sentinel://"):
        from redis.sentinel import Sentinel

        sentinels, master_name, db = _parse_sentinel_url(url)
        log.info("resolving Redis master via Sentinel: name=%s sentinels=%s db=%d",
                 master_name, sentinels, db)
        sentinel = Sentinel(sentinels, socket_timeout=1.0)
        master_host, master_port = sentinel.discover_master(master_name)
        log.info("Sentinel reports current master at %s:%s", master_host, master_port)
        return {"connection": "redis://{}:{}/{}".format(master_host, master_port, db)}

    if url:
        return {"connection": url}
    host = os.environ.get("REDIS_HOST", "redis-master")
    port = os.environ.get("REDIS_PORT", "6379")
    return {"connection": "redis://{}:{}".format(host, port)}


async def main_async():
    from bullmq import Worker

    conn = _redis_connection()
    log.info("connecting to Redis (%s), queue=%s, concurrency=1",
             conn["connection"], QUEUE_NAME)

    # Warm the model at startup so the first job isn't penalised by the load.
    load_model()

    worker = Worker(
        QUEUE_NAME,
        _bull_process,
        {"connection": conn["connection"], "concurrency": 1},
    )
    log.info("worker started; waiting for jobs on '%s'", QUEUE_NAME)

    # Keep the process alive until interrupted.
    import asyncio
    stop = asyncio.Event()

    def _shutdown():
        log.info("shutdown signal received")
        stop.set()

    try:
        loop = asyncio.get_event_loop()
        import signal
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, _shutdown)
            except NotImplementedError:
                # add_signal_handler is unavailable on Windows event loops.
                pass
    except Exception:  # noqa: BLE001
        pass

    await stop.wait()
    log.info("closing worker")
    await worker.close()


def main():
    import asyncio
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        log.info("interrupted; exiting")


if __name__ == "__main__":
    main()

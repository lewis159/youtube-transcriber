import { supabaseAdmin } from '@/lib/supabase'

/**
 * Pluggable event logger for the transcription lifecycle.
 *
 * Callers only ever touch {@link logEvent}. WHERE those events go is decided by
 * the module-level {@link sinks} array, so external sinks (Sentry / Datadog /
 * Loki / …) can be bolted on LATER — env-gated, see the extension point below —
 * without changing a single call site. logEvent never throws: a logging failure
 * must never break the request it is observing.
 */

// ── Public types ─────────────────────────────────────────────────────────────
export type LogLevel = 'info' | 'warn' | 'error'

export interface EventLogEntry {
  level?: LogLevel
  event: string
  videoId?: string
  userId?: string
  message?: string
  metadata?: Record<string, unknown>
}

/**
 * The fully-resolved entry a sink receives: `level` defaulted, `source` pinned to
 * 'app' (this module is the app-side logger; the worker writes its own rows), and
 * `event` guaranteed present.
 */
export type ResolvedLogEntry = Required<Pick<EventLogEntry, 'event'>> &
  EventLogEntry & { level: LogLevel; source: 'app' }

export interface LogSink {
  name: string
  write(entry: ResolvedLogEntry): Promise<void> | void
}

// ── Built-in sinks ───────────────────────────────────────────────────────────

/** Structured one-line JSON to console — cheap, always-on, grep-friendly. */
const ConsoleSink: LogSink = {
  name: 'console',
  write(entry) {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level: entry.level,
      source: entry.source,
      event: entry.event,
      videoId: entry.videoId,
      userId: entry.userId,
      message: entry.message,
      metadata: entry.metadata,
    })
    if (entry.level === 'error') console.error(line)
    else if (entry.level === 'warn') console.warn(line)
    else console.log(line)
  },
}

/** Persists the event to the `event_logs` table via the service-role client. */
const DbSink: LogSink = {
  name: 'db',
  async write(entry) {
    const { error } = await supabaseAdmin.from('event_logs').insert({
      level: entry.level,
      source: entry.source,
      event: entry.event,
      video_id: entry.videoId ?? null,
      user_id: entry.userId ?? null,
      message: entry.message ?? null,
      metadata: entry.metadata ?? {},
    })
    if (error) throw error
  },
}

// ── Sink registry (assembled once) ───────────────────────────────────────────
const sinks: LogSink[] = [ConsoleSink, DbSink]

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSION POINT — future external sinks plug in HERE, env-gated, no caller
// changes required. Implement a LogSink and push it onto `sinks`, for example:
//
//   if (process.env.SENTRY_DSN) sinks.push(sentrySink)
//   if (process.env.DATADOG_API_KEY) sinks.push(datadogSink)
//   if (process.env.LOKI_URL) sinks.push(lokiSink)
//
// Deliberately NOT wiring any external dependency in now — this is just the seam.
// ─────────────────────────────────────────────────────────────────────────────

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fan an event out to every configured sink. Defaults `level` to 'info' and
 * pins `source` to 'app'. Each sink is wrapped in its own try/catch so one
 * failing sink can neither block the others nor reject the caller — this
 * function NEVER throws.
 */
export async function logEvent(entry: EventLogEntry): Promise<void> {
  const resolved: ResolvedLogEntry = {
    ...entry,
    level: entry.level ?? 'info',
    source: 'app',
  }

  await Promise.all(
    sinks.map(async (sink) => {
      try {
        await sink.write(resolved)
      } catch (err) {
        // A logging failure must never break the request. Swallow, but leave a
        // breadcrumb so a broken sink is at least visible in the console.
        console.error(`[event-log] sink "${sink.name}" failed:`, err)
      }
    })
  )
}

/** Canonical lifecycle event names — shared vocabulary for app + worker. */
export const EVENTS = {
  // Upload / queueing (app)
  video_added: 'video_added',
  queued: 'queued',
  sync_started: 'sync_started',
  // Retry — user re-runs transcription for an EXISTING video (no new row)
  retry: 'retry',
  // Transcription pipeline (worker)
  extracting_audio: 'extracting_audio',
  audio_extracted: 'audio_extracted',
  captions_checked: 'captions_checked',
  captions_found: 'captions_found',
  whisper_fallback: 'whisper_fallback',
  transcribing: 'transcribing',
  completed: 'completed',
  // AI summary (app)
  summary_started: 'summary_started',
  summary_completed: 'summary_completed',
  // AI chat (app)
  chat_message: 'chat_message',
  // Universal failure event
  error: 'error',
} as const

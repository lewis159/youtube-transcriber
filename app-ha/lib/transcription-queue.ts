import { Queue, type ConnectionOptions } from 'bullmq'

/**
 * Whisper transcription queue — PRODUCER side only.
 *
 * This module is the *only* new infra dependency introduced by the async
 * (Whisper) upload path. It pushes jobs onto the BullMQ queue named
 * `transcription`, which the (already-built) in-house worker consumes over the
 * shared Redis instance (`redis-master:6379` on `youtube-transcriber-network`).
 *
 * It is intentionally lazy: nothing connects to Redis at import time, so the
 * synchronous (default, flag-OFF) upload path never touches Redis and the
 * existing behaviour is unaffected if Redis is absent.
 */

// Must match the queue name the worker consumes.
const QUEUE_NAME = 'transcription'

export interface TranscriptionJobPayload {
  videoId: string
  youtubeUrl: string
  userId: string
  tier: string
}

let queue: Queue | null = null

/**
 * Parse a Sentinel URL of the shape the HA prod stack sets:
 *
 *   sentinel://host1:port1,host2:port2,host3:port3/<db>?sentinelName=<masterName>
 *
 * e.g. sentinel://sentinel-1:26379,sentinel-2:26380,sentinel-3:26381/0?sentinelName=mymaster
 *
 * Returns an ioredis Sentinel options object. BullMQ passes `connection`
 * straight to ioredis, and ioredis switches into Sentinel mode whenever a
 * `sentinels` array + `name` are present — it then auto-discovers the current
 * master and transparently reconnects to the new master on failover. That is
 * exactly the resilience we want in HA prod.
 *
 * The URL is parsed by hand rather than via `new URL(...)` because the WHATWG
 * URL parser does not understand a comma-separated host list in the authority.
 */
function parseSentinelUrl(url: string): ConnectionOptions {
  // Strip the scheme, then split off the path/query (db + sentinelName).
  const withoutScheme = url.slice('sentinel://'.length)
  const [authority, rest = ''] = splitOnce(withoutScheme, '/')

  const sentinels = authority
    .split(',')
    .map((hp) => hp.trim())
    .filter(Boolean)
    .map((hp) => {
      const [host, port = '26379'] = splitOnce(hp, ':')
      return { host, port: parseInt(port, 10) }
    })

  // `rest` is "<db>?sentinelName=<name>" (either part optional).
  const [dbStr, queryStr = ''] = splitOnce(rest, '?')
  const db = dbStr ? parseInt(dbStr, 10) : 0
  const params = new URLSearchParams(queryStr)
  // Support the documented `sentinelName`; also accept `name` as an alias.
  const name = params.get('sentinelName') || params.get('name') || 'mymaster'

  return { sentinels, name, db } as unknown as ConnectionOptions
}

/** Split a string on the first occurrence of `sep` only. */
function splitOnce(s: string, sep: string): [string, string?] {
  const i = s.indexOf(sep)
  if (i === -1) return [s, undefined]
  return [s.slice(0, i), s.slice(i + sep.length)]
}

/**
 * Build the Redis connection options from the same env vars the rest of the
 * stack uses. Topology-flexible:
 *   - `sentinel://...`  → ioredis Sentinel options (HA prod; survives failover).
 *   - `redis://...`     → passed straight through (single-redis local dev).
 *   - else              → discrete REDIS_HOST / REDIS_PORT (defaults match the
 *                         docker service name so it "just works" in compose).
 */
function getConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL
  if (url) {
    if (url.startsWith('sentinel://')) {
      return parseSentinelUrl(url)
    }
    return { url } as unknown as ConnectionOptions
  }

  return {
    host: process.env.REDIS_HOST || 'redis-master',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  }
}

/**
 * Lazily create (and memoise) the producer Queue. The connection is only
 * opened on first enqueue, never at import.
 */
function getQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, { connection: getConnection() })
  }
  return queue
}

/**
 * Enqueue a Whisper transcription job. Payload shape matches exactly what the
 * worker expects: { videoId, youtubeUrl, userId, tier }.
 */
export async function enqueueTranscription(payload: TranscriptionJobPayload) {
  const q = getQueue()
  return q.add('transcribe', payload, {
    // Sensible, conservative retry defaults; the worker owns status writes.
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  })
}

import Redis, { type RedisOptions } from 'ioredis'

/**
 * Redis-backed rate limiter — HA-safe shared state.
 *
 * The limiter state lives in Redis (not process memory) so it is shared across
 * every app replica. A fixed-window counter is used: the first request in a
 * window does `INCR` then `EXPIRE`, and the window naturally resets when the key
 * expires. This is cheap (1–2 round-trips), atomic per key, and correct across
 * replicas — exactly what we need behind a load balancer.
 *
 * Topology-flexible, mirroring `transcription-queue.ts`:
 *   - `sentinel://...`  → ioredis Sentinel options (HA prod; survives failover).
 *   - `redis://...`     → passed straight through (single-redis local dev).
 *   - else              → discrete REDIS_HOST / REDIS_PORT (docker compose).
 *
 * FAIL OPEN: if Redis is unreachable or errors, we ALLOW the request (and log
 * it) rather than hard-blocking real users on an infra hiccup. Guardrails are a
 * cost/abuse backstop, not a correctness gate.
 *
 * The connection is lazy: nothing connects at import time.
 */

export interface RateLimitResult {
  /** Whether the request is permitted. */
  allowed: boolean
  /** Requests remaining in the current window (>= 0). */
  remaining: number
  /** Seconds until the current window resets. */
  resetSeconds: number
}

let client: Redis | null = null

/** Split a string on the first occurrence of `sep` only. */
function splitOnce(s: string, sep: string): [string, string?] {
  const i = s.indexOf(sep)
  if (i === -1) return [s, undefined]
  return [s.slice(0, i), s.slice(i + sep.length)]
}

/**
 * Parse a Sentinel URL of the shape the HA prod stack sets:
 *
 *   sentinel://host1:port1,host2:port2,host3:port3/<db>?sentinelName=<masterName>
 *
 * Returns ioredis Sentinel options. ioredis switches into Sentinel mode when a
 * `sentinels` array + `name` are present, auto-discovers the master, and
 * transparently reconnects on failover. Mirrors transcription-queue.ts.
 */
function parseSentinelUrl(url: string): RedisOptions {
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

  const [dbStr, queryStr = ''] = splitOnce(rest, '?')
  const db = dbStr ? parseInt(dbStr, 10) : 0
  const params = new URLSearchParams(queryStr)
  const name = params.get('sentinelName') || params.get('name') || 'mymaster'

  // Optional auth: the same password authenticates BOTH the Sentinels
  // (`sentinelPassword`) and the discovered data nodes (`password`). When unset,
  // omit both so the no-auth setup behaves exactly as before.
  const pwd = process.env.REDIS_PASSWORD
  const auth = pwd ? { password: pwd, sentinelPassword: pwd } : {}

  return { sentinels, name, db, ...auth }
}

/**
 * Lazily create (and memoise) the ioredis client using the same env vars and
 * topology rules as the transcription queue.
 */
function getClient(): Redis {
  if (client) return client

  // Optional auth: when unset/empty, omit `password` so the no-auth setup
  // behaves exactly as before.
  const pwd = process.env.REDIS_PASSWORD
  const auth = pwd ? { password: pwd } : {}

  const url = process.env.REDIS_URL
  if (url) {
    if (url.startsWith('sentinel://')) {
      client = new Redis(parseSentinelUrl(url))
    } else {
      // `redis://...` connection string.
      client = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false, ...auth })
    }
  } else {
    client = new Redis({
      host: process.env.REDIS_HOST || 'redis-master',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ...auth,
    })
  }

  // Never let an unhandled 'error' event crash the process; we fail open.
  client.on('error', (err) => {
    console.error('[rate-limit] Redis connection error (failing open):', err?.message ?? err)
  })

  return client
}

/**
 * Check (and consume) one unit against a fixed-window counter.
 *
 * @param key           Logical bucket, e.g. `chat:<userId>`. Namespaced internally.
 * @param limit         Max allowed requests within the window.
 * @param windowSeconds Window length in seconds.
 *
 * Returns `{ allowed, remaining, resetSeconds }`. On ANY Redis failure this
 * returns `allowed: true` (fail open) and logs the error.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`

  try {
    const redis = getClient()

    // INCR is atomic; the first hit creates the key at 1. We then set the TTL
    // only when the counter is fresh (count === 1) so the window is fixed from
    // the first request and not extended by later hits.
    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds)
    }

    // TTL may be -1 (no expiry set — rare race) or -2 (key gone). Guard both so
    // a key can never get stuck without a window; re-arm the TTL if missing.
    let ttl = await redis.ttl(redisKey)
    if (ttl < 0) {
      await redis.expire(redisKey, windowSeconds)
      ttl = windowSeconds
    }

    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)
    return { allowed, remaining, resetSeconds: ttl }
  } catch (err) {
    // FAIL OPEN — never block a real user because Redis is down.
    console.error(
      `[rate-limit] check failed for key "${redisKey}" — failing open:`,
      err instanceof Error ? err.message : err
    )
    return { allowed: true, remaining: limit, resetSeconds: windowSeconds }
  }
}

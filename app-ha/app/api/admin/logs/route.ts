import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50

const LEVELS = ['info', 'warn', 'error'] as const
const SOURCES = ['app', 'worker'] as const

/**
 * GET /api/admin/logs — read-only event_logs viewer feed.
 * Admin-only (global_admin), enforced by requireAdmin().
 *
 * Query params (all optional):
 *   level     — 'info' | 'warn' | 'error'
 *   source    — 'app' | 'worker'
 *   event     — exact event key match
 *   video_id  — uuid
 *   user_id   — uuid
 *   q         — free-text ILIKE on message
 *   since     — ISO date/datetime (created_at >=)
 *   until     — ISO date/datetime (created_at <=)
 *   limit     — page size (1..100, default 50)
 *   offset    — row offset (default 0)
 *
 * Returns: { rows, total, limit, offset, hasMore }
 */
export async function GET(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { searchParams } = new URL(request.url)

  const level = searchParams.get('level') || ''
  const source = searchParams.get('source') || ''
  const event = searchParams.get('event') || ''
  const videoId = searchParams.get('video_id') || ''
  const userId = searchParams.get('user_id') || ''
  const q = searchParams.get('q') || ''
  const since = searchParams.get('since') || ''
  const until = searchParams.get('until') || ''

  const rawLimit = parseInt(searchParams.get('limit') || '', 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE

  const rawOffset = parseInt(searchParams.get('offset') || '', 10)
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0

  let query = supabaseAdmin
    .from('event_logs')
    .select('id, created_at, level, source, event, video_id, user_id, message, metadata', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })

  if (level && (LEVELS as readonly string[]).includes(level)) {
    query = query.eq('level', level)
  }
  if (source && (SOURCES as readonly string[]).includes(source)) {
    query = query.eq('source', source)
  }
  if (event) {
    query = query.eq('event', event)
  }
  if (videoId) {
    query = query.eq('video_id', videoId)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (q) {
    // Escape ILIKE wildcards in user input so they're treated literally.
    const escaped = q.replace(/[\\%_]/g, (m) => `\\${m}`)
    query = query.ilike('message', `%${escaped}%`)
  }
  if (since) {
    query = query.gte('created_at', since)
  }
  if (until) {
    query = query.lte('created_at', until)
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []
  const total = count ?? rows.length
  const hasMore = offset + rows.length < total

  return NextResponse.json({ rows, total, limit, offset, hasMore })
}

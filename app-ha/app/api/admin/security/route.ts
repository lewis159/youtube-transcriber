import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/security — real security overview signals.
 * Admin-only (global_admin), enforced by requireAdmin().
 *
 * All numbers are derived from real tables (event_logs, admin_audit_log).
 * No hand-authored / fabricated content. A `windowHours` window (default 24h)
 * scopes the error/warn counts to recent activity.
 *
 * Returns: {
 *   windowHours,
 *   events: { total, errors, warns, errorsWindow, warnsWindow },
 *   audit:  { total },
 *   rls:    { enabled, note },
 *   recentErrors: [ { id, created_at, source, event, message } ]
 * }
 */
export async function GET(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const rawWindow = parseInt(searchParams.get('windowHours') || '', 10)
  const windowHours = Number.isFinite(rawWindow) && rawWindow > 0 ? Math.min(rawWindow, 720) : 24
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  // Helper: exact head-count for event_logs with optional filters.
  async function countEvents(filters: {
    level?: string
    since?: string
  }): Promise<number> {
    let q = supabaseAdmin
      .from('event_logs')
      .select('id', { count: 'exact', head: true })
    if (filters.level) q = q.eq('level', filters.level)
    if (filters.since) q = q.gte('created_at', filters.since)
    const { count, error } = await q
    if (error) throw error
    return count ?? 0
  }

  try {
    const [
      totalEvents,
      totalErrors,
      totalWarns,
      errorsWindow,
      warnsWindow,
    ] = await Promise.all([
      countEvents({}),
      countEvents({ level: 'error' }),
      countEvents({ level: 'warn' }),
      countEvents({ level: 'error', since }),
      countEvents({ level: 'warn', since }),
    ])

    // Audit log row count (real table; may be 0 → honest empty state on the page).
    const { count: auditCount, error: auditErr } = await supabaseAdmin
      .from('admin_audit_log')
      .select('id', { count: 'exact', head: true })
    if (auditErr) throw auditErr

    // Most recent error rows for the overview "needs attention" list.
    const { data: recentErrors, error: recentErr } = await supabaseAdmin
      .from('event_logs')
      .select('id, created_at, source, event, message')
      .eq('level', 'error')
      .order('created_at', { ascending: false })
      .limit(5)
    if (recentErr) throw recentErr

    return NextResponse.json({
      windowHours,
      events: {
        total: totalEvents,
        errors: totalErrors,
        warns: totalWarns,
        errorsWindow,
        warnsWindow,
      },
      audit: {
        total: auditCount ?? 0,
      },
      rls: {
        // event_logs + admin_audit_log both have RLS enabled with no permissive
        // end-user policy (migrations 011 + 002); access is service-role only.
        enabled: true,
        note: 'RLS enabled on event_logs and admin_audit_log; access is service-role only (no end-user policy).',
      },
      recentErrors: recentErrors || [],
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load security overview'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'

// Service-role client — never exposed to the browser. Audit writes/reads
// must bypass RLS, so we use the service-role key here (same pattern as
// lib/admin-auth.ts).
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return Boolean(url) && !url.includes('placeholder')
}

export interface LogAuditInput {
  /** Machine action key, e.g. 'container_drained', 'tier_change'. */
  action: string
  /** What kind of thing was acted on, e.g. 'container', 'user'. */
  target?: string
  /** Human-readable detail of the change, stored in `notes`. */
  details?: string
  /** Clerk user id of the admin performing the action. */
  actorClerkId?: string | null
  /** Optional structured before/after snapshots. */
  oldValue?: unknown
  newValue?: unknown
}

/**
 * Insert an audit row using the service-role client. Best-effort: never throws,
 * so a logging failure can't break the admin action it accompanies.
 */
export async function logAudit(input: LogAuditInput): Promise<void> {
  if (!isConfigured()) return

  try {
    const supabase = getServiceClient()

    // Resolve the admin's public.users.id (uuid) from their Clerk id.
    let adminUserId: string | null = null
    if (input.actorClerkId) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', input.actorClerkId)
        .single()
      adminUserId = data?.id ?? null
    }

    await supabase.from('admin_audit_log').insert({
      admin_user_id: adminUserId,
      action: input.action,
      target_type: input.target ?? null,
      target_id: null,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
      notes: input.details ?? null,
    })
  } catch (err) {
    console.error('logAudit failed:', err)
  }
}

export interface AuditLogRow {
  ts: string
  admin: string
  action: string
  target: string
  details: string
}

/**
 * Read recent audit rows, newest first, mapped to the shape the audit-log
 * page renders. Joins to public.users for the admin's email/name.
 */
export async function getAuditLog(limit: number = 100): Promise<AuditLogRow[]> {
  if (!isConfigured()) return []

  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('action, target_type, target_id, notes, created_at, admin_user_id, users:admin_user_id(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((row: any) => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users
      return {
        ts: row.created_at ? new Date(row.created_at).toISOString().slice(0, 19).replace('T', ' ') : '',
        admin: user?.email || user?.full_name || 'system',
        action: row.action,
        target: row.target_id || row.target_type || '—',
        details: row.notes || '',
      }
    })
  } catch (err) {
    console.error('getAuditLog failed:', err)
    return []
  }
}

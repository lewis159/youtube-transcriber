import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Display-label maps — the DB stores lowercase tier values (starter/pro/…).
const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  studio: 'Studio',
  enterprise: 'Enterprise',
}

function tierLabel(tier: string | null): string {
  if (!tier) return 'Starter'
  return TIER_LABELS[tier] ?? (tier.charAt(0).toUpperCase() + tier.slice(1))
}

function toInitials(str: string): string {
  const parts = str.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return str.slice(0, 2).toUpperCase()
}

export interface AdminUserRow {
  id: string
  name: string
  initials: string
  email: string
  tier: string
  status: string
  joined: string
  lastActive: string
  role: string
}

/**
 * GET — list all users for the admin Users & Orgs page.
 * Admin-only (global_admin), enforced by requireAdmin().
 *
 * NOTE: the `users` table has NO `status` column — status is DERIVED from
 * the `is_trial` flag (true → Trial, false → Active). Selecting a
 * non-existent `status` column is exactly what caused the original empty
 * list (the whole query errored and returned null rows).
 */
export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { data: rows, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, tier, role, is_trial, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/users] Supabase fetch error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users: AdminUserRow[] = (rows ?? []).map((u) => {
    const email: string = u.email ?? ''
    const display = (u.full_name && u.full_name.trim()) || email.split('@')[0] || 'Unknown'
    return {
      id: u.id,
      name: display,
      initials: toInitials(display),
      email,
      tier: tierLabel(u.tier),
      status: u.is_trial ? 'Trial' : 'Active',
      joined: u.created_at
        ? new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      lastActive: '—',
      role: u.role ?? 'user',
    }
  })

  return NextResponse.json({ users })
}

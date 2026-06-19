import { supabaseAdmin } from '@/lib/supabase'
import UsersAndOrgsClient, { type User, type Org } from './UsersClient'

// The DB stores lowercase tier values (starter/pro/…); the UI uses labels.
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

// Helper to derive initials from an email or name string
function toInitials(str: string): string {
  const parts = str.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return str.slice(0, 2).toUpperCase()
}

function fmtDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function UsersAndOrgsPage() {
  // ── Users ──────────────────────────────────────────────────────────────
  // IMPORTANT: there is no `status` column on the users table — selecting it
  // previously errored the whole query and produced an empty list. Status is
  // derived from `is_trial` (Trial vs Active).
  const { data: userRows, error: usersError } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, tier, role, is_trial, bonus_transcriptions, created_at')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('[admin/users] Supabase users fetch error:', usersError.message)
  }

  const initialUsers: User[] = (userRows ?? []).map((u) => {
    const email: string = u.email ?? ''
    const display = (u.full_name && u.full_name.trim()) || email.split('@')[0] || 'Unknown'
    return {
      id: u.id,
      name: display,
      initials: toInitials(display),
      email,
      tier: tierLabel(u.tier),
      status: u.is_trial ? 'Trial' : 'Active',
      joined: fmtDate(u.created_at),
      lastActive: '—',
      role: u.role ?? 'user',
      bonusTranscriptions: typeof u.bonus_transcriptions === 'number' ? u.bonus_transcriptions : 0,
    }
  })

  // ── Organisations ──────────────────────────────────────────────────────
  // Real data from the `organisations` table (British spelling per schema),
  // with member/admin counts resolved from `org_members`.
  const { data: orgRows, error: orgsError } = await supabaseAdmin
    .from('organisations')
    .select('id, name, tier, seat_limit, created_at')
    .order('created_at', { ascending: false })

  if (orgsError) {
    console.error('[admin/users] Supabase organisations fetch error:', orgsError.message)
  }

  const orgIds = (orgRows ?? []).map((o) => o.id)
  const memberCounts: Record<string, number> = {}
  const orgAdmins: Record<string, string> = {}

  if (orgIds.length > 0) {
    const { data: members } = await supabaseAdmin
      .from('org_members')
      .select('org_id, org_role, users:user_id(email, full_name)')
      .in('org_id', orgIds)

    for (const m of members ?? []) {
      const oid = (m as any).org_id as string
      memberCounts[oid] = (memberCounts[oid] ?? 0) + 1
      if ((m as any).org_role === 'org_admin' && !orgAdmins[oid]) {
        const u = Array.isArray((m as any).users) ? (m as any).users[0] : (m as any).users
        if (u) orgAdmins[oid] = u.full_name || u.email || '—'
      }
    }
  }

  const initialOrgs: Org[] = (orgRows ?? []).map((o) => ({
    id: o.id,
    name: o.name ?? 'Untitled organisation',
    tier: tierLabel(o.tier),
    members: memberCounts[o.id] ?? 0,
    admin: orgAdmins[o.id] ?? '—',
    seatsUsed: memberCounts[o.id] ?? 0,
    seatsTotal: o.seat_limit ?? 0,
    created: fmtDate(o.created_at),
  }))

  return <UsersAndOrgsClient initialUsers={initialUsers} initialOrgs={initialOrgs} />
}

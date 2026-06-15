import { supabaseAdmin } from '@/lib/supabase'
import UsersAndOrgsClient, { type User } from './UsersClient'

// Helper to derive initials from an email or name string
function toInitials(str: string): string {
  const parts = str.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return str.slice(0, 2).toUpperCase()
}

export default async function UsersAndOrgsPage() {
  const { data: rows, error } = await supabaseAdmin
    .from('users')
    .select('id, email, tier, role, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/users] Supabase fetch error:', error.message)
  }

  const initialUsers: User[] = (rows ?? []).map(u => {
    const email: string = u.email ?? ''
    const localPart = email.split('@')[0] ?? 'Unknown'
    return {
      id:         u.id,
      name:       localPart,
      initials:   toInitials(localPart),
      email,
      tier:       u.tier    ?? 'Starter',
      status:     u.status  ?? 'Active',
      joined:     new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastActive: '—',
      role:       u.role    ?? 'user',
    }
  })

  return <UsersAndOrgsClient initialUsers={initialUsers} />
}

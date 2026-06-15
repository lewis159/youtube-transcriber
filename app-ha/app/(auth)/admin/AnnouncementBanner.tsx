import { supabaseAdmin } from '@/lib/supabase'

// Server component. Reads the current active announcement directly via the
// service-role client and renders a site-wide banner. Included from the admin
// Overview page for now (admins only) — a full user-facing banner can come
// later by adding this to the authenticated app shell.

const LEVEL_STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  info:     { bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.3)', color: '#60a5fa', icon: 'ℹ️' },
  warning:  { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.3)',  color: '#eab308', icon: '⚠️' },
  critical: { bg: 'rgba(229,57,53,0.10)',  border: 'rgba(229,57,53,0.4)',  color: '#E53935', icon: '🚨' },
}

export default async function AnnouncementBanner() {
  let announcement: { message: string; level: string } | null = null

  try {
    const { data } = await supabaseAdmin
      .from('announcements')
      .select('message, level')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    announcement = data ?? null
  } catch {
    announcement = null
  }

  if (!announcement) return null

  const s = LEVEL_STYLES[announcement.level] ?? LEVEL_STYLES.info

  return (
    <div style={{
      background: s.bg, borderBottom: `0.5px solid ${s.border}`,
      padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '13px', color: s.color, fontWeight: 500,
    }}>
      <span style={{ fontSize: '14px' }}>{s.icon}</span>
      <span>{announcement.message}</span>
    </div>
  )
}

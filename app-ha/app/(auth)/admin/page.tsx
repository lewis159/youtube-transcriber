import { supabaseAdmin } from '@/lib/supabase'

export default async function AdminOverviewPage() {
  // ── Fetch real stats from Supabase ──────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: totalVideos },
    { data: videoRows },
    { data: recentUsersRaw },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('videos').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('videos').select('status'),
    supabaseAdmin
      .from('users')
      .select('id, email, tier, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const doneCount   = videoRows?.filter(v => v.status === 'done' || v.status === 'completed').length ?? 0
  const successRate = totalVideos && totalVideos > 0 ? Math.round((doneCount / totalVideos) * 100) : 0

  const fmtNum = (n: number | null) =>
    n == null ? '—' : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)

  const stats = [
    { label: 'Total Users',      value: fmtNum(totalUsers),   sub: 'All registered accounts', color: '#E53935', subColor: '#888' },
    { label: 'Organisations',    value: '—',                   sub: 'Org data coming soon',    color: '#22c55e', subColor: '#888' },
    { label: 'Total Videos',     value: fmtNum(totalVideos),  sub: 'All submitted videos',    color: '#60a5fa', subColor: '#22c55e' },
    { label: 'Transcripts Done', value: fmtNum(doneCount),    sub: `${successRate}% success rate`, color: '#a78bfa', subColor: '#888' },
  ]

  const recentUsers = (recentUsersRaw ?? []).map(u => ({
    name:    u.email?.split('@')[0] ?? 'Unknown',
    email:   u.email ?? '',
    tier:    u.tier   ?? 'Starter',
    status:  'Active',
    joined:  new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    role:    u.role   ?? 'user',
  }))

  const activity = [
    { icon: '👤', text: 'James Walker signed up — Starter trial started',   time: '2 min ago',   color: '#22c55e' },
    { icon: '💳', text: 'Tom Hughes upgraded to Pro — £9.00 charged',        time: '14 min ago',  color: '#22c55e' },
    { icon: '⚠️', text: 'Dan Cooper payment failed — card declined',         time: '1 hr ago',    color: '#E53935' },
    { icon: '🎬', text: '182 new transcripts processed today',                time: '3 hrs ago',   color: '#60a5fa' },
    { icon: '🏢', text: 'Acme Productions added 3 new seats',                time: '5 hrs ago',   color: '#888' },
  ]

  const tierBadge = (tier: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      Starter:    { bg: 'rgba(255,255,255,0.04)', color: '#666' },
      Pro:        { bg: 'rgba(229,57,53,0.08)',   color: '#E53935' },
      Studio:     { bg: 'rgba(229,57,53,0.15)',   color: '#ff6b6b' },
      Enterprise: { bg: 'rgba(229,57,53,0.25)',   color: '#ff8a80' },
    }
    const s = styles[tier] || styles.Starter
    return (
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, border: `0.5px solid ${s.color}33`, fontWeight: 600 }}>
        {tier}
      </span>
    )
  }

  const statusBadge = (status: string) => {
    const s = status === 'Active'
      ? { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' }
      : { bg: 'rgba(234,179,8,0.1)', color: '#eab308' }
    return (
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, fontWeight: 600 }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Sub-bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Overview</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>LIVE</span>
        </div>
        <span style={{ fontSize: '12px', color: '#444' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {stats.map(({ label, value, sub, color, subColor }) => (
            <div key={label} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '20px', borderTop: `2px solid ${color}` }}>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: '28px', fontWeight: 500, marginBottom: '6px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: subColor }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', alignItems: 'start' }}>

          {/* Recent users table */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Recent Users</span>
              <a href="/admin/users" style={{ fontSize: '12px', color: '#E53935', textDecoration: 'none' }}>View all →</a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                  {['User', 'Tier', 'Status', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user, i) => (
                  <tr key={user.email} style={{ borderBottom: i < recentUsers.length - 1 ? '0.5px solid #141414' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</div>
                      <div style={{ fontSize: '11px', color: '#444', fontFamily: 'monospace', marginTop: '2px' }}>{user.email}</div>
                      {user.role === 'global_admin' && <div style={{ fontSize: '10px', color: '#E53935', marginTop: '2px' }}>Global Admin</div>}
                      {user.role === 'org_admin' && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>Org Admin</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{tierBadge(user.tier)}</td>
                    <td style={{ padding: '12px 16px' }}>{statusBadge(user.status)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#444' }}>{user.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Activity feed */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Activity Feed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {activity.map(({ icon, text, time, color }, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '12px', padding: '12px 0',
                  borderBottom: i < activity.length - 1 ? '0.5px solid #141414' : 'none',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#141414', border: `0.5px solid ${color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{text}</div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '4px' }}>{time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {[
            { href: '/admin/users',     icon: '👥', label: 'Users & Orgs' },
            { href: '/admin/billing',   icon: '💳', label: 'Billing' },
            { href: '/admin/containers',icon: '🐳', label: 'Containers' },
            { href: '/admin/security',  icon: '🔒', label: 'Security' },
            { href: '/admin/roadmap',   icon: '🗺️', label: 'Roadmap' },
          ].map(({ href, icon, label }) => (
            <a key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px',
                padding: '16px', textAlign: 'center', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(229,57,53,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}

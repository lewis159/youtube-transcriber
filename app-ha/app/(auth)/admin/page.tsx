import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d',
        borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '60px',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Admin Overview</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{today}</span>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>GA</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '24px' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {/* Total users */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #E53935' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Total Users</div>
            <div style={{ fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>1,284</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>+24 this week</div>
          </div>
          {/* Active trials */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #333' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Active Trials</div>
            <div style={{ fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>347</div>
            <div style={{ fontSize: '11px', color: '#888' }}>27% convert to paid</div>
          </div>
          {/* Monthly revenue */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #22c55e' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Monthly Revenue</div>
            <div style={{ fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>£4,820</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>+£340 this month</div>
          </div>
          {/* Containers */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #22c55e' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Containers</div>
            <div style={{ fontSize: '26px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>2 / 10</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>All healthy — 18% avg CPU</div>
          </div>
        </div>

        {/* Bottom panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px' }}>

          {/* Recent alerts */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>🔔</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Alerts</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Warning alert */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '6px', background: 'rgba(229,57,53,0.06)', border: '0.5px solid rgba(229,57,53,0.15)' }}>
                <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>App-4001 CPU at 64%</div>
                  <div style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace', marginTop: '2px' }}>15:38:22</div>
                </div>
              </div>
              {/* Neutral alerts */}
              {[
                { icon: '💸', msg: 'Refund issued — £9.00', time: '15:22:10' },
                { icon: '🏢', msg: 'New org created', time: '14:55:01' },
                { icon: '⬆️', msg: 'User upgraded to Studio', time: '14:31:44' },
              ].map((alert, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '0.5px solid #1e1e1e' }}>
                  <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>{alert.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{alert.msg}</div>
                    <div style={{ fontSize: '11px', color: '#555', fontFamily: 'monospace', marginTop: '2px' }}>{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Quick Actions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: '👤', label: 'Add user', href: '/admin/users' },
                { icon: '🔄', label: 'Deploy update', href: '/admin/containers' },
                { icon: '📢', label: 'Broadcast message', href: '#' },
                { icon: '🪙', label: 'Issue credits', href: '/admin/billing' },
              ].map((action, i) => (
                <Link key={i} href={action.href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)', border: '0.5px solid #1e1e1e',
                  fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: '14px' }}>{action.icon}</span>
                  {action.label}
                </Link>
              ))}
              {/* Drain container — red */}
              <Link href="/admin/containers" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '6px',
                background: 'rgba(229,57,53,0.04)', border: '0.5px solid rgba(229,57,53,0.3)',
                fontSize: '13px', color: '#E53935', textDecoration: 'none',
              }}>
                <span style={{ fontSize: '14px' }}>🛑</span>
                Drain container
              </Link>
            </div>
          </div>

          {/* Changelog */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🕐</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Changelog</span>
              </div>
              <Link href="/admin/changelog" style={{ fontSize: '12px', color: '#E53935', textDecoration: 'none' }}>View all →</Link>
            </div>

            {/* v0.1.0 */}
            <div style={{ borderLeft: '2px solid #E53935', paddingLeft: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>v0.1.0 alpha</span>
                <span style={{ fontSize: '10px', color: '#E53935', background: 'rgba(229,57,53,0.1)', border: '0.5px solid rgba(229,57,53,0.3)', padding: '1px 6px', borderRadius: '3px' }}>CURRENT</span>
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New features</div>
              {['Dark mode UI + design system', 'Clerk auth + middleware', 'Feature flag architecture', '/api/ping health check'].map((f, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>• {f}</div>
              ))}
              <div style={{ fontSize: '11px', color: '#555', marginTop: '8px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Changes</div>
              {['Downgraded Next.js 16 → 15', 'Fixed nginx headers for Clerk'].map((c, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>• {c}</div>
              ))}
            </div>

            {/* v0.0.9 */}
            <div style={{ borderLeft: '2px solid #333', paddingLeft: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', marginBottom: '6px' }}>v0.0.9 pre-alpha</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Next.js rewrite from Flask. HA Docker stack.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

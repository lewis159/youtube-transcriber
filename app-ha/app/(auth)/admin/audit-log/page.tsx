import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const actionColors: Record<string, { bg: string; color: string }> = {
  tier_change:       { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa' },
  refund_issued:     { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
  feature_override:  { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
  user_suspended:    { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  user_unsuspended:  { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
  credit_granted:    { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
  org_created:       { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  container_drained: { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  password_reset:    { bg: 'rgba(107,114,128,0.1)',color: '#9ca3af' },
  broadcast_sent:    { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
}

const logs = [
  { ts: '2026-06-14 15:44:01', admin: 'admin@yt.io',  action: 'tier_change',       target: 'Sarah Mitchell', details: 'Starter → Pro' },
  { ts: '2026-06-14 15:22:10', admin: 'admin@yt.io',  action: 'refund_issued',      target: 'James Walker',   details: '£9.00 refunded' },
  { ts: '2026-06-14 15:10:33', admin: 'admin@yt.io',  action: 'feature_override',   target: 'Tom Hughes',     details: 'ai_chapters → enabled' },
  { ts: '2026-06-14 14:55:01', admin: 'admin@yt.io',  action: 'org_created',        target: 'Acme Corp',      details: 'Enterprise tier' },
  { ts: '2026-06-14 14:31:44', admin: 'admin@yt.io',  action: 'tier_change',        target: 'Ben Percival',   details: 'Pro → Studio' },
  { ts: '2026-06-14 13:50:12', admin: 'admin@yt.io',  action: 'user_suspended',     target: 'Dan Cooper',     details: 'Terms violation' },
  { ts: '2026-06-14 13:22:09', admin: 'admin@yt.io',  action: 'credit_granted',     target: 'Priya Sharma',   details: '+50 credits' },
  { ts: '2026-06-14 12:15:44', admin: 'admin@yt.io',  action: 'container_drained',  target: 'app-4001',       details: 'Scheduled maintenance' },
  { ts: '2026-06-14 11:40:22', admin: 'admin@yt.io',  action: 'broadcast_sent',     target: 'All users',      details: 'Maintenance window notice' },
  { ts: '2026-06-14 10:55:18', admin: 'admin@yt.io',  action: 'password_reset',     target: 'Lisa Chen',      details: 'Admin-forced reset' },
  { ts: '2026-06-13 18:30:00', admin: 'admin@yt.io',  action: 'tier_change',        target: 'Emma Davis',     details: 'Studio → Enterprise' },
  { ts: '2026-06-13 17:12:33', admin: 'admin@yt.io',  action: 'refund_issued',      target: 'Tom Hughes',     details: '£12.00 refunded' },
  { ts: '2026-06-13 16:45:10', admin: 'admin@yt.io',  action: 'feature_override',   target: 'James Walker',   details: 'export_pdf → enabled' },
  { ts: '2026-06-13 15:20:05', admin: 'admin@yt.io',  action: 'user_unsuspended',   target: 'Mark Ellis',     details: 'Appeal approved' },
  { ts: '2026-06-13 14:00:44', admin: 'admin@yt.io',  action: 'org_created',        target: 'DevContent Ltd', details: 'Studio tier' },
  { ts: '2026-06-13 13:10:22', admin: 'admin@yt.io',  action: 'credit_granted',     target: 'Tom Hughes',     details: '+20 credits (compensation)' },
  { ts: '2026-06-13 12:05:11', admin: 'admin@yt.io',  action: 'container_drained',  target: 'app-4002',       details: 'CPU spike' },
  { ts: '2026-06-13 11:30:00', admin: 'admin@yt.io',  action: 'broadcast_sent',     target: 'Studio+ users',  details: 'New AI chapters feature' },
  { ts: '2026-06-13 10:55:33', admin: 'admin@yt.io',  action: 'user_suspended',     target: 'Spam Account',   details: 'Automated detection' },
  { ts: '2026-06-12 18:00:00', admin: 'admin@yt.io',  action: 'password_reset',     target: 'Sarah Mitchell', details: 'User request' },
]

export default async function AuditLogPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        gap: '12px', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Audit Log</span>
        <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input type="date" style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }} defaultValue="2026-06-12" />
          <input type="date" style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }} defaultValue="2026-06-14" />
          <select style={{ padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', fontSize: '13px', outline: 'none' }}>
            <option>All action types</option>
            <option>tier_change</option>
            <option>refund_issued</option>
            <option>feature_override</option>
            <option>user_suspended</option>
            <option>user_unsuspended</option>
            <option>credit_granted</option>
            <option>org_created</option>
            <option>container_drained</option>
            <option>broadcast_sent</option>
            <option>password_reset</option>
          </select>
          <input type="text" placeholder="Search by user..." style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', background: '#0d0d0d', border: '0.5px solid #2a2a2a', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }} />
        </div>

        {/* Table */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #1e1e1e' }}>
                {['Timestamp', 'Admin', 'Action', 'Target', 'Details'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const style = actionColors[log.action] || { bg: 'rgba(255,255,255,0.05)', color: '#888' }
                return (
                  <tr key={i} style={{ borderBottom: i < logs.length - 1 ? '0.5px solid #141414' : 'none' }}>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.ts}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{log.admin}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: style.bg, color: style.color, fontWeight: 600, fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 500 }}>{log.target}</td>
                    <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{log.details}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

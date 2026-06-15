import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const transactions = [
  { id: '1', user: 'Ben Percival',   plan: 'Studio',     amount: '£29.00', date: '14 Jun 2026', status: 'Paid' },
  { id: '2', user: 'Sarah Mitchell', plan: 'Pro',    amount: '£12.00', date: '14 Jun 2026', status: 'Paid' },
  { id: '3', user: 'Emma Davis',     plan: 'Enterprise', amount: '£89.00', date: '13 Jun 2026', status: 'Paid' },
  { id: '4', user: 'James Walker',   plan: 'Starter',   amount: '£0.00',  date: '13 Jun 2026', status: 'Refunded' },
  { id: '5', user: 'Priya Sharma',   plan: 'Studio',     amount: '£29.00', date: '12 Jun 2026', status: 'Paid' },
  { id: '6', user: 'Tom Hughes',     plan: 'Pro',    amount: '£12.00', date: '12 Jun 2026', status: 'Failed' },
  { id: '7', user: 'Lisa Chen',      plan: 'Pro',    amount: '£9.00',  date: '11 Jun 2026', status: 'Refunded' },
  { id: '8', user: 'Dan Cooper',     plan: 'Starter',   amount: '£5.00',  date: '10 Jun 2026', status: 'Failed' },
]

const failedPayments = [
  { user: 'Tom Hughes',  plan: 'Pro',  amount: '£12.00', reason: 'Card declined' },
  { user: 'Dan Cooper',  plan: 'Starter', amount: '£5.00',  reason: 'Insufficient funds' },
  { user: 'Mark Ellis',  plan: 'Studio',   amount: '£29.00', reason: 'Expired card' },
]

function statusBadge(status: string) {
  const s: Record<string, { bg: string; color: string }> = {
    Paid:     { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e' },
    Refunded: { bg: 'rgba(234,179,8,0.1)',  color: '#eab308' },
    Failed:   { bg: 'rgba(229,57,53,0.1)',  color: '#E53935' },
  }
  const style = s[status] || s.Paid
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: style.bg, color: style.color, fontWeight: 600 }}>
      {status}
    </span>
  )
}

export default async function BillingPage() {
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
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Billing Management</span>
        <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #22c55e' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>MRR</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>£4,820</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>+£340 this month</div>
          </div>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #22c55e' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Total Revenue</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>£18,440</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>since launch</div>
          </div>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #E53935' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Failed Payments</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>3</div>
            <div style={{ fontSize: '11px', color: '#E53935' }}>requires attention</div>
          </div>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #333' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Refunds Issued</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>£127</div>
            <div style={{ fontSize: '11px', color: '#888' }}>this month</div>
          </div>
        </div>

        {/* Two panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '12px' }}>
          {/* Recent transactions */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1e1e' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Recent Transactions</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                  {['User', 'Plan', 'Amount', 'Date', 'Status', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} style={{ borderBottom: i < transactions.length - 1 ? '0.5px solid #141414' : 'none' }}>
                    <td style={{ padding: '10px 14px', fontSize: '13px' }}>{tx.user}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.plan}</td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', fontFamily: 'monospace' }}>{tx.amount}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{tx.date}</td>
                    <td style={{ padding: '10px 14px' }}>{statusBadge(tx.status)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'transparent', border: '0.5px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Failed payments */}
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Failed Payments</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {failedPayments.map((fp, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '6px', background: 'rgba(229,57,53,0.04)', border: '0.5px solid rgba(229,57,53,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{fp.user}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#E53935' }}>{fp.amount}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{fp.plan}</div>
                  <div style={{ fontSize: '11px', color: '#E53935', marginBottom: '12px' }}>Reason: {fp.reason}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ flex: 1, padding: '6px', borderRadius: '4px', background: '#E53935', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Retry</button>
                    <button style={{ flex: 1, padding: '6px', borderRadius: '4px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid #2a2a2a', cursor: 'pointer', fontSize: '12px' }}>Contact user</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

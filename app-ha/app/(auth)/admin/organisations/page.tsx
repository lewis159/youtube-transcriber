import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const orgs = [
  {
    id: '1',
    name: 'Acme Productions',
    tier: 'Enterprise',
    members: 15,
    admin: 'Emma Davis',
    seatsUsed: 8,
    seatsTotal: 15,
    created: 'Mar 2026',
  },
  {
    id: '2',
    name: 'YT Translator',
    tier: 'Studio',
    members: 5,
    admin: 'Ben Percival',
    seatsUsed: 5,
    seatsTotal: 10,
    created: 'Jan 2026',
  },
  {
    id: '3',
    name: 'MediaFlow Agency',
    tier: 'Pro',
    members: 3,
    admin: 'Sarah Mitchell',
    seatsUsed: 3,
    seatsTotal: 5,
    created: 'Apr 2026',
  },
  {
    id: '4',
    name: 'DevContent Ltd',
    tier: 'Studio',
    members: 7,
    admin: 'Priya Sharma',
    seatsUsed: 7,
    seatsTotal: 10,
    created: 'May 2026',
  },
]

function tierBadge(tier: string) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Pro:        { bg: 'rgba(229,57,53,0.08)',  color: '#E53935', border: 'rgba(229,57,53,0.2)' },
    Studio:     { bg: 'rgba(229,57,53,0.15)',  color: '#ff6b6b', border: 'rgba(229,57,53,0.35)' },
    Enterprise: { bg: 'rgba(229,57,53,0.25)',  color: '#ff8a80', border: 'rgba(229,57,53,0.5)' },
  }
  const s = styles[tier] || { bg: 'rgba(255,255,255,0.05)', color: '#888', border: '#333' }
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, fontWeight: 600 }}>
      {tier}
    </span>
  )
}

export default async function OrganisationsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Organisations</span>
          <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
        </div>
        <button disabled style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '6px', background: '#E53935', color: '#fff', border: 'none', cursor: 'not-allowed', opacity: 0.4, fontWeight: 600 }}>
          + New organisation
        </button>
      </div>

      {/* Demo data banner */}
      <div style={{
        background: 'rgba(234,179,8,0.08)', borderBottom: '0.5px solid rgba(234,179,8,0.25)',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '12px', color: '#eab308',
      }}>
        <span>⚠</span>
        <span>Demo data — this page shows sample data and is not yet connected to live organisation data. Actions are disabled.</span>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #E53935' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Total Orgs</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>12</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Across all tiers</div>
          </div>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #22c55e' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Active Orgs</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>10</div>
            <div style={{ fontSize: '11px', color: '#22c55e' }}>83% active rate</div>
          </div>
          <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px', borderTop: '2px solid #333' }}>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>Enterprise Orgs</div>
            <div style={{ fontSize: '26px', fontWeight: 500, marginBottom: '4px' }}>3</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Top tier</div>
          </div>
        </div>

        {/* Org cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {orgs.map((org) => {
            const seatPct = Math.round((org.seatsUsed / org.seatsTotal) * 100)
            return (
              <div key={org.id} style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>{org.name}</div>
                    {tierBadge(org.tier)}
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#1a1a1a', border: '0.5px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                    🏢
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Members</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{org.members}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Org Admin</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{org.admin}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Created</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{org.created}</div>
                  </div>
                </div>

                {/* Seat usage bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#555' }}>Seat usage</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{org.seatsUsed}/{org.seatsTotal} seats</span>
                  </div>
                  <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${seatPct}%`, background: seatPct > 80 ? '#E53935' : '#22c55e', borderRadius: '2px' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#E53935', color: '#fff', border: 'none', cursor: 'not-allowed', opacity: 0.4, fontSize: '12px', fontWeight: 600 }}>Manage</button>
                  <button disabled style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'transparent', color: 'var(--text-secondary)', border: '0.5px solid #2a2a2a', cursor: 'not-allowed', opacity: 0.4, fontSize: '12px' }}>View users</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        background: '#0d0d0d', borderBottom: '0.5px solid #1e1e1e',
        padding: '0 24px', height: '48px', display: 'flex', alignItems: 'center',
        gap: '12px', position: 'sticky', top: '60px', zIndex: 50,
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Billing Management</span>
        <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
      </div>

      {/* Coming soon state — fills the content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: '20px',
      }}>
        {/* Icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(229,57,53,0.06)', border: '0.5px solid rgba(229,57,53,0.2)',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '420px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Billing — coming soon
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
            Revenue, transactions and payment management will appear here once billing is connected.
          </p>
        </div>

        <span style={{
          fontSize: '11px', color: '#555', fontFamily: 'monospace',
          background: 'rgba(255,255,255,0.02)', border: '0.5px solid #1e1e1e',
          padding: '4px 12px', borderRadius: '6px',
        }}>
          Not yet available
        </span>
      </div>
    </div>
  )
}

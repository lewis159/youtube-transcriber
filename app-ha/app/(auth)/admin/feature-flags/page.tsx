import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

type TierName = 'Explorer' | 'Creator' | 'Studio' | 'Enterprise'

const features: { key: string; label: string; tiers: Record<TierName, boolean> }[] = [
  { key: 'transcribe',        label: 'Transcribe',          tiers: { Explorer: true,  Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'notes',             label: 'Notes',               tiers: { Explorer: true,  Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'export_txt',        label: 'Export TXT',          tiers: { Explorer: true,  Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'export_pdf',        label: 'Export PDF',          tiers: { Explorer: false, Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'folders',           label: 'Folders',             tiers: { Explorer: false, Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'share_links',       label: 'Share Links',         tiers: { Explorer: false, Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'link_screenshots',  label: 'Link Screenshots',    tiers: { Explorer: false, Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'ai_chapters',       label: 'AI Chapters',         tiers: { Explorer: false, Creator: true,  Studio: true,  Enterprise: true  } },
  { key: 'api_access',        label: 'API Access',          tiers: { Explorer: false, Creator: false, Studio: false, Enterprise: true  } },
  { key: 'team_seats',        label: 'Team Seats',          tiers: { Explorer: false, Creator: false, Studio: false, Enterprise: true  } },
]

const tiers: TierName[] = ['Explorer', 'Creator', 'Studio', 'Enterprise']

const overrides = [
  { user: 'James Walker',  feature: 'export_pdf',  direction: 'enabled',  setBy: 'admin@yt.io', date: '13 Jun 2026' },
  { user: 'Tom Hughes',    feature: 'ai_chapters', direction: 'enabled',  setBy: 'admin@yt.io', date: '12 Jun 2026' },
  { user: 'Dan Cooper',    feature: 'transcribe',  direction: 'disabled', setBy: 'admin@yt.io', date: '10 Jun 2026' },
]

function Check({ val }: { val: boolean }) {
  return (
    <span style={{ fontSize: '15px', fontWeight: 700, color: val ? '#22c55e' : '#E53935' }}>
      {val ? '✓' : '✗'}
    </span>
  )
}

export default async function FeatureFlagsPage() {
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
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Feature Flags</span>
        <span style={{ fontSize: '11px', color: '#E53935', fontFamily: 'monospace', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.2)', padding: '2px 8px', borderRadius: '4px' }}>ALPHA v0.1.0</span>
      </div>

      <div style={{ padding: '24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Override features per tier or per individual user. Changes take effect immediately.
        </p>

        {/* Tier defaults table */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🏷️</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Tier Defaults</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #1a1a1a' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '220px' }}>Feature</th>
                {tiers.map((t) => (
                  <th key={t} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={f.key} style={{ borderBottom: i < features.length - 1 ? '0.5px solid #141414' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{f.label}</td>
                  {tiers.map((t) => (
                    <td key={t} style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Check val={f.tiers[t]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User overrides */}
        <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px' }}>👤</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>User Overrides</span>
          </div>
          <input
            type="text"
            placeholder="Find user to override..."
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '6px',
              background: '#141414', border: '0.5px solid #2a2a2a',
              color: 'var(--text-primary)', fontSize: '13px', outline: 'none', marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {overrides.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '6px', background: '#141414', border: '0.5px solid #1e1e1e' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, minWidth: '120px' }}>{o.user}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: '120px' }}>{o.feature}</span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600,
                    background: o.direction === 'enabled' ? 'rgba(34,197,94,0.1)' : 'rgba(229,57,53,0.1)',
                    color: o.direction === 'enabled' ? '#22c55e' : '#E53935',
                  }}>{o.direction}</span>
                  <span style={{ fontSize: '12px', color: '#555' }}>by {o.setBy} · {o.date}</span>
                </div>
                <button style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '4px', background: 'rgba(229,57,53,0.08)', border: '0.5px solid rgba(229,57,53,0.3)', color: '#E53935', cursor: 'pointer' }}>
                  Remove override
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

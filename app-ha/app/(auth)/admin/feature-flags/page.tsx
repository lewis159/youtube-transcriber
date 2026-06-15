import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

type TierName = 'Starter' | 'Pro' | 'Studio' | 'Enterprise'

const features: { key: string; label: string; tiers: Record<TierName, boolean> }[] = [
  { key: 'transcribe',        label: 'Transcribe',          tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'notes',             label: 'Notes',               tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'export_txt',        label: 'Export TXT',          tiers: { Starter: true,  Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'export_pdf',        label: 'Export PDF',          tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'folders',           label: 'Folders',             tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'share_links',       label: 'Share Links',         tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'link_screenshots',  label: 'Link Screenshots',    tiers: { Starter: false, Pro: true,  Studio: true,  Enterprise: true  } },
  { key: 'ai_chapters',       label: 'AI Chapters',         tiers: { Starter: false, Pro: false, Studio: true,  Enterprise: true  } },
  { key: 'api_access',        label: 'API Access',          tiers: { Starter: false, Pro: false, Studio: false, Enterprise: true  } },
  { key: 'team_seats',        label: 'Team Seats',          tiers: { Starter: false, Pro: false, Studio: false, Enterprise: true  } },
]

const tiers: TierName[] = ['Starter', 'Pro', 'Studio', 'Enterprise']

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

        {/* Tier defaults — pricing card grid */}
        {(() => {
          const tierMeta: Record<TierName, { color: string; price: string; includes: string | null }> = {
            Starter:    { color: '#888',    price: 'Free',    includes: null },
            Pro:        { color: '#E53935', price: '$9/mo',   includes: 'Includes Starter +' },
            Studio:     { color: '#ff6b6b', price: '$29/mo',  includes: 'Includes Pro +' },
            Enterprise: { color: '#ff8a80', price: 'Custom',  includes: 'Includes Studio +' },
          }
          const prevTier: Record<TierName, TierName | null> = {
            Starter: null, Pro: 'Starter', Studio: 'Pro', Enterprise: 'Studio',
          }

          return (
            <div style={{ background: '#0d0d0d', border: '0.5px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🏷️</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Tier Defaults</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', padding: '20px', gap: '12px' }}>
                {tiers.map((tier) => {
                  const meta = tierMeta[tier]
                  const prev = prevTier[tier]
                  const inherited = prev
                    ? features.filter((f) => f.tiers[prev])
                    : []
                  const added = features.filter((f) => {
                    if (!f.tiers[tier]) return false
                    if (prev === null) return true
                    return !f.tiers[prev]
                  })

                  return (
                    <div key={tier} style={{
                      background: '#141414',
                      border: `0.5px solid ${meta.color}33`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}>
                      {/* Card header */}
                      <div style={{
                        padding: '14px 16px',
                        borderBottom: `0.5px solid ${meta.color}33`,
                        background: `${meta.color}0d`,
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: meta.color }}>{tier}</div>
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{meta.price}</div>
                      </div>

                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {/* Inherited features (shown collapsed for Pro/Studio/Enterprise) */}
                        {meta.includes && inherited.length > 0 && (
                          <>
                            <div style={{
                              fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                              letterSpacing: '0.07em', color: '#444', marginBottom: '8px',
                              paddingBottom: '6px', borderBottom: '0.5px solid #1e1e1e',
                            }}>
                              {meta.includes}
                            </div>
                            {inherited.map((f) => (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <span style={{ fontSize: '13px', color: '#3a6b3a', lineHeight: 1 }}>✓</span>
                                <span style={{ fontSize: '12px', color: '#555' }}>{f.label}</span>
                              </div>
                            ))}
                            {added.length > 0 && (
                              <div style={{
                                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                                letterSpacing: '0.07em', color: meta.color, margin: '10px 0 8px',
                                paddingBottom: '6px', borderBottom: `0.5px solid ${meta.color}33`,
                              }}>
                                New in {tier}
                              </div>
                            )}
                          </>
                        )}

                        {/* Added / base features */}
                        {added.map((f) => (
                          <div key={f.key} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0',
                            borderLeft: `2px solid ${meta.color}`,
                            paddingLeft: '8px', marginLeft: '-8px',
                          }}>
                            <span style={{ fontSize: '13px', color: '#22c55e', lineHeight: 1 }}>✓</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{f.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

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

import { UpgradeButton } from '@/components/UpgradeButton'

const plans = [
  {
    tier: 'starter' as const,
    name: 'Starter',
    price: 'Free',
    description: 'Try it out — no card required.',
    features: [
      '5 lifetime transcriptions',
      'Transcript viewer',
      'Timestamped sentences',
      'Transcript search',
      'Export as TXT',
    ],
    cta: null,
    comingSoon: false,
    highlight: false,
  },
  {
    tier: 'pro' as const,
    name: 'Pro',
    price: '£9',
    period: '/month',
    description: 'For regular creators.',
    features: [
      '10 transcriptions/month',
      '1-month credit rollover',
      'Export PDF',
      'Folders',
      'Share links (10-day)',
      'Link screenshots (up to 5)',
    ],
    cta: 'pro',
    comingSoon: true,
    highlight: false,
  },
  {
    tier: 'studio' as const,
    name: 'Studio',
    price: '£29',
    period: '/month',
    description: 'For power users and small teams.',
    features: [
      '40 transcriptions/month',
      '1-month credit rollover',
      'Notes',
      'Audio / video export',
      'Unlimited screenshots',
      'Folders (up to 10)',
      'Share links (30-day)',
      'AI chapters',
      'Scheduled transcription',
      'Transcript correction',
      'Organisations',
    ],
    cta: 'studio',
    comingSoon: true,
    highlight: false,
  },
  {
    tier: 'enterprise' as const,
    name: 'Enterprise',
    price: 'Custom',
    description: 'For agencies and large teams.',
    features: [
      'Unlimited transcriptions',
      'All Studio features',
      'API access',
      'Team seats',
      'Priority processing',
      'Dedicated support',
    ],
    cta: 'enterprise',
    comingSoon: true,
    highlight: false,
  },
]

export default function PricingPage() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', padding: '60px 24px', color: '#f5f5f5' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 12 }}>Simple, transparent pricing</h1>
          <p style={{ color: '#999', fontSize: 16 }}>Start free today. Paid plans coming soon.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <div
              key={plan.tier}
              style={{
                background: '#0d0d0d',
                border: '0.5px solid #1e1e1e',
                borderRadius: 8,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                position: 'relative',
                opacity: plan.comingSoon ? 0.6 : 1,
              }}
            >
              {plan.comingSoon && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#2a2a2a', color: '#888', fontSize: 11, fontWeight: 700,
                  padding: '3px 12px', borderRadius: 20, letterSpacing: '0.08em',
                  border: '0.5px solid #333', whiteSpace: 'nowrap',
                }}>
                  COMING SOON
                </div>
              )}

              <div>
                <div style={{ fontSize: 13, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 700 }}>{plan.price}</span>
                  {'period' in plan && plan.period && <span style={{ color: '#666', fontSize: 14 }}>{plan.period}</span>}
                </div>
                <p style={{ color: '#666', fontSize: 13, marginTop: 6 }}>{plan.description}</p>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 13, color: plan.comingSoon ? '#555' : '#ccc', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: plan.comingSoon ? '#444' : '#e53e3e', fontSize: 16 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {plan.comingSoon ? (
                <div style={{
                  textAlign: 'center', background: '#111', border: '0.5px solid #2a2a2a',
                  borderRadius: 6, padding: '10px 20px', color: '#555', fontSize: 14, fontWeight: 600,
                }}>
                  Coming Soon
                </div>
              ) : plan.cta ? (
                <UpgradeButton tier={plan.cta as 'pro' | 'studio' | 'enterprise'} label={`Get ${plan.name}`} className="w-full" />
              ) : (
                <a
                  href="/sign-up"
                  style={{
                    display: 'block', textAlign: 'center', background: '#e53e3e',
                    color: '#fff', border: 'none', borderRadius: 6,
                    padding: '10px 20px', fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  }}
                >
                  Get started free
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

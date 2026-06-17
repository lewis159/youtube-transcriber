import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { getSupabaseUserId, supabaseAdmin } from '@/lib/supabase'
import DeleteAccountButton from './DeleteAccountButton'
import LocalTranscriptionToggle from './LocalTranscriptionToggle'

const TIER_INFO = {
  starter: {
    name: 'Starter',
    price: 'Free',
    color: '#888',
    features: ['5 transcriptions total', 'Transcript viewer & search', 'Download TXT'],
    next: 'pro',
  },
  pro: {
    name: 'Pro',
    price: '$9/mo',
    color: '#E53935',
    features: ['10 transcriptions/month', 'PDF & all export formats', 'Folders & sharing'],
    next: 'studio',
  },
  studio: {
    name: 'Studio',
    price: '$29/mo',
    color: '#ff6b6b',
    features: ['Everything in Pro', 'AI chapters', 'Notes panel', 'Priority support'],
    next: 'enterprise',
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    color: '#E53935',
    features: ['Everything in Studio', 'API access', 'Team seats', 'SSO / SAML'],
    next: null,
  },
}

type TierKey = keyof typeof TIER_INFO

const VALID_TIERS = new Set<string>(Object.keys(TIER_INFO))

function toTierKey(value: string | null | undefined): TierKey {
  if (value && VALID_TIERS.has(value)) return value as TierKey
  return 'starter'
}

export default async function SettingsPage() {
  const { userId } = await auth()

  let currentTier: TierKey = 'starter'
  let dbEmail: string | null = null
  let memberSince: string | null = null
  let clerkImageUrl: string | null = null
  let clerkFullName: string | null = null
  let clerkEmail: string | null = null

  if (userId) {
    try {
      const supabaseUserId = await getSupabaseUserId(userId)
      const { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('tier, email, created_at')
        .eq('id', supabaseUserId)
        .single()

      currentTier = toTierKey(dbUser?.tier)
      dbEmail = dbUser?.email ?? null
      if (dbUser?.created_at) {
        memberSince = new Date(dbUser.created_at).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }
    } catch {
      // If lookup fails, fall back to defaults already set above
    }
  }

  const tierInfo = TIER_INFO[currentTier]
  const displayEmail = dbEmail ?? clerkEmail ?? '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '760px' }}>

      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Manage your account and subscription.</p>
      </div>

      {/* Profile */}
      <section style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '28px',
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Profile
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {displayEmail}
            </div>
            {memberSince && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Member since {memberSince}
              </div>
            )}
          </div>
        </div>
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-elevated)',
          borderRadius: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}>
          To update your name, email, or password, use the account menu in the top-right corner.
        </div>
      </section>

      {/* Current plan */}
      <section style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border-default)`,
        borderRadius: '12px',
        padding: '28px',
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Current Plan
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800 }}>{tierInfo.name}</span>
              <span style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                {tierInfo.price}
              </span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tierInfo.features.map(f => (
                <li key={f} style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '12px' }}>✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          {tierInfo.next && (
            <Link href="/#pricing" className="btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Upgrade to {TIER_INFO[tierInfo.next as TierKey].name}
            </Link>
          )}
        </div>

        {/* Usage */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-elevated)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>Monthly usage</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Transcriptions</span>
            <span style={{ fontWeight: 600 }}>0 / 3</span>
          </div>
          <div style={{
            height: '6px',
            background: 'var(--bg-base)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{ width: '0%', height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
          </div>
        </div>
      </section>

      {/* Transcription */}
      <section style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '28px',
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Transcription
        </h2>
        <LocalTranscriptionToggle />
      </section>

      {/* Billing placeholder */}
      <section style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '28px',
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Billing
        </h2>
        <div style={{
          padding: '24px',
          background: 'var(--bg-elevated)',
          borderRadius: '8px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>💳</div>
          {currentTier === 'starter' ? (
            <>
              <p>You&apos;re on the free plan — no billing information required.</p>
              <p style={{ marginTop: '6px', fontSize: '13px' }}>Upgrade anytime to unlock premium features.</p>
            </>
          ) : (
            <p>You&apos;re on the <strong>{tierInfo.name}</strong> plan.</p>
          )}
          <Link href="/#pricing" className="btn-secondary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none', fontSize: '13px' }}>
            View pricing
          </Link>
        </div>
      </section>

      {/* Danger zone */}
      <section style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(229,57,53,0.3)',
        borderRadius: '12px',
        padding: '28px',
      }}>
        <h2 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '20px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Danger Zone
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Delete account</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Permanently delete your account and all transcripts. This cannot be undone.
            </div>
          </div>
          <DeleteAccountButton />
        </div>
      </section>

    </div>
  )
}

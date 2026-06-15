import { requireGlobalAdminPage } from '@/lib/admin-auth'
import { getTierFeatures } from '@/lib/feature-flags'
import FeatureFlagsEditor from './FeatureFlagsEditor'

export const dynamic = 'force-dynamic'

export default async function FeatureFlagsPage() {
  await requireGlobalAdminPage()

  const { featureKeys, matrix } = await getTierFeatures()

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
          Toggle which features each tier includes. Tiers are shown least → most privileged.
          Changes are saved to the <code style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>tier_features</code> table and take effect immediately.
        </p>

        {/* Tier defaults — DB-driven, editable (admin-only) */}
        <FeatureFlagsEditor featureKeys={featureKeys} initialMatrix={matrix} />
      </div>
    </div>
  )
}

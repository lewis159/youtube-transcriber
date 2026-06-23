// ── Canonical per-tier configuration — SINGLE SOURCE OF TRUTH ────────────────
//
// This module is the ONE authoritative place for the per-tier MONTHLY
// transcription limit in the app code. It is consumed by:
//   - app/api/videos/upload/route.ts  (quota enforcement)
//   - app/(marketing)/pricing/page.tsx (advertised limits)
//   - app/(auth)/settings/page.tsx     (TIER_INFO + usage widget)
// so the advertised number and the enforced number can never drift apart.
//
// IMPORTANT: These values MUST match the seeded
// `tier_features.config.monthly_credits` in
// supabase/migrations/005_tier_rename_and_features.sql. If you change a
// tier's monthly allowance, change it in BOTH places (here and that
// migration's seed) — they are the source of truth for the app and the DB
// respectively, and the quota is wrong the moment they disagree.
//
//   starter:    5   (lifetime free trial — credit_type "lifetime")
//   pro:        10  (per month)
//   studio:     40  (per month)
//   enterprise: null (unlimited / custom)

export type Tier = 'starter' | 'pro' | 'studio' | 'enterprise'

/**
 * Per-tier monthly transcription limit. `null` means unlimited (the quota
 * check is skipped entirely for that tier). Values must match
 * tier_features.config.monthly_credits (migration 005).
 */
export const TIER_TRANSCRIPTION_LIMITS: Record<Tier, number | null> = {
  starter: 5,
  pro: 10,
  studio: 40,
  enterprise: null, // unlimited
}

/**
 * Resolve a tier's monthly transcription limit, defaulting unknown/garbage
 * tier strings to the starter limit (the safest, lowest allowance). Returns
 * `null` for unlimited tiers.
 */
export function transcriptionLimitForTier(tier: string | null | undefined): number | null {
  if (tier && tier in TIER_TRANSCRIPTION_LIMITS) {
    return TIER_TRANSCRIPTION_LIMITS[tier as Tier]
  }
  return TIER_TRANSCRIPTION_LIMITS.starter
}

/**
 * Human-readable description of a tier's transcription allowance, for use in
 * marketing/settings copy. Starter is a lifetime trial; paid tiers are monthly.
 */
export function transcriptionAllowanceLabel(tier: Tier): string {
  const limit = TIER_TRANSCRIPTION_LIMITS[tier]
  if (limit === null) return 'Unlimited transcriptions'
  if (tier === 'starter') return `${limit} lifetime transcriptions`
  return `${limit} transcriptions/month`
}

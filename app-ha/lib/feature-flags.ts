import { unstable_cache } from 'next/cache'
import { supabaseAdmin, getSupabaseUserId } from './supabase'

// Tier order: least → most privileged. DB stores tiers lowercase.
export const TIER_ORDER = ['starter', 'pro', 'studio', 'enterprise'] as const
export type Tier = (typeof TIER_ORDER)[number]

export interface TierFeaturesMatrix {
  // Feature keys in stable (alphabetical) order
  featureKeys: string[]
  // featureKey -> tier -> enabled
  matrix: Record<string, Record<string, boolean>>
}

/**
 * Reads all tier_features rows (service role → bypasses RLS) and returns a
 * matrix the admin page can render. Cached 30s, tagged 'tier-features'.
 */
export const getTierFeatures = unstable_cache(
  async (): Promise<TierFeaturesMatrix> => {
    const { data, error } = await supabaseAdmin
      .from('tier_features')
      .select('tier, feature_key, enabled')

    if (error) throw error

    const matrix: Record<string, Record<string, boolean>> = {}
    for (const row of data ?? []) {
      if (!matrix[row.feature_key]) matrix[row.feature_key] = {}
      matrix[row.feature_key][row.tier] = !!row.enabled
    }

    const featureKeys = Object.keys(matrix).sort()
    return { featureKeys, matrix }
  },
  ['tier-features'],
  { revalidate: 30, tags: ['tier-features'] }
)

export async function checkUserFeature(clerkUserId: string, feature: string): Promise<boolean> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('id', supabaseUserId)
      .single()

    if (!user) return false

    const { data } = await supabaseAdmin
      .from('tier_features')
      .select('enabled')
      .eq('tier', user.tier)
      .eq('feature_key', feature)
      .single()

    return data?.enabled ?? false
  } catch {
    return false
  }
}

export function upgradeRequired(feature: string) {
  return { error: 'upgrade_required', feature }
}

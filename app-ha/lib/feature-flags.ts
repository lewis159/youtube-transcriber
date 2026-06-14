'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type FeatureKey =
  | 'transcribe'
  | 'notes'
  | 'export_txt'
  | 'export_pdf'
  | 'folders'
  | 'share_links'
  | 'link_screenshots'
  | 'ai_chapters'
  | 'api_access'
  | 'team_seats'

export type Tier = 'explorer' | 'creator' | 'studio' | 'enterprise'

/**
 * Server-side: check if a tier has access to a feature.
 * Used in API routes and server components.
 */
export async function checkFeature(tier: Tier, feature: FeatureKey): Promise<boolean> {
  const { data, error } = await supabase
    .from('tier_features')
    .select('enabled')
    .eq('tier', tier)
    .eq('feature_key', feature)
    .single()

  if (error || !data) return false
  return data.enabled
}

/**
 * Server-side: get all features for a tier as a map.
 */
export async function getFeatureMap(tier: Tier): Promise<Record<FeatureKey, boolean>> {
  const { data, error } = await supabase
    .from('tier_features')
    .select('feature_key, enabled')
    .eq('tier', tier)

  if (error || !data) {
    return {} as Record<FeatureKey, boolean>
  }

  return Object.fromEntries(
    data.map((row: { feature_key: string; enabled: boolean }) => [row.feature_key, row.enabled])
  ) as Record<FeatureKey, boolean>
}

/**
 * Server-side: check feature for a specific user (looks up their tier first).
 * Pass clerk_user_id.
 */
export async function checkUserFeature(clerkUserId: string, feature: FeatureKey): Promise<boolean> {
  const { data: user, error } = await supabase
    .from('users')
    .select('tier')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !user) return false
  return checkFeature(user.tier as Tier, feature)
}

/**
 * Upgrade required response payload — returned from API routes when feature is blocked.
 */
export function upgradeRequired(feature: FeatureKey) {
  return {
    error: 'upgrade_required',
    feature,
    message: `This feature requires a higher tier. Please upgrade your plan.`,
  }
}

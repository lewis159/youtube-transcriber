'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type FeatureKey =
  | 'transcribe'
  | 'credit_rollover'
  | 'transcript_viewer'
  | 'timestamped_sentences'
  | 'transcript_search'
  | 'notes'
  | 'export_txt'
  | 'export_pdf'
  | 'export_audio_video'
  | 'link_screenshots'
  | 'folders'
  | 'share_links'
  | 'ai_chapters'
  | 'scheduled_transcription'
  | 'transcript_correction'
  | 'priority_processing'
  | 'organisations'
  | 'api_access'
  | 'team_seats'

export type Tier = 'starter' | 'pro' | 'studio' | 'enterprise'

export const TIER_LABELS: Record<Tier, string> = {
  starter:    'Starter',
  pro:        'Pro',
  studio:     'Studio',
  enterprise: 'Enterprise',
}

export const TIER_ORDER: Tier[] = ['starter', 'pro', 'studio', 'enterprise']

/**
 * Server-side: check if a tier has access to a feature.
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
 * Server-side: get all features + config for a tier.
 */
export async function getFeatureMap(tier: Tier): Promise<Record<FeatureKey, { enabled: boolean; config: Record<string, unknown> }>> {
  const { data, error } = await supabase
    .from('tier_features')
    .select('feature_key, enabled, config')
    .eq('tier', tier)

  if (error || !data) return {} as never

  return Object.fromEntries(
    data.map((row: { feature_key: string; enabled: boolean; config: Record<string, unknown> }) => [
      row.feature_key,
      { enabled: row.enabled, config: row.config ?? {} },
    ])
  ) as never
}

/**
 * Server-side: check feature for a specific user by clerk_user_id.
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
 * Server-side: get feature config value for a user (e.g. monthly_credits limit).
 */
export async function getUserFeatureConfig(clerkUserId: string, feature: FeatureKey): Promise<Record<string, unknown>> {
  const { data: user, error } = await supabase
    .from('users')
    .select('tier')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (error || !user) return {}

  const { data, error: fe } = await supabase
    .from('tier_features')
    .select('config')
    .eq('tier', user.tier)
    .eq('feature_key', feature)
    .single()

  if (fe || !data) return {}
  return data.config ?? {}
}

/**
 * Upgrade required response — returned from API routes when feature is blocked.
 */
export function upgradeRequired(feature: FeatureKey) {
  return {
    error: 'upgrade_required',
    feature,
    message: 'This feature requires a higher tier. Please upgrade your plan.',
  }
}

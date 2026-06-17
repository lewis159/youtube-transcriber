import { unstable_cache } from 'next/cache'
import { supabaseAdmin, getSupabaseUserId } from './supabase'

// Tier order: least → most privileged. DB stores tiers lowercase.
export const TIER_ORDER = ['starter', 'pro', 'studio', 'enterprise'] as const
export type Tier = (typeof TIER_ORDER)[number]

/**
 * Display order for feature flags on the admin Feature Flags page.
 * NEW FLAGS GO AT THE TOP of this array — newest features render first so
 * recently-added flags are easy to spot. This is purely a display-order
 * source of truth (tier_features has no created_at column); it does not
 * affect toggling, saving, or DB semantics.
 *
 * Any feature key NOT listed here falls to the bottom of the list (stable
 * order), so the page still renders unknown/new keys without a code change.
 */
export const FEATURE_ORDER: string[] = [
  // ── Newest (migration 010 — whisper summary) ──
  'summary_chat',
  'ai_summary',
  'stt_fallback',
  // ── Existing (migration 005) ──
  'transcribe',
  'credit_rollover',
  'transcript_viewer',
  'timestamped_sentences',
  'transcript_search',
  'notes',
  'export_txt',
  'export_pdf',
  'export_audio_video',
  'link_screenshots',
  'folders',
  'share_links',
  'ai_chapters',
  'scheduled_transcription',
  'transcript_correction',
  'priority_processing',
  'organisations',
  'api_access',
  'team_seats',
]

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

    // Order by FEATURE_ORDER (newest first). Listed keys come first in array
    // order; any unlisted key falls to the bottom in stable alphabetical order.
    const rank = (key: string) => {
      const i = FEATURE_ORDER.indexOf(key)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    const featureKeys = Object.keys(matrix).sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      return a.localeCompare(b)
    })
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

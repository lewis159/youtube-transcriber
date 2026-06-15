import { supabaseAdmin, getSupabaseUserId } from './supabase'

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

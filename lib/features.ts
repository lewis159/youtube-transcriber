import { supabaseAdmin } from './supabase'
import { getDbUser } from './auth'

export async function userHasFeature(clerkUserId: string, featureKey: string): Promise<boolean> {
  const user = await getDbUser(clerkUserId)
  const { data } = await supabaseAdmin
    .from('tier_features')
    .select('enabled')
    .eq('tier', user.tier)
    .eq('feature_key', featureKey)
    .single()
  return data?.enabled ?? false
}

export function featureBlockedResponse(featureKey: string) {
  return Response.json({ error: 'upgrade_required', feature: featureKey }, { status: 403 })
}

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TIER_ORDER } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

/**
 * Toggle a feature on/off for a tier in the tier_features table.
 * Body: { tier: string, feature_key: string, enabled: boolean }
 * Admin-only (global_admin), enforced by requireAdmin().
 */
export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  let body: { tier?: unknown; feature_key?: unknown; enabled?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tier, feature_key, enabled } = body

  if (
    typeof tier !== 'string' ||
    typeof feature_key !== 'string' ||
    typeof enabled !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'tier (string), feature_key (string) and enabled (boolean) are required' },
      { status: 400 }
    )
  }

  if (!(TIER_ORDER as readonly string[]).includes(tier)) {
    return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('tier_features')
    .update({ enabled })
    .eq('tier', tier)
    .eq('feature_key', feature_key)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateTag('tier-features')

  return NextResponse.json({ ok: true, tier, feature_key, enabled })
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseUserId, supabaseAdmin } from '@/lib/supabase'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'

// ── Local transcription opt-in route — additive, tier-gated on `stt_fallback` ──
//
//  GET → { allowed, enabled } where:
//          allowed = checkUserFeature(userId, 'stt_fallback') — does the tier permit it
//          enabled = users.local_transcription_enabled — the user's per-account opt-in
//  PUT/PATCH → body { enabled: boolean }. Turning it ON requires `allowed`; otherwise
//          403 upgrade_required (same shape as the export/summary routes). Turning it
//          OFF is always allowed. Persists users.local_transcription_enabled.
//
// Matches existing conventions: Clerk auth(), supabaseAdmin service client
// (bypasses RLS), and the upgradeRequired(...) 403 shape.

const FEATURE = 'stt_fallback'

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await checkUserFeature(userId, FEATURE)

    let enabled = false
    try {
      const supabaseUserId = await getSupabaseUserId(userId)
      const { data } = await supabaseAdmin
        .from('users')
        .select('local_transcription_enabled')
        .eq('id', supabaseUserId)
        .single()
      enabled = data?.local_transcription_enabled ?? false
    } catch {
      // If the lookup fails, fall back to the safe default (disabled).
      enabled = false
    }

    // Effective state: a user can only be "on" if their tier still allows it.
    return NextResponse.json({ allowed, enabled: allowed ? enabled : false })
  } catch (error) {
    console.error('Local transcription GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load setting' },
      { status: 500 }
    )
  }
}

async function setEnabled(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const enabled = body?.enabled === true

    const allowed = await checkUserFeature(userId, FEATURE)

    // Only the tier-permitted may opt IN. Opting out is always allowed.
    if (enabled && !allowed) {
      return NextResponse.json(upgradeRequired(FEATURE), { status: 403 })
    }

    const supabaseUserId = await getSupabaseUserId(userId)
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ local_transcription_enabled: enabled })
      .eq('id', supabaseUserId)
      .select('local_transcription_enabled')
      .single()

    if (error) throw error

    return NextResponse.json({
      allowed,
      enabled: data?.local_transcription_enabled ?? enabled,
    })
  } catch (error) {
    console.error('Local transcription update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save setting' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return setEnabled(request)
}

export async function PATCH(request: NextRequest) {
  return setEnabled(request)
}

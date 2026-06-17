export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabaseUserId, supabaseAdmin } from '@/lib/supabase'
import type { AiProviderPref } from '@/lib/llm'

// ── AI provider preference route — additive, NOT tier-gated ───────────────────
//
//  GET → { provider: 'local' | 'hosted' } — the user's per-account preference
//        for which model powers AI summaries + Q&A chat.
//  PUT/PATCH → body { provider: 'local' | 'hosted' } (validated). Persists
//        users.ai_provider and returns the new value.
//
// Matches the local-transcription settings route conventions: Clerk auth(),
// supabaseAdmin service client (bypasses RLS). There is no tier gate here —
// every user may choose either provider. Default 'local' on any lookup failure.

const VALID: readonly AiProviderPref[] = ['local', 'hosted']

function normalise(value: unknown): AiProviderPref {
  return value === 'hosted' ? 'hosted' : 'local'
}

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let provider: AiProviderPref = 'local'
    try {
      const supabaseUserId = await getSupabaseUserId(userId)
      const { data } = await supabaseAdmin
        .from('users')
        .select('ai_provider')
        .eq('id', supabaseUserId)
        .single()
      provider = normalise(data?.ai_provider)
    } catch {
      // If the lookup fails, fall back to the safe default (local).
      provider = 'local'
    }

    return NextResponse.json({ provider })
  } catch (error) {
    console.error('AI provider GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load setting' },
      { status: 500 }
    )
  }
}

async function setProvider(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const provider = body?.provider

    if (!VALID.includes(provider)) {
      return NextResponse.json(
        { error: "provider must be 'local' or 'hosted'" },
        { status: 400 }
      )
    }

    const supabaseUserId = await getSupabaseUserId(userId)
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ai_provider: provider })
      .eq('id', supabaseUserId)
      .select('ai_provider')
      .single()

    if (error) throw error

    return NextResponse.json({ provider: normalise(data?.ai_provider ?? provider) })
  } catch (error) {
    console.error('AI provider update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save setting' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  return setProvider(request)
}

export async function PATCH(request: NextRequest) {
  return setProvider(request)
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getVideoByIdAndUser,
  getVideoTranscript,
  getSupabaseUserId,
  supabaseAdmin,
} from '@/lib/supabase'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'
import {
  summariseTranscript,
  buildPlainText,
  MAX_TRANSCRIPT_CHARS,
  type TranscriptSegment,
} from '@/lib/claude'
import type { AiProviderPref } from '@/lib/llm'
import { logEvent, EVENTS } from '@/lib/event-log'

// ── AI summary route — additive, flag-gated on `ai_summary` (default OFF) ─────
//
//  GET  → return the cached summary for a video, or 404 if none exists.
//  POST → generate-and-cache a summary on demand (idempotent: returns the
//         cached row if one already exists, so Claude is billed once per video).
//
// Matches the export route's conventions exactly: Clerk auth(), supabaseAdmin
// service client (bypasses RLS), ownership via getVideoByIdAndUser, and the
// upgradeRequired(...) 403 shape.

/** Shape a video_summaries row into the JSON response. */
function serialiseSummary(row: {
  summary: string | null
  key_points: unknown
  chapters: unknown
  model: string | null
  created_at: string | null
}) {
  return {
    summary: row.summary ?? '',
    keyPoints: Array.isArray(row.key_points) ? row.key_points : [],
    chapters: Array.isArray(row.chapters) ? row.chapters : [],
    model: row.model ?? null,
    createdAt: row.created_at ?? null,
  }
}

/** Resolve the user's tier from users.tier (same source as checkUserFeature). */
async function getUserTier(clerkUserId: string): Promise<string> {
  const supabaseUserId = await getSupabaseUserId(clerkUserId)
  const { data } = await supabaseAdmin
    .from('users')
    .select('tier')
    .eq('id', supabaseUserId)
    .single()
  return data?.tier ?? 'starter'
}

/** Resolve the user's AI provider preference (users.ai_provider). Default 'local'. */
async function getAiProvider(clerkUserId: string): Promise<AiProviderPref> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)
    const { data } = await supabaseAdmin
      .from('users')
      .select('ai_provider')
      .eq('id', supabaseUserId)
      .single()
    return data?.ai_provider === 'hosted' ? 'hosted' : 'local'
  } catch {
    return 'local'
  }
}

/** GET — return the cached summary, or 404 if not yet generated. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkUserFeature(userId, 'ai_summary'))) {
      return NextResponse.json(upgradeRequired('ai_summary'), { status: 403 })
    }

    const { id } = await params

    // Verify ownership — throws if video not found or belongs to another user.
    try {
      await getVideoByIdAndUser(id, userId)
    } catch {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { data: existing } = await supabaseAdmin
      .from('video_summaries')
      .select('summary, key_points, chapters, model, created_at')
      .eq('video_id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 })
    }

    return NextResponse.json(serialiseSummary(existing))
  } catch (error) {
    console.error('Summary GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load summary' },
      { status: 500 }
    )
  }
}

/** POST — generate-and-cache a summary (or return the cached one if it exists). */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Captured for the catch-block error log (declared inside try otherwise).
  let videoId: string | undefined
  let logUserId: string | undefined

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logUserId = userId

    if (!(await checkUserFeature(userId, 'ai_summary'))) {
      return NextResponse.json(upgradeRequired('ai_summary'), { status: 403 })
    }

    const { id } = await params
    videoId = id

    // Verify ownership — throws if video not found or belongs to another user.
    try {
      await getVideoByIdAndUser(id, userId)
    } catch {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Cached? Return it — billed once per video.
    const { data: existing } = await supabaseAdmin
      .from('video_summaries')
      .select('summary, key_points, chapters, model, created_at')
      .eq('video_id', id)
      .single()

    if (existing) {
      return NextResponse.json({ ...serialiseSummary(existing), cached: true })
    }

    // Load the transcript.
    let transcript: { content: unknown } | null = null
    try {
      transcript = await getVideoTranscript(id)
    } catch {
      transcript = null
    }
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    const segments = (transcript.content as TranscriptSegment[]) ?? []
    if (segments.length === 0) {
      return NextResponse.json({ error: 'Transcript is empty' }, { status: 400 })
    }

    const { text: plainText } = buildPlainText(segments)

    // Cost guardrail: reject transcripts beyond the cap with a clear error
    // rather than silently truncating a large/expensive request. (buildPlainText
    // already caps the text it produces; this surfaces the situation to the caller.)
    const rawLength = segments.reduce((n, s) => n + (s.text?.length ?? 0), 0)
    if (rawLength > MAX_TRANSCRIPT_CHARS) {
      return NextResponse.json(
        {
          error: 'transcript_too_long',
          message: `Transcript exceeds the ${MAX_TRANSCRIPT_CHARS}-character cap for AI summaries.`,
          length: rawLength,
          cap: MAX_TRANSCRIPT_CHARS,
        },
        { status: 413 }
      )
    }

    // Resolve tier → model and the user's provider preference, then summarise.
    const tier = await getUserTier(userId)
    const aiProvider = await getAiProvider(userId)

    // Lifecycle log: AI summary generation about to start.
    await logEvent({
      event: EVENTS.summary_started,
      videoId: id,
      userId,
      metadata: { provider: aiProvider, tier, chars: plainText.length },
    })

    const result = await summariseTranscript(plainText, tier, aiProvider)

    // Lifecycle log: AI summary generated successfully.
    await logEvent({
      event: EVENTS.summary_completed,
      videoId: id,
      userId,
      metadata: {
        provider: aiProvider,
        tier,
        model: result.model,
        chars: plainText.length,
        keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints.length : 0,
        chapters: Array.isArray(result.chapters) ? result.chapters.length : 0,
      },
    })

    // Persist. video_id is UNIQUE; on a race the insert conflicts — fall back to
    // returning whatever is now cached so the caller still gets a summary.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('video_summaries')
      .insert([
        {
          video_id: id,
          summary: result.summary,
          key_points: result.keyPoints,
          chapters: result.chapters,
          model: result.model,
        },
      ])
      .select('summary, key_points, chapters, model, created_at')
      .single()

    if (insertError) {
      const { data: raced } = await supabaseAdmin
        .from('video_summaries')
        .select('summary, key_points, chapters, model, created_at')
        .eq('video_id', id)
        .single()
      if (raced) {
        return NextResponse.json({ ...serialiseSummary(raced), cached: true })
      }
      throw insertError
    }

    return NextResponse.json({ ...serialiseSummary(inserted), cached: false })
  } catch (error) {
    console.error('Summary POST error:', error)

    // Lifecycle log: summary generation/persistence failed. (logEvent never throws.)
    await logEvent({
      level: 'error',
      event: EVENTS.error,
      videoId,
      userId: logUserId,
      message: error instanceof Error ? error.message : 'Failed to generate summary',
      metadata: { stage: 'summary' },
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

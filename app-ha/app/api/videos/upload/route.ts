export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { claimTranscriptionSlot, updateVideoStatus, saveTranscript, supabaseAdmin, getSupabaseUserId } from '@/lib/supabase'
import { fetchTranscript, extractYouTubeId, getYouTubeThumbnail, getYouTubeTitle } from '@/lib/transcript'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'
import { enqueueTranscription } from '@/lib/transcription-queue'
import { logEvent, EVENTS } from '@/lib/event-log'
import { transcriptionLimitForTier } from '@/lib/tiers'

// ── Cost guardrail: per-tier MONTHLY transcription quota ─────────────────────
// The per-tier monthly limit lives in the single source of truth lib/tiers.ts
// (which must match tier_features.config.monthly_credits). The check itself is
// now performed ATOMICALLY in the DB via claim_transcription_slot (migration
// 019): count-this-month + insert happen in one transaction under a per-user
// advisory lock, so concurrent uploads can no longer all pass before any
// insert. `null` limit = unlimited (the count check is skipped server-side).

/**
 * Resolve the caller's tier for the Whisper job payload. Best-effort: if the
 * lookup fails for any reason we fall back to 'starter' rather than blocking
 * the upload. Only used on the async (flag-ON) path.
 */
async function getUserTier(clerkUserId: string): Promise<string> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)
    const { data } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('id', supabaseUserId)
      .single()
    return data?.tier ?? 'starter'
  } catch {
    return 'starter'
  }
}

/**
 * First day of the CURRENT calendar month (UTC), as a YYYY-MM-DD string —
 * the value a grant's `period_month` carries when it applies to this month.
 */
function currentPeriodMonth(): string {
  const now = new Date()
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return first.toISOString().slice(0, 10)
}

/**
 * Sum the admin/support-granted extra transcriptions that apply to the CURRENT
 * calendar month (transcription_grants, migration 017). Grants are ONE-TIME:
 * each row carries the `period_month` it applies to, so only grants issued for
 * THIS month count — next month they no longer apply and the quota reverts to
 * the plain tier limit. The total is ADDED to the user's per-tier monthly limit
 * so support can compensate for failed runs this month without changing tier.
 *
 * Negative-amount rows (corrections) are summed too, so the net total is
 * authoritative. Best-effort: any failure resolves to 0 so a DB hiccup never
 * inflates the quota and never blocks the existing limit logic.
 */
async function getCurrentMonthGrantTotal(clerkUserId: string): Promise<number> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)
    const { data } = await supabaseAdmin
      .from('transcription_grants')
      .select('amount')
      .eq('user_id', supabaseUserId)
      .eq('period_month', currentPeriodMonth())
    if (!Array.isArray(data)) return 0
    const total = data.reduce((sum, row) => sum + (typeof row.amount === 'number' ? row.amount : 0), 0)
    // Never let corrections push the effective bonus below 0.
    return total > 0 ? total : 0
  } catch {
    return 0
  }
}

/**
 * Read the caller's per-user local-transcription opt-in
 * (users.local_transcription_enabled, migration 011). Best-effort: any failure
 * resolves to `false` so we fall back to the safe synchronous caption path
 * rather than enqueueing against the user's wishes / a missing pref.
 */
async function getLocalTranscriptionEnabled(clerkUserId: string): Promise<boolean> {
  try {
    const supabaseUserId = await getSupabaseUserId(clerkUserId)
    const { data } = await supabaseAdmin
      .from('users')
      .select('local_transcription_enabled')
      .eq('id', supabaseUserId)
      .single()
    return data?.local_transcription_enabled === true
  } catch {
    return false
  }
}

/**
 * Background processing for a freshly-created video.
 *
 * This is intentionally fire-and-forget: the POST handler kicks this off
 * WITHOUT awaiting it, so the request can return immediately while the
 * (potentially slow) transcript scrape happens in the background.
 *
 * It must never throw to the caller — any failure flips the video to the
 * 'error' status, which the dashboard already styles.
 */
async function processVideo(videoId: string, youtubeUrl: string) {
  try {
    // Fetch transcript (the slow part)
    const transcript = await fetchTranscript(youtubeUrl)

    // Persist it
    await saveTranscript(videoId, transcript, 'en')

    // Mark done
    await updateVideoStatus(videoId, 'completed')
  } catch (error) {
    console.error(`Background processing failed for video ${videoId}:`, error)
    // Best-effort flip to error — swallow any failure here so we never crash.
    const message = error instanceof Error ? error.message : 'Failed to process video'
    try {
      await updateVideoStatus(videoId, 'error', message)
    } catch (statusError) {
      console.error(`Failed to set error status for video ${videoId}:`, statusError)
    }
  }
}

export async function POST(request: NextRequest) {
  let video: Awaited<ReturnType<typeof claimTranscriptionSlot>> | undefined

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Feature gate: transcribe
    const canTranscribe = await checkUserFeature(userId, 'transcribe')
    if (!canTranscribe) {
      // Log the denial so blocked transcriptions are visible to admins. A
      // misconfig (e.g. an empty tier_features table) shows up as a flood of
      // these for users who should have access.
      await logEvent({
        level: 'warn',
        event: EVENTS.transcribe_blocked,
        userId,
        message: 'Transcribe blocked: feature not enabled for the user’s tier',
        metadata: { reason: 'upgrade_required', feature: 'transcribe' },
      })
      return NextResponse.json(upgradeRequired('transcribe'), { status: 403 })
    }

    // ── Cost guardrail: resolve the caller's tier + effective monthly limit ──
    // The per-tier limit comes from the single source of truth (lib/tiers.ts,
    // which mirrors tier_features.config.monthly_credits). The effective limit
    // = tier limit + admin/support grants for THIS calendar month
    // (transcription_grants, migration 017). Grants are one-time: they apply
    // only to the month they were issued for, so the bump expires at month
    // rollover. `null` tier limit = unlimited → no count check downstream.
    //
    // The actual count + compare + insert is done ATOMICALLY by
    // claimTranscriptionSlot below (migration 019) under a per-user advisory
    // lock, closing the check-then-act race the old code had.
    const tier = await getUserTier(userId)
    const tierLimit = transcriptionLimitForTier(tier)
    const bonus = tierLimit != null ? await getCurrentMonthGrantTotal(userId) : 0
    const effectiveLimit = tierLimit != null ? tierLimit + bonus : null

    const { youtubeUrl } = await request.json()

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract YouTube ID and validate
    const youtubeId = extractYouTubeId(youtubeUrl)
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Fetch real YouTube title via oEmbed, fall back to youtubeId
    const videoTitle = await getYouTubeTitle(youtubeId)

    // ── Atomic quota claim + video creation ─────────────────────────────────
    // Counts this month's videos, compares to effectiveLimit, and inserts the
    // row in ONE DB transaction under a per-user advisory lock. Returns the new
    // row on success, or null when the quota is exhausted.
    //
    // FAIL CLOSED: any DB error here PROPAGATES (claimTranscriptionSlot does not
    // swallow it) and is caught by the outer try/catch → 500. The previous code
    // swallowed count failures and let the upload through; for a billing control
    // we now reject rather than risk uncounted transcriptions.
    let claimed: Awaited<ReturnType<typeof claimTranscriptionSlot>>
    try {
      claimed = await claimTranscriptionSlot(
        userId,
        youtubeId,
        videoTitle,
        getYouTubeThumbnail(youtubeId),
        effectiveLimit
      )
    } catch (claimErr) {
      // Quota enforcement failed at the DB layer — fail closed (503), do not
      // let an unmetered upload through. This is a genuine system fault → error.
      await logEvent({
        level: 'error',
        event: EVENTS.error,
        userId,
        message: 'Atomic quota claim failed (rejecting upload, fail-closed)',
        metadata: {
          reason: 'quota_unavailable',
          error: claimErr instanceof Error ? claimErr.message : String(claimErr),
        },
      })
      return NextResponse.json(
        { error: 'quota_unavailable', feature: 'transcribe' },
        { status: 503 }
      )
    }

    if (!claimed) {
      // Quota exhausted — no slot was claimed and no row was inserted.
      await logEvent({
        level: 'warn',
        event: EVENTS.transcribe_blocked,
        userId,
        message: 'Transcribe blocked: monthly quota reached',
        metadata: { reason: 'quota_exceeded', tier, limit: effectiveLimit },
      })
      return NextResponse.json(
        { error: 'quota_exceeded', feature: 'transcribe', limit: effectiveLimit },
        { status: 429 }
      )
    }

    video = claimed

    // Lifecycle log: video row created. (logEvent never throws.)
    await logEvent({
      event: EVENTS.video_added,
      videoId: video.id,
      userId,
      metadata: { youtubeUrl },
    })

    // ── Async (Whisper) path — flag-gated, default OFF ──────────────────────
    // The async Whisper pipeline now requires BOTH:
    //   (1) the `stt_fallback` feature being enabled for the user's tier, AND
    //   (2) the user's own opt-in (users.local_transcription_enabled === true).
    // Only when BOTH are true do we hand the video off to the in-house Whisper
    // worker via the `transcription` queue. Otherwise we fall through to the
    // EXISTING synchronous caption scrape below — unchanged.
    const [hasFallbackFeature, localEnabled] = await Promise.all([
      checkUserFeature(userId, 'stt_fallback'),
      getLocalTranscriptionEnabled(userId),
    ])
    const useWhisper = hasFallbackFeature && localEnabled

    if (useWhisper) {
      // Mark queued up front so the dashboard reflects the new pipeline state.
      await updateVideoStatus(video.id, 'queued')

      // Lifecycle log: handed off to the async Whisper queue.
      await logEvent({ event: EVENTS.queued, videoId: video.id, userId })

      // Enqueue the job for the worker. The worker owns all subsequent status
      // writes (extracting_audio → transcribing → completed/error). Reuses the
      // `tier` already resolved above for the quota check.
      await enqueueTranscription({
        videoId: video.id,
        youtubeUrl,
        userId,
        tier,
      })

      // Respond right away — the dashboard polls for the status to flip.
      return NextResponse.json(
        {
          success: true,
          videoId: video.id,
          youtubeId,
          status: 'queued',
        },
        { status: 201 }
      )
    }

    // Lifecycle log: synchronous caption path taken.
    await logEvent({ event: EVENTS.sync_started, videoId: video.id, userId })

    // Mark as processing up front so the dashboard shows the right state.
    await updateVideoStatus(video.id, 'processing')

    // Kick off the heavy lifting in the background WITHOUT awaiting it, so the
    // response returns immediately. Errors are handled inside processVideo and
    // can never reject this handler.
    void processVideo(video.id, youtubeUrl)

    // Respond right away — the dashboard polls for the status to flip.
    return NextResponse.json(
      {
        success: true,
        videoId: video.id,
        youtubeId,
        status: 'processing',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)

    const message = error instanceof Error ? error.message : 'Failed to process video'

    // Mark video as errored if the record was already created
    if (video?.id) {
      await updateVideoStatus(video.id, 'error', message).catch(() => {})
    }

    // Lifecycle log: upload failed. (logEvent never throws — safe in the catch.)
    // userId may be unavailable if auth() itself threw; resolve it best-effort.
    let errUserId: string | undefined
    try {
      errUserId = (await auth()).userId ?? undefined
    } catch {
      errUserId = undefined
    }
    await logEvent({
      level: 'error',
      event: EVENTS.error,
      videoId: video?.id,
      userId: errUserId,
      message,
      metadata: { stage: 'upload' },
    })

    return NextResponse.json(
      {
        error: message,
        success: false,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'POST a YouTube URL to upload' })
}

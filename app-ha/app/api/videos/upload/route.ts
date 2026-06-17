export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createVideo, updateVideoStatus, saveTranscript, supabaseAdmin, getSupabaseUserId } from '@/lib/supabase'
import { fetchTranscript, extractYouTubeId, getYouTubeThumbnail, getYouTubeTitle } from '@/lib/transcript'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'
import { enqueueTranscription } from '@/lib/transcription-queue'
import { logEvent, EVENTS } from '@/lib/event-log'

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
    try {
      await updateVideoStatus(videoId, 'error')
    } catch (statusError) {
      console.error(`Failed to set error status for video ${videoId}:`, statusError)
    }
  }
}

export async function POST(request: NextRequest) {
  let video: Awaited<ReturnType<typeof createVideo>> | undefined

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Feature gate: transcribe
    const canTranscribe = await checkUserFeature(userId, 'transcribe')
    if (!canTranscribe) {
      return NextResponse.json(upgradeRequired('transcribe'), { status: 403 })
    }

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

    // Create video record
    video = await createVideo(
      youtubeId,
      userId,
      videoTitle,
      getYouTubeThumbnail(youtubeId)
    )

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
      // writes (extracting_audio → transcribing → completed/error).
      const tier = await getUserTier(userId)
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

    // Mark video as errored if the record was already created
    if (video?.id) {
      await updateVideoStatus(video.id, 'error').catch(() => {})
    }

    const message = error instanceof Error ? error.message : 'Failed to process video'

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

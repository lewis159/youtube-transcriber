export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getVideoByIdAndUser,
  getSupabaseUserId,
  updateVideoStatus,
  saveTranscript,
  supabaseAdmin,
} from '@/lib/supabase'
import { fetchTranscript } from '@/lib/transcript'
import { checkUserFeature } from '@/lib/feature-flags'
import { enqueueTranscription } from '@/lib/transcription-queue'
import { logEvent, EVENTS } from '@/lib/event-log'

// ── Retry route — re-run transcription for an EXISTING video ─────────────────
//
//  POST → re-queue the SAME video row (no new row created). Mirrors the upload
//         route's gating decision exactly: if the user has the `stt_fallback`
//         feature AND has opted in to local transcription, the job is handed to
//         the async Whisper queue; otherwise it falls back to the synchronous
//         caption-scrape path. Only allowed from a terminal status
//         (completed | error); an in-progress video is rejected so concurrent
//         clicks can't double-enqueue.
//
// Conventions match upload/route.ts and the per-video action routes: Clerk
// auth(), supabaseAdmin service client (bypasses RLS), ownership via
// getVideoByIdAndUser, logEvent(...) lifecycle logging.

// In-progress statuses — a video in any of these is still being worked on, so a
// retry must be refused (matches the dashboard's IN_PROGRESS set + createVideo's
// default 'pending'). Only the terminal states (completed | error) may retry.
const IN_PROGRESS_STATUSES = new Set([
  'pending',
  'processing',
  'queued',
  'extracting_audio',
  'transcribing',
])

/**
 * Resolve the caller's tier for the Whisper job payload. Best-effort: falls back
 * to 'starter' rather than blocking the retry. (Mirrors upload/route.ts.)
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
 * (users.local_transcription_enabled). Best-effort → false, so we fall back to
 * the safe synchronous caption path. (Mirrors upload/route.ts.)
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
 * Synchronous caption path for a retried video — identical work to upload's
 * processVideo: scrape the transcript, persist it, mark completed; on failure
 * flip to 'error'. Fire-and-forget: the POST handler kicks this off WITHOUT
 * awaiting so the request returns immediately and the dashboard polls for the
 * status flip. It must never throw to the caller.
 */
async function processVideo(videoId: string, youtubeUrl: string) {
  try {
    const transcript = await fetchTranscript(youtubeUrl)
    await saveTranscript(videoId, transcript, 'en')
    await updateVideoStatus(videoId, 'completed')
  } catch (error) {
    console.error(`Retry processing failed for video ${videoId}:`, error)
    try {
      await updateVideoStatus(videoId, 'error')
    } catch (statusError) {
      console.error(`Failed to set error status for video ${videoId}:`, statusError)
    }
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Captured for the catch-block error log.
  let videoId: string | undefined
  let logUserId: string | undefined

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logUserId = userId

    const { id } = await params
    videoId = id

    // Verify ownership — throws if not found or owned by another user.
    let video: Awaited<ReturnType<typeof getVideoByIdAndUser>>
    try {
      video = await getVideoByIdAndUser(id, userId)
    } catch {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const previousStatus: string = video.status

    // Guard against double-processing: refuse a retry while the video is still
    // in flight, WITHOUT re-enqueuing. Only terminal states may retry.
    if (IN_PROGRESS_STATUSES.has(previousStatus)) {
      return NextResponse.json(
        { alreadyRunning: true, status: previousStatus },
        { status: 409 }
      )
    }

    // Reconstruct the canonical watch URL from the stored youtube_id — the same
    // shape upload hands to fetchTranscript / enqueueTranscription.
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtube_id}`

    // Reset the SAME row: clear any prior error and drop the old transcript so a
    // re-run can persist a fresh one (transcripts.video_id is UNIQUE). Setting
    // error_message to null mirrors clearing the failure; status is set below to
    // the same initial state upload uses, depending on the chosen path.
    await supabaseAdmin
      .from('videos')
      .update({ error_message: null })
      .eq('id', id)
    await supabaseAdmin.from('transcripts').delete().eq('video_id', id)

    // ── Re-run the SAME decision the upload route makes ─────────────────────
    // Async (Whisper) path requires BOTH the `stt_fallback` feature AND the
    // user's local-transcription opt-in. Otherwise fall back to the synchronous
    // caption scrape — exactly as upload/route.ts does.
    const [hasFallbackFeature, localEnabled] = await Promise.all([
      checkUserFeature(userId, 'stt_fallback'),
      getLocalTranscriptionEnabled(userId),
    ])
    const useWhisper = hasFallbackFeature && localEnabled

    if (useWhisper) {
      const tier = await getUserTier(userId)

      // Mark queued up front — same initial status upload uses on this path.
      await updateVideoStatus(id, 'queued')

      // Lifecycle log: retry handed off to the async Whisper queue.
      await logEvent({
        event: EVENTS.retry,
        videoId: id,
        userId,
        metadata: { from: 'retry', previousStatus, path: 'whisper' },
      })

      await enqueueTranscription({ videoId: id, youtubeUrl, userId, tier })

      return NextResponse.json({ success: true, videoId: id, status: 'queued' })
    }

    // Synchronous caption path — same initial status ('processing') as upload.
    await updateVideoStatus(id, 'processing')

    // Lifecycle log: retry took the synchronous caption path.
    await logEvent({
      event: EVENTS.retry,
      videoId: id,
      userId,
      metadata: { from: 'retry', previousStatus, path: 'sync' },
    })

    // Fire-and-forget the heavy lifting; errors are handled inside processVideo
    // and can never reject this handler. The dashboard polls for the status flip.
    void processVideo(id, youtubeUrl)

    return NextResponse.json({ success: true, videoId: id, status: 'processing' })
  } catch (error) {
    console.error('Retry error:', error)

    // Lifecycle log: retry failed. (logEvent never throws — safe in the catch.)
    await logEvent({
      level: 'error',
      event: EVENTS.error,
      videoId,
      userId: logUserId,
      message: error instanceof Error ? error.message : 'Failed to retry transcription',
      metadata: { stage: 'retry' },
    })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retry transcription',
        success: false,
      },
      { status: 500 }
    )
  }
}

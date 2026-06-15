export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createVideo, updateVideoStatus, saveTranscript } from '@/lib/supabase'
import { fetchTranscript, extractYouTubeId, getYouTubeThumbnail, getYouTubeTitle } from '@/lib/transcript'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'

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

    const { youtubeUrl, title } = await request.json()

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

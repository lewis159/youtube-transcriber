export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createVideo, updateVideoStatus, saveTranscript } from '@/lib/supabase'
import { fetchTranscript, extractYouTubeId, getYouTubeThumbnail, getYouTubeTitle } from '@/lib/transcript'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'

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

    // Update status to processing
    await updateVideoStatus(video.id, 'processing')

    // Fetch transcript
    const transcript = await fetchTranscript(youtubeUrl)

    // Save transcript
    await saveTranscript(video.id, transcript, 'en')

    // Update status to completed
    await updateVideoStatus(video.id, 'completed')

    return NextResponse.json(
      {
        success: true,
        videoId: video.id,
        youtubeId,
        transcriptLength: transcript.length,
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

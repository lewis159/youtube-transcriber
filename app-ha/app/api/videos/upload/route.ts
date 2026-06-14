import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createVideo, updateVideoStatus, saveTranscript } from '@/lib/supabase'
import { fetchTranscript, extractYouTubeId, getYouTubeThumbnail } from '@/lib/transcript'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const youtubeUrl = body.youtubeUrl || body.url
    const { title } = body

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract YouTube ID and validate
    const youtubeId = extractYouTubeId(youtubeUrl)
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Create video record
    const video = await createVideo(
      youtubeId,
      userId,
      title || youtubeId,
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

    const message = error instanceof Error ? error.message : 'Failed to upload video'

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

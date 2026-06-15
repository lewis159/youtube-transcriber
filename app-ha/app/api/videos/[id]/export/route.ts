export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getVideoByIdAndUser, getVideoTranscript } from '@/lib/supabase'
import { generateTXT, generateSRT, generateZIP } from '@/lib/export'
import { checkUserFeature, upgradeRequired } from '@/lib/feature-flags'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const format = request.nextUrl.searchParams.get('format') || 'txt'

    // Feature gate per format:
    //  - pdf      → export_pdf (Pro+)
    //  - txt/srt/zip → export_txt (base, Starter-allowed); the ZIP just
    //    bundles the transcript text formats, so it's a base convenience.
    if (format === 'pdf') {
      if (!(await checkUserFeature(userId, 'export_pdf'))) {
        return NextResponse.json(upgradeRequired('export_pdf'), { status: 403 })
      }
    } else {
      if (!(await checkUserFeature(userId, 'export_txt'))) {
        return NextResponse.json(upgradeRequired('export_txt'), { status: 403 })
      }
    }

    // Verify ownership — throws if video not found or belongs to another user
    let video: { youtube_id: string; title?: string }
    try {
      video = await getVideoByIdAndUser(id, userId)
    } catch {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // PDF is not yet implemented server-side
    if (format === 'pdf') {
      return NextResponse.json({ error: 'pdf_not_implemented' }, { status: 501 })
    }

    const transcript = await getVideoTranscript(id)

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    const segments = transcript.content as Array<{ text: string; start: number; duration: number }>

    switch (format) {
      case 'txt': {
        const txt = generateTXT(segments)
        return new NextResponse(txt, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="transcript.txt"`,
          },
        })
      }

      case 'srt': {
        const srt = generateSRT(segments)
        return new NextResponse(srt, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="transcript.srt"`,
          },
        })
      }

      case 'zip': {
        const zipBlob = await generateZIP(segments, video.title || video.youtube_id, video.youtube_id)
        const buffer = Buffer.from(await zipBlob.arrayBuffer())
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${video.youtube_id}.zip"`,
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}

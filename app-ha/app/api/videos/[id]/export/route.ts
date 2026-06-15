export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getVideoByIdAndUser, getVideoTranscript } from '@/lib/supabase'
import { generateTXT, generateSRT, generatePDF, generateZIP } from '@/lib/export'
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

    // Feature gate: export_pdf for PDF format, export_txt for all other formats
    if (format === 'pdf') {
      const canExportPdf = await checkUserFeature(userId, 'export_pdf')
      if (!canExportPdf) {
        return NextResponse.json(upgradeRequired('export_pdf'), { status: 403 })
      }
    } else {
      const canExportTxt = await checkUserFeature(userId, 'export_txt')
      if (!canExportTxt) {
        return NextResponse.json(upgradeRequired('export_txt'), { status: 403 })
      }
    }

    const video = await getVideoByIdAndUser(id, userId)
    const transcript = await getVideoTranscript(id)

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 })
    }

    const segments = transcript.content as any[]

    switch (format) {
      case 'txt': {
        const txt = generateTXT(segments)
        return new NextResponse(txt, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${video.youtube_id}.txt"`,
          },
        })
      }

      case 'srt': {
        const srt = generateSRT(segments)
        return new NextResponse(srt, {
          headers: {
            'Content-Type': 'application/x-subrip',
            'Content-Disposition': `attachment; filename="${video.youtube_id}.srt"`,
          },
        })
      }

      case 'pdf': {
        const pdf = generatePDF(segments, video.title || video.youtube_id)
        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${video.youtube_id}.pdf"`,
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

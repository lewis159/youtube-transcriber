import { NextResponse } from 'next/server'
import { requireAuth, getDbUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { userHasFeature } from '@/lib/features'
import { transcriptToPlainText, type TranscriptSegment } from '@/lib/transcript'
import JSZip from 'jszip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// GET /api/export?videoId=xxx&format=txt|zip|pdf
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get('videoId')
    const format = searchParams.get('format') ?? 'txt'
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

    const clerkId = await requireAuth()
    const user = await getDbUser(clerkId)

    if (format === 'pdf' && !(await userHasFeature(clerkId, 'export_pdf'))) {
      return NextResponse.json({ error: 'upgrade_required', feature: 'export_pdf' }, { status: 403 })
    }

    // Fetch video + transcript + notes (must belong to this user)
    const { data: video, error } = await supabaseAdmin
      .from('videos')
      .select('*, transcripts(*), notes(*)')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (error || !video) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const transcript = video.transcripts as { content: TranscriptSegment[] } | null
    const notes = (video.notes as Array<{ body: string }> | null)?.[0]?.body ?? ''
    const plainText = transcript ? transcriptToPlainText(transcript.content) : ''
    const safeTitle = (video.title ?? 'transcript').replace(/[^a-z0-9]+/gi, '_').slice(0, 60)

    if (format === 'txt') {
      return new Response(plainText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}.txt"`,
        },
      })
    }

    if (format === 'zip') {
      const zip = new JSZip()
      zip.file(`${safeTitle}_transcript.txt`, plainText)
      if (notes) zip.file(`${safeTitle}_notes.txt`, notes)
      const blob = await zip.generateAsync({ type: 'uint8array' })
      return new Response(Buffer.from(blob), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${safeTitle}.zip"`,
        },
      })
    }

    if (format === 'pdf') {
      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
      const pageWidth = 595
      const pageHeight = 842
      const margin = 50
      const lineHeight = 16
      const textWidth = pageWidth - margin * 2

      let page = pdf.addPage([pageWidth, pageHeight])
      let y = pageHeight - margin

      const drawText = (text: string, size: number, isBold = false) => {
        const f = isBold ? boldFont : font
        const words = text.split(' ')
        let line = ''
        for (const word of words) {
          const test = line ? `${line} ${word}` : word
          if (f.widthOfTextAtSize(test, size) > textWidth) {
            if (y < margin + lineHeight) {
              page = pdf.addPage([pageWidth, pageHeight])
              y = pageHeight - margin
            }
            page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) })
            y -= lineHeight
            line = word
          } else {
            line = test
          }
        }
        if (line) {
          if (y < margin + lineHeight) {
            page = pdf.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }
          page.drawText(line, { x: margin, y, size, font: f, color: rgb(0, 0, 0) })
          y -= lineHeight
        }
        y -= 4
      }

      drawText(video.title ?? 'Transcript', 18, true)
      drawText(`youtube.com/watch?v=${video.youtube_id}`, 10)
      y -= 10

      drawText('Transcript', 13, true)
      drawText(plainText, 10)

      if (notes) {
        y -= 10
        drawText('Notes', 13, true)
        drawText(notes, 10)
      }

      const pdfBytes = await pdf.save()
      return new Response(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format. Use txt, zip, or pdf.' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Unauthenticated' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

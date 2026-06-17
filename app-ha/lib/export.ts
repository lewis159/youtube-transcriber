import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

export interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

export function generateTXT(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join('\n')
}

export function generateSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((segment, index) => {
      const startTime = formatTimestamp(segment.start)
      const endTime = formatTimestamp(segment.start + segment.duration)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    })
    .join('\n')
}

export async function generateZIP(
  segments: TranscriptSegment[],
  _title: string,
  videoId: string
): Promise<Blob> {
  const zip = new JSZip()

  const txt = generateTXT(segments)
  zip.file(`${videoId}.txt`, txt)

  const srt = generateSRT(segments)
  zip.file(`${videoId}.srt`, srt)

  return zip.generateAsync({ type: 'blob' })
}

// ── Summary PDF export — additive, Phase 4 (AI summary) ──────────────────────
// Branded summary document: dark banner header (YT Transcriber red), then the
// AI summary, key points, and chapters. Uses jspdf (already a dependency).

export interface SummaryPdfData {
  summary: string
  keyPoints: string[]
  chapters: { title: string; timestamp: string }[]
}

const BRAND_RED: [number, number, number] = [229, 57, 53] // #E53935
const BANNER_DARK: [number, number, number] = [18, 18, 18] // near-black banner
const TEXT_DARK: [number, number, number] = [30, 30, 30]
const TEXT_MUTED: [number, number, number] = [110, 110, 110]

/**
 * Build a branded summary PDF (summary + key points + chapters).
 * Returns an ArrayBuffer suitable for a NextResponse body.
 */
export function generateSummaryPDF(title: string, data: SummaryPdfData): ArrayBuffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentWidth = pageWidth - margin * 2
  let y = 0

  // Dark banner header with brand red accent bar.
  doc.setFillColor(...BANNER_DARK)
  doc.rect(0, 0, pageWidth, 70, 'F')
  doc.setFillColor(...BRAND_RED)
  doc.rect(0, 70, pageWidth, 4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('YT Transcriber', margin, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(220, 220, 220)
  doc.text('AI Video Summary', margin, 54)

  y = 100

  // Page-break helper.
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Video title.
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  const titleLines = doc.splitTextToSize(title || 'Video Summary', contentWidth)
  titleLines.forEach((line: string) => {
    ensureSpace(20)
    doc.text(line, margin, y)
    y += 20
  })
  y += 8

  const sectionHeading = (label: string) => {
    ensureSpace(34)
    doc.setFillColor(...BRAND_RED)
    doc.rect(margin, y - 9, 3, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...BRAND_RED)
    doc.text(label, margin + 10, y)
    y += 20
  }

  // Summary section.
  if (data.summary) {
    sectionHeading('Summary')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...TEXT_DARK)
    const lines = doc.splitTextToSize(data.summary, contentWidth)
    lines.forEach((line: string) => {
      ensureSpace(15)
      doc.text(line, margin, y)
      y += 15
    })
    y += 12
  }

  // Key points section.
  if (data.keyPoints.length > 0) {
    sectionHeading('Key Points')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(...TEXT_DARK)
    data.keyPoints.forEach((point) => {
      const lines = doc.splitTextToSize(point, contentWidth - 16)
      lines.forEach((line: string, idx: number) => {
        ensureSpace(15)
        if (idx === 0) {
          doc.setTextColor(...BRAND_RED)
          doc.text('•', margin, y)
          doc.setTextColor(...TEXT_DARK)
        }
        doc.text(line, margin + 16, y)
        y += 15
      })
      y += 3
    })
    y += 12
  }

  // Chapters section.
  if (data.chapters.length > 0) {
    sectionHeading('Chapters')
    doc.setFontSize(10.5)
    data.chapters.forEach((ch) => {
      ensureSpace(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BRAND_RED)
      const stamp = ch.timestamp || ''
      doc.text(stamp, margin, y)
      const stampWidth = doc.getTextWidth(stamp) + 10
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...TEXT_DARK)
      const lines = doc.splitTextToSize(ch.title || '', contentWidth - stampWidth)
      lines.forEach((line: string, idx: number) => {
        if (idx > 0) ensureSpace(15)
        doc.text(line, margin + stampWidth, y)
        y += 15
      })
    })
  }

  // Footer on each page.
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text(
      `Generated by YT Transcriber · Page ${p} of ${pageCount}`,
      margin,
      pageHeight - 24
    )
  }

  return doc.output('arraybuffer')
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`
}

function pad(num: number, length: number = 2): string {
  return String(num).padStart(length, '0')
}

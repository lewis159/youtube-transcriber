import jsPDF from 'jspdf'
import JSZip from 'jszip'

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

export function generatePDF(segments: TranscriptSegment[], title: string): jsPDF {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  pdf.setFont('Helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.text(title || 'Transcript', margin, yPosition)
  yPosition += 15

  pdf.setFont('Helvetica', 'normal')
  pdf.setFontSize(10)

  segments.forEach((segment) => {
    const timestamp = formatTimestamp(segment.start)
    const text = `[${timestamp}] ${segment.text}`

    const lines = pdf.splitTextToSize(text, maxWidth) as string[]
    const lineHeight = pdf.getLineHeight() / pdf.internal.scaleFactor

    if (yPosition + lines.length * lineHeight > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
    }

    lines.forEach((line: string) => {
      pdf.text(line, margin, yPosition)
      yPosition += lineHeight
    })

    yPosition += 2
  })

  return pdf
}

export async function generateZIP(
  segments: TranscriptSegment[],
  title: string,
  videoId: string
): Promise<Blob> {
  const zip = new JSZip()

  const txt = generateTXT(segments)
  zip.file(`${videoId}.txt`, txt)

  const srt = generateSRT(segments)
  zip.file(`${videoId}.srt`, srt)

  const pdf = generatePDF(segments, title)
  const pdfBlob = pdf.output('blob')
  zip.file(`${videoId}.pdf`, pdfBlob)

  return zip.generateAsync({ type: 'blob' })
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

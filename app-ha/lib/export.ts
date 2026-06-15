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

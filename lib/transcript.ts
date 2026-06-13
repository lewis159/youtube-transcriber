import { YoutubeTranscript } from 'youtube-transcript'

export type TranscriptSegment = {
  text: string
  start: number
  duration: number
}

export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId)
  return raw.map((s) => ({
    text: s.text,
    start: s.offset ?? 0,
    duration: s.duration ?? 0,
  }))
}

export function transcriptToPlainText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim()
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

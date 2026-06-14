import { YoutubeTranscript } from 'youtube-transcript'

export interface TranscriptItem {
  text: string
  start: number
  duration: number
}

export async function fetchTranscript(youtubeUrl: string): Promise<TranscriptItem[]> {
  try {
    const videoId = extractYouTubeId(youtubeUrl)
    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available for this video')
    }

    return transcript.map((item: any) => ({
      text: item.text,
      start: parseFloat(item.offset) / 1000 || 0,
      duration: parseFloat(item.duration) / 1000 || 0,
    }))
  } catch (error) {
    console.error('Error fetching transcript:', error)
    throw error
  }
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/0.jpg`
}

export function getYouTubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${youtubeId}`
}

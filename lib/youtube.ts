export function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }
  return null
}

export type VideoMeta = {
  title: string
  thumbnail: string
  channelName: string
}

export async function fetchVideoMeta(videoId: string): Promise<VideoMeta> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`oEmbed fetch failed: ${res.status}`)
  const data = await res.json()
  return {
    title: data.title ?? 'Untitled',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    channelName: data.author_name ?? '',
  }
}

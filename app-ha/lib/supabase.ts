import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Video operations
export async function createVideo(youtubeId: string, userId: string, title?: string, thumbnail?: string) {
  const { data, error } = await supabase
    .from('videos')
    .insert([{ youtube_id: youtubeId, user_id: userId, title, thumbnail, status: 'pending' }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVideoStatus(videoId: string, status: string) {
  const { data, error } = await supabase
    .from('videos')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', videoId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVideoById(videoId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single()

  if (error) throw error
  return data
}

export async function listVideos(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getVideoByIdAndUser(videoId: string, userId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

export async function deleteVideo(videoId: string) {
  const { error } = await supabase.from('videos').delete().eq('id', videoId)
  if (error) throw error
}

// Transcript operations
export async function saveTranscript(videoId: string, transcript: any[], language: string = 'en') {
  const fullText = transcript.map((item) => item.text).join(' ')

  const { data: transcriptData, error: transcriptError } = await supabase
    .from('transcripts')
    .insert([{ video_id: videoId, content: transcript, language }])
    .select()
    .single()

  if (transcriptError) throw transcriptError

  const { error: textError } = await supabase
    .from('video_transcript_text')
    .insert([{ video_id: videoId, text_content: fullText }])

  if (textError) throw textError

  return transcriptData
}

export async function getVideoTranscript(videoId: string) {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('video_id', videoId)
    .single()

  if (error) throw error
  return data
}

export async function testDatabaseConnection(): Promise<boolean> {
  // Skip test during build if credentials not set
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    return false
  }

  try {
    const { error } = await supabase.from('videos').select('*').limit(1)
    return !error
  } catch (err) {
    console.error('Database connection test failed:', err)
    return false
  }
}

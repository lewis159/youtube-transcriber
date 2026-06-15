import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service-role client for server-side admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function getSupabaseUserId(clerkUserId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()
  if (error || !data) throw new Error(`User not found for Clerk ID: ${clerkUserId}`)
  return data.id
}

// Video operations — all use supabaseAdmin to bypass RLS on server
export async function createVideo(youtubeId: string, clerkUserId: string, title?: string, thumbnail?: string) {
  const supabaseUserId = await getSupabaseUserId(clerkUserId)
  const { data, error } = await supabaseAdmin
    .from('videos')
    .insert([{ youtube_id: youtubeId, user_id: supabaseUserId, title, thumbnail, status: 'pending' }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVideoStatus(videoId: string, status: string) {
  const { data, error } = await supabaseAdmin
    .from('videos')
    .update({ status })
    .eq('id', videoId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVideoById(videoId: string) {
  const { data, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single()

  if (error) throw error
  return data
}

export async function listVideos(clerkUserId: string, limit: number = 10) {
  const supabaseUserId = await getSupabaseUserId(clerkUserId)
  const { data, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getVideoByIdAndUser(videoId: string, clerkUserId: string) {
  const supabaseUserId = await getSupabaseUserId(clerkUserId)
  const { data, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .eq('user_id', supabaseUserId)
    .single()

  if (error) throw error
  return data
}

export async function deleteVideo(videoId: string) {
  const { error } = await supabaseAdmin.from('videos').delete().eq('id', videoId)
  if (error) throw error
}

// Transcript operations
export async function saveTranscript(videoId: string, transcript: any[], language: string = 'en') {
  const { data, error } = await supabaseAdmin
    .from('transcripts')
    .insert([{ video_id: videoId, content: transcript, language }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getVideoTranscript(videoId: string) {
  const { data, error } = await supabaseAdmin
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

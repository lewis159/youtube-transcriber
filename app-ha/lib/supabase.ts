import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

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

// ── Changelog + Roadmap content (DB-backed, cached) ──────────────────────────
// Both read server-side via supabaseAdmin (service role → bypasses RLS).
// Returned objects are plain serialisable shapes matching what the pages render.

export interface ChangelogEntry {
  id: string
  version: string
  label: string | null
  date: string | null
  isCurrent: boolean
  borderColor: string | null
  newFeatures: string[]
  changes: string[]
  removed: string[]
}

export const getChangelogEntries = unstable_cache(
  async (): Promise<ChangelogEntry[]> => {
    const { data, error } = await supabaseAdmin
      .from('changelog_entries')
      .select('id, version, label, date, is_current, border_color, new_features, changes, removed, sort_order')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.id,
      version: row.version,
      label: row.label,
      date: row.date,
      isCurrent: row.is_current,
      borderColor: row.border_color,
      newFeatures: row.new_features ?? [],
      changes: row.changes ?? [],
      removed: row.removed ?? [],
    }))
  },
  ['changelog'],
  { revalidate: 30, tags: ['changelog'] }
)

export interface RoadmapItem {
  id: number
  title: string
  description: string
  status: string
  priority: string
  category: string
  updatedAt: string
}

export const getRoadmapItems = unstable_cache(
  async (): Promise<RoadmapItem[]> => {
    const { data, error } = await supabaseAdmin
      .from('roadmap_items')
      .select('item_key, title, description, status, priority, category, updated_at, sort_order')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: row.item_key,
      title: row.title,
      description: row.description ?? '',
      status: row.status,
      priority: row.priority,
      category: row.category,
      updatedAt: row.updated_at ?? '',
    }))
  },
  ['roadmap'],
  { revalidate: 30, tags: ['roadmap'] }
)

// ── Roadmap item update threads (admin-only comments) ────────────────────────
// Modelled on the Sentinel ops.comments pattern. Comments join item_key (the
// human-facing #) → users for an attributed author name. Service-role read.

export interface RoadmapComment {
  id: string
  itemKey: number
  body: string
  kind: string
  authorName: string
  createdAt: string
}

// Returns ALL roadmap comments (across every item), ordered created_at ASC
// (oldest first) so the server page can group them by itemKey and render each
// thread newest-at-bottom. Cached with a short revalidate + 'roadmap-comments'
// tag; the POST/DELETE API route revalidates that tag on every mutation.
export const getRoadmapComments = unstable_cache(
  async (): Promise<RoadmapComment[]> => {
    const { data, error } = await supabaseAdmin
      .from('roadmap_comments')
      .select('id, item_key, body, kind, created_at, author:author_user_id(full_name, email)')
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data ?? []).map((row: any) => {
      const author = Array.isArray(row.author) ? row.author[0] : row.author
      return {
        id: row.id,
        itemKey: row.item_key,
        body: row.body,
        kind: row.kind,
        authorName: author?.full_name || author?.email || 'system',
        createdAt: row.created_at ?? '',
      }
    })
  },
  ['roadmap-comments'],
  { revalidate: 10, tags: ['roadmap-comments'] }
)

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

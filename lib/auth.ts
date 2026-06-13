import { auth } from '@clerk/nextjs/server'
import { getSupabaseAdmin } from './supabase'

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthenticated')
  return userId
}

export async function getDbUser(clerkUserId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single()
  if (error) throw error
  return data
}


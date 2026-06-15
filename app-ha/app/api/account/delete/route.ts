export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getSupabaseUserId, supabaseAdmin } from '@/lib/supabase'

// POST /api/account/delete
// Permanently and irreversibly deletes the authenticated user's account:
//   1. Resolves the Supabase user id from the Clerk id.
//   2. Deletes the `users` row in Supabase. All user-owned data
//      (videos, transcripts, notes, folders, video_folders, share_links,
//      credit_transactions, org_members, user_feature_overrides) is removed
//      via ON DELETE CASCADE on the users(id) foreign keys.
//   3. Deletes the Clerk user so the account can no longer sign in.
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Resolve the Supabase user id. If the user has no Supabase row
    //    (lookup throws), we still proceed to delete the Clerk account.
    let supabaseUserId: string | null = null
    try {
      supabaseUserId = await getSupabaseUserId(userId)
    } catch {
      supabaseUserId = null
    }

    // 2. Delete the Supabase user row (cascades to all owned data).
    if (supabaseUserId) {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', supabaseUserId)

      if (error) {
        console.error('Account deletion — Supabase delete failed:', error)
        return NextResponse.json(
          { error: 'Failed to delete account data' },
          { status: 500 }
        )
      }
    }

    // 3. Delete the Clerk user. This signs the user out everywhere and
    //    prevents any future sign-in with this account.
    const client = await clerkClient()
    await client.users.deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
}

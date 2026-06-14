import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service-role client — never exposed to the browser
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(url, key)
}

/**
 * Call at the top of every /api/admin/* route handler.
 * Returns null if the caller is a global_admin, or a 401/403 NextResponse to return immediately.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Skip role check if Supabase credentials aren't configured (dev with no DB)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!url || url.includes('placeholder')) {
    return null
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (user.role !== 'global_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

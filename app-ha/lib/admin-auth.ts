import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

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

  // Dev convenience ONLY: skip the role check when Supabase isn't configured
  // (local work with no DB). This must FAIL CLOSED in production — a
  // missing/placeholder Supabase URL there is a misconfiguration and must
  // DENY admin access, never grant it to every signed-in user.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!url || url.includes('placeholder')) {
    if (process.env.NODE_ENV !== 'production') {
      return null
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

/**
 * Call at the top of a server component / layout that guards admin PAGES.
 * Redirects to /dashboard if the caller isn't a signed-in global_admin.
 * Mirrors the dev-bypass behaviour of requireAdmin (no role check when
 * Supabase credentials aren't configured).
 */
export async function requireGlobalAdminPage(): Promise<void> {
  const { userId } = await auth()

  if (!userId) {
    redirect('/dashboard')
  }

  // Dev convenience ONLY: skip the role check when Supabase isn't configured
  // (local work with no DB). This must FAIL CLOSED in production — a
  // missing/placeholder Supabase URL there is a misconfiguration and must
  // DENY admin access (redirect), never silently grant page access.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (!url || url.includes('placeholder')) {
    if (process.env.NODE_ENV !== 'production') {
      return
    }
    redirect('/dashboard')
  }

  const supabase = getServiceClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (error || !user || user.role !== 'global_admin') {
    redirect('/dashboard')
  }
}

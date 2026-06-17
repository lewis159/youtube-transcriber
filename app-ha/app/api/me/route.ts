export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

// Lightweight "who am I" endpoint for the client nav: returns the signed-in
// user's role + tier so the UI can hide admin-only controls. No PII beyond
// what the client already needs for gating.
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ role: null, tier: null }, { status: 401 })
  }

  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('role, tier')
      .eq('clerk_user_id', userId)
      .single()

    return NextResponse.json({
      role: data?.role ?? 'user',
      tier: data?.tier ?? null,
    })
  } catch {
    // Fail closed: unknown role → treated as a normal user by the client.
    return NextResponse.json({ role: 'user', tier: null })
  }
}

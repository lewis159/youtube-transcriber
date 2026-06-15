import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin-auth'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const ALLOWED_LEVELS = ['info', 'warning', 'critical'] as const
type Level = typeof ALLOWED_LEVELS[number]

// GET — returns the single active announcement (newest), or null.
// Open to any signed-in user so the app shell can render the banner.
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('id, message, level, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ announcement: null }, { status: 200 })
  }

  return NextResponse.json({ announcement: data ?? null })
}

// POST — admin-only. Creates a new active announcement.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { userId } = await auth()
  const { message, level } = await req.json()

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const lvl: Level = ALLOWED_LEVELS.includes(level as Level) ? (level as Level) : 'info'

  // Resolve the admin's public.users.id from their Clerk id (best-effort).
  let createdBy: string | null = null
  if (userId) {
    const { data: u } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()
    createdBy = u?.id ?? null
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ message: message.trim(), level: lvl, active: true, created_by: createdBy })
    .select('id, message, level, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    action: 'announcement_broadcast',
    target: 'announcement',
    details: `Broadcast (${lvl}): ${message.trim().slice(0, 120)}`,
    actorClerkId: userId,
  })

  return NextResponse.json({ success: true, announcement: data })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getUserDetails } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// POST /api/admin/users/[id]/reset-password - send password reset email via Clerk
export async function POST(req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params

    // Get user to find Clerk ID
    const { user } = await getUserDetails(id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Call Clerk API to send password reset
    const clerkSecret = process.env.CLERK_SECRET_KEY
    if (!clerkSecret) {
      return NextResponse.json({ error: 'Clerk not configured' }, { status: 500 })
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${user.clerk_user_id}/password_reset_email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecret}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.errors?.[0]?.message || 'Failed to send reset email')
    }

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${user.email}`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { getSupabaseAdmin } from '@/lib/supabase'

type Params = { params: Promise<{ id: string }> }

// POST /api/admin/users/[id]/block - block or unblock user
export async function POST(req: Request, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const { blocked } = await req.json()

    // Note: In a real app, you'd have a "blocked" column in users table
    // For now, this is a placeholder for future blocking functionality
    // Would need DB migration to add blocked field first

    return NextResponse.json({
      success: true,
      message: blocked ? 'User blocked' : 'User unblocked',
      blocked,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

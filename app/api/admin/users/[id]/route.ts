import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getUserDetails, addCredits } from '@/lib/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { user, transactions } = await getUserDetails(id)

    return NextResponse.json({ user, transactions })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    if (!body.amount || !body.reason) {
      return NextResponse.json(
        { error: 'Missing amount or reason' },
        { status: 400 }
      )
    }

    const result = await addCredits(id, body.amount, body.reason, body.notes)

    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const status = msg === 'Admin access required' ? 403 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

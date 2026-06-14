import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const res = await fetch('http://test-runner:4100/', {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { ok: false, scripts: [], error: 'Test runner unavailable' },
      { status: 503 }
    )
  }
}

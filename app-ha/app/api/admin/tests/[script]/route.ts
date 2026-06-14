import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const ALLOWED = ['landing', 'auth', 'dashboard', 'knowledge-base', 'admin', 'admin-overview', 'admin-users', 'admin-containers', 'kb-articles', 'full-suite']

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ script: string }> }
) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { script } = await params
  if (!ALLOWED.includes(script)) {
    return NextResponse.json({ error: 'Unknown script' }, { status: 404 })
  }
  try {
    const res = await fetch(`http://test-runner:4100/run/${script}`, {
      method: 'POST',
      signal: AbortSignal.timeout(130000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Test runner unavailable or timed out' },
      { status: 503 }
    )
  }
}

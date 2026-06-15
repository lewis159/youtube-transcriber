export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { testDatabaseConnection } from '@/lib/supabase'

export async function GET() {
  const dbHealthy = await testDatabaseConnection()

  return NextResponse.json(
    {
      status: 'healthy',
      database: dbHealthy ? 'connected' : 'disconnected'
    },
    { status: dbHealthy ? 200 : 503 }
  )
}

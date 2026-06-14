import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listVideos } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = request.nextUrl.searchParams.get('limit') || '10'
    const data = await listVideos(userId, parseInt(limit))

    return NextResponse.json(data)
  } catch (error) {
    console.error('List videos error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list videos' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/knowledge-base/[slug] – get article (checks visibility)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()

    let isAdminOrSupport = false

    if (userId) {
      try {
        const user = await getDbUser(userId)
        isAdminOrSupport = user.role === 'administrator' || user.role === 'support'
      } catch {
        // User not yet synced
      }
    }

    let query = getSupabaseAdmin()
      .from('knowledge_base_articles')
      .select('*')
      .eq('slug', slug)

    // Filter by visibility if not admin/support
    if (!isAdminOrSupport) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/knowledge-base/[slug] – update article (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getDbUser(userId)
    const isAdmin = user.role === 'administrator' || user.role === 'support'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, content, category, is_public, order_index } = body

    const { data, error } = await getSupabaseAdmin()
      .from('knowledge_base_articles')
      .update({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content && { content }),
        ...(category && { category }),
        ...(is_public !== undefined && { is_public }),
        ...(order_index !== undefined && { order_index }),
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg.includes('Unauthorized') ? 401 : msg.includes('Admin') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// DELETE /api/knowledge-base/[slug] – delete article (admin only)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getDbUser(userId)
    const isAdmin = user.role === 'administrator' || user.role === 'support'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { error } = await getSupabaseAdmin()
      .from('knowledge_base_articles')
      .delete()
      .eq('slug', slug)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg.includes('Unauthorized') ? 401 : msg.includes('Admin') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

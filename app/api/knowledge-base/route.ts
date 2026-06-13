import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDbUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/knowledge-base – list articles (filters by visibility + user role)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

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
      .select('id, slug, title, description, category, is_public, order_index, updated_at')

    // Filter by visibility if not admin/support
    if (!isAdminOrSupport) {
      query = query.eq('is_public', true)
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Search by title or description if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.order('order_index', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/knowledge-base – create article (admin only)
export async function POST(req: Request) {
  try {
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
    const { slug, title, description, content, category, is_public, order_index } = body

    if (!slug || !title || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, title, content, category' },
        { status: 400 }
      )
    }

    const { data, error } = await getSupabaseAdmin()
      .from('knowledge_base_articles')
      .insert({
        slug,
        title,
        description: description || null,
        content,
        category,
        is_public: is_public !== undefined ? is_public : true,
        order_index: order_index || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const status = msg.includes('Unauthorized') ? 401 : msg.includes('Admin') ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

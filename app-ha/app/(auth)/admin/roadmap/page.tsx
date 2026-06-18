import { getRoadmapItems, getRoadmapComments } from '@/lib/supabase'
import RoadmapClient from './RoadmapClient'

export default async function RoadmapPage() {
  const [roadmap, comments] = await Promise.all([
    getRoadmapItems(),
    getRoadmapComments(),
  ])

  // Group comments by item_key (oldest-first within each thread, as returned).
  const commentsByItem: Record<number, typeof comments> = {}
  for (const c of comments) {
    ;(commentsByItem[c.itemKey] ??= []).push(c)
  }

  // Status/priority/category are stored as plain text in the DB; the client
  // component's typed unions assert the expected shape for rendering.
  return (
    <RoadmapClient
      roadmap={roadmap as React.ComponentProps<typeof RoadmapClient>['roadmap']}
      commentsByItem={commentsByItem}
    />
  )
}

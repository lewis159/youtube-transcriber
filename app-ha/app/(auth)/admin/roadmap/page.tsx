import { getRoadmapItems } from '@/lib/supabase'
import RoadmapClient from './RoadmapClient'

export default async function RoadmapPage() {
  const roadmap = await getRoadmapItems()
  // Status/priority/category are stored as plain text in the DB; the client
  // component's typed unions assert the expected shape for rendering.
  return <RoadmapClient roadmap={roadmap as React.ComponentProps<typeof RoadmapClient>['roadmap']} />
}

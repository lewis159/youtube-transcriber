import { getChangelogEntries } from '@/lib/supabase'
import ChangelogClient from './ChangelogClient'

export default async function ChangelogPage() {
  const versions = await getChangelogEntries()
  return <ChangelogClient versions={versions} />
}

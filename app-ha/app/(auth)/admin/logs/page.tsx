import { redirect } from 'next/navigation'

// Logs have been consolidated under Security. The LogViewer component in this
// folder is still used (imported by the Security page); only this route is a
// redirect so old links land on the right tab.
export default function LogsPage() {
  redirect('/admin/security?tab=events')
}

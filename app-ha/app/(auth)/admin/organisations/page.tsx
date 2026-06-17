import { redirect } from 'next/navigation'

// Organisations have been merged into the Users & Organisations page.
// This standalone route is kept only to avoid dead links; it redirects.
export default function OrganisationsPage() {
  redirect('/admin/users')
}

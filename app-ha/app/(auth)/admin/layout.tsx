import { requireGlobalAdminPage } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireGlobalAdminPage()
  return <>{children}</>
}

import { requireGlobalAdminPage } from '@/lib/admin-auth'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireGlobalAdminPage()
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 60px)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, minWidth: 0, padding: '32px' }}>
        {children}
      </div>
    </div>
  )
}

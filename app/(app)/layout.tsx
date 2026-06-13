import { auth } from '@clerk/nextjs/server'
import { getDbUser } from '@/lib/auth'
import { AppHeader } from '@/components/AppHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  let tier: string | null = null
  let isAdmin = false
  if (userId) {
    try {
      const user = await getDbUser(userId)
      tier = user?.tier ?? null
      isAdmin = user?.role === 'administrator' || user?.role === 'support'
    } catch {
      // user row not yet created (webhook pending)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F13]">
      <AppHeader tier={tier ?? undefined} isAdmin={isAdmin} />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

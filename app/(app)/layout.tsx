import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { getDbUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  let tier: string | null = null
  if (userId) {
    try {
      const user = await getDbUser(userId)
      tier = user?.tier ?? null
    } catch {
      // user row not yet created (webhook pending)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F13]">
      <header className="border-b border-[#2A2A35] px-6 h-14 flex items-center justify-between flex-shrink-0">
        <Link href="/dashboard" className="flex items-center">
          <img src="/logos/logo_full.png" alt="YT Transcriber" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {tier && (
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-[#0C447C] bg-[#042C53]/30 text-[#85B7EB] capitalize">
              {tier}
            </span>
          )}
          <UserButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

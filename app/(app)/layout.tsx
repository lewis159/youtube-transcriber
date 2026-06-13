import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">YT Transcriber</Link>
        <UserButton />
      </header>
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}

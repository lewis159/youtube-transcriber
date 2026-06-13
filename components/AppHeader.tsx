'use client'

import Link from 'next/link'
import { UserMenu } from './UserMenu'

interface AppHeaderProps {
  tier?: string
  isAdmin?: boolean
}

export function AppHeader({ tier, isAdmin }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2A2A35] bg-[#0F0F13]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0 group">
          <img src="/logos/logo_full.png" alt="YT Transcriber" className="h-6 w-auto group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 flex-1 ml-12">
          <Link href="/dashboard" className="text-sm text-[#888] hover:text-white transition-colors">
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/dashboard/admin" className="text-sm text-[#888] hover:text-white transition-colors">
              Admin
            </Link>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {tier && (
            <span className="text-xs px-3 py-1 rounded-full border border-[#0C447C] bg-[#042C53]/30 text-[#85B7EB] capitalize font-medium">
              {tier}
            </span>
          )}
          <UserMenu isAdmin={isAdmin ?? false} />
        </div>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AppHeaderProps {
  tier?: string
  isAdmin?: boolean
}

export function AppHeader({ tier, isAdmin }: AppHeaderProps) {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

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
          <Link href="/knowledge-base" className="text-sm text-[#888] hover:text-white transition-colors">
            Knowledge Base
          </Link>
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="flex items-center gap-2 text-sm text-[#888] hover:text-white transition-colors"
              >
                Admin
                <ChevronDown className={`w-4 h-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {adminMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#18181F] border border-[#2A2A35] rounded-lg shadow-lg z-50">
                  <Link
                    href="/dashboard/admin"
                    className="block px-4 py-2 text-sm text-[#888] hover:text-white hover:bg-[#242429] first:rounded-t-lg transition-colors"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Users
                  </Link>
                  <Link
                    href="/dashboard/admin?tab=orgs"
                    className="block px-4 py-2 text-sm text-[#888] hover:text-white hover:bg-[#242429] transition-colors"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Organizations
                  </Link>
                  <Link
                    href="/dashboard/admin/system"
                    className="block px-4 py-2 text-sm text-[#888] hover:text-white hover:bg-[#242429] last:rounded-b-lg transition-colors"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    System
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {tier && (
            <span className="text-xs px-3 py-1 rounded-full border border-[#0C447C] bg-[#042C53]/30 text-[#85B7EB] capitalize font-medium">
              {tier}
            </span>
          )}
          <UserButton />
        </div>
      </div>
    </header>
  )
}

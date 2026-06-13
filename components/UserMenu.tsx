'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'

export function UserMenu({ isAdmin }: { isAdmin: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)

  if (!isAdmin) {
    return <UserButton />
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181F] border border-[#2A2A35] hover:border-[#378ADD] transition-colors"
          title="Admin menu"
        >
          <span className="text-sm">⚙️</span>
        </button>
        <UserButton />
      </div>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#18181F] border border-[#2A2A35] rounded-lg shadow-lg z-50">
          <Link
            href="/dashboard/admin"
            className="block w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#2A2A35] rounded-t-lg transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            📊 Admin Panel
          </Link>
          <button
            onClick={() => setMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-xs text-[#888] hover:bg-[#2A2A35] rounded-b-lg transition-colors border-t border-[#2A2A35]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

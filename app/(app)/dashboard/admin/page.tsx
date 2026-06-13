'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'

interface User {
  id: string
  email: string
  tier: string
  role: string
  subscription_credits: number
  purchased_credits: number
  created_at: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users?limit=100')
      if (!response.ok) throw new Error('Failed to fetch users')
      const { users, total } = await response.json()
      setUsers(users)
      setTotal(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#888]">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 max-w-lg">
          <p className="text-[#E04B4A]">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F13] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#888]">Manage users, credits, and accounts</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-[#18181F] border border-[#2A2A35] rounded-lg text-white placeholder-[#666]"
          />
        </div>

        {/* Users Table */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0F0F13] border-b border-[#2A2A35]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Sub Credits
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Purchased
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#888]">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr
                      key={user.id}
                      className="border-b border-[#2A2A35] hover:bg-[#242429] transition-colors"
                    >
                      <td className="px-4 py-3 text-white">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-[#2A2A35] rounded text-[#85B7EB] text-xs">
                          {user.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#888]">
                        {user.subscription_credits}
                      </td>
                      <td className="px-4 py-3 text-[#888]">
                        {user.purchased_credits}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#85B7EB]">
                        {user.subscription_credits + user.purchased_credits}
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'admin' ? (
                          <span className="px-2 py-1 bg-[#378ADD] rounded text-white text-xs">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[#888] text-xs">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#888]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/users/${user.id}`}
                          className="text-[#378ADD] hover:text-[#85B7EB] transition-colors"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 text-sm text-[#888]">
          Showing {filteredUsers.length} of {total} users
        </div>
      </div>
    </div>
  )
}

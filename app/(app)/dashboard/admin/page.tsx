'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  tier: string
  role: string
  organization_id: string
  organizations: { name: string; slug: string } | null
  subscription_credits: number
  purchased_credits: number
  created_at: string
}

interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'orgs' | 'create'>('users')
  const [createEmail, setCreateEmail] = useState('')
  const [createOrgName, setCreateOrgName] = useState('')
  const [createOrgSlug, setCreateOrgSlug] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, orgsRes] = await Promise.all([
        fetch('/api/admin/users?limit=100'),
        fetch('/api/organizations')
      ])

      if (!usersRes.ok || !orgsRes.ok) throw new Error('Failed to fetch data')

      const usersData = await usersRes.json()
      const orgsData = await orgsRes.json()

      setUsers(usersData.users || [])
      setTotal(usersData.total || 0)
      setOrganizations(orgsData || [])
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
    return <div className="flex items-center justify-center py-12"><div className="text-[#888]">Loading...</div></div>
  }

  if (error) {
    return <div className="bg-[#18181F] border border-[#E04B4A] rounded-lg p-6"><p className="text-[#E04B4A]">Error: {error}</p></div>
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-[#888]">Manage users, organizations, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[#2A2A35]">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-[#378ADD] text-white'
              : 'border-transparent text-[#888] hover:text-white'
          }`}
        >
          Users ({total})
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'orgs'
              ? 'border-[#378ADD] text-white'
              : 'border-transparent text-[#888] hover:text-white'
          }`}
        >
          Organizations ({organizations.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'border-[#378ADD] text-white'
              : 'border-transparent text-[#888] hover:text-white'
          }`}
        >
          Create
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 bg-[#18181F] border border-[#2A2A35] rounded-lg text-white placeholder-[#666]"
          />

          <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0F0F13] border-b border-[#2A2A35]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-white">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Organization</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Tier</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Credits</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Joined</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#888]">No users found</td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-[#2A2A35] hover:bg-[#242429]">
                        <td className="px-4 py-3 text-white font-medium">{user.email}</td>
                        <td className="px-4 py-3 text-[#888]">{user.organizations?.name || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-[#2A2A35] rounded text-[#85B7EB] text-xs">
                            {user.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#85B7EB]">
                          {user.subscription_credits + user.purchased_credits}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'administrator' ? 'bg-[#378ADD] text-white' :
                            user.role === 'org_admin' ? 'bg-[#2A5A3D] text-[#4AE070]' :
                            user.role === 'support' ? 'bg-[#5A4A2A] text-[#E0B04A]' :
                            'bg-[#2A2A35] text-[#888]'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#888] text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/admin/users/${user.id}`}
                            className="text-[#378ADD] hover:text-[#85B7EB] text-sm"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'orgs' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map(org => (
            <div key={org.id} className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 hover:border-[#378ADD] transition-colors">
              <h3 className="font-semibold text-white mb-2">{org.name}</h3>
              <p className="text-sm text-[#888] mb-4">@{org.slug}</p>
              <p className="text-xs text-[#666] mb-4">
                Created {new Date(org.created_at).toLocaleDateString()}
              </p>
              <Link
                href={`/dashboard/admin/organizations/${org.id}`}
                className="text-[#378ADD] hover:text-[#85B7EB] text-sm"
              >
                Manage members →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === 'create' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create User Section */}
          <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Create User</h2>
            <p className="text-sm text-[#888] mb-4">Create a new user account. Note: User must sign up via Clerk when webhook is configured.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={e => setCreateEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white placeholder-[#666]"
                />
              </div>
              <button
                onClick={async () => {
                  if (!createEmail) return
                  try {
                    setSubmitting(true)
                    setError(null)
                    setSuccess(null)
                    const response = await fetch('/api/admin/users/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: createEmail }),
                    })
                    if (!response.ok) throw new Error('Failed to create user')
                    setSuccess('User created successfully. Note: Webhook will be configured in production.')
                    setCreateEmail('')
                    await fetchData()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to create user')
                  } finally {
                    setSubmitting(false)
                  }
                }}
                disabled={submitting || !createEmail}
                className="w-full px-4 py-2 bg-[#378ADD] hover:bg-[#185FA5] disabled:bg-[#2A2A35] text-white font-medium rounded-lg transition-colors"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>

          {/* Create Organization Section */}
          <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Create Organization</h2>
            <p className="text-sm text-[#888] mb-4">Create a new organization. Slug must be unique and lowercase.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Organization Name</label>
                <input
                  type="text"
                  value={createOrgName}
                  onChange={e => setCreateOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white placeholder-[#666]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Slug (@handle)</label>
                <input
                  type="text"
                  value={createOrgSlug}
                  onChange={e => setCreateOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="acme-corp"
                  className="w-full px-4 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded-lg text-white placeholder-[#666]"
                />
              </div>
              <button
                onClick={async () => {
                  if (!createOrgName || !createOrgSlug) return
                  try {
                    setSubmitting(true)
                    setError(null)
                    setSuccess(null)
                    const response = await fetch('/api/organizations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: createOrgName, slug: createOrgSlug }),
                    })
                    if (!response.ok) throw new Error('Failed to create organization')
                    setSuccess('Organization created successfully')
                    setCreateOrgName('')
                    setCreateOrgSlug('')
                    await fetchData()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to create organization')
                  } finally {
                    setSubmitting(false)
                  }
                }}
                disabled={submitting || !createOrgName || !createOrgSlug}
                className="w-full px-4 py-2 bg-[#378ADD] hover:bg-[#185FA5] disabled:bg-[#2A2A35] text-white font-medium rounded-lg transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && <div className="fixed bottom-4 right-4 bg-[#2A0F0F] border border-[#5A1515] rounded-lg p-4 text-[#E04B4A] max-w-sm"><p className="text-sm">{error}</p></div>}
      {success && <div className="fixed bottom-4 right-4 bg-[#0F2A15] border border-[#155A2A] rounded-lg p-4 text-[#4AE070] max-w-sm"><p className="text-sm">{success}</p></div>}
    </div>
  )
}

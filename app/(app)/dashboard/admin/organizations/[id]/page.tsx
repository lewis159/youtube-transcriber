'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  users?: Member[]
}

interface Member {
  id: string
  email: string
  tier: string
  role: string
  created_at: string
}

export default function OrgManagementPage() {
  const params = useParams()
  const orgId = params.id as string
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'org_admin'>('user')

  useEffect(() => {
    fetchOrgDetails()
  }, [orgId])

  const fetchOrgDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/organizations/${orgId}`)
      if (!response.ok) throw new Error('Failed to fetch organization')
      const data = await response.json()
      setOrg(data)
      setMembers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      setSuccess(`Added ${email} to organization`)
      setEmail('')
      setRole('user')
      await fetchOrgDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the organization?')) return

    try {
      const response = await fetch(`/api/organizations/${orgId}/members/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove member')
      setSuccess('Member removed')
      await fetchOrgDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="text-[#888]">Loading organization...</div></div>
  }

  if (!org) {
    return (
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <p className="text-[#E04B4A] mb-4">Organization not found</p>
        <Link href="/dashboard/admin" className="text-[#378ADD]">Back to Admin Dashboard</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Back Link */}
      <Link href="/dashboard/admin" className="text-[#378ADD] hover:text-[#85B7EB]">
        ← Back to Dashboard
      </Link>

      {/* Org Header */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-2">{org.name}</h1>
        <div className="flex gap-6 text-sm">
          <div><p className="text-[#888]">Slug</p><p className="text-[#85B7EB] font-semibold">@{org.slug}</p></div>
          <div><p className="text-[#888]">Members</p><p className="text-[#85B7EB] font-semibold">{members.length}</p></div>
          <div><p className="text-[#888]">Created</p><p className="text-[#85B7EB]">{new Date(org.created_at).toLocaleDateString()}</p></div>
        </div>
      </div>

      {error && <div className="bg-[#2A0F0F] border border-[#5A1515] rounded p-4"><p className="text-[#E04B4A]">{error}</p></div>}
      {success && <div className="bg-[#0F2A15] border border-[#155A2A] rounded p-4"><p className="text-[#4AE070]">{success}</p></div>}

      {/* Add Member Form */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Member</h2>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="col-span-2 px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white placeholder-[#666]"
              required
            />
            <select value={role} onChange={e => setRole(e.target.value as 'user' | 'org_admin')} className="px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white">
              <option value="user">Member</option>
              <option value="org_admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={submitting || !email} className="w-full px-4 py-2 bg-[#378ADD] hover:bg-[#185FA5] disabled:bg-[#2A2A35] text-white font-medium rounded transition-colors">
            {submitting ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg overflow-hidden">
        <div className="bg-[#0F0F13] border-b border-[#2A2A35] px-6 py-3">
          <h2 className="font-semibold text-white">Members ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#888]">No members yet</div>
        ) : (
          <div className="divide-y divide-[#2A2A35]">
            {members.map(member => (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#242429] transition-colors">
                <div>
                  <p className="font-medium text-white">{member.email}</p>
                  <p className="text-xs text-[#888]">{new Date(member.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    member.role === 'org_admin' ? 'bg-[#2A5A3D] text-[#4AE070]' : 'bg-[#2A2A35] text-[#888]'
                  }`}>
                    {member.role === 'org_admin' ? 'Admin' : 'Member'}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="px-3 py-1 bg-[#5A2A2A] hover:bg-[#7A3A3A] text-[#E04B4A] text-sm rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

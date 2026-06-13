'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

interface Transaction {
  id: string
  amount: number
  reason: string
  notes?: string
  created_at: string
  admin_id?: string
}

interface Video {
  id: string
  youtube_id: string
  title: string
  status: string
  created_at: string
}

export default function UserManagementPage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('manual_adjustment')
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      const { user, transactions, videos } = await response.json()
      setUser(user)
      setTransactions(transactions || [])
      setVideos(videos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !reason) return

    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          reason,
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error)
      }

      setSuccess(`Added ${amount} credits successfully`)
      setAmount('')
      setReason('manual_adjustment')
      setNotes('')
      await fetchUserDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add credits')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleBlock = async () => {
    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked: !isBlocked }),
      })

      if (!response.ok) throw new Error('Failed to update block status')
      setIsBlocked(!isBlocked)
      setSuccess(isBlocked ? 'User unblocked' : 'User blocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update block status')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to send reset email')
      setSuccess('Password reset email sent to user')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="text-[#888]">Loading user...</div></div>
  }

  if (!user) {
    return (
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <p className="text-[#E04B4A] mb-4">User not found</p>
        <Link href="/dashboard/admin" className="text-[#378ADD]">Back to Admin Dashboard</Link>
      </div>
    )
  }

  const totalCredits = user.subscription_credits + user.purchased_credits

  return (
    <div className="flex flex-col gap-8">
      {/* Back Link */}
      <Link href="/dashboard/admin" className="text-[#378ADD] hover:text-[#85B7EB]">
        ← Back to Dashboard
      </Link>

      {/* User Header */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{user.email}</h1>
            <p className="text-sm text-[#888]">{user.organizations?.name || 'Personal Organization'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePasswordReset}
              disabled={submitting}
              className="px-3 py-1 bg-[#5A4A2A] hover:bg-[#7A6A3A] text-[#E0B04A] text-sm rounded transition-colors"
              title="Send password reset email"
            >
              🔑 Reset Password
            </button>
            <button
              onClick={handleToggleBlock}
              disabled={submitting}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                isBlocked
                  ? 'bg-[#2A5A3D] hover:bg-[#3A7A4D] text-[#4AE070]'
                  : 'bg-[#5A2A2A] hover:bg-[#7A3A3A] text-[#E04B4A]'
              }`}
            >
              {isBlocked ? '✓ Unblock' : '⊘ Block'}
            </button>
          </div>
        </div>

        {error && <div className="bg-[#2A0F0F] border border-[#5A1515] rounded p-2 mb-4"><p className="text-[#E04B4A] text-sm">{error}</p></div>}
        {success && <div className="bg-[#0F2A15] border border-[#155A2A] rounded p-2 mb-4"><p className="text-[#4AE070] text-sm">{success}</p></div>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[#888] mb-1">Tier</p>
            <select
              value={user.tier}
              onChange={async (e) => {
                try {
                  setSubmitting(true)
                  const response = await fetch(`/api/admin/users/${userId}/tier`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tier: e.target.value }),
                  })
                  if (!response.ok) throw new Error('Failed to update tier')
                  setSuccess('Tier updated')
                  await fetchUserDetails()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to update tier')
                } finally {
                  setSubmitting(false)
                }
              }}
              disabled={submitting}
              className="bg-[#0F0F13] border border-[#2A2A35] rounded px-2 py-1 text-[#85B7EB] font-semibold text-sm"
            >
              <option value="explorer">Explorer</option>
              <option value="creator">Creator</option>
              <option value="studio">Studio</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div><p className="text-[#888]">Role</p><p className="text-[#85B7EB] font-semibold">{user.role}</p></div>
          <div><p className="text-[#888]">Total Credits</p><p className="text-[#85B7EB] font-bold text-lg">{totalCredits}</p></div>
          <div><p className="text-[#888]">Joined</p><p className="text-[#85B7EB]">{new Date(user.created_at).toLocaleDateString()}</p></div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#2A2A35] grid grid-cols-2 gap-4 text-sm">
          <div className="bg-[#0F0F13] rounded p-3"><p className="text-[#888]">Subscription</p><p className="text-[#378ADD] font-bold">{user.subscription_credits}</p></div>
          <div className="bg-[#0F0F13] rounded p-3"><p className="text-[#888]">Purchased</p><p className="text-[#378ADD] font-bold">{user.purchased_credits}</p></div>
        </div>
      </div>

      {/* Add Credits Form */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add Credits</h2>
        <form onSubmit={handleAddCredits} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 50" className="w-full px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white placeholder-[#666]" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Reason</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white">
                <option value="manual_adjustment">Manual Adjustment</option>
                <option value="refund">Refund</option>
                <option value="promotion">Promotional</option>
                <option value="support_issue">Support Compensation</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Support context..." className="w-full px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white placeholder-[#666] resize-none" rows={2} />
          </div>
          <button type="submit" disabled={submitting || !amount} className="w-full px-4 py-2 bg-[#378ADD] hover:bg-[#185FA5] disabled:bg-[#2A2A35] text-white font-medium rounded transition-colors">
            {submitting ? 'Adding...' : 'Add Credits'}
          </button>
        </form>
      </div>

      {/* User Videos */}
      {videos.length > 0 && (
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Videos ({videos.length})</h2>
          <div className="space-y-2">
            {videos.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-[#0F0F13] border border-[#2A2A35] rounded p-3">
                <div className="flex-1">
                  <p className="text-white font-medium">{v.title || 'Untitled'}</p>
                  <p className="text-xs text-[#888]">youtube.com/watch?v={v.youtube_id}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${v.status === 'done' ? 'bg-[#0F5A2A] text-[#4AE070]' : v.status === 'error' ? 'bg-[#5A0F0F] text-[#E04B4A]' : 'bg-[#2A4A5A] text-[#85B7EB]'}`}>
                    {v.status}
                  </span>
                  <span className="text-xs text-[#888]">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4">Credit History</h2>
        {transactions.length === 0 ? (
          <p className="text-[#888]">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-[#0F0F13] border border-[#2A2A35] rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">{tx.amount > 0 ? '+' : ''}{tx.amount} credits</p>
                  <p className="text-xs text-[#888]">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-[#888] mb-1 capitalize">{tx.reason}</p>
                {tx.notes && <p className="text-xs text-[#666]">{tx.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

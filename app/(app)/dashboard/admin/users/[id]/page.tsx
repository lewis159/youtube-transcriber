'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface User {
  id: string
  email: string
  tier: string
  role: string
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

export default function UserManagementPage() {
  const params = useParams()
  const userId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
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
      const { user, transactions } = await response.json()
      setUser(user)
      setTransactions(transactions || [])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#888]">Loading user...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 max-w-lg">
          <p className="text-[#E04B4A]">User not found</p>
          <Link href="/dashboard/admin" className="text-[#378ADD] mt-4 block">
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalCredits = user.subscription_credits + user.purchased_credits

  return (
    <div className="min-h-screen bg-[#0F0F13] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard/admin"
          className="text-[#378ADD] hover:text-[#85B7EB] mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        {/* User Header */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{user.email}</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#888]">Tier</p>
              <p className="text-[#85B7EB] font-semibold">{user.tier}</p>
            </div>
            <div>
              <p className="text-[#888]">Role</p>
              <p className="text-[#85B7EB] font-semibold">{user.role}</p>
            </div>
            <div>
              <p className="text-[#888]">Total Credits</p>
              <p className="text-[#85B7EB] font-bold text-lg">{totalCredits}</p>
            </div>
            <div>
              <p className="text-[#888]">Joined</p>
              <p className="text-[#85B7EB]">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Credit Breakdown */}
          <div className="mt-4 pt-4 border-t border-[#2A2A35]">
            <p className="text-[#888] text-xs mb-2">Credit Breakdown</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-[#0F0F13] rounded p-3">
                <p className="text-[#888]">Subscription Credits</p>
                <p className="text-[#378ADD] font-bold">{user.subscription_credits}</p>
              </div>
              <div className="bg-[#0F0F13] rounded p-3">
                <p className="text-[#888]">Purchased Credits</p>
                <p className="text-[#378ADD] font-bold">{user.purchased_credits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Credits Form */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Add Credits</h2>

          {error && (
            <div className="bg-[#2A0F0F] border border-[#5A1515] rounded p-3 mb-4">
              <p className="text-[#E04B4A] text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-[#0F2A15] border border-[#155A2A] rounded p-3 mb-4">
              <p className="text-[#4AE070] text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleAddCredits} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g., 50"
                className="w-full px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white placeholder-[#666]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Reason
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white"
              >
                <option value="manual_adjustment">Manual Support Adjustment</option>
                <option value="refund">Refund</option>
                <option value="promotion">Promotional Offer</option>
                <option value="support_issue">Support Issue Compensation</option>
                <option value="subscription_grant">Subscription Grant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g., User reported transcription error on 2026-06-13"
                className="w-full px-3 py-2 bg-[#0F0F13] border border-[#2A2A35] rounded text-white placeholder-[#666] resize-none"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !amount}
              className="w-full px-4 py-2 bg-[#378ADD] hover:bg-[#185FA5] disabled:bg-[#2A2A35] text-white font-medium rounded transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Credits'}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="bg-[#18181F] border border-[#2A2A35] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Credit History</h2>

          {transactions.length === 0 ? (
            <p className="text-[#888]">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="bg-[#0F0F13] border border-[#2A2A35] rounded p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-white">
                      {tx.amount > 0 ? '+' : ''}{tx.amount} credits
                    </p>
                    <p className="text-xs text-[#888]">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-[#888] mb-1 capitalize">{tx.reason}</p>
                  {tx.notes && <p className="text-xs text-[#666]">{tx.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

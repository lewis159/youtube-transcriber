'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'

export default function DeleteAccountButton() {
  const { signOut } = useClerk()
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE'

  async function handleDelete() {
    if (!canDelete || deleting) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to delete account')
      }
      // Account + Clerk user are gone — end the session and return home.
      await signOut({ redirectUrl: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          background: 'transparent',
          border: '1px solid rgba(229,57,53,0.4)',
          color: 'var(--accent)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Delete account
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        This is permanent and cannot be undone. Type <strong style={{ color: 'var(--accent)' }}>DELETE</strong> to confirm.
      </div>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        autoFocus
        disabled={deleting}
        style={{
          padding: '10px 12px',
          borderRadius: '6px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
        }}
      />
      {error && (
        <div style={{ fontSize: '13px', color: 'var(--accent)' }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            background: canDelete && !deleting ? 'var(--accent)' : 'transparent',
            border: '1px solid rgba(229,57,53,0.4)',
            color: canDelete && !deleting ? '#fff' : 'var(--accent)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: canDelete && !deleting ? 'pointer' : 'not-allowed',
            opacity: !canDelete || deleting ? 0.6 : 1,
          }}
        >
          {deleting ? 'Deleting…' : 'Permanently delete'}
        </button>
        <button
          onClick={() => {
            setConfirming(false)
            setConfirmText('')
            setError(null)
          }}
          disabled={deleting}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: deleting ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

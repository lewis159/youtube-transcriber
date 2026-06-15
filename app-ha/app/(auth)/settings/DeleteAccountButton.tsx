'use client'

export default function DeleteAccountButton() {
  return (
    <button
      onClick={() => alert('Account deletion coming soon. Contact support@yttranscriber.com.')}
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

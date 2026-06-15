'use client'

import { useState } from 'react'

// "Was this article helpful?" — local-only thank-you. No backend yet; the choice
// is remembered for this article in localStorage so the buttons don't re-prompt.
export default function HelpfulButtons({ slug }: { slug: string }) {
  const storageKey = `kb-helpful:${slug}`

  const [choice, setChoice] = useState<'yes' | 'no' | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = window.localStorage.getItem(storageKey)
    return saved === 'yes' || saved === 'no' ? saved : null
  })

  function vote(value: 'yes' | 'no') {
    setChoice(value)
    try {
      window.localStorage.setItem(storageKey, value)
    } catch {
      // ignore storage being unavailable (private mode, etc.)
    }
  }

  return (
    <section
      data-print-hide
      className="glass-card"
      style={{
        padding: '28px',
        textAlign: 'center',
        marginBottom: '48px',
      }}
    >
      {choice ? (
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {choice === 'yes'
            ? '🙏 Thanks for your feedback!'
            : '🙏 Thanks — sorry this wasn’t quite what you needed. Contact support and we’ll help.'}
        </p>
      ) : (
        <>
          <p
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
            }}
          >
            Was this article helpful?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => vote('yes')}
              className="btn-secondary"
              style={{ padding: '10px 24px', fontSize: '15px' }}
            >
              👍 Yes
            </button>
            <button
              type="button"
              onClick={() => vote('no')}
              className="btn-secondary"
              style={{ padding: '10px 24px', fontSize: '15px' }}
            >
              👎 No
            </button>
          </div>
        </>
      )}
    </section>
  )
}

'use client'

// ── Q&A chat over the transcript — additive, Phase 4 ─────────────────────────
// Streams answers from /api/videos/[id]/chat (text/plain chunked). Only mounted
// when summary_chat is enabled for the user (gated by the parent + the route).

import { useRef, useState } from 'react'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

export default function SummaryChat({ videoId }: { videoId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  async function send() {
    const question = input.trim()
    if (!question || busy) return

    const history = messages.slice(-8)
    setMessages((m) => [...m, { role: 'user', content: question }, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    scrollToBottom()

    try {
      const res = await fetch(`/api/videos/${videoId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      })

      if (res.status === 403) {
        setMessages((m) => {
          const next = [...m]
          next[next.length - 1] = {
            role: 'assistant',
            content: 'Q&A chat requires a plan upgrade.',
          }
          return next
        })
        return
      }

      if (!res.ok || !res.body) {
        throw new Error('Chat request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      // Stream chunks into the trailing assistant message.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((m) => {
          const next = [...m]
          next[next.length - 1] = { role: 'assistant', content: acc }
          return next
        })
        scrollToBottom()
      }
    } catch (e) {
      console.error(e)
      setMessages((m) => {
        const next = [...m]
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Sorry — something went wrong generating a response.',
        }
        return next
      })
    } finally {
      setBusy(false)
      scrollToBottom()
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '15px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ color: '#E53935' }}>💬</span> Ask about this video
      </div>

      <div
        ref={scrollRef}
        style={{
          maxHeight: '360px',
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
            Ask a question about the video and the AI will answer from the transcript.
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {m.content || (busy && i === messages.length - 1 ? '…' : '')}
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Ask a question…"
          disabled={busy}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            background: '#E53935',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: busy || !input.trim() ? 'default' : 'pointer',
            opacity: busy || !input.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {busy ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

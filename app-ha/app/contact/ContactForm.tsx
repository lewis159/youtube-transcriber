'use client'

import { useState } from 'react'

/**
 * Front-end-only contact form.
 *
 * NOTE: This form does NOT actually send anything yet. On submit it only
 * shows a confirmation message in the UI. To make it functional it needs a
 * backend / email integration (e.g. a Next.js route handler that posts to an
 * email service such as Resend/SendGrid, or a support-ticket endpoint).
 * Do not assume submissions are being received until that is wired up.
 */
export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: send the form data to a backend / email integration.
    // Currently this is front-end only and does not deliver the message.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--accent-border)',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Thanks, we&apos;ll be in touch</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Your message has been received. We&apos;ll get back to you at the email you provided.
        </p>
      </div>
    )
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: '6px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label htmlFor="name" style={labelStyle}>Name</label>
        <input id="name" name="name" type="text" required style={fieldStyle} placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input id="email" name="email" type="email" required style={fieldStyle} placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="message" style={labelStyle}>Message</label>
        <textarea id="message" name="message" required rows={6} style={{ ...fieldStyle, resize: 'vertical' }} placeholder="How can we help?" />
      </div>
      <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: '15px', padding: '12px 32px' }}>
        Send message
      </button>
    </form>
  )
}

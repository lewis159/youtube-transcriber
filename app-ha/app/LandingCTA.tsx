'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export function NavCTA() {
  const { isSignedIn } = useUser()
  if (isSignedIn) {
    return (
      <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
        Go to Dashboard
      </Link>
    )
  }
  return (
    <>
      <Link href="/sign-in" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>Sign In</Link>
      <Link href="/sign-up" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
        Start Free
      </Link>
    </>
  )
}

export function HeroCTA() {
  const { isSignedIn } = useUser()
  return (
    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link
        href={isSignedIn ? '/dashboard' : '/sign-up'}
        className="btn-primary"
        style={{ fontSize: '16px', padding: '14px 36px' }}
      >
        {isSignedIn ? 'Go to Dashboard' : 'Start Free — No card needed'}
      </Link>
      <a href="#features" className="btn-secondary" style={{ fontSize: '16px', padding: '14px 36px' }}>
        See Features
      </a>
    </div>
  )
}

export function PricingCTA() {
  const { isSignedIn } = useUser()
  return (
    <Link
      href={isSignedIn ? '/dashboard' : '/sign-up'}
      className="btn-primary"
      style={{ display: 'inline-block', marginTop: '32px', padding: '12px 32px', fontSize: '15px', textDecoration: 'none' }}
    >
      {isSignedIn ? 'Go to Dashboard' : 'Get early access'}
    </Link>
  )
}

export function FinalCTA() {
  const { isSignedIn } = useUser()
  return (
    <Link
      href={isSignedIn ? '/dashboard' : '/sign-up'}
      className="btn-primary"
      style={{ fontSize: '18px', padding: '16px 48px', textDecoration: 'none' }}
    >
      {isSignedIn ? 'Go to Dashboard' : 'Create your free account'}
    </Link>
  )
}

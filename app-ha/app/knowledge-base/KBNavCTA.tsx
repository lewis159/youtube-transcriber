'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export default function KBNavCTA() {
  const { isSignedIn } = useUser()
  if (isSignedIn) {
    return (
      <Link href="/dashboard" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
        Dashboard
      </Link>
    )
  }
  return (
    <Link href="/sign-in" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
      Sign in
    </Link>
  )
}

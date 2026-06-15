export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, getPriceForTier, isStripeConfigured, StripeTier } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier } = (await req.json()) as { tier: StripeTier }

  // Enterprise = contact sales; no checkout.
  if (tier === 'enterprise') {
    return NextResponse.json({ error: 'Enterprise is contact-sales only' }, { status: 400 })
  }

  if (!getPriceForTier(tier)) {
    return NextResponse.json({ error: 'Invalid or unconfigured tier' }, { status: 400 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, stripe_customer_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const session = await createCheckoutSession({
    tier,
    clerkUserId: userId,
    customerId: user.stripe_customer_id,
    email: user.email,
    successUrl: `${appUrl}/dashboard?upgraded=1`,
    cancelUrl: `${appUrl}/pricing`,
  })

  return NextResponse.json({ url: session.url })
}

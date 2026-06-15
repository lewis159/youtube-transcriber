export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES, StripeTier } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tier } = await req.json() as { tier: StripeTier }
  const priceId = STRIPE_PRICES[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('email, stripe_customer_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: user.stripe_customer_id ?? undefined,
    customer_email: user.stripe_customer_id ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { clerk_user_id: userId, tier },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      metadata: { clerk_user_id: userId, tier },
    },
  })

  return NextResponse.json({ url: session.url })
}

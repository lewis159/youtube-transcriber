export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getStripe, getStripePrices, isStripeConfigured } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

/** Reverse map: Price ID → tier, built from env at request time. */
function tierFromPriceId(priceId: string | undefined): string | undefined {
  if (!priceId) return undefined
  const prices = getStripePrices()
  return (Object.entries(prices).find(([, id]) => id && id === priceId)?.[0]) as string | undefined
}

async function setUserTier(clerkUserId: string, tier: string, stripeCustomerId: string) {
  await supabaseAdmin
    .from('users')
    .update({ tier, stripe_customer_id: stripeCustomerId })
    .eq('clerk_user_id', clerkUserId)
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const stripe = getStripe()!

  // Raw body required for signature verification.
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clerkUserId = session.metadata?.clerk_user_id
      const tier = session.metadata?.tier
      if (clerkUserId && tier && session.customer) {
        await setUserTier(clerkUserId, tier, session.customer as string)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = sub.metadata?.clerk_user_id
      const tier = tierFromPriceId(sub.items.data[0]?.price.id)
      if (clerkUserId && tier && sub.customer) {
        await setUserTier(clerkUserId, tier, sub.customer as string)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = sub.metadata?.clerk_user_id
      if (clerkUserId) {
        await supabaseAdmin
          .from('users')
          .update({ tier: 'starter' })
          .eq('clerk_user_id', clerkUserId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

const TIER_FROM_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO        ?? '___']: 'pro',
  [process.env.STRIPE_PRICE_STUDIO     ?? '___']: 'studio',
  [process.env.STRIPE_PRICE_ENTERPRISE ?? '___']: 'enterprise',
}

async function setUserTier(clerkUserId: string, tier: string, stripeCustomerId: string) {
  await supabaseAdmin
    .from('users')
    .update({ tier, stripe_customer_id: stripeCustomerId })
    .eq('clerk_user_id', clerkUserId)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clerkUserId = session.metadata?.clerk_user_id
      const tier        = session.metadata?.tier
      if (clerkUserId && tier && session.customer) {
        await setUserTier(clerkUserId, tier, session.customer as string)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const clerkUserId = sub.metadata?.clerk_user_id
      const priceId     = sub.items.data[0]?.price.id
      const tier        = priceId ? TIER_FROM_PRICE[priceId] : undefined
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

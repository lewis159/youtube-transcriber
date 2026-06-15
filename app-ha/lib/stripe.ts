import Stripe from 'stripe'

export type StripeTier = 'pro' | 'studio' | 'enterprise'

// Lazy getter — nothing runs at module load time, so build never throws
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  }
  return _stripe
}

// Keep named export for backward compat — proxy to lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export function getStripePrices(): Record<StripeTier, string> {
  return {
    pro:        process.env.STRIPE_PRICE_PRO        ?? '',
    studio:     process.env.STRIPE_PRICE_STUDIO     ?? '',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
  }
}

export const STRIPE_PRICES = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return getStripePrices()[prop as StripeTier] ?? ''
  },
})

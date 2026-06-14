import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const STRIPE_PRICES: Record<string, string> = {
  pro:        process.env.STRIPE_PRICE_PRO        ?? '',
  studio:     process.env.STRIPE_PRICE_STUDIO     ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
}

export type StripeTier = 'pro' | 'studio' | 'enterprise'

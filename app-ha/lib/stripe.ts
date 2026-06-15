import Stripe from 'stripe'

// ─────────────────────────────────────────────────────────────────────────────
// KEY-AGNOSTIC Stripe plumbing.
//
// Required env vars (names only — NEVER hardcode the values):
//   STRIPE_SECRET_KEY                   server-side secret key (sk_test_… / sk_live_…)
//   STRIPE_WEBHOOK_SECRET               webhook signing secret (whsec_…)
//   STRIPE_PRICE_PRO                    Stripe Price ID for the Pro tier
//   STRIPE_PRICE_STUDIO                 Stripe Price ID for the Studio tier
//   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  publishable key (pk_test_… / pk_live_…)
//
// Enterprise is "contact sales" — it has no Price ID and no checkout flow.
//
// Nothing here runs at import time, so the app always builds/boots even with
// no Stripe keys set. Callers must check `isStripeConfigured()` first and
// degrade gracefully (return 503) when it returns false.
// ─────────────────────────────────────────────────────────────────────────────

export type StripeTier = 'pro' | 'studio' | 'enterprise'

/** True only when a server-side secret key is present. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

// Lazy singleton — instantiated on first use, never at module load.
let _stripe: Stripe | null = null

/**
 * Returns the Stripe SDK instance, or null when STRIPE_SECRET_KEY is absent.
 * Never throws at import; safe to call during build/SSG.
 */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  }
  return _stripe
}

/** Env-driven tier → Price ID mapping. Enterprise has no price (contact sales). */
export function getStripePrices(): Record<StripeTier, string> {
  return {
    pro:        process.env.STRIPE_PRICE_PRO    ?? '',
    studio:     process.env.STRIPE_PRICE_STUDIO ?? '',
    enterprise: '', // contact sales — no checkout
  }
}

/** The Price ID for a tier, or '' if not configured / not purchasable. */
export function getPriceForTier(tier: StripeTier): string {
  return getStripePrices()[tier] ?? ''
}

export const STRIPE_PRICES = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    return getStripePrices()[prop as StripeTier] ?? ''
  },
})

export interface CreateCheckoutSessionArgs {
  tier: StripeTier
  clerkUserId: string
  /** Existing Stripe customer id, if the user already has one. */
  customerId?: string | null
  /** Used to prefill checkout when the user has no customer id yet. */
  email?: string | null
  successUrl: string
  cancelUrl: string
}

/**
 * Creates a Stripe Checkout Session for a subscription tier.
 * Returns the session (caller reads `.url`).
 * Throws if Stripe is not configured or the tier has no Price ID — callers
 * should guard with `isStripeConfigured()` / `getPriceForTier()` first.
 */
export async function createCheckoutSession(args: CreateCheckoutSessionArgs): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe is not configured')

  const priceId = getPriceForTier(args.tier)
  if (!priceId) throw new Error(`No Stripe price configured for tier: ${args.tier}`)

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: args.customerId ?? undefined,
    customer_email: args.customerId ? undefined : (args.email ?? undefined),
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { clerk_user_id: args.clerkUserId, tier: args.tier },
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    subscription_data: {
      metadata: { clerk_user_id: args.clerkUserId, tier: args.tier },
    },
  })
}

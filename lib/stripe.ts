import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

/** Lazy Stripe singleton — throws only when actually used, so `next build` works without keys. */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  stripeClient = new Stripe(key);
  return stripeClient;
}

export function stripePriceIdForTier(tier: 'starter' | 'pro'): string {
  const id =
    tier === 'starter' ? process.env.STRIPE_STARTER_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID;
  if (!id) throw new Error(`Missing ${tier === 'starter' ? 'STRIPE_STARTER_PRICE_ID' : 'STRIPE_PRO_PRICE_ID'}`);
  return id;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

/** Map a Stripe price id back to a ProtAI tier (used by webhooks). */
export function tierForPriceId(priceId: string | null | undefined): 'starter' | 'pro' | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return null;
}

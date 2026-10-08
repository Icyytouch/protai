import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';
import { appUrl, getStripe, stripePriceIdForTier } from '@/lib/stripe';


const CheckoutBody = z.object({
  project_id: z.string().uuid(),
  tier: z.enum(['starter', 'pro']),
});

/**
 * POST /api/stripe/checkout — create a Stripe Checkout Session for a
 * ProtAI subscription (Starter $19/mo or Pro $39/mo).
 * The webhook finalizes the tier on checkout.session.completed.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = CheckoutBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { project_id, tier } = parsed.data;

  const ctx = await requireProject(project_id);
  if ('error' in ctx) return ctx.error;

  let priceId: string;
  try {
    priceId = stripePriceIdForTier(tier);
  } catch {
    return NextResponse.json({ error: `Stripe price ID for tier "${tier}" is not configured` }, { status: 500 });
  }

  const stripe = getStripe();
  const { data: sub } = await ctx.supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('project_id', project_id)
    .single();

  let customerId = (sub as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { project_id },
    });
    customerId = customer.id;
    await ctx.supabase
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('project_id', project_id);
  }

  const base = appUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { type: 'subscription', project_id, tier },
    subscription_data: { metadata: { project_id, tier } },
    success_url: `${base}/dashboard/${project_id}/billing?success=1`,
    cancel_url: `${base}/dashboard/${project_id}/billing?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}

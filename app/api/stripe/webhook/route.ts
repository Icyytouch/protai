import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { currentPeriod, toNum } from '@/lib/metering';
import { getStripe, tierForPriceId } from '@/lib/stripe';


/**
 * POST /api/stripe/webhook — Stripe events (raw body, signature verified).
 *
 * Handled events:
 * - checkout.session.completed (metadata.type=subscription) → create/update subscriptions row
 * - checkout.session.completed (metadata.type=credit_pack)   → record purchase + grant credits (idempotent)
 * - customer.subscription.updated                            → sync tier/status
 * - customer.subscription.deleted                            → downgrade to free
 * - invoice.payment_failed                                  → mark past_due (best effort)
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break; // ignore everything else
    }
  } catch (err) {
    console.error(`[stripe webhook] handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  if (md['type'] === 'credit_pack') {
    await handleCreditPackPurchase(session);
    return;
  }

  // Subscription purchase (metadata.type === 'subscription' or unset legacy).
  const projectId = md['project_id'];
  const tier = md['tier'];
  if (!projectId || (tier !== 'starter' && tier !== 'pro')) return;

  const db = createAdminSupabaseClient();
  await db.from('subscriptions').upsert(
    {
      project_id: projectId,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
      stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : null,
      tier,
      status: 'active',
    },
    { onConflict: 'project_id' },
  );
}

async function handleCreditPackPurchase(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const projectId = md['project_id'];
  const packId = md['pack_id'];
  const meterSlug = md['meter_slug'];
  const endUserId = md['end_user_id'];
  if (!projectId || !packId || !meterSlug || !endUserId) return;

  const db = createAdminSupabaseClient();

  // Idempotency: Stripe may retry webhooks; stripe_session_id is unique.
  const { data: existing } = await db
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', session.id)
    .single();
  if (existing) return;

  const units = toNum(md['units'] ?? null);
  if (!(units > 0)) return;

  const { data: meter } = await db
    .from('meters')
    .select('id')
    .eq('project_id', projectId)
    .eq('slug', meterSlug)
    .single();
  if (!meter) return;
  const meterId = (meter as { id: string }).id;

  const { data: purchase, error: purchaseError } = await db
    .from('purchases')
    .insert({
      project_id: projectId,
      end_user_id: endUserId,
      pack_id: packId,
      stripe_session_id: session.id,
      units,
      status: 'completed',
    })
    .select('id')
    .single();

  // Unique-violation race: another worker already recorded it.
  if (purchaseError) {
    if (purchaseError.code === '23505') return;
    throw purchaseError;
  }
  if (!purchase) return;

  // Grant the credits to the current-period balance.
  const period = currentPeriod();
  const { data: row } = await db
    .from('balances')
    .select('id, balance')
    .eq('project_id', projectId)
    .eq('meter_id', meterId)
    .eq('end_user_id', endUserId)
    .eq('period', period)
    .single();

  let newBalance: number;
  if (row) {
    const balanceId = (row as { id: string }).id;
    newBalance = toNum((row as { balance: string | number }).balance) + units;
    const { error } = await db.from('balances').update({ balance: newBalance }).eq('id', balanceId);
    if (error) throw error;
  } else {
    const { data: created, error } = await db
      .from('balances')
      .insert({ project_id: projectId, meter_id: meterId, end_user_id: endUserId, period, balance: units })
      .select('id')
      .single();
    if (error || !created) throw error ?? new Error('Failed to create balance');
    newBalance = units;
  }

  await db.from('ledger').insert({
    project_id: projectId,
    meter_id: meterId,
    end_user_id: endUserId,
    units,
    kind: 'purchase',
    balance_after: newBalance,
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const db = createAdminSupabaseClient();
  const priceId = sub.items.data[0]?.price.id ?? null;
  const tier = tierForPriceId(priceId);

  const update: Record<string, unknown> = { status: sub.status };
  if (tier) update['tier'] = tier;

  const { data } = await db
    .from('subscriptions')
    .select('project_id')
    .eq('stripe_subscription_id', sub.id)
    .single();
  if (!data) {
    // Fallback: match via subscription metadata set at checkout.
    const projectId = sub.metadata?.['project_id'];
    if (!projectId) return;
    await db.from('subscriptions').update(update).eq('project_id', projectId);
    return;
  }
  await db.from('subscriptions').update(update).eq('project_id', (data as { project_id: string }).project_id);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const db = createAdminSupabaseClient();
  const { data } = await db
    .from('subscriptions')
    .select('project_id')
    .eq('stripe_subscription_id', sub.id)
    .single();
  const projectId =
    (data as { project_id: string } | null)?.project_id ?? sub.metadata?.['project_id'];
  if (!projectId) return;
  await db
    .from('subscriptions')
    .update({ tier: 'free', status: 'canceled' })
    .eq('project_id', projectId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Best effort: mark the subscription past_due so the dashboard reflects it.
  const inv = invoice as unknown as {
    parent?: { subscription_details?: { subscription?: string } };
    subscription?: string;
  };
  const subscriptionId =
    inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null;
  if (!subscriptionId || typeof subscriptionId !== 'string') return;
  const db = createAdminSupabaseClient();
  await db
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);
}

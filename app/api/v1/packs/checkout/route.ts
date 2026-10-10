import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { authenticateApiKey, getMeter, toNum } from '@/lib/metering';
import { checkRateLimit } from '@/lib/rate-limit';
import { appUrl, getStripe } from '@/lib/stripe';


const PackCheckoutBody = z.object({
  pack_id: z.string().uuid(),
  meter_slug: z.string().min(1).max(64),
  end_user_id: z.string().min(1).max(128),
  success_url: z.string().url().max(2048).optional(),
  cancel_url: z.string().url().max(2048).optional(),
});

/**
 * POST /api/v1/packs/checkout — create a Stripe Checkout Session for a
 * credit-pack purchase. Called server-side by the BUILDER's backend using
 * their ProtAI API key (never from the browser).
 *
 * Body: {pack_id, meter_slug, end_user_id, success_url?, cancel_url?}
 * The meter is bound at purchase time (packs define units+price only).
 * 200 {url, session_id} · 400 validation · 401 bad key · 404 unknown pack/meter · 429
 *
 * On `checkout.session.completed`, the webhook grants the units to
 * (project, meter, end_user) and writes a ledger 'purchase' entry.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = PackCheckoutBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { pack_id, meter_slug, end_user_id, success_url, cancel_url } = parsed.data;

  const ctx = await authenticateApiKey(req.headers.get('authorization'));
  if (!ctx) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  const rl = await checkRateLimit(`v1:${ctx.keyId}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retry_after: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    );
  }

  const db = createAdminSupabaseClient();
  const { data: pack } = await db
    .from('credit_packs')
    .select('id, name, units, price_cents, currency, active')
    .eq('id', pack_id)
    .eq('project_id', ctx.projectId)
    .eq('active', true)
    .single();

  if (!pack) {
    return NextResponse.json({ error: 'Unknown or inactive credit pack' }, { status: 404 });
  }

  const meter = await getMeter(ctx.projectId, meter_slug);
  if (!meter) {
    return NextResponse.json({ error: `Unknown meter: ${meter_slug}` }, { status: 404 });
  }

  const packRow = pack as { name: string; units: string | number; price_cents: number; currency: string };
  const base = appUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: packRow.currency || 'usd',
          unit_amount: packRow.price_cents,
          product_data: { name: `${packRow.name} — ProtAI credits` },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'credit_pack',
      project_id: ctx.projectId,
      pack_id,
      meter_slug,
      end_user_id,
      units: String(toNum(packRow.units)),
    },
    success_url: success_url ?? `${base}/`,
    cancel_url: cancel_url ?? `${base}/`,
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}

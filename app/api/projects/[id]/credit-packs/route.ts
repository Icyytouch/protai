import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const CreatePack = z.object({
  name: z.string().min(1).max(80),
  units: z.number().positive().max(1_000_000_000),
  price_cents: z.number().int().min(0).max(100_000_000),
  currency: z.string().length(3).optional().default('usd'),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * Credit packs define purchasable credit bundles (units + price).
 * The meter is bound at PURCHASE time via POST /api/v1/packs/checkout
 * {pack_id, meter_slug, end_user_id} — one pack can serve many meters.
 */

/** GET — list credit packs. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('credit_packs')
    .select('id, name, units, price_cents, currency, stripe_payment_link, active')
    .eq('project_id', id)
    .order('price_cents', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to list credit packs' }, { status: 500 });
  return NextResponse.json({ credit_packs: data });
}

/** POST — create a credit pack. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = CreatePack.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('credit_packs')
    .insert({
      project_id: id,
      name: parsed.data.name,
      units: parsed.data.units,
      price_cents: parsed.data.price_cents,
      currency: parsed.data.currency.toLowerCase(),
    })
    .select('id, name, units, price_cents, currency, stripe_payment_link, active')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to create credit pack' }, { status: 500 });
  return NextResponse.json({ credit_pack: data }, { status: 201 });
}

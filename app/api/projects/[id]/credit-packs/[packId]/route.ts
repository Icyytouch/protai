import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const UpdatePack = z.object({
  name: z.string().min(1).max(80).optional(),
  units: z.number().positive().max(1_000_000_000).optional(),
  price_cents: z.number().int().min(0).max(100_000_000).optional(),
  active: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

type Ctx = { params: Promise<{ id: string; packId: string }> };

/** PATCH — update a credit pack (e.g. deactivate it). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, packId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = UpdatePack.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('credit_packs')
    .update(parsed.data)
    .eq('id', packId)
    .eq('project_id', id)
    .select('id, name, units, price_cents, currency, stripe_payment_link, active')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update credit pack' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Credit pack not found' }, { status: 404 });
  return NextResponse.json({ credit_pack: data });
}

/** DELETE — delete a credit pack. Past purchases keep their pack_id (set null). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, packId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { error } = await ctx.supabase.from('credit_packs').delete().eq('id', packId).eq('project_id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete credit pack' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

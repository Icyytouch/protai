import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const UpdateMeter = z.object({
  unit_label: z.string().min(1).max(40).optional(),
  monthly_quota: z.number().min(0).max(1_000_000_000).optional(),
  overage: z.enum(['block', 'allow_alert']).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

type Ctx = { params: Promise<{ id: string; meterId: string }> };

/** PATCH — update a meter (slug is immutable). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, meterId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = UpdateMeter.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('meters')
    .update(parsed.data)
    .eq('id', meterId)
    .eq('project_id', id)
    .select('id, slug, unit_label, monthly_quota, overage, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update meter' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Meter not found' }, { status: 404 });
  return NextResponse.json({ meter: data });
}

/** DELETE — delete a meter and its balances/ledger (cascade). */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, meterId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { error } = await ctx.supabase.from('meters').delete().eq('id', meterId).eq('project_id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete meter' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

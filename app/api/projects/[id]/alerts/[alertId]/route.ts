import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const UpdateAlert = z.object({
  threshold_pct: z.number().int().min(1).max(100).optional(),
  channel: z.string().min(1).max(20).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

type Ctx = { params: Promise<{ id: string; alertId: string }> };

/** PATCH — update an alert config. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, alertId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = UpdateAlert.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('alerts')
    .update(parsed.data)
    .eq('id', alertId)
    .eq('project_id', id)
    .select('id, threshold_pct, channel, last_triggered_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  return NextResponse.json({ alert: data });
}

/** DELETE — remove an alert config. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, alertId } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { error } = await ctx.supabase.from('alerts').delete().eq('id', alertId).eq('project_id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const CreateAlert = z.object({
  meter_slug: z.string().min(1).max(64).optional(),
  threshold_pct: z.number().int().min(1).max(100),
  channel: z.string().min(1).max(20).optional().default('email'),
});

type Ctx = { params: Promise<{ id: string }> };

/** GET — list alert configs. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('alerts')
    .select('id, meter_id, threshold_pct, channel, last_triggered_at, meters (slug)')
    .eq('project_id', id)
    .order('threshold_pct', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to list alerts' }, { status: 500 });

  const alerts = (data as Array<Record<string, unknown>>).map((a) => ({
    id: a['id'],
    meter_slug: (a['meters'] as { slug: string } | null)?.slug ?? null,
    threshold_pct: a['threshold_pct'],
    channel: a['channel'],
    last_triggered_at: a['last_triggered_at'],
  }));
  return NextResponse.json({ alerts });
}

/** POST — create an alert config (optionally scoped to one meter). */
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
  const parsed = CreateAlert.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  let meterId: string | null = null;
  if (parsed.data.meter_slug) {
    const { data: meter } = await ctx.supabase
      .from('meters')
      .select('id')
      .eq('project_id', id)
      .eq('slug', parsed.data.meter_slug)
      .single();
    if (!meter) {
      return NextResponse.json({ error: `Unknown meter: ${parsed.data.meter_slug}` }, { status: 404 });
    }
    meterId = (meter as { id: string }).id;
  }

  const { data, error } = await ctx.supabase
    .from('alerts')
    .insert({
      project_id: id,
      meter_id: meterId,
      threshold_pct: parsed.data.threshold_pct,
      channel: parsed.data.channel,
    })
    .select('id, threshold_pct, channel, last_triggered_at')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  return NextResponse.json({ alert: { ...data, meter_slug: parsed.data.meter_slug ?? null } }, { status: 201 });
}

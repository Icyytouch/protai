import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';
import { currentPeriod } from '@/lib/metering';


const AdjustBalance = z.object({
  meter_slug: z.string().min(1).max(64),
  end_user_id: z.string().min(1).max(128),
  units: z.number().min(-1_000_000_000).max(1_000_000_000).refine((n) => n !== 0, 'units must be non-zero'),
  kind: z.enum(['adjust', 'grant']),
});

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET — list current-period balances. Query: ?meter=<slug>&q=<search>&period=YYYY-MM&limit=&offset=
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const sp = req.nextUrl.searchParams;
  const meterSlug = sp.get('meter');
  const q = sp.get('q');
  const period = sp.get('period') ?? currentPeriod();
  const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '50', 10) || 50, 1), 200);
  const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10) || 0, 0);

  let query = ctx.supabase
    .from('balances')
    .select('id, end_user_id, balance, period, updated_at, meters!inner (slug, unit_label)', { count: 'exact' })
    .eq('project_id', id)
    .eq('period', period)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (meterSlug) query = query.eq('meters.slug', meterSlug);
  if (q) query = query.ilike('end_user_id', `%${q}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to list balances' }, { status: 500 });

  const balances = (data as Array<Record<string, unknown>>).map((b) => ({
    id: b['id'],
    end_user_id: b['end_user_id'],
    balance: b['balance'],
    period: b['period'],
    updated_at: b['updated_at'],
    meter_slug: (b['meters'] as { slug: string }).slug,
    unit_label: (b['meters'] as { unit_label: string }).unit_label,
  }));
  return NextResponse.json({ balances, total: count ?? balances.length, period });
}

/**
 * POST — manual balance adjustment. kind='adjust' (correction, units may be
 * negative) or 'grant' (free credits, units must be positive). Writes a
 * ledger entry so the change is auditable.
 */
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
  const parsed = AdjustBalance.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { meter_slug, end_user_id, units, kind } = parsed.data;
  if (kind === 'grant' && units <= 0) {
    return NextResponse.json({ error: 'Grant units must be positive' }, { status: 400 });
  }

  const { data: meter } = await ctx.supabase
    .from('meters')
    .select('id')
    .eq('project_id', id)
    .eq('slug', meter_slug)
    .single();
  if (!meter) return NextResponse.json({ error: `Unknown meter: ${meter_slug}` }, { status: 404 });

  const period = currentPeriod();
  const meterId = (meter as { id: string }).id;

  // Get-or-create the balance row (RLS-scoped to the owner).
  let { data: row } = await ctx.supabase
    .from('balances')
    .select('id, balance')
    .eq('project_id', id)
    .eq('meter_id', meterId)
    .eq('end_user_id', end_user_id)
    .eq('period', period)
    .single();

  if (!row) {
    const { data: created, error } = await ctx.supabase
      .from('balances')
      .insert({ project_id: id, meter_id: meterId, end_user_id, period, balance: 0 })
      .select('id, balance')
      .single();
    if (error || !created) return NextResponse.json({ error: 'Failed to create balance' }, { status: 500 });
    row = created;
  }

  const current = parseFloat(String((row as { balance: string | number }).balance)) || 0;
  const newBalance = current + units;

  const { error: updateError } = await ctx.supabase
    .from('balances')
    .update({ balance: newBalance })
    .eq('id', (row as { id: string }).id);
  if (updateError) return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });

  await ctx.supabase.from('ledger').insert({
    project_id: id,
    meter_id: meterId,
    end_user_id,
    units,
    kind,
    balance_after: newBalance,
  });

  return NextResponse.json({ balance: newBalance, period });
}

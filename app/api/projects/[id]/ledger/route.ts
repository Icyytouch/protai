import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireProject } from '@/lib/api';


const LedgerQuery = z.object({
  meter: z.string().max(64).optional(),
  end_user_id: z.string().max(128).optional(),
  kind: z.enum(['check', 'report', 'adjust', 'grant', 'purchase']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

type Ctx = { params: Promise<{ id: string }> };

/** GET — filterable ledger. Query: ?meter=&end_user_id=&kind=&limit=&offset= */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ctx = await requireProject(id);
  if ('error' in ctx) return ctx.error;

  const parsed = LedgerQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 });
  }
  const { meter, end_user_id, kind, limit, offset } = parsed.data;

  let query = ctx.supabase
    .from('ledger')
    .select('id, end_user_id, units, kind, balance_after, created_at, meters!inner (slug)', { count: 'exact' })
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (meter) query = query.eq('meters.slug', meter);
  if (end_user_id) query = query.eq('end_user_id', end_user_id);
  if (kind) query = query.eq('kind', kind);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to read ledger' }, { status: 500 });

  const entries = (data as Array<Record<string, unknown>>).map((e) => ({
    id: e['id'],
    end_user_id: e['end_user_id'],
    meter_slug: (e['meters'] as { slug: string }).slug,
    units: e['units'],
    kind: e['kind'],
    balance_after: e['balance_after'],
    created_at: e['created_at'],
  }));
  return NextResponse.json({ entries, total: count ?? entries.length });
}

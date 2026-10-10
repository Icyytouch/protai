import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { checkUsage, reportUsage, getMeter, type KeyContext } from '@/lib/metering';
import { checkRateLimit } from '@/lib/rate-limit';

const DEMO_PROJECT_NAME = '__playground_demo__';

const PlaygroundBody = z.object({
  action: z.enum(['check', 'report']),
  end_user_id: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'letters, numbers, dashes only'),
  units: z.number().int().positive().max(10000),
});

/**
 * Get (or lazily create) the shared playground demo project + tokens meter.
 * Owned by the first admin; hidden from the normal project list.
 */
async function getDemoProjectId(): Promise<string> {
  const db = createAdminSupabaseClient();
  const { data: existing } = await db
    .from('projects')
    .select('id')
    .eq('name', DEMO_PROJECT_NAME)
    .maybeSingle();
  if (existing) return (existing as { id: string }).id;

  const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin').limit(1).single();
  const ownerId = (admins as { id: string } | null)?.id;
  if (!ownerId) throw new Error('Playground not configured yet — an admin account is required.');

  const { data: created, error } = await db
    .from('projects')
    .insert({ name: DEMO_PROJECT_NAME, owner_id: ownerId })
    .select('id')
    .single();
  if (error || !created) throw new Error('Could not set up the playground.');
  const projectId = (created as { id: string }).id;

  await db.from('meters').insert({
    project_id: projectId,
    slug: 'tokens',
    unit_label: 'tokens',
    monthly_quota: 1000,
    overage: 'block',
  });
  return projectId;
}

/**
 * POST /api/demo/playground — try the metering API with no signup.
 * Body: { action: 'check'|'report', end_user_id, units }
 * Strictly rate-limited per IP. Demo balances are shared and reset monthly.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = PlaygroundBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Rate limit by IP: 20 requests/min.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`demo:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Playground rate limit exceeded. Try again in a minute.' }, { status: 429 });
  }

  let projectId: string;
  try {
    projectId = await getDemoProjectId();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Playground unavailable' },
      { status: 503 }
    );
  }

  const ctx: KeyContext = { keyId: 'demo', projectId, killSwitch: false };
  const meter = await getMeter(projectId, 'tokens');
  if (!meter) return NextResponse.json({ error: 'Playground unavailable' }, { status: 503 });

  const { action, end_user_id, units } = parsed.data;
  try {
    if (action === 'check') {
      const result = await checkUsage(ctx, meter, end_user_id, units);
      return NextResponse.json({ action, ...result });
    }
    const result = await reportUsage(ctx, meter, end_user_id, units);
    return NextResponse.json({ action, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Playground error' },
      { status: 500 }
    );
  }
}

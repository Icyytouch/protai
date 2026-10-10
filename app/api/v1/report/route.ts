import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticateApiKey,
  getMeter,
  reportUsage,
  PlanLimitError,
} from '@/lib/metering';
import { evaluateAlerts } from '@/lib/alerts';
import { checkRateLimit } from '@/lib/rate-limit';


const ReportBody = z.object({
  end_user_id: z.string().min(1).max(128),
  meter: z.string().min(1).max(64),
  units: z.number().positive().max(1_000_000_000),
});

/**
 * POST /api/v1/report — deduct units after the work is done.
 * Auth: Authorization: Bearer ptk_...
 * 200 {balance} · 400 validation · 401 bad key · 404 unknown meter
 * 403 {error, reason:'insufficient'|'killed', balance, quota} · 429 rate limited
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = ReportBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }
  const { end_user_id, meter: meterSlug, units } = parsed.data;

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

  const meter = await getMeter(ctx.projectId, meterSlug);
  if (!meter) {
    return NextResponse.json({ error: `Unknown meter: ${meterSlug}` }, { status: 404 });
  }

  let result;
  try {
    result = await reportUsage(ctx, meter, end_user_id, units);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message, upgrade_tier: err.upgradeTier, code: 'plan_limit' },
        { status: 402 }
      );
    }
    throw err;
  }

  if (!result.ok) {
    const status = 403;
    if (result.reason === 'killed') {
      return NextResponse.json(
        { error: 'Project kill-switch is enabled', reason: 'killed', balance: result.balance },
        { status },
      );
    }
    return NextResponse.json(
      { error: 'Insufficient quota', reason: 'insufficient', balance: result.balance },
      { status },
    );
  }

  await evaluateAlerts(ctx.projectId, meter, end_user_id, result.balance);

  return NextResponse.json({ balance: result.balance });
}

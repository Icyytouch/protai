import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticateApiKey,
  checkUsage,
  getMeter,
  PlanLimitError,
} from '@/lib/metering';
import { evaluateAlerts } from '@/lib/alerts';
import { checkRateLimit } from '@/lib/rate-limit';


const CheckBody = z.object({
  end_user_id: z.string().min(1).max(128),
  meter: z.string().min(1).max(64),
  units: z.number().positive().max(1_000_000_000).optional().default(1),
});

/**
 * POST /api/v1/check — quota check (does NOT deduct).
 * Auth: Authorization: Bearer ptk_...
 * 200 {allowed, balance, quota, reason?} — `allowed:false` is a 200, not an error.
 * 400 validation · 401 bad key · 404 unknown meter · 429 rate limited
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = CheckBody.safeParse(body);
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
    result = await checkUsage(ctx, meter, end_user_id, units);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message, upgrade_tier: err.upgradeTier, code: 'plan_limit' },
        { status: 402 }
      );
    }
    throw err;
  }

  // Best-effort alert evaluation; never fails the request.
  if (result.allowed) {
    await evaluateAlerts(ctx.projectId, meter, end_user_id, result.balance);
  }

  return NextResponse.json(result);
}

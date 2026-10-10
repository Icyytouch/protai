import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticateApiKey,
  currentPeriod,
  getMeter,
  getOrCreateBalance,
  toNum,
} from '@/lib/metering';
import { checkRateLimit } from '@/lib/rate-limit';


const BalanceQuery = z.object({
  end_user_id: z.string().min(1).max(128),
  meter: z.string().min(1).max(64),
});

/**
 * GET /api/v1/balance?end_user_id=&meter= — read-only balance lookup.
 * Auth: Authorization: Bearer ptk_...
 * 200 {balance, quota, period} · 400 validation · 401 bad key · 404 unknown meter · 429 rate limited
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = BalanceQuery.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query', details: parsed.error.flatten() }, { status: 400 });
  }
  const { end_user_id, meter: meterSlug } = parsed.data;

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

  const period = currentPeriod();
  const row = await getOrCreateBalance(ctx.projectId, meter.id, end_user_id, period);

  return NextResponse.json({
    balance: toNum(row.balance),
    quota: toNum(meter.monthly_quota),
    period,
  });
}

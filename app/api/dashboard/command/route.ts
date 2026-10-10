import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/components/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { currentPeriod } from '@/lib/metering';

/**
 * POST /api/dashboard/command — natural-language command execution.
 * Body: { projectId, intent, params }
 * The client parses free text into a structured intent; this route
 * executes data intents against the project's ledger/balances.
 */

type Intent =
  | { type: 'user_balance'; userId: string }
  | { type: 'top_burners'; limit: number }
  | { type: 'spike' }
  | { type: 'quota_forecast' }
  | { type: 'project_stats' };

async function verifyProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const db = createAdminSupabaseClient();
  const { data } = await db.from('projects').select('id').eq('id', projectId).eq('owner_id', user.id).maybeSingle();
  return data ? db : null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { projectId, intent } = body as { projectId: string; intent: Intent };
  if (!projectId || !intent?.type) {
    return NextResponse.json({ error: 'Missing projectId or intent' }, { status: 400 });
  }

  const db = await verifyProject(projectId);
  if (!db) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const period = currentPeriod();

  try {
    switch (intent.type) {
      case 'user_balance': {
        const { data } = await db
          .from('balances')
          .select('balance, meters!inner(slug)')
          .eq('project_id', projectId)
          .eq('end_user_id', intent.userId)
          .eq('period', period);
        const rows = (data as Array<{ balance: number; meters: { slug: string } }> | null) ?? [];
        if (rows.length === 0) {
          return NextResponse.json({ answer: `No balances found for "${intent.userId}" this period.`, rows: [] });
        }
        const lines = rows.map((r) => `${r.meters.slug}: ${Number(r.balance).toLocaleString()} left`);
        return NextResponse.json({
          answer: `**${intent.userId}** — ${rows.length} meter${rows.length > 1 ? 's' : ''} this period:`,
          rows: lines,
        });
      }

      case 'top_burners': {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data } = await db
          .from('ledger')
          .select('end_user_id, units, meters!inner(slug)')
          .eq('project_id', projectId)
          .eq('kind', 'report')
          .gte('created_at', since)
          .limit(5000);
        const totals = new Map<string, number>();
        for (const r of (data as Array<{ end_user_id: string; units: number }> ?? [])) {
          totals.set(r.end_user_id, (totals.get(r.end_user_id) ?? 0) + Number(r.units));
        }
        const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, intent.limit || 5);
        if (top.length === 0) {
          return NextResponse.json({ answer: 'No usage reported in the last 24 hours.', rows: [] });
        }
        return NextResponse.json({
          answer: `Top burners in the last 24h:`,
          rows: top.map(([u, units], i) => `${i + 1}. ${u} — ${units.toLocaleString()} units`),
        });
      }

      case 'spike': {
        // Compare today's burn vs the 7-day daily average.
        const { data: meters } = await db.from('meters').select('id,slug').eq('project_id', projectId);
        const meterList = (meters as Array<{ id: string; slug: string }>) ?? [];
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const { data } = await db
          .from('ledger')
          .select('meter_id, units, created_at')
          .eq('project_id', projectId)
          .eq('kind', 'report')
          .gte('created_at', weekStart)
          .limit(10000);
        const rows = (data as Array<{ meter_id: string; units: number; created_at: string }>) ?? [];
        const findings: string[] = [];
        for (const m of meterList) {
          const mRows = rows.filter((r) => r.meter_id === m.id);
          const todayUnits = mRows.filter((r) => r.created_at >= todayStart.toISOString()).reduce((s, r) => s + Number(r.units), 0);
          const weekUnits = mRows.reduce((s, r) => s + Number(r.units), 0);
          const dailyAvg = weekUnits / 7;
          if (dailyAvg > 0 && todayUnits > dailyAvg * 2) {
            findings.push(`**${m.slug}** is at ${todayUnits.toLocaleString()} today vs a ${Math.round(dailyAvg).toLocaleString()}/day average — ${(todayUnits / dailyAvg).toFixed(1)}× normal.`);
          }
        }
        // Also find the single biggest burner today.
        const byUser = new Map<string, number>();
        for (const r of rows.filter((r) => r.created_at >= todayStart.toISOString())) {
          const key = `${r.meter_id}`;
          byUser.set(key, (byUser.get(key) ?? 0) + Number(r.units));
        }
        if (findings.length === 0) {
          return NextResponse.json({ answer: 'No unusual spikes — today looks normal across all meters.', rows: [] });
        }
        return NextResponse.json({ answer: 'Spike detected:', rows: findings });
      }

      case 'quota_forecast': {
        // Users whose burn rate exhausts balance within 48h.
        const { data: balances } = await db
          .from('balances')
          .select('end_user_id, balance, meter_id, meters!inner(slug, monthly_quota)')
          .eq('project_id', projectId)
          .eq('period', period)
          .gt('balance', 0)
          .limit(2000);
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data: recent } = await db
          .from('ledger')
          .select('end_user_id, meter_id, units')
          .eq('project_id', projectId)
          .eq('kind', 'report')
          .gte('created_at', since)
          .limit(10000);
        const burn = new Map<string, number>();
        for (const r of (recent as Array<{ end_user_id: string; meter_id: string; units: number }>) ?? []) {
          const k = `${r.end_user_id}:${r.meter_id}`;
          burn.set(k, (burn.get(k) ?? 0) + Number(r.units));
        }
        const atRisk: string[] = [];
        for (const b of ((balances as unknown) as Array<{ end_user_id: string; balance: number; meter_id: string; meters: { slug: string } }>) ?? []) {
          const daily = burn.get(`${b.end_user_id}:${b.meter_id}`) ?? 0;
          if (daily > 0) {
            const hoursLeft = (Number(b.balance) / daily) * 24;
            if (hoursLeft < 48) {
              atRisk.push(`${b.end_user_id} (${b.meters.slug}) — ~${Math.max(1, Math.round(hoursLeft))}h left at current burn`);
            }
          }
        }
        if (atRisk.length === 0) {
          return NextResponse.json({ answer: 'Nobody is on track to exhaust quota in the next 48 hours.', rows: [] });
        }
        return NextResponse.json({ answer: `${atRisk.length} user${atRisk.length > 1 ? 's' : ''} running low:`, rows: atRisk.slice(0, 10) });
      }

      case 'project_stats': {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const [{ count: checks }, { count: reports }, { count: users }] = await Promise.all([
          db.from('ledger').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('kind', 'check').gte('created_at', todayStart.toISOString()),
          db.from('ledger').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('kind', 'report').gte('created_at', todayStart.toISOString()),
          db.from('balances').select('id', { count: 'exact', head: true }).eq('project_id', projectId).eq('period', period),
        ]);
        return NextResponse.json({
          answer: `Today at a glance:`,
          rows: [`${checks ?? 0} checks`, `${reports ?? 0} reports`, `${users ?? 0} active users this period`],
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown intent' }, { status: 400 });
    }
  } catch (err) {
    console.error('[command]', err);
    return NextResponse.json({ error: 'Command failed' }, { status: 500 });
  }
}

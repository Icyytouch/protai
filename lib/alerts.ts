import { createAdminSupabaseClient } from './supabase-admin';
import { currentPeriod, toNum, type Meter } from './metering';
import { sendEmail } from './email';

/**
 * Threshold-alert detection + email delivery.
 *
 * After a check/report, usage_pct = (quota - balance) / quota * 100 is
 * computed for the affected meter+user. Any alert config on the project
 * (optionally scoped to that meter) whose threshold is crossed gets its
 * `last_triggered_at` stamped — edge-triggered once per period — and the
 * project owner is emailed. Email is fire-and-forget: alert delivery must
 * never slow down or fail a metering request.
 */
export async function evaluateAlerts(
  projectId: string,
  meter: Meter,
  endUserId: string,
  balance: number,
): Promise<void> {
  const quota = toNum(meter.monthly_quota);
  if (quota <= 0) return;

  const usagePct = ((quota - balance) / quota) * 100;
  const period = currentPeriod();
  const periodStart = `${period}-01T00:00:00.000Z`;

  try {
    const db = createAdminSupabaseClient();
    const { data: configs } = await db
      .from('alerts')
      .select('id, meter_id, threshold_pct, last_triggered_at')
      .eq('project_id', projectId)
      .or(`meter_id.is.null,meter_id.eq.${meter.id}`);

    if (!configs || configs.length === 0) return;

    let fired = false;
    let firedThreshold = 0;
    for (const cfg of configs as Array<{
      id: string;
      threshold_pct: number;
      last_triggered_at: string | null;
    }>) {
      const alreadyFiredThisPeriod =
        cfg.last_triggered_at !== null && cfg.last_triggered_at >= periodStart;
      if (alreadyFiredThisPeriod) continue;
      if (usagePct >= cfg.threshold_pct) {
        await db.from('alerts').update({ last_triggered_at: new Date().toISOString() }).eq('id', cfg.id);
        fired = true;
        firedThreshold = Math.max(firedThreshold, cfg.threshold_pct);
      }
    }

    if (fired) {
      // Fire-and-forget: never block metering on email delivery.
      void sendAlertEmail(db, projectId, meter, endUserId, usagePct, firedThreshold, period).catch((err) =>
        console.error('[alerts] email failed:', err),
      );
    }
  } catch {
    // Alert evaluation must never fail a metering request.
  }
}

async function sendAlertEmail(
  db: ReturnType<typeof createAdminSupabaseClient>,
  projectId: string,
  meter: Meter,
  endUserId: string,
  usagePct: number,
  thresholdPct: number,
  period: string,
): Promise<void> {
  const { data: project } = await db
    .from('projects')
    .select('id, name, owner_id')
    .eq('id', projectId)
    .single();
  const ownerId = (project as { owner_id?: string } | null)?.owner_id;
  if (!ownerId) return;

  const { data: userRes } = await db.auth.admin.getUserById(ownerId);
  const email = userRes?.user?.email;
  if (!email) return;

  const projectName = (project as { name?: string } | null)?.name ?? 'your project';
  const subject = `ProtAI alert: ${endUserId} hit ${Math.round(usagePct)}% of quota`;
  const text = [
    `Hi,`,
    ``,
    `Spend alert from ProtAI (${projectName}):`,
    ``,
    `  User:   ${endUserId}`,
    `  Meter:  ${meter.slug}`,
    `  Usage:  ${usagePct.toFixed(1)}% of monthly quota (threshold: ${thresholdPct}%)`,
    `  Period: ${period}`,
    ``,
    `View details: ${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/${projectId}/ledger`,
    ``,
    `— ProtAI`,
  ].join('\n');

  await sendEmail(email, subject, text);
}

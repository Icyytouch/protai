import { after } from 'next/server';

import { createAdminSupabaseClient } from './supabase-admin';
import { currentPeriod, toNum, type Meter } from './metering';
import { sendEmail } from './email';
import { fireWebhooks } from './webhooks';
import { sendPushToUser } from './push';

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
      // `after`, not a bare floating promise: in serverless the runtime may
      // freeze background work once the response is sent, so an un-awaited
      // send would silently never run. `after` guarantees it completes
      // without delaying the metering response.
      after(() =>
        Promise.all([
          sendAlertEmail(db, projectId, meter, endUserId, usagePct, firedThreshold, period),
          sendThresholdPush(db, projectId, meter, endUserId, usagePct, firedThreshold),
        ]).catch((err) => console.error('[alerts] notification failed:', err)),
      );
      fireWebhooks(projectId, 'usage.threshold', {
        meter_slug: meter.slug,
        end_user_id: endUserId,
        usage_pct: Math.round(usagePct * 100) / 100,
        threshold_pct: firedThreshold,
        balance_after: balance,
      });
    }

    // Quota exhausted: balance hit zero after this call.
    if (balance <= 0) {
      after(() =>
        sendQuotaExhaustedPush(db, projectId, meter, endUserId).catch((err) =>
          console.error('[alerts] quota push failed:', err),
        ),
      );
      fireWebhooks(projectId, 'quota.exhausted', {
        meter_slug: meter.slug,
        end_user_id: endUserId,
        usage_pct: 100,
        balance_after: balance,
      });
    }
  } catch {
    // Alert evaluation must never fail a metering request.
  }
}

async function getProjectOwner(
  db: ReturnType<typeof createAdminSupabaseClient>,
  projectId: string,
): Promise<{ ownerId: string | null; projectName: string }> {
  const { data: project } = await db
    .from('projects')
    .select('id, name, owner_id')
    .eq('id', projectId)
    .single();
  return {
    ownerId: (project as { owner_id?: string } | null)?.owner_id ?? null,
    projectName: (project as { name?: string } | null)?.name ?? 'your project',
  };
}

/** Push a threshold breach to the project owner's phone. */
async function sendThresholdPush(
  db: ReturnType<typeof createAdminSupabaseClient>,
  projectId: string,
  meter: Meter,
  endUserId: string,
  usagePct: number,
  thresholdPct: number,
): Promise<void> {
  const { ownerId, projectName } = await getProjectOwner(db, projectId);
  if (!ownerId) return;
  await sendPushToUser(ownerId, {
    title: `ProtAI: ${Math.round(usagePct)}% of quota used`,
    body: `${endUserId} hit ${usagePct.toFixed(1)}% on ${meter.slug} (${projectName}) — threshold ${thresholdPct}%.`,
    url: `/dashboard/${projectId}/ledger`,
  });
}

/** Push a quota-exhausted event to the project owner's phone. */
async function sendQuotaExhaustedPush(
  db: ReturnType<typeof createAdminSupabaseClient>,
  projectId: string,
  meter: Meter,
  endUserId: string,
): Promise<void> {
  const { ownerId, projectName } = await getProjectOwner(db, projectId);
  if (!ownerId) return;
  await sendPushToUser(ownerId, {
    title: `ProtAI: quota exhausted`,
    body: `${endUserId} ran out of ${meter.slug} credits on ${projectName}. Checks are now denied.`,
    url: `/dashboard/${projectId}/ledger`,
  });
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
  const { ownerId, projectName } = await getProjectOwner(db, projectId);
  if (!ownerId) return;

  const { data: userRes } = await db.auth.admin.getUserById(ownerId);
  const email = userRes?.user?.email;
  if (!email) return;

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

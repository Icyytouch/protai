import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from './supabase-admin';
import { extractBearerKey, hashApiKey } from './keys';

/** Convert Supabase `numeric` (returned as string) to a JS number. */
export function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Current metering period in UTC: "YYYY-MM". Quotas reset each period. */
export function currentPeriod(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export interface Meter {
  id: string;
  project_id: string;
  slug: string;
  unit_label: string;
  monthly_quota: string | number;
  overage: 'block' | 'allow_alert';
}

export interface KeyContext {
  keyId: string;
  projectId: string;
  killSwitch: boolean;
}

export interface BalanceRow {
  id: string;
  balance: string | number;
}

function admin(): SupabaseClient {
  return createAdminSupabaseClient();
}

/**
 * Authenticate a request via `Authorization: Bearer ptk_...`.
 * Returns the key context or null. Also touches `last_used_at`
 * (failure to update it never fails the request).
 */
export async function authenticateApiKey(authHeader: string | null): Promise<KeyContext | null> {
  const rawKey = extractBearerKey(authHeader);
  if (!rawKey) return null;

  const { data, error } = await admin()
    .from('api_keys')
    .select('id, project_id, projects!inner (kill_switch)')
    .eq('key_hash', hashApiKey(rawKey))
    .single();

  if (error || !data) return null;

  const ctx: KeyContext = {
    keyId: (data as { id: string }).id,
    projectId: (data as { project_id: string }).project_id,
    killSwitch: Boolean(
      (data as unknown as { projects: { kill_switch: boolean } }).projects.kill_switch,
    ),
  };

  // Best-effort usage timestamp; never blocks the request.
  try {
    await admin().from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', ctx.keyId);
  } catch {
    /* ignore */
  }

  return ctx;
}

/** Resolve a meter by slug within a project. */
export async function getMeter(projectId: string, slug: string): Promise<Meter | null> {
  const { data, error } = await admin()
    .from('meters')
    .select('id, project_id, slug, unit_label, monthly_quota, overage')
    .eq('project_id', projectId)
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return data as Meter;
}

/** Get the current-period balance row, creating it at 0 if missing. */
export async function getOrCreateBalance(
  projectId: string,
  meterId: string,
  endUserId: string,
  period: string,
): Promise<BalanceRow> {
  const db = admin();
  const { data } = await db
    .from('balances')
    .select('id, balance')
    .eq('project_id', projectId)
    .eq('meter_id', meterId)
    .eq('end_user_id', endUserId)
    .eq('period', period)
    .single();

  if (data) return data as BalanceRow;

  // New balance row needed. If this end user has never been seen on the
  // project before, enforce the plan's end-user limit first.
  const { data: seen } = await db
    .from('balances')
    .select('id')
    .eq('project_id', projectId)
    .eq('end_user_id', endUserId)
    .limit(1);
  if (!seen || seen.length === 0) {
    const { checkEndUserLimit } = await import('./tiers');
    const limit = await checkEndUserLimit(projectId);
    if (!limit.ok) {
      throw new PlanLimitError(limit.message, limit.upgradeTier);
    }
  }

  const { data: created, error } = await db
    .from('balances')
    .upsert(
      { project_id: projectId, meter_id: meterId, end_user_id: endUserId, period, balance: 0 },
      { onConflict: 'project_id,meter_id,end_user_id,period' },
    )
    .select('id, balance')
    .single();

  if (error || !created) throw new Error('Failed to create balance row');
  return created as BalanceRow;
}

/** Thrown when a plan limit blocks an operation. Routes map this to 402. */
export class PlanLimitError extends Error {
  upgradeTier: string;
  constructor(message: string, upgradeTier: string) {
    super(message);
    this.name = 'PlanLimitError';
    this.upgradeTier = upgradeTier;
  }
}

export interface CheckResult {
  allowed: boolean;
  balance: number;
  quota: number;
  reason?: 'insufficient' | 'killed';
}

/**
 * Quota check. Does NOT deduct — call `reportUsage` after the work is done.
 * `usable = balance + quota`; with overage='block', `units` must fit in usable.
 */
export async function checkUsage(
  ctx: KeyContext,
  meter: Meter,
  endUserId: string,
  units: number,
): Promise<CheckResult> {
  const period = currentPeriod();
  const quota = toNum(meter.monthly_quota);

  if (ctx.killSwitch) {
    return { allowed: false, balance: 0, quota, reason: 'killed' };
  }

  const row = await getOrCreateBalance(ctx.projectId, meter.id, endUserId, period);
  const balance = toNum(row.balance);

  let allowed = true;
  let reason: CheckResult['reason'];
  if (meter.overage === 'block' && balance + quota - units < 0) {
    allowed = false;
    reason = 'insufficient';
  }

  await admin().from('ledger').insert({
    project_id: ctx.projectId,
    meter_id: meter.id,
    end_user_id: endUserId,
    units,
    kind: 'check',
    balance_after: balance,
    note: reason ?? null,
  });

  return { allowed, balance, quota, ...(reason ? { reason } : {}) };
}

export interface ReportResult {
  ok: boolean;
  balance: number;
  reason?: 'insufficient' | 'killed';
}

/**
 * Deduct `units` from the user's balance. Uses the atomic `deduct_balance`
 * Postgres function: a single statement with row locking, safe under
 * concurrent load. With overage='block' the call is
 * rejected when it would exceed balance+quota; with 'allow_alert' the
 * balance may go negative.
 */
export async function reportUsage(
  ctx: KeyContext,
  meter: Meter,
  endUserId: string,
  units: number,
): Promise<ReportResult> {
  const period = currentPeriod();
  const quota = toNum(meter.monthly_quota);
  const db = admin();

  if (ctx.killSwitch) {
    await db.from('ledger').insert({
      project_id: ctx.projectId,
      meter_id: meter.id,
      end_user_id: endUserId,
      units,
      kind: 'report',
      balance_after: 0,
      note: 'killed',
    });
    return { ok: false, balance: 0, reason: 'killed' };
  }

  // Ensure the row exists (and the end-user plan limit is respected for new users).
  await getOrCreateBalance(ctx.projectId, meter.id, endUserId, period);

  // Atomic deduction via Postgres function (row lock, single statement).
  const { data, error } = await db.rpc('deduct_balance', {
    p_project_id: ctx.projectId,
    p_meter_id: meter.id,
    p_end_user_id: endUserId,
    p_period: period,
    p_units: units,
    p_quota: quota,
    p_allow_negative: meter.overage === 'allow_alert',
  });

  if (error) {
    if (error.message?.includes('insufficient_quota')) {
      const { data: row } = await db
        .from('balances')
        .select('balance')
        .eq('project_id', ctx.projectId)
        .eq('meter_id', meter.id)
        .eq('end_user_id', endUserId)
        .eq('period', period)
        .single();
      const bal = toNum((row as { balance?: number } | null)?.balance ?? 0);
      await db.from('ledger').insert({
        project_id: ctx.projectId,
        meter_id: meter.id,
        end_user_id: endUserId,
        units,
        kind: 'report',
        balance_after: bal,
        note: 'insufficient',
      });
      return { ok: false, balance: bal, reason: 'insufficient' };
    }
    throw new Error('Failed to update balance');
  }

  const newBalance = toNum(data);

  await db.from('ledger').insert({
    project_id: ctx.projectId,
    meter_id: meter.id,
    end_user_id: endUserId,
    units,
    kind: 'report',
    balance_after: newBalance,
  });

  return { ok: true, balance: newBalance };
}

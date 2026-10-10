import { createAdminSupabaseClient } from './supabase-admin';

export type Tier = 'free' | 'starter' | 'pro';

/** -1 means unlimited. Mirrors the pricing page. */
export const TIER_LIMITS: Record<Tier, { projects: number; meters: number; endUsers: number }> = {
  free: { projects: 1, meters: 3, endUsers: 100 },
  starter: { projects: 3, meters: -1, endUsers: 10_000 },
  pro: { projects: -1, meters: -1, endUsers: 100_000 },
};

const TIER_RANK: Record<Tier, number> = { free: 0, starter: 1, pro: 2 };

function toTier(raw: unknown): Tier {
  return raw === 'starter' || raw === 'pro' ? raw : 'free';
}

/** Active tier for a single project (from its subscription row). */
export async function getProjectTier(projectId: string): Promise<Tier> {
  try {
    const db = createAdminSupabaseClient();
    const { data } = await db
      .from('subscriptions')
      .select('tier,status')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .maybeSingle();
    const row = data as { tier?: string } | null;
    return toTier(row?.tier);
  } catch {
    return 'free';
  }
}

/** Highest active tier across all of a user's projects. Used for project-creation limits. */
export async function getUserMaxTier(userId: string): Promise<Tier> {
  try {
    const db = createAdminSupabaseClient();
    const { data: projects } = await db.from('projects').select('id').eq('owner_id', userId);
    const ids = ((projects as Array<{ id: string }>) ?? []).map((p) => p.id);
    if (ids.length === 0) return 'free';
    const { data: subs } = await db
      .from('subscriptions')
      .select('tier')
      .in('project_id', ids)
      .eq('status', 'active');
    let best: Tier = 'free';
    for (const s of (subs as Array<{ tier: string }>) ?? []) {
      const t = toTier(s.tier);
      if (TIER_RANK[t] > TIER_RANK[best]) best = t;
    }
    return best;
  } catch {
    return 'free';
  }
}

export type LimitCheck = { ok: true } | { ok: false; message: string; upgradeTier: Tier };

function over(limit: number, count: number): boolean {
  return limit >= 0 && count >= limit;
}

/** Can this user create another project? */
export async function checkProjectLimit(userId: string): Promise<LimitCheck> {
  const tier = await getUserMaxTier(userId);
  const limit = TIER_LIMITS[tier].projects;
  if (limit < 0) return { ok: true };
  const db = createAdminSupabaseClient();
  const { count } = await db.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', userId);
  if (over(limit, count ?? 0)) {
    return {
      ok: false,
      message: `Your plan allows ${limit} project${limit === 1 ? '' : 's'}. Upgrade to create more.`,
      upgradeTier: tier === 'free' ? 'starter' : 'pro',
    };
  }
  return { ok: true };
}

/** Can this project add another meter? */
export async function checkMeterLimit(projectId: string): Promise<LimitCheck> {
  const tier = await getProjectTier(projectId);
  const limit = TIER_LIMITS[tier].meters;
  if (limit < 0) return { ok: true };
  const db = createAdminSupabaseClient();
  const { count } = await db.from('meters').select('id', { count: 'exact', head: true }).eq('project_id', projectId);
  if (over(limit, count ?? 0)) {
    return {
      ok: false,
      message: `Your plan allows ${limit} meters per project. Upgrade to add more.`,
      upgradeTier: tier === 'free' ? 'starter' : 'pro',
    };
  }
  return { ok: true };
}

/** Count distinct end users ever seen on a project (across all periods). */
export async function countEndUsers(projectId: string): Promise<number> {
  const db = createAdminSupabaseClient();
  // Distinct count via group-by; balances is the source of truth for seen users.
  const { data } = await db.from('balances').select('end_user_id').eq('project_id', projectId).limit(200_000);
  return new Set(((data as Array<{ end_user_id: string }>) ?? []).map((r) => r.end_user_id)).size;
}

/** Can this project track another distinct end user? Call before first-seeing a new user. */
export async function checkEndUserLimit(projectId: string): Promise<LimitCheck> {
  const tier = await getProjectTier(projectId);
  const limit = TIER_LIMITS[tier].endUsers;
  if (limit < 0) return { ok: true };
  const count = await countEndUsers(projectId);
  if (over(limit, count)) {
    return {
      ok: false,
      message: `Your plan allows ${limit.toLocaleString()} end users. Upgrade to track more.`,
      upgradeTier: tier === 'free' ? 'starter' : 'pro',
    };
  }
  return { ok: true };
}

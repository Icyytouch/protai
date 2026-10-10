import Link from "next/link";
import { getProjectTier, TIER_LIMITS, type Tier } from "@/lib/tiers";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

function Bar({ used, limit }: { used: number; limit: number }) {
  const pct = limit < 0 ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const hot = limit >= 0 && used >= limit;
  const warm = limit >= 0 && !hot && pct >= 80;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
      <div
        className={`h-full rounded-full transition-all ${hot ? "bg-red-400" : warm ? "bg-amber-400" : "bg-emerald-500"}`}
        style={{ width: limit < 0 ? "100%" : `${pct}%` }}
      />
    </div>
  );
}

function fmt(limit: number, used: number) {
  if (limit < 0) return `${used.toLocaleString()} / unlimited`;
  return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
}

/**
 * Plan usage strip: shows meters / end users against the project's tier,
 * with an upgrade nudge at 80%+ or when capped.
 */
export async function PlanUsage({ projectId, compact = false }: { projectId: string; compact?: boolean }) {
  const tier: Tier = await getProjectTier(projectId);
  const limits = TIER_LIMITS[tier];
  const db = createAdminSupabaseClient();

  const [{ count: meters }, { data: balances }] = await Promise.all([
    db.from("meters").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    db.from("balances").select("end_user_id").eq("project_id", projectId).limit(200_000),
  ]);
  const meterCount = meters ?? 0;
  const userCount = new Set(((balances as Array<{ end_user_id: string }>) ?? []).map((b) => b.end_user_id)).size;

  const rows = [
    { label: "Meters", used: meterCount, limit: limits.meters },
    { label: "End users", used: userCount, limit: limits.endUsers },
  ];
  const capped = rows.some((r) => r.limit >= 0 && r.used >= r.limit);
  const warm = rows.some((r) => r.limit >= 0 && r.used / Math.max(1, r.limit) >= 0.8);

  if (tier !== "free" && !warm && compact) return null;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        capped
          ? "border-amber-500/30 bg-amber-500/[0.05]"
          : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-200">
          {tier === "free" ? "Free plan" : <span className="capitalize">{tier} plan</span>}
        </p>
        {(capped || warm) && tier !== "pro" ? (
          <Link
            href={`/dashboard/${projectId}/billing`}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            {capped ? "Upgrade to grow" : "View plans"}
          </Link>
        ) : tier === "free" ? (
          <Link href={`/dashboard/${projectId}/billing`} className="text-xs text-zinc-500 transition hover:text-emerald-300">
            Compare plans →
          </Link>
        ) : null}
      </div>
      {capped && (
        <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
          You've hit a plan limit. Upgrade to keep growing — your data and meters stay exactly as they are.
        </p>
      )}
      <div className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-xs text-zinc-500">{r.label}</span>
              <span className="font-mono text-xs text-zinc-400">{fmt(r.limit, r.used)}</span>
            </div>
            <Bar used={r.used} limit={r.limit} />
          </div>
        ))}
      </div>
    </div>
  );
}

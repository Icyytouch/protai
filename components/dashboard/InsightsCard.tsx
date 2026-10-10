import Link from "next/link";
import { getUser } from "@/components/supabase/server";
import { Card } from "@/components/ui";
import { currentPeriod } from "@/app/dashboard/_types";

type Insight = {
  tone: "amber" | "red" | "sky" | "green";
  title: string;
  body: string;
  href?: string;
  cta?: string;
};

/**
 * Proactive insights: the dashboard tells you things before you ask —
 * quota exhaustion forecasts, burn spikes, kill-switch state.
 */
export async function InsightsCard({ projectId }: { projectId: string }) {
  const { supabase } = await getUser();
  const period = currentPeriod();
  const insights: Insight[] = [];

  // 1. Kill-switch reminder
  const { data: project } = await supabase
    .from("projects")
    .select("kill_switch")
    .eq("id", projectId)
    .single();
  if ((project as { kill_switch: boolean } | null)?.kill_switch) {
    insights.push({
      tone: "red",
      title: "Kill-switch is ON",
      body: "Every check() call is being denied right now.",
      href: `/dashboard/${projectId}`,
      cta: "Review",
    });
  }

  // 2. Quota exhaustion forecast (48h at current burn)
  const { data: balances } = await supabase
    .from("balances")
    .select("end_user_id, balance, meter_id, meters!inner(slug)")
    .eq("project_id", projectId)
    .eq("period", period)
    .gt("balance", 0)
    .limit(2000);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("ledger")
    .select("end_user_id, meter_id, units")
    .eq("project_id", projectId)
    .eq("kind", "report")
    .gte("created_at", since)
    .limit(10000);

  const burn = new Map<string, number>();
  for (const r of (recent as Array<{ end_user_id: string; meter_id: string; units: number }>) ?? []) {
    const k = `${r.end_user_id}:${r.meter_id}`;
    burn.set(k, (burn.get(k) ?? 0) + Number(r.units));
  }
  let atRisk = 0;
  let soonest = "";
  for (const b of ((balances as unknown) as Array<{ end_user_id: string; balance: number; meter_id: string; meters: { slug: string } }>) ?? []) {
    const daily = burn.get(`${b.end_user_id}:${b.meter_id}`) ?? 0;
    if (daily > 0) {
      const hoursLeft = (Number(b.balance) / daily) * 24;
      if (hoursLeft < 48) {
        atRisk++;
        if (!soonest) soonest = `${b.end_user_id} (~${Math.max(1, Math.round(hoursLeft))}h left)`;
      }
    }
  }
  if (atRisk > 0) {
    insights.push({
      tone: "amber",
      title: `${atRisk} user${atRisk > 1 ? "s" : ""} running dry`,
      body: `On track to exhaust quota within 48h. Soonest: ${soonest}.`,
      href: `/dashboard/${projectId}/users`,
      cta: "View users",
    });
  }

  // 3. Spike detection: today vs 7-day average
  const weekStart = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: meters } = await supabase.from("meters").select("id,slug").eq("project_id", projectId);
  const { data: weekRows } = await supabase
    .from("ledger")
    .select("meter_id, units, created_at")
    .eq("project_id", projectId)
    .eq("kind", "report")
    .gte("created_at", weekStart)
    .limit(10000);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  for (const m of (meters as Array<{ id: string; slug: string }>) ?? []) {
    const mRows = ((weekRows as Array<{ meter_id: string; units: number; created_at: string }>) ?? []).filter((r) => r.meter_id === m.id);
    if (mRows.length < 5) continue;
    const todayUnits = mRows.filter((r) => r.created_at >= todayStart.toISOString()).reduce((s, r) => s + Number(r.units), 0);
    const dailyAvg = mRows.reduce((s, r) => s + Number(r.units), 0) / 7;
    if (dailyAvg > 0 && todayUnits > dailyAvg * 2.5) {
      insights.push({
        tone: "amber",
        title: `Burn spike on ${m.slug}`,
        body: `${todayUnits.toLocaleString()} today vs ${Math.round(dailyAvg).toLocaleString()}/day average.`,
        href: `/dashboard/${projectId}/ledger`,
        cta: "Inspect",
      });
      break;
    }
  }

  // 4. Healthy state
  if (insights.length === 0) {
    insights.push({
      tone: "green",
      title: "All quiet",
      body: "No spikes, no users running dry, kill-switch off. Your guardrails are holding.",
    });
  }

  const toneClass: Record<Insight["tone"], string> = {
    amber: "border-amber-500/25 bg-amber-500/[0.05]",
    red: "border-red-500/25 bg-red-500/[0.05]",
    sky: "border-sky-500/25 bg-sky-500/[0.05]",
    green: "border-emerald-500/25 bg-emerald-500/[0.05]",
  };
  const dotClass: Record<Insight["tone"], string> = {
    amber: "bg-amber-400",
    red: "bg-red-400",
    sky: "bg-sky-400",
    green: "bg-emerald-400",
  };

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-zinc-100">
          <span className="mr-1.5 text-emerald-400">✦</span>Insights
        </h3>
        <p className="text-[11px] text-zinc-600">updated just now</p>
      </div>
      <div className="mt-4 space-y-3">
        {insights.map((ins, i) => (
          <div key={i} className={`rounded-xl border p-4 ${toneClass[ins.tone]}`}>
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass[ins.tone]}`} />
              <p className="text-sm font-medium text-zinc-100">{ins.title}</p>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{ins.body}</p>
            {ins.href && (
              <Link href={ins.href} className="mt-2 inline-block text-xs font-medium text-emerald-300 transition hover:text-emerald-200">
                {ins.cta ?? "View"} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

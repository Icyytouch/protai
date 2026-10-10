import Link from "next/link";
import { getUser } from "@/components/supabase/server";
import { PageHeader, Stat, Card, Badge, EmptyState } from "@/components/ui";
import { PlanUsage } from "@/components/dashboard/PlanUsage";
import { SpendChart } from "@/components/dashboard/SpendChart";
import { KillSwitchToggle } from "./kill-switch";
import { currentPeriod, formatDateTime, type LedgerRow } from "@/app/dashboard/_types";

export default async function ProjectOverview({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,kill_switch,created_at")
    .eq("id", projectId)
    .single();
  const p = project as { id: string; name: string; kill_switch: boolean; created_at: string };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const period = currentPeriod();

  const [{ count: checksToday }, { count: reportsToday }, { count: activeUsers }, { count: meterCount }, { count: keyCount }, { data: recent }] =
    await Promise.all([
      supabase.from("ledger").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("kind", "check").gte("created_at", todayStart.toISOString()),
      supabase.from("ledger").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("kind", "report").gte("created_at", todayStart.toISOString()),
      supabase.from("balances").select("id", { count: "exact", head: true }).eq("project_id", projectId).eq("period", period),
      supabase.from("meters").select("id", { count: "exact", head: true }).eq("project_id", projectId),
      supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("project_id", projectId),
      supabase.from("ledger").select("id,end_user_id,units,kind,balance_after,created_at,meters(slug)").eq("project_id", projectId).order("created_at", { ascending: false }).limit(8),
    ]);

  const recentRows = (recent as LedgerRow[] | null) ?? [];

  return (
    <>
      <PageHeader
        title={p.name}
        sub={`Project overview · billing period ${period}`}
        action={<KillSwitchToggle projectId={p.id} projectName={p.name} enabled={p.kill_switch} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Checks today" value={String(checksToday ?? 0)} hint="check() calls since midnight" />
        <Stat label="Reports today" value={String(reportsToday ?? 0)} hint="report() calls since midnight" />
        <Stat label="Active users" value={String(activeUsers ?? 0)} hint={`with balances in ${period}`} />
        <Stat
          label="Kill-switch"
          value={p.kill_switch ? "ON" : "OFF"}
          hint={p.kill_switch ? "All checks denied" : "Operating normally"}
        />
      </div>

      <div className="mt-4">
        <PlanUsage projectId={projectId} compact />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <SpendChart projectId={projectId} />
        <Card>
          <h2 className="mb-4 font-medium text-zinc-100">Setup checklist</h2>
          <ul className="space-y-3 text-sm">
            <ChecklistItem done={(keyCount ?? 0) > 0} label="Create an API key" href={`/dashboard/${p.id}/keys`} />
            <ChecklistItem done={(meterCount ?? 0) > 0} label="Define a meter" href={`/dashboard/${p.id}/meters`} />
            <ChecklistItem done={(activeUsers ?? 0) > 0} label="First end user metered" href={`/dashboard/${p.id}/users`} />
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 font-medium text-zinc-100">Recent activity</h2>
          {recentRows.length === 0 ? (
            <EmptyState title="No activity yet" sub="Make your first check() call and it will show up here." />
          ) : (
            <ul className="space-y-2.5">
              {recentRows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2.5">
                    <KindBadge kind={r.kind} />
                    <span className="font-mono text-xs text-zinc-400">{r.end_user_id}</span>
                  </span>
                  <span className="text-xs text-zinc-500">
                    {r.meters?.slug ?? "—"} · {formatDateTime(r.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/dashboard/${p.id}/ledger`} className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">
            View full ledger →
          </Link>
        </Card>
      </div>
    </>
  );
}

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 text-zinc-300 hover:text-white">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
            done ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : "border-zinc-600 text-transparent"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        {label}
      </Link>
    </li>
  );
}

function KindBadge({ kind }: { kind: string }) {
  const tone = kind === "check" ? "blue" : kind === "report" ? "neutral" : kind === "adjust" ? "amber" : "green";
  return <Badge tone={tone as "blue" | "neutral" | "amber" | "green"}>{kind}</Badge>;
}

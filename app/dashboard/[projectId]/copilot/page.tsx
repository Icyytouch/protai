import Link from "next/link";
import { getUser } from "@/components/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";

type Diagnosis = {
  severity: "critical" | "warning" | "tip";
  title: string;
  detail: string;
  fix: string;
  code?: string;
};

const severityStyle = {
  critical: "border-red-500/30 bg-red-500/[0.05]",
  warning: "border-amber-500/30 bg-amber-500/[0.05]",
  tip: "border-sky-500/30 bg-sky-500/[0.05]",
} as const;

const severityDot = {
  critical: "bg-red-400",
  warning: "bg-amber-400",
  tip: "bg-sky-400",
} as const;

/**
 * Integration Copilot — reads your actual API traffic and diagnoses
 * integration problems, with the exact fix for each one.
 */
export default async function CopilotPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [{ data: meters }, { data: ledger }, { data: project }] = await Promise.all([
    supabase.from("meters").select("id,slug").eq("project_id", projectId),
    supabase
      .from("ledger")
      .select("kind, note, end_user_id, meter_id, created_at")
      .eq("project_id", projectId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("projects").select("kill_switch").eq("id", projectId).single(),
  ]);

  const meterList = (meters as Array<{ id: string; slug: string }>) ?? [];
  const rows = (ledger as Array<{ kind: string; note: string | null; end_user_id: string; meter_id: string; created_at: string }>) ?? [];
  const slugOf = (id: string) => meterList.find((m) => m.id === id)?.slug ?? "unknown";
  const diagnoses: Diagnosis[] = [];

  // 1. Kill-switch blocks
  const killed = rows.filter((r) => r.note === "killed");
  if (killed.length > 0 || (project as { kill_switch: boolean } | null)?.kill_switch) {
    diagnoses.push({
      severity: "critical",
      title: `Kill-switch is blocking traffic`,
      detail: `${killed.length} call${killed.length === 1 ? " was" : "s were"} denied with reason "killed" in the last 7 days. Every check() returns allowed: false while it's on.`,
      fix: "Turn it off on the project overview when you're ready — or leave it on if you're intentionally paused.",
      code: `// your check() calls return this while it's on:\n{ "allowed": false, "reason": "killed" }`,
    });
  }

  // 2. Repeated insufficient denials per user
  const insufficient = rows.filter((r) => r.note === "insufficient");
  const byUser = new Map<string, number>();
  for (const r of insufficient) byUser.set(r.end_user_id, (byUser.get(r.end_user_id) ?? 0) + 1);
  const repeatOffenders = [...byUser.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);
  for (const [user, n] of repeatOffenders) {
    diagnoses.push({
      severity: "warning",
      title: `"${user}" hit quota ${n} times`,
      detail: `This user keeps getting denied. They're either your power user (sell them a credit pack) or stuck in a loop (check your upgrade UX).`,
      fix: "Handle allowed: false with an upgrade prompt or a credit-pack checkout — don't silently retry.",
      code: `const check = await protai.check(userId, "tokens");\nif (!check.allowed && check.reason === "insufficient") {\n  return showUpgrade({ balance: check.balance }); // don't retry in a loop\n}`,
    });
  }

  // 3. Checks without reports — integration gap
  const checksByUserMeter = new Map<string, number>();
  const reportsByUserMeter = new Map<string, number>();
  for (const r of rows) {
    const k = `${r.end_user_id}:${r.meter_id}`;
    if (r.kind === "check") checksByUserMeter.set(k, (checksByUserMeter.get(k) ?? 0) + 1);
    if (r.kind === "report") reportsByUserMeter.set(k, (reportsByUserMeter.get(k) ?? 0) + 1);
  }
  let checkOnly = 0;
  for (const [k, n] of checksByUserMeter) {
    if ((reportsByUserMeter.get(k) ?? 0) === 0) checkOnly += n;
  }
  if (checkOnly >= 5) {
    diagnoses.push({
      severity: "tip",
      title: `${checkOnly} checks never reported usage`,
      detail: `You're calling check() but never following up with report() — usage isn't being deducted, so quotas never decrease.`,
      fix: "Always report actual usage after the AI call completes.",
      code: `const usage = await openai.chat.completions.create({ /* ... */ });\nawait protai.report(userId, "tokens", usage.usage.total_tokens); // ← add this`,
    });
  }

  // 4. No traffic at all
  if (rows.length === 0) {
    diagnoses.push({
      severity: "tip",
      title: "No API traffic in the last 7 days",
      detail: "The copilot watches your live check()/report() calls and diagnoses problems here. Nothing to analyze yet.",
      fix: "Make your first call from the onboarding wizard or your app, then come back.",
    });
  }

  return (
    <>
      <PageHeader
        title="Copilot"
        sub="Watches your live API traffic and diagnoses integration problems — with the exact fix."
      />

      {diagnoses.length === 0 ? (
        <EmptyState
          title="Your integration looks healthy"
          sub="No denied calls, no missing reports, no kill-switch blocks in the last 7 days. The copilot will flag anything the moment it appears."
        />
      ) : (
        <div className="space-y-4">
          {diagnoses.map((d, i) => (
            <Card key={i} className={severityStyle[d.severity]}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${severityDot[d.severity]}`} />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {d.severity}
                </span>
              </div>
              <h3 className="mt-1.5 text-base font-medium text-zinc-50">
                <span className="mr-1.5 text-emerald-400">✦</span>{d.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{d.detail}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                <strong className="font-medium text-zinc-100">Fix: </strong>{d.fix}
              </p>
              {d.code && (
                <pre className="mt-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
                  {d.code}
                </pre>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        Analyzing {rows.length.toLocaleString()} ledger entries across {meterList.length} meter{meterList.length === 1 ? "" : "s"} · last 7 days ·{" "}
        <Link href={`/dashboard/${projectId}/ledger`} className="text-zinc-500 underline-offset-2 hover:underline">
          view raw ledger
        </Link>
      </p>
    </>
  );
}

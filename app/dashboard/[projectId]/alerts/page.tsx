import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td, Card } from "@/components/ui";
import { CreateAlertButton, DeleteAlertButton } from "./alert-buttons";
import { formatDateTime, type Alert, type Meter } from "@/app/dashboard/_types";

export default async function AlertsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const [{ data: alerts }, { data: meters }] = await Promise.all([
    supabase
      .from("alerts")
      .select("id,project_id,meter_id,threshold_pct,channel,last_triggered_at,meters(slug)")
      .eq("project_id", projectId)
      .order("threshold_pct"),
    supabase.from("meters").select("id,slug").eq("project_id", projectId).order("slug"),
  ]);
  const alertList = (alerts as Alert[] | null) ?? [];
  const meterList = (meters as Pick<Meter, "id" | "slug">[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Alerts"
        sub="Get emailed when a user's spend crosses a threshold — per meter, or project-wide."
        action={<CreateAlertButton projectId={projectId} meters={meterList} />}
      />

      <Card className="mb-6 border-sky-500/20 bg-sky-500/[0.04]">
        <h2 className="font-medium text-zinc-100">How alerting works</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
          <li>Per-meter alerts fire when an end user burns past the threshold % of their monthly quota.</li>
          <li>Project-wide alerts (no meter selected) watch total burn across all meters.</li>
          <li>Alerts are delivered by email to your account address, the moment a threshold is crossed.</li>
        </ul>
      </Card>

      {alertList.length === 0 ? (
        <EmptyState
          title="No alerts configured"
          sub="Create your first alert — e.g. 80% on all meters — and you'll hear about spend spikes before the invoice does."
          action={<CreateAlertButton projectId={projectId} meters={meterList} />}
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Scope</Th>
              <Th>Threshold</Th>
              <Th>Channel</Th>
              <Th>Last triggered</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {alertList.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-900/60">
                <Td>
                  {a.meter_id ? (
                    <code className="font-mono text-xs text-emerald-300">{a.meters?.slug ?? "—"}</code>
                  ) : (
                    <span className="text-zinc-300">All meters (project-wide)</span>
                  )}
                </Td>
                <Td className="tabular-nums">{a.threshold_pct}%</Td>
                <Td className="capitalize text-zinc-400">{a.channel}</Td>
                <Td className="text-zinc-500">{a.last_triggered_at ? formatDateTime(a.last_triggered_at) : "Never"}</Td>
                <Td className="text-right">
                  <DeleteAlertButton projectId={projectId} alertId={a.id} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </>
  );
}

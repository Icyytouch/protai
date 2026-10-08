import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td } from "@/components/ui";
import { CreateMeterButton, MeterButtons, OverageBadge } from "./meter-forms";
import type { Meter } from "@/app/dashboard/_types";

export default async function MetersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("meters")
    .select("id,project_id,slug,unit_label,monthly_quota,overage,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  const meters = (data as Meter[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Meters"
        sub="A meter is anything you bill usage for — tokens, generations, minutes. Reference it by slug in API calls."
        action={<CreateMeterButton projectId={projectId} />}
      />
      {meters.length === 0 ? (
        <EmptyState
          title="No meters yet"
          sub="Create your first meter — e.g. slug “tokens”, unit “Tokens”, quota 100. Then call protai.check(userId, “tokens”)."
          action={<CreateMeterButton projectId={projectId} />}
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Slug</Th>
              <Th>Unit</Th>
              <Th>Monthly quota</Th>
              <Th>On overage</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {meters.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-900/60">
                <Td><code className="font-mono text-sm text-emerald-300">{m.slug}</code></Td>
                <Td>{m.unit_label}</Td>
                <Td className="tabular-nums">{Number(m.monthly_quota).toLocaleString("en-US")}</Td>
                <Td><OverageBadge overage={m.overage} /></Td>
                <Td className="text-right">
                  <MeterButtons projectId={projectId} meter={m} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </>
  );
}

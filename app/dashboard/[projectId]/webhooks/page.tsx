import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td, Card, Badge } from "@/components/ui";
import { CreateWebhookButton, WebhookActions } from "./webhook-buttons";
import { WEBHOOK_EVENTS } from "@/lib/webhook-events";
import { formatDateTime } from "@/app/dashboard/_types";

type Webhook = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
};

export default async function WebhooksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("webhook_endpoints")
    .select("id,url,events,active,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  const webhooks = (data as Webhook[] | null) ?? [];

  const eventLabel = (id: string) => WEBHOOK_EVENTS.find((e) => e.id === id)?.label ?? id;

  return (
    <>
      <PageHeader
        title="Webhooks"
        sub="Push quota events to your own backend the moment they happen — no polling."
        action={<CreateWebhookButton projectId={projectId} />}
      />

      <Card className="mb-6 border-sky-500/20 bg-sky-500/[0.04]">
        <h2 className="font-medium text-zinc-100">How webhooks work</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
          <li>Each event is a signed <code className="font-mono text-xs text-emerald-300">POST</code> to your URL, with an <code className="font-mono text-xs text-emerald-300">X-ProtAI-Signature</code> header (<code className="font-mono text-xs">sha256=HMAC(secret, body)</code>).</li>
          <li>Delivery is fire-and-forget with a 5s timeout — it never slows down your metering calls.</li>
          <li>Use the <span className="text-zinc-200">Send test</span> button to verify your endpoint before going live.</li>
        </ul>
      </Card>

      {webhooks.length === 0 ? (
        <EmptyState
          title="No webhooks yet"
          sub="Add an endpoint and ProtAI will push usage.threshold, quota.exhausted, and kill_switch.toggled events to it."
          action={<CreateWebhookButton projectId={projectId} />}
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Endpoint</Th>
              <Th>Events</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map((w) => (
              <tr key={w.id} className="hover:bg-zinc-900/60">
                <Td><code className="break-all font-mono text-xs text-zinc-300">{w.url}</code></Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {w.events.map((e) => (
                      <Badge key={e} tone="green">{eventLabel(e)}</Badge>
                    ))}
                  </div>
                </Td>
                <Td>{w.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Paused</Badge>}</Td>
                <Td className="text-zinc-500">{formatDateTime(w.created_at)}</Td>
                <Td className="text-right">
                  <WebhookActions projectId={projectId} webhookId={w.id} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </>
  );
}

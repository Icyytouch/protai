import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td, Card } from "@/components/ui";
import { CreatePackButton, PackButtons, PackLinkCell } from "./pack-forms";
import { formatMoney, type CreditPack } from "@/app/dashboard/_types";

export default async function PacksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("credit_packs")
    .select("id,project_id,name,units,price_cents,currency,stripe_payment_link,active")
    .eq("project_id", projectId)
    .order("price_cents");
  const packs = (data as CreditPack[] | null) ?? [];

  return (
    <>
      <PageHeader
        title="Credit Packs"
        sub="Sell top-ups to your users. Share the payment link; completed purchases credit their balance automatically."
        action={<CreatePackButton projectId={projectId} />}
      />

      <Card className="mb-6 border-sky-500/20 bg-sky-500/[0.04]">
        <h2 className="font-medium text-zinc-100">How it works</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
          <li>Create a pack here (name, units granted, price in USD).</li>
          <li>
            From <em>your</em> server, call the pack checkout endpoint with your ProtAI API key
            whenever a user wants to buy — it returns a Stripe Checkout URL:
          </li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-300">
{`curl -X POST https://protai.co.uk/api/v1/packs/checkout \\
  -H "Authorization: Bearer ptk_…" \\
  -H "Content-Type: application/json" \\
  -d '{"pack_id": "PASTE_PACK_ID", "meter_slug": "generations",
       "end_user_id": "user_123"}'
// → { "url": "https://checkout.stripe.com/…" } — redirect the buyer there`}
        </pre>
        <p className="mt-2 text-sm text-zinc-400">
          When the buyer completes checkout, the webhook grants the units to their balance
          automatically (ledger kind “purchase”).
        </p>
      </Card>

      {packs.length === 0 ? (
        <EmptyState
          title="No credit packs yet"
          sub="Create your first pack — e.g. 1,000 generations for $9 — and start letting heavy users fund themselves."
          action={<CreatePackButton projectId={projectId} />}
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th className="text-right">Units</Th>
              <Th className="text-right">Price</Th>
              <Th>Integration</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {packs.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-900/60">
                <Td className="font-medium text-zinc-100">{p.name}</Td>
                <Td className="text-right tabular-nums">{Number(p.units).toLocaleString("en-US")}</Td>
                <Td className="text-right tabular-nums">{formatMoney(p.price_cents, p.currency)}</Td>
                <Td><PackLinkCell pack={p} /></Td>
                <Td className="text-right">
                  <PackButtons projectId={projectId} pack={p} />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </>
  );
}

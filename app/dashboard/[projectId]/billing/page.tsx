import { getUser } from "@/components/supabase/server";
import { PageHeader, Card, Badge } from "@/components/ui";
import { CheckoutButton, PortalButton } from "./billing-buttons";
import type { Subscription } from "@/app/dashboard/_types";

const tierInfo = {
  free: { name: "Free", price: "$0", blurb: "1 project · 3 meters · 100 end users" },
  starter: { name: "Starter", price: "$19/mo", blurb: "3 projects · unlimited meters · 10,000 end users · auto kill-switch" },
  pro: { name: "Pro", price: "$39/mo", blurb: "Unlimited projects & meters · 100,000 end users · priority support" },
} as const;

export default async function BillingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { supabase } = await getUser();

  const { data } = await supabase
    .from("subscriptions")
    .select("project_id,tier,status,current_period_end")
    .eq("project_id", projectId)
    .maybeSingle();
  const sub = (data as Subscription | null) ?? { project_id: projectId, tier: "free", status: "active", current_period_end: null };
  const info = tierInfo[sub.tier];

  return (
    <>
      <PageHeader title="Billing" sub="Your ProtAI subscription for this project. Prices in USD." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-100">Current plan</h2>
            <Badge tone={sub.tier === "free" ? "neutral" : "green"}>{info.name}</Badge>
          </div>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50">
            {info.price}
          </p>
          <p className="mt-2 text-sm text-zinc-400">{info.blurb}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Status: <span className="capitalize">{sub.status}</span>
            {sub.current_period_end &&
              ` · renews ${new Date(sub.current_period_end).toLocaleDateString("en-US")}`}
          </p>
          {sub.tier !== "free" && (
            <div className="mt-6">
              <PortalButton projectId={projectId} />
              <p className="mt-2 text-xs text-zinc-600">Update payment method, change plan, or cancel.</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-medium text-zinc-100">Upgrade</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Unlock more projects, end users, and automatic guardrails.
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Starter — $19/mo</p>
                <p className="text-xs text-zinc-500">For side projects finding traction.</p>
              </div>
              {sub.tier === "starter" ? (
                <Badge tone="green">Current</Badge>
              ) : (
                <CheckoutButton projectId={projectId} tier="starter" label="Upgrade" />
              )}
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
              <div>
                <p className="text-sm font-medium text-zinc-100">Pro — $39/mo</p>
                <p className="text-xs text-zinc-500">For production apps with real spend.</p>
              </div>
              {sub.tier === "pro" ? (
                <Badge tone="green">Current</Badge>
              ) : (
                <CheckoutButton projectId={projectId} tier="pro" label="Upgrade" primary />
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

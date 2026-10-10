import { getUser } from "@/components/supabase/server";
import { Card } from "@/components/ui";
import { SpendRiver } from "./SpendRiver";

/** Live spend river: per-user burn over the last 24h as flowing streams. */
export async function SpendRiverCard({ projectId }: { projectId: string }) {
  const { supabase } = await getUser();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data } = await supabase
    .from("ledger")
    .select("end_user_id, units")
    .eq("project_id", projectId)
    .eq("kind", "report")
    .gte("created_at", since)
    .limit(5000);

  const totals = new Map<string, number>();
  for (const r of (data as Array<{ end_user_id: string; units: number }>) ?? []) {
    totals.set(r.end_user_id, (totals.get(r.end_user_id) ?? 0) + Number(r.units));
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const hues = [160, 190, 140, 210, 175, 120]; // emerald → teal → cyan range
  const streams = top.map(([userId, units], i) => ({ userId, units, hue: hues[i % hues.length] }));
  const total = top.reduce((s, [, u]) => s + u, 0);

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-zinc-100">Live spend river</h3>
        <p className="font-mono text-xs text-zinc-500">{total.toLocaleString()} units · last 24h</p>
      </div>
      {streams.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-600">
          No usage in the last 24 hours. When your users burn, their streams appear here.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/60">
          <SpendRiver streams={streams} height={Math.max(160, streams.length * 52)} />
        </div>
      )}
      <p className="mt-2 text-[11px] text-zinc-600">Streams flow faster and glow brighter the more each user burns.</p>
    </Card>
  );
}

import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td, Badge, inputClass } from "@/components/ui";
import { formatDateTime, type LedgerRow, type LedgerKind, type Meter } from "@/app/dashboard/_types";

const PAGE_SIZE = 25;
const kinds: LedgerKind[] = ["check", "report", "adjust", "grant", "purchase"];

function kindTone(kind: string): "blue" | "neutral" | "amber" | "green" {
  if (kind === "check") return "blue";
  if (kind === "report") return "neutral";
  if (kind === "adjust") return "amber";
  return "green";
}

export default async function LedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ meter?: string; kind?: string; from?: string; to?: string; page?: string }>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;
  const { supabase } = await getUser();
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { data: meters } = await supabase
    .from("meters")
    .select("id,slug")
    .eq("project_id", projectId)
    .order("slug");
  const meterList = (meters as Pick<Meter, "id" | "slug">[] | null) ?? [];

  let query = supabase
    .from("ledger")
    .select("id,end_user_id,units,kind,balance_after,created_at,meters(slug)", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (sp.meter) query = query.eq("meter_id", sp.meter);
  if (sp.kind && kinds.includes(sp.kind as LedgerKind)) query = query.eq("kind", sp.kind);
  if (sp.from) query = query.gte("created_at", new Date(sp.from).toISOString());
  if (sp.to) {
    const end = new Date(sp.to);
    end.setDate(end.getDate() + 1);
    query = query.lt("created_at", end.toISOString());
  }

  const { data, count } = await query.range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);
  const rows = (data as LedgerRow[] | null) ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const base = { meter: sp.meter ?? "", kind: sp.kind ?? "", from: sp.from ?? "", to: sp.to ?? "" };
    const merged = { ...base, ...over };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <>
      <PageHeader
        title="Ledger"
        sub="Append-only history of every check, report, adjustment, grant, and purchase."
      />

      <form method="get" className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select name="meter" defaultValue={sp.meter ?? ""} className={inputClass}>
          <option value="">All meters</option>
          {meterList.map((m) => (
            <option key={m.id} value={m.id}>{m.slug}</option>
          ))}
        </select>
        <select name="kind" defaultValue={sp.kind ?? ""} className={inputClass}>
          <option value="">All kinds</option>
          {kinds.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} className={inputClass} />
        <input type="date" name="to" defaultValue={sp.to ?? ""} className={inputClass} />
        <button type="submit" className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 transition hover:border-zinc-500">
          Filter
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No ledger entries" sub="Adjust the filters or make your first API call." />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Kind</Th>
                <Th>End user</Th>
                <Th>Meter</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Balance after</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/60">
                  <Td className="whitespace-nowrap text-zinc-400">{formatDateTime(r.created_at)}</Td>
                  <Td><Badge tone={kindTone(r.kind)}>{r.kind}</Badge></Td>
                  <Td><code className="font-mono text-xs">{r.end_user_id}</code></Td>
                  <Td><code className="font-mono text-xs text-emerald-300">{r.meters?.slug ?? "—"}</code></Td>
                  <Td className="text-right tabular-nums">{Number(r.units).toLocaleString("en-US")}</Td>
                  <Td className="text-right tabular-nums text-zinc-400">
                    {r.balance_after === null ? "—" : Number(r.balance_after).toLocaleString("en-US")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
            <span>Page {pageNum} of {totalPages} · {(count ?? 0).toLocaleString("en-US")} entries</span>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <a href={qs({ page: String(pageNum - 1) })} className="rounded-xl border border-zinc-700 px-3.5 py-2 hover:border-zinc-500">← Prev</a>
              )}
              {pageNum < totalPages && (
                <a href={qs({ page: String(pageNum + 1) })} className="rounded-xl border border-zinc-700 px-3.5 py-2 hover:border-zinc-500">Next →</a>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

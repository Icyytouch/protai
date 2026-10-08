import { getUser } from "@/components/supabase/server";
import { PageHeader, EmptyState, TableShell, Th, Td, inputClass } from "@/components/ui";
import { AdjustDialog } from "./adjust-dialog";
import { currentPeriod, type Balance, type Meter } from "@/app/dashboard/_types";

const PAGE_SIZE = 50;

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { projectId } = await params;
  const { q = "", page = "1" } = await searchParams;
  const { supabase } = await getUser();
  const period = currentPeriod();
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const { data: meters } = await supabase
    .from("meters")
    .select("id,slug,unit_label")
    .eq("project_id", projectId);
  const meterList = (meters as Pick<Meter, "id" | "slug" | "unit_label">[] | null) ?? [];

  let query = supabase
    .from("balances")
    .select("id,project_id,meter_id,end_user_id,balance,period,updated_at,meters(slug,unit_label)", { count: "exact" })
    .eq("project_id", projectId)
    .eq("period", period)
    .order("updated_at", { ascending: false });

  if (q.trim()) query = query.ilike("end_user_id", `%${q.trim()}%`);

  const { data, count } = await query.range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);
  const rows = (data as Balance[] | null) ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Users"
        sub={`End-user balances for the current billing period (${period}). Balances reset logic is per calendar month.`}
      />

      <form method="get" className="mb-5 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by end user ID…"
          className={inputClass}
        />
        <button type="submit" className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 transition hover:border-zinc-500">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={q ? "No users match your search" : "No users metered yet"}
          sub="Balances appear here once your app reports usage for an end user ID."
        />
      ) : (
        <>
          <TableShell>
            <thead>
              <tr>
                <Th>End user</Th>
                <Th>Meter</Th>
                <Th>Balance</Th>
                <Th>Updated</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-900/60">
                  <Td><code className="font-mono text-xs">{b.end_user_id}</code></Td>
                  <Td><code className="font-mono text-xs text-emerald-300">{b.meters?.slug ?? "—"}</code></Td>
                  <Td className={`tabular-nums font-medium ${Number(b.balance) < 0 ? "text-red-300" : "text-zinc-100"}`}>
                    {Number(b.balance).toLocaleString("en-US")}
                  </Td>
                  <Td className="text-zinc-500">{new Date(b.updated_at).toLocaleDateString("en-US")}</Td>
                  <Td className="text-right">
                    <AdjustDialog
                      projectId={projectId}
                      meterId={b.meter_id}
                      meterSlug={b.meters?.slug ?? ""}
                      endUserId={b.end_user_id}
                      currentBalance={Number(b.balance)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
              <span>Page {pageNum} of {totalPages} · {(count ?? 0).toLocaleString("en-US")} users</span>
              <div className="flex gap-2">
                {pageNum > 1 && (
                  <a href={`?q=${encodeURIComponent(q)}&page=${pageNum - 1}`} className="rounded-xl border border-zinc-700 px-3.5 py-2 hover:border-zinc-500">← Prev</a>
                )}
                {pageNum < totalPages && (
                  <a href={`?q=${encodeURIComponent(q)}&page=${pageNum + 1}`} className="rounded-xl border border-zinc-700 px-3.5 py-2 hover:border-zinc-500">Next →</a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

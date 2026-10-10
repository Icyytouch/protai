import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { getSiteRole, canManageRoles } from "@/lib/roles";
import { listAllUsers } from "../_actions";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AdminUsersPage() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canManageRoles(role)) redirect("/dashboard");

  const users = await listAllUsers();

  return (
    <div className="space-y-6">
      <PageHeader title="Users" sub={`${users.length} registered accounts. Roles are managed under Team.`} />
      <Card className="!p-0 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No users yet" sub="Accounts appear here once they sign up." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-5 py-3 font-medium text-zinc-400">Email</th>
                  <th className="px-5 py-3 font-medium text-zinc-400">Joined</th>
                  <th className="px-5 py-3 font-medium text-zinc-400">Role</th>
                  <th className="px-5 py-3 font-medium text-zinc-400">Projects</th>
                  <th className="px-5 py-3 font-medium text-zinc-400">Tier</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"}>
                    <td className="px-5 py-3 text-zinc-200">{u.email ?? "—"}</td>
                    <td className="px-5 py-3 text-zinc-500">
                      {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          u.role === "admin"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : u.role === "user"
                              ? "bg-zinc-800 text-zinc-400"
                              : "bg-sky-500/15 text-sky-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-400">{u.projects}</td>
                    <td className="px-5 py-3 text-zinc-400">{u.tier ? <span className="capitalize">{u.tier}</span> : <span className="text-zinc-600">free</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

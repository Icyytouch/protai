import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/components/supabase/server";
import { getSiteRole, canManageRoles } from "@/lib/roles";
import { getAdminStats, getRecentSignups } from "./_actions";
import { Card } from "@/components/ui";

const sections = [
  {
    href: "/dashboard/admin/posts",
    title: "Blog posts",
    sub: "Write, edit, publish. RankMath-style SEO built in.",
    icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z",
  },
  {
    href: "/dashboard/admin/team",
    title: "Team",
    sub: "Invite members, assign admin / editor / author roles.",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m22 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  },
  {
    href: "/dashboard/admin/users",
    title: "Users",
    sub: "Every signup, their role, projects, and billing tier.",
    icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  },
  {
    href: "/blog",
    title: "View blog",
    sub: "See the public site exactly as readers see it.",
    icon: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  },
];

export default async function AdminOverviewPage() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  const role = await getSiteRole(user.id);
  if (!canManageRoles(role)) redirect("/dashboard");

  const [stats, signups] = await Promise.all([getAdminStats(), getRecentSignups()]);

  const statCards = [
    { label: "Registered users", value: stats.users },
    { label: "Projects", value: stats.projects },
    { label: "Posts published", value: stats.postsPublished },
    { label: "Drafts waiting", value: stats.postsDraft },
    { label: "Team members", value: stats.team },
  ];

  return (
    <div className="space-y-8">
      {/* stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="!p-5">
            <p className="font-mono text-3xl font-semibold tabular-nums text-zinc-50">{s.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* manage sections */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Manage</h2>
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="lift-card flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-zinc-700"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d={s.icon} />
                </svg>
              </span>
              <span>
                <span className="block font-medium text-zinc-100">{s.title}</span>
                <span className="mt-0.5 block text-sm text-zinc-500">{s.sub}</span>
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto shrink-0 text-zinc-600">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* recent signups */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Recent signups</h2>
          <Card className="mt-3 !p-2">
            {signups.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">No signups yet.</p>
            ) : (
              <ul className="divide-y divide-zinc-800/60">
                {signups.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                      {(s.email?.[0] ?? "?").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-zinc-200">{s.email ?? "—"}</span>
                      <span className="block text-xs text-zinc-600">
                        {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        s.role === "admin"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : s.role === "user"
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-sky-500/15 text-sky-300"
                      }`}
                    >
                      {s.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Link href="/dashboard/admin/users" className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300">
            View all users →
          </Link>
        </div>
      </div>
    </div>
  );
}

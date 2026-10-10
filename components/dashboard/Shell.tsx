"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/dashboard/_actions";

const nav = [
  { key: "", label: "Overview", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" },
  { key: "keys", label: "API Keys", icon: "M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-8 8v5m4-5v3m4-3v2" },
  { key: "meters", label: "Meters", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { key: "users", label: "Users", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m22 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
  { key: "ledger", label: "Ledger", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { key: "alerts", label: "Alerts", icon: "M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V5a2 2 0 1 0-4 0v.3A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" },
  { key: "packs", label: "Credit Packs", icon: "M20 7H4a2 2 0 0 1 0-4h14v4m0 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5m18 2a2 2 0 0 1 2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 1-2 2" },
  { key: "billing", label: "Billing", icon: "M3 10h18M7 15h2m4 0h2M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" },
];

const staffNav = [
  { href: "/dashboard/admin/posts", label: "Blog posts", icon: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" },
  { href: "/dashboard/admin/team", label: "Team", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m22 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
];

function NavItem({ href, icon, label, active, onClick }: {
  href: string; icon: string; label: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
        active
          ? "bg-emerald-500/10 text-emerald-200"
          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
      }`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
        <path d={icon} />
      </svg>
      {label}
    </Link>
  );
}

export function Shell({
  projects,
  userEmail,
  isStaff,
  children,
}: {
  projects: { id: string; name: string }[];
  userEmail: string;
  isStaff?: boolean;
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const projectId = typeof params.projectId === "string" ? params.projectId : null;
  const base = projectId ? `/dashboard/${projectId}` : "/dashboard";
  const activeProject = projects.find((p) => p.id === projectId);

  // Breadcrumb from the path segments after /dashboard/[projectId]
  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .slice(2)
    .map((s) => s.replace(/-/g, " "));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-zinc-800/80 px-5">
        <Logo href="/dashboard" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {projects.length > 0 && (
          <div className="mb-4 px-1">
            <label className="mb-1.5 block px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Project
            </label>
            <div className="relative">
              <select
                value={projectId ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  router.push(id ? `/dashboard/${id}` : "/dashboard");
                }}
                className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-3 pr-8 text-sm text-zinc-100 outline-none transition focus:border-emerald-500/60"
              >
                {!projectId && <option value="">All projects</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        )}

        {!projectId && (
          <NavItem
            href="/dashboard"
            icon="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"
            label="Projects"
            active={pathname === "/dashboard"}
            onClick={() => setOpen(false)}
          />
        )}

        {projectId && (
          <>
            <p className="mb-1.5 mt-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Metering
            </p>
            {nav.map((item) => {
              const href = item.key ? `${base}/${item.key}` : base;
              const active = item.key
                ? pathname === href || pathname.startsWith(href + "/")
                : pathname === base;
              return (
                <NavItem key={item.key || "overview"} href={href} icon={item.icon} label={item.label} active={active} onClick={() => setOpen(false)} />
              );
            })}
          </>
        )}

        {isStaff && (
          <>
            <p className="mb-1.5 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Site admin
            </p>
            {staffNav.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href || pathname.startsWith(item.href + "/")}
                onClick={() => setOpen(false)}
              />
            ))}
          </>
        )}
      </div>

      <div className="border-t border-zinc-800/80 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
            {(userEmail[0] ?? "?").toUpperCase()}
          </span>
          <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">{userEmail}</p>
        </div>
        <div className="mt-1 flex gap-2">
          <Link href="/docs" className="flex-1 rounded-lg border border-zinc-800 px-3 py-1.5 text-center text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200">
            Docs
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex-1 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800/80 bg-zinc-950 lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-zinc-800 bg-zinc-950">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <div className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="rounded-lg border border-zinc-800 p-2 text-zinc-400 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-sm">
              <Link href="/dashboard" className="shrink-0 text-zinc-500 transition hover:text-zinc-200">
                {activeProject ? activeProject.name : "Projects"}
              </Link>
              {crumbs.map((c, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1.5">
                  <span className="text-zinc-700">/</span>
                  <span className={`truncate capitalize ${i === crumbs.length - 1 ? "text-zinc-200" : "text-zinc-500"}`}>
                    {c}
                  </span>
                </span>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/blog"
                target="_blank"
                className="hidden rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 sm:inline-block"
              >
                View site
              </Link>
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

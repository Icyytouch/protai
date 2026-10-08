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

export function Shell({
  projects,
  userEmail,
  children,
}: {
  projects: { id: string; name: string }[];
  userEmail: string;
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const projectId = typeof params.projectId === "string" ? params.projectId : null;
  const base = projectId ? `/dashboard/${projectId}` : "/dashboard";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-zinc-800 px-5">
        <Logo href="/dashboard" />
      </div>

      {projectId && projects.length > 0 && (
        <div className="border-b border-zinc-800 px-4 py-3">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Project
          </label>
          <select
            value={projectId}
            onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!projectId && (
          <Link
            href="/dashboard"
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              pathname === "/dashboard"
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
            </svg>
            Projects
          </Link>
        )}
        {projectId &&
          nav.map((item) => {
            const href = item.key ? `${base}/${item.key}` : base;
            const active = item.key
              ? pathname === href || pathname.startsWith(href + "/")
              : pathname === base;
            return (
              <Link
                key={item.key || "overview"}
                href={href}
                onClick={() => setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-zinc-800 text-zinc-50"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-4">
        <p className="truncate text-xs text-zinc-500">{userEmail}</p>
        <div className="mt-2 flex gap-2">
          <Link href="/docs" className="flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-center text-xs text-zinc-300 transition hover:border-zinc-500">
            Docs
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block">
        <div className="sticky top-0 h-screen">{sidebar}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-zinc-800 bg-zinc-950">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center border-b border-zinc-800 px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-xl border border-zinc-700 p-2 text-zinc-300"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-3">
            <Logo href="/dashboard" />
          </div>
        </div>
        <main className="flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

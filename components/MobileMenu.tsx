"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/login", label: "Log in" },
];

/** Hamburger menu for the marketing header on small screens. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="rounded-lg border border-zinc-800 p-2 text-zinc-300 transition hover:border-zinc-600"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-zinc-800/60 px-5 py-3.5 text-sm text-zinc-200 transition last:border-0 hover:bg-zinc-900 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <div className="p-4">
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Start free
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

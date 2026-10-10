"use client";

import { useEffect, useState } from "react";

const LINKS = [
  { href: "#playground", label: "Playground" },
  { href: "#install", label: "Install" },
  { href: "#api-key", label: "API key" },
  { href: "#meter", label: "Define a meter" },
  { href: "#wrap", label: "Wrap your call" },
  { href: "#guardrails", label: "Guardrails" },
  { href: "#reference", label: "API reference" },
  { href: "#overage", label: "Overage" },
  { href: "#packs", label: "Credit packs" },
  { href: "#webhooks", label: "Webhooks" },
  { href: "#frameworks", label: "Frameworks" },
  { href: "#http", label: "Plain HTTP" },
];

/** Sticky table-of-contents for the docs page with scroll-spy. */
export function DocsToc() {
  const [active, setActive] = useState("");

  useEffect(() => {
    function onScroll() {
      let current = "";
      for (const l of LINKS) {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top < 120) current = l.href;
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-24 space-y-1">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          On this page
        </p>
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`block rounded-lg px-3 py-1.5 text-sm transition ${
              active === l.href
                ? "bg-emerald-500/10 text-emerald-300"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            }`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { LiveDashboard } from "@/components/LiveDashboard";

const PHASES = [
  {
    n: "01",
    title: "Define what you meter",
    body: "Tokens, generations, minutes, API calls — any unit your AI app bills for. One dashboard, one slug per meter.",
    visual: "meters",
  },
  {
    n: "02",
    title: "Set the guardrails",
    body: "Per-user monthly quotas, 80% alert thresholds, and a kill-switch that denies every check in one click.",
    visual: "guardrails",
  },
  {
    n: "03",
    title: "Watch it breathe",
    body: "Every check and report streams into your ledger in real time. The copilot flags integration bugs; insights warn you before quotas run dry.",
    visual: "live",
  },
];

/**
 * CinematicSection — pinned scroll experience. The left copy steps through
 * phases as you scroll; the right visual crossfades between product moments.
 */
export function CinematicSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      setActive(Math.min(PHASES.length - 1, Math.floor(progress * PHASES.length)));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative" style={{ height: "320vh" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
          {/* stepping copy */}
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">How it works</p>
            <div className="relative mt-6 h-64">
              {PHASES.map((p, i) => (
                <div
                  key={p.n}
                  className={`absolute inset-0 transition-all duration-500 ${
                    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                  }`}
                >
                  <p className="font-mono text-sm text-emerald-400">{p.n}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">{p.title}</h3>
                  <p className="mt-4 max-w-md leading-relaxed text-zinc-400">{p.body}</p>
                </div>
              ))}
            </div>
            {/* progress */}
            <div className="mt-4 flex gap-2">
              {PHASES.map((p, i) => (
                <div key={p.n} className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full bg-emerald-400 transition-all duration-500 ${i <= active ? "w-full" : "w-0"}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* crossfading visual */}
          <div className="relative hidden h-[420px] lg:block">
            {/* meters visual */}
            <div className={`absolute inset-0 transition-all duration-700 ${active === 0 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
              <div className="border-beam h-full rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8">
                <p className="font-mono text-xs text-zinc-500">meters</p>
                <div className="mt-6 space-y-4">
                  {[
                    { slug: "tokens", unit: "Tokens", quota: "10,000 / mo" },
                    { slug: "generations", unit: "Images", quota: "500 / mo" },
                    { slug: "minutes", unit: "Audio min", quota: "120 / mo" },
                  ].map((m, i) => (
                    <div
                      key={m.slug}
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all duration-500"
                      style={{ transform: `translateX(${active === 0 ? 0 : (i + 1) * 24}px)`, opacity: active === 0 ? 1 : 0 }}
                    >
                      <div>
                        <code className="font-mono text-sm text-emerald-300">{m.slug}</code>
                        <p className="mt-0.5 text-xs text-zinc-500">{m.unit}</p>
                      </div>
                      <p className="font-mono text-xs text-zinc-400">{m.quota}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* guardrails visual */}
            <div className={`absolute inset-0 transition-all duration-700 ${active === 1 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
              <div className="border-beam flex h-full flex-col justify-center rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8">
                <p className="font-mono text-xs text-zinc-500">guardrails</p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-amber-200">Alert at 80% of quota</p>
                      <span className="live-ping relative inline-block h-2 w-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full w-4/5 rounded-full bg-amber-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-5">
                    <div>
                      <p className="text-sm font-medium text-red-200">Kill-switch</p>
                      <p className="mt-0.5 text-xs text-zinc-500">Deny every check instantly</p>
                    </div>
                    <div className="flex h-8 w-14 items-center rounded-full bg-zinc-800 p-1">
                      <div className="h-6 w-6 rounded-full bg-zinc-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* live visual */}
            <div className={`absolute inset-0 transition-all duration-700 ${active === 2 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
              <div className="border-beam h-full overflow-hidden rounded-3xl border border-zinc-800">
                <LiveDashboard />
              </div>
            </div>
          </div>

          {/* mobile: stacked visuals */}
          <div className="lg:hidden">
            <div className="border-beam overflow-hidden rounded-3xl border border-zinc-800">
              <LiveDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type Bar = { user: string; meter: string; pct: number; hot: boolean };
type Alert = { id: number; text: string; time: string };

const USERS = ["user_8f2a", "user_1c9d", "user_77b1", "user_3e55", "user_9d01", "user_42ab"];
const METERS = ["tokens", "generations", "minutes"];

function randUser() {
  return USERS[Math.floor(Math.random() * USERS.length)];
}

/** A living, breathing dashboard: ticking counters, shifting usage bars,
 *  incoming spend alerts, and a working kill-switch demo. */
export function LiveDashboard() {
  const [checks, setChecks] = useState(48201);
  const [tokens, setTokens] = useState(1.9);
  const [over, setOver] = useState(7);
  const [bars, setBars] = useState<Bar[]>([
    { user: "user_8f2a", meter: "tokens", pct: 92, hot: true },
    { user: "user_1c9d", meter: "tokens", pct: 84, hot: true },
    { user: "user_77b1", meter: "generations", pct: 61, hot: false },
    { user: "user_3e55", meter: "tokens", pct: 44, hot: false },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, text: "user_8f2a crossed 80% of token quota — email sent", time: "now" },
  ]);
  const [frozen, setFrozen] = useState(false);
  const idRef = useRef(2);

  // Tick counters + drift bars every 2s (paused when frozen).
  useEffect(() => {
    if (frozen) return;
    const id = setInterval(() => {
      setChecks((c) => c + Math.floor(Math.random() * 40) + 8);
      setTokens((t) => Math.round((t + Math.random() * 0.02) * 100) / 100);
      setBars((prev) =>
        prev.map((b) => {
          const next = Math.min(99, Math.max(5, b.pct + Math.floor(Math.random() * 11) - 4));
          return { ...b, pct: next, hot: next >= 80 };
        })
      );
    }, 2000);
    return () => clearInterval(id);
  }, [frozen]);

  // New spend alert every ~7s.
  useEffect(() => {
    if (frozen) return;
    const id = setInterval(() => {
      const u = randUser();
      const m = METERS[Math.floor(Math.random() * METERS.length)];
      const alert: Alert = {
        id: idRef.current++,
        text: `${u} crossed 80% of ${m} quota — email sent`,
        time: "now",
      };
      setAlerts((prev) => [alert, ...prev].slice(0, 3));
      setOver((o) => o + 1);
    }, 7000);
    return () => clearInterval(id);
  }, [frozen]);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
      {/* window bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 font-mono text-xs text-zinc-500">app.protai.co.uk/dashboard</span>
        <button
          onClick={() => setFrozen((f) => !f)}
          className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold transition ${
            frozen
              ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
              : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          }`}
        >
          {frozen ? "❄ Frozen — click to resume" : "Kill-switch"}
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800/60">
        {[
          { label: "Checks today", value: checks.toLocaleString("en-US") },
          { label: "Tokens reported", value: `${tokens.toFixed(1)}M` },
          { label: "Users over 80%", value: String(over) },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{s.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-50">{s.value}</p>
          </div>
        ))}
      </div>

      {/* usage bars */}
      <div className="space-y-2 px-4 pt-4">
        {bars.map((r) => (
          <div key={r.user} className="flex items-center gap-3 rounded-xl bg-zinc-900/60 px-4 py-2.5">
            <span className="font-mono text-xs text-zinc-400">{r.user}</span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400">{r.meter}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${r.hot ? "bg-amber-400" : "bg-emerald-500"}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className={`w-10 text-right font-mono text-xs tabular-nums ${r.hot ? "text-amber-300" : "text-zinc-400"}`}>
              {r.pct}%
            </span>
          </div>
        ))}
      </div>

      {/* live alert feed */}
      <div className="space-y-1.5 px-4 py-4">
        <p className="px-1 text-[11px] font-medium uppercase tracking-widest text-zinc-600">Spend alerts</p>
        {alerts.map((a) => (
          <div
            key={a.id}
            className="alert-slide-in flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2"
          >
            <span className="live-ping relative inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 text-amber-400" />
            <p className="text-xs text-zinc-300">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

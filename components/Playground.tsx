"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";

type Result = Record<string, unknown> | null;

/** Interactive API playground: try check()/report() live with no signup. */
export function Playground() {
  const [userId, setUserId] = useState("demo_user");
  const [units, setUnits] = useState(100);
  const [loading, setLoading] = useState<"check" | "report" | null>(null);
  const [response, setResponse] = useState<Result>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(action: "check" | "report") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/demo/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, end_user_id: userId.trim() || "demo_user", units }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Playground error");
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResponse(null);
    } finally {
      setLoading(null);
    }
  }

  const requestPreview = {
    end_user_id: userId.trim() || "demo_user",
    meter: "tokens",
    units,
  };

  return (
    <Reveal>
      <div className="border-beam overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 px-5 py-3.5">
          <span className="live-ping relative inline-block h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" />
          <p className="text-sm font-medium text-zinc-200">Live playground</p>
          <p className="ml-auto hidden font-mono text-xs text-zinc-600 sm:block">no signup · real API</p>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
          {/* controls */}
          <div className="space-y-4 border-b border-zinc-800/60 p-5 md:border-b-0 md:border-r">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-500">
                End user ID
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="demo_user"
                maxLength={64}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 font-mono text-sm text-zinc-100 outline-none transition focus:border-emerald-500/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-zinc-500">
                Units: <span className="font-mono text-emerald-300">{units.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={1}
                max={1500}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="mt-1 text-xs text-zinc-600">Demo quota is 1,000 tokens. Push past it to see the block.</p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => call("check")}
                disabled={loading !== null}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading === "check" ? "Checking…" : "check()"}
              </button>
              <button
                onClick={() => call("report")}
                disabled={loading !== null}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 disabled:opacity-50"
              >
                {loading === "report" ? "Reporting…" : "report()"}
              </button>
            </div>
          </div>

          {/* request / response */}
          <div className="space-y-3 p-5">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-zinc-600">Request</p>
              <pre className="overflow-x-auto rounded-xl bg-zinc-900/70 p-3.5 font-mono text-xs leading-relaxed text-zinc-400">
                {JSON.stringify(requestPreview, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-zinc-600">Response</p>
              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 font-mono text-xs text-red-300">
                  {error}
                </p>
              ) : response ? (
                <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5 font-mono text-xs leading-relaxed text-emerald-200">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 font-mono text-xs text-zinc-600">
                  {"// hit check() or report() to see the live response"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

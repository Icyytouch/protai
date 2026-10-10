"use client";

import { useMemo, useState } from "react";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function CostCalculator() {
  const [users, setUsers] = useState(2000);
  const [tokensPerUser, setTokensPerUser] = useState(50_000);
  const [costPerMillion, setCostPerMillion] = useState(2);

  const { unprotected, abuser, protai } = useMemo(() => {
    const totalTokens = users * tokensPerUser;
    const unprotected = (totalTokens / 1_000_000) * costPerMillion;
    // One abusive power-user weekend: 2% of users burn 40x their share.
    const abuser = ((users * 0.02 * tokensPerUser * 40) / 1_000_000) * costPerMillion;
    const protai = 19;
    return { unprotected, abuser, protai };
  }, [users, tokensPerUser, costPerMillion]);

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60">
      <div className="grid lg:grid-cols-2">
        <div className="space-y-7 p-6 sm:p-9">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">Runaway-cost calculator</p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-50">What does one bad month cost you?</h3>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm text-zinc-400">Monthly active users</label>
              <span className="font-mono text-sm text-zinc-100">{fmt(users)}</span>
            </div>
            <input
              type="range" min={100} max={50000} step={100} value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm text-zinc-400">Avg tokens per user / month</label>
              <span className="font-mono text-sm text-zinc-100">{fmt(tokensPerUser)}</span>
            </div>
            <input
              type="range" min={5000} max={500000} step={5000} value={tokensPerUser}
              onChange={(e) => setTokensPerUser(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm text-zinc-400">Your cost per 1M tokens</label>
              <span className="font-mono text-sm text-zinc-100">${costPerMillion.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0.5} max={30} step={0.5} value={costPerMillion}
              onChange={(e) => setCostPerMillion(Number(e.target.value))}
              className="mt-2 w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 border-t border-zinc-800 bg-zinc-950/60 p-6 sm:p-9 lg:border-l lg:border-t-0">
          <div>
            <p className="text-sm text-zinc-500">Token bill if every user stays in quota</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-zinc-100">${fmt(unprotected)}</p>
          </div>
          <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4">
            <p className="text-sm text-zinc-400">…plus one abusive weekend <span className="text-zinc-500">(2% of users burn 40× their share)</span></p>
            <p className="mt-1 font-mono text-3xl font-semibold text-red-300">+${fmt(abuser)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <p className="text-sm text-zinc-400">ProtAI Starter — capped, metered, kill-switched</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-emerald-300">${protai}<span className="text-base text-zinc-500">/mo flat</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

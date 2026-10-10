"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toggleKillSwitch } from "@/app/dashboard/_actions";

type Result = { answer: string; rows: string[] } | { error: string };

const PAGES: { keys: string[]; label: string; path: string }[] = [
  { keys: ["overview", "dashboard", "home"], label: "Overview", path: "" },
  { keys: ["key", "keys", "api key"], label: "API Keys", path: "/keys" },
  { keys: ["meter"], label: "Meters", path: "/meters" },
  { keys: ["user"], label: "Users", path: "/users" },
  { keys: ["ledger", "activity", "log"], label: "Ledger", path: "/ledger" },
  { keys: ["alert"], label: "Alerts", path: "/alerts" },
  { keys: ["webhook"], label: "Webhooks", path: "/webhooks" },
  { keys: ["pack", "credit"], label: "Credit Packs", path: "/packs" },
  { keys: ["bill", "pricing", "plan", "subscription"], label: "Billing", path: "/billing" },
];

const SUGGESTIONS = [
  "Who's burning fastest?",
  "Balance of user_123",
  "Why did usage spike?",
  "Who runs out soon?",
  "How's today looking?",
  "Turn kill switch on",
];

/** Parse free text into a navigation target or a data intent. */
function parse(input: string): { kind: "nav"; path: string; label: string } | { kind: "intent"; type: string; params: Record<string, string | number> } | { kind: "kill"; enabled: boolean } | null {
  const t = input.toLowerCase().trim();

  // kill switch
  if (/kill.?switch|pause everything|stop everything|shut (it|everything) down/.test(t) && /on|enable|pause|stop|shut/.test(t)) {
    return { kind: "kill", enabled: true };
  }
  if (/kill.?switch/.test(t) && /off|disable|resume|turn off/.test(t)) {
    return { kind: "kill", enabled: false };
  }

  // navigation: "go to meters", "open billing"
  const navMatch = t.match(/^(?:go to|open|show|visit)\s+(.+)$/);
  const navQuery = navMatch ? navMatch[1] : t;
  for (const p of PAGES) {
    if (p.keys.some((k) => navQuery.includes(k))) {
      if (navMatch || /^(meters|keys|alerts|webhooks|billing|users|ledger|overview|packs)/.test(t)) {
        return { kind: "nav", path: p.path, label: p.label };
      }
    }
  }

  // user balance: "balance of user_123"
  const balMatch = t.match(/balance(?: of)?\s+([a-zA-Z0-9_-]+)/) || t.match(/(?:credits|balance).*?\b([a-zA-Z0-9_-]{3,})\b.*(?:have|left)/);
  if (/balance|credit/.test(t) && balMatch) {
    return { kind: "intent", type: "user_balance", params: { userId: balMatch[1] } };
  }

  if (/top|burning fastest|biggest (user|spender)|heaviest/.test(t)) {
    return { kind: "intent", type: "top_burners", params: { limit: 5 } };
  }
  if (/spike|unusual|anomaly|what happened|why/.test(t)) {
    return { kind: "intent", type: "spike", params: {} };
  }
  if (/run(s|ning)? out|exhaust|running low|low balance/.test(t)) {
    return { kind: "intent", type: "quota_forecast", params: {} };
  }
  if (/today|stats|glance|how.*looking|summary/.test(t)) {
    return { kind: "intent", type: "project_stats", params: {} };
  }
  return null;
}

export function CommandBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only inside a project context.
  const projectMatch = pathname.match(/^\/dashboard\/([0-9a-f-]{36})/);
  const projectId = projectMatch?.[1] ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  useEffect(() => setOpen(false), [pathname]);

  const execute = useCallback(async (text: string) => {
    if (!projectId) return;
    const parsed = parse(text);
    if (!parsed) {
      setResult({ error: "I didn't get that. Try one of the suggestions below." });
      return;
    }
    if (parsed.kind === "nav") {
      router.push(`/dashboard/${projectId}${parsed.path}`);
      setOpen(false);
      return;
    }
    if (parsed.kind === "kill") {
      setLoading(true);
      try {
        await toggleKillSwitch(projectId, parsed.enabled);
        setResult({ answer: `Kill-switch turned **${parsed.enabled ? "ON — all checks now denied" : "OFF — operating normally"}**.`, rows: [] });
      } catch {
        setResult({ error: "Couldn't toggle the kill-switch." });
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, intent: { type: parsed.type, ...parsed.params } }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Command failed. Try again." });
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  const run = useCallback(() => {
    if (!query.trim()) return;
    execute(query);
  }, [query, execute]);

  if (!projectId) return null;

  return (
    <>
      {/* trigger hint */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300 md:flex"
      >
        <span>Ask anything…</span>
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm" />
          <div
            className="border-beam relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
              <span className="text-emerald-400">✦</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setResult(null); }}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="Ask anything — “who's burning fastest?”, “go to billing”…"
                className="w-full bg-transparent py-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />}
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {result ? (
                <div className="px-3 py-2">
                  {"error" in result ? (
                    <p className="text-sm text-red-300">{result.error}</p>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-200" dangerouslySetInnerHTML={{ __html: result.answer.replace(/\*\*(.+?)\*\*/g, "<strong class='text-zinc-50'>$1</strong>") }} />
                      {result.rows.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {result.rows.map((r, i) => (
                            <li key={i} className="rounded-lg bg-zinc-800/50 px-3 py-1.5 font-mono text-xs text-zinc-300">{r}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="py-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Try asking</p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); execute(s); }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <span className="text-zinc-600">→</span> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 px-4 py-2.5 text-[11px] text-zinc-600">
              Enter to run · Esc to close · navigates, queries usage, toggles the kill-switch
            </div>
          </div>
        </div>
      )}
    </>
  );
}

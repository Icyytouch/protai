"use client";

import { useEffect, useRef, useState } from "react";

const tabs = [
  {
    id: "js",
    label: "JavaScript",
    code: `import { ProtAI } from "@protai/sdk";

const protai = new ProtAI(process.env.PROTAI_API_KEY!);

// gate the expensive call
const check = await protai.check(userId, "tokens");
if (!check.allowed) return showUpgrade(check); // reason: 'insufficient' | 'killed'

const usage = await openai.chat.completions.create({ /* ... */ });

// report what was actually spent
await protai.report(userId, "tokens", usage.usage.total_tokens);`,
  },
  {
    id: "py",
    label: "Python",
    code: `from protai import ProtAI

protai = ProtAI(api_key=os.environ["PROTAI_API_KEY"])

# gate the expensive call
check = protai.check(user_id, "tokens")
if not check.allowed:
    return show_upgrade(check)  # reason: 'insufficient' | 'killed'

usage = openai.chat.completions.create( ... )

# report what was actually spent
protai.report(user_id, "tokens", usage.usage.total_tokens)`,
  },
  {
    id: "curl",
    label: "cURL",
    code: `# check before spending
curl -X POST https://protai.co.uk/api/v1/check \\
  -H "Authorization: Bearer ptk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id":"user_123","meter":"tokens"}'
# => {"allowed":true,"balance":4820,"quota":10000}

# report after spending
curl -X POST https://protai.co.uk/api/v1/report \\
  -H "Authorization: Bearer ptk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id":"user_123","meter":"tokens","units":1840}'`,
  },
];

/** Code block that types itself when scrolled into view or when switching tabs. */
export function CodeTabs() {
  const [active, setActive] = useState("js");
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tab = tabs.find((t) => t.id === active)!;

  // Start typing when scrolled into view.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Type the active tab's code.
  useEffect(() => {
    if (!started) return;
    setTyped("");
    let i = 0;
    const code = tab.code;
    const id = setInterval(() => {
      i += 3;
      setTyped(code.slice(0, i));
      if (i >= code.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [active, started, tab.code]);

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div className="flex gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`rounded-lg px-3.5 py-1.5 font-mono text-xs transition ${
                active === t.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-xs text-zinc-600 sm:inline">3 lines. Any provider.</span>
      </div>
      <pre className="min-h-[280px] overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-zinc-300">
        <code>
          {typed}
          <span className="typing-caret">▍</span>
        </code>
      </pre>
    </div>
  );
}

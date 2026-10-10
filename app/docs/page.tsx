import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Playground } from "@/components/Playground";

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 font-mono text-[13px] leading-relaxed text-zinc-300">
      <code>{children}</code>
    </pre>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-xl font-semibold tracking-tight text-zinc-50">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-zinc-400">{children}</p>;
}

const methods: { name: string; sig: string; desc: string; rows: [string, string][] }[] = [
  {
    name: "check",
    sig: "POST /api/v1/check",
    desc: "Call before spending tokens on a user. Returns whether the spend is allowed under their balance, quota, and your kill-switch.",
    rows: [
      ["end_user_id", "string — your user's ID (any stable identifier)"],
      ["meter", "string — meter slug, e.g. \"tokens\""],
      ["units", "number, optional — default 1"],
    ],
  },
  {
    name: "report",
    sig: "POST /api/v1/report",
    desc: "Call after the AI call completes, with what was actually spent. Deducts from the user's balance and writes a ledger entry.",
    rows: [
      ["end_user_id", "string"],
      ["meter", "string — meter slug"],
      ["units", "number — actual units consumed"],
    ],
  },
  {
    name: "balance",
    sig: "GET /api/v1/balance?end_user_id=&meter=",
    desc: "Read the current credit state for a user on a meter. Useful for rendering “you have X left” UI.",
    rows: [
      ["end_user_id", "query string"],
      ["meter", "query string — meter slug"],
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2.5">
            <Link href="/dashboard" className="rounded-xl px-3.5 py-2 text-sm text-zinc-300 transition hover:text-white">
              Dashboard
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Documentation</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          5-minute quickstart
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Meter your first user in five minutes. You need a ProtAI account and an API key —
          both free. Or skip the setup and try the live API right now:
        </p>

        <div className="mt-8">
          <Playground />
        </div>

        <H2>1. Install the SDK</H2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-mono text-xs text-zinc-500">JavaScript / TypeScript</p>
            <Code>{"npm install @protai/sdk"}</Code>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-zinc-500">Python</p>
            <Code>{"pip install protai"}</Code>
          </div>
        </div>

        <H2>2. Create an API key</H2>
        <P>
          In the <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">dashboard</Link>,
          create a project, open <strong className="text-zinc-200">API Keys</strong>, and create a key.
          It starts with <code className="font-mono text-xs text-zinc-200">ptk_</code> and is shown once —
          copy it immediately. Send it as <code className="font-mono text-xs text-zinc-200">Authorization: Bearer &lt;key&gt;</code>.
        </P>

        <H2>3. Define a meter</H2>
        <P>
          Open <strong className="text-zinc-200">Meters</strong> and create one — e.g. slug{" "}
          <code className="font-mono text-xs text-emerald-300">tokens</code>, unit “Tokens”, monthly quota 100.
          The slug is what you reference in code.
        </P>

        <H2>4. Wrap your AI call</H2>
        <P>Three lines. Check before you spend, report after:</P>
        <div className="mt-4">
          <Code>{`import { ProtAI } from "@protai/sdk";
const protai = new ProtAI(process.env.PROTAI_API_KEY!);

const check = await protai.check(userId, "tokens");
if (!check.allowed) return showUpgrade(check); // reason: 'insufficient' | 'killed'

const usage = await openai.chat.completions.create({ /* ... */ });
await protai.report(userId, "tokens", usage.usage.total_tokens);`}</Code>
        </div>

        <H2>5. Set your guardrails</H2>
        <P>
          Open <strong className="text-zinc-200">Alerts</strong> and add an 80% threshold — you'll be
          emailed before a user burns through quota. If spend ever runs away, the{" "}
          <strong className="text-zinc-200">kill-switch</strong> on the project overview denies every
          check instantly.
        </P>

        <H2>Method reference</H2>
        <P>Base URL: <code className="font-mono text-xs text-zinc-200">https://protai.co.uk</code> (use <code className="font-mono text-xs text-zinc-200">http://localhost:3000</code> locally). All requests need the <code className="font-mono text-xs text-zinc-200">Authorization: Bearer ptk_…</code> header. Rate limit: 100 requests/minute per key.</P>
        {methods.map((m) => (
          <div key={m.name} className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <code className="font-mono text-base font-semibold text-emerald-300">{m.name}</code>
              <code className="font-mono text-xs text-zinc-500">{m.sig}</code>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{m.desc}</p>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {m.rows.map(([k, v]) => (
                  <tr key={k} className="border-t border-zinc-800/60">
                    <td className="py-2 pr-4 font-mono text-xs text-sky-300">{k}</td>
                    <td className="py-2 text-xs text-zinc-400">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="font-medium text-zinc-100">Response shapes</h3>
          <div className="mt-3">
            <Code>{`// check → 200
{ "allowed": true, "balance": 4820, "quota": 10000 }
// or, when denied:
{ "allowed": false, "balance": -120, "quota": 10000, "reason": "insufficient" }
// or when the kill-switch is on:
{ "allowed": false, "balance": 4820, "quota": 10000, "reason": "killed" }

// report → 200
{ "balance": 2980 }

// balance → 200
{ "balance": 2980, "quota": 10000, "period": "2026-10" }`}</Code>
          </div>
        </div>

        <H2>Overage behaviors</H2>
        <P>Each meter decides what happens when a user exceeds their monthly quota:</P>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-5">
            <h3 className="font-medium text-amber-200">Hard block</h3>
            <p className="mt-2 text-sm text-zinc-400">
              check() returns <code className="font-mono text-xs">allowed: false</code> with reason{" "}
              <code className="font-mono text-xs">insufficient</code>. Show an upgrade prompt. Best for free tiers.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.04] p-5">
            <h3 className="font-medium text-sky-200">Allow + alert</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Usage continues (balance can go negative) and you're emailed immediately. Best for paying
              customers you never want to interrupt mid-task.
            </p>
          </div>
        </div>

        <H2>Selling credit packs</H2>
        <P>
          Define packs in the dashboard (<strong className="text-zinc-200">Credit Packs</strong>), then sell
          them from your own backend — call the pack checkout endpoint with your ProtAI API key and
          redirect the buyer to the returned Stripe URL. Completed purchases credit their balance
          automatically:
        </P>
        <div className="mt-4">
          <Code>{`curl -X POST https://protai.co.uk/api/v1/packs/checkout \\
  -H "Authorization: Bearer ptk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"pack_id":"PASTE_PACK_ID","meter_slug":"tokens",
       "end_user_id":"user_123"}'
// → { "url": "https://checkout.stripe.com/…", "session_id": "cs_…" }`}</Code>
        </div>

        <H2>No SDK? Use plain HTTP</H2>
        <P>Any language can call the API directly:</P>
        <div className="mt-4">
          <Code>{`curl -X POST https://protai.co.uk/api/v1/check \\
  -H "Authorization: Bearer ptk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"end_user_id":"user_123","meter":"tokens","units":1}'`}</Code>
        </div>

        <H2>Framework quickstarts</H2>
        <P>Drop-in patterns for the most common stacks:</P>

        <h3 className="mt-6 font-medium text-zinc-100">Next.js API route</h3>
        <div className="mt-3">
          <Code>{`// app/api/generate/route.ts
import { ProtAI } from "@protai/sdk";
const protai = new ProtAI(process.env.PROTAI_API_KEY!);

export async function POST(req: Request) {
  const { userId, prompt } = await req.json();

  const check = await protai.check(userId, "tokens");
  if (!check.allowed) {
    return Response.json(
      { error: "Out of credits", balance: check.balance },
      { status: check.reason === "killed" ? 503 : 402 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o", messages: [{ role: "user", content: prompt }],
  });
  await protai.report(userId, "tokens", completion.usage!.total_tokens);

  return Response.json({ text: completion.choices[0].message.content });
}`}</Code>
        </div>

        <h3 className="mt-6 font-medium text-zinc-100">Express middleware</h3>
        <div className="mt-3">
          <Code>{`// middleware/protai.js
import { ProtAI } from "@protai/sdk";
const protai = new ProtAI(process.env.PROTAI_API_KEY);

export function meter(meterSlug) {
  return async (req, res, next) => {
    const userId = req.user.id; // from your auth
    const check = await protai.check(userId, meterSlug);
    if (!check.allowed) {
      return res.status(402).json({ error: "Out of credits", balance: check.balance });
    }
    // stash for the route to report actual usage after the AI call
    req.protai = { userId, meterSlug };
    next();
  };
}

// usage:
app.post("/api/generate", meter("tokens"), async (req, res) => {
  const out = await runModel(req.body.prompt);
  await protai.report(req.protai.userId, "tokens", out.tokensUsed);
  res.json(out);
});`}</Code>
        </div>

        <h3 className="mt-6 font-medium text-zinc-100">FastAPI dependency</h3>
        <div className="mt-3">
          <Code>{`# deps.py
from protai import ProtAI
from fastapi import Depends, HTTPException

protai = ProtAI(api_key=os.environ["PROTAI_API_KEY"])

async def metered(user_id: str, meter: str = "tokens"):
    check = await protai.check(user_id, meter)
    if not check.allowed:
        raise HTTPException(
            status_code=402,
            detail={"error": "Out of credits", "balance": check.balance},
        )
    return {"user_id": user_id, "meter": meter}

# usage:
@app.post("/generate")
async def generate(prompt: str, ctx=Depends(lambda: metered(current_user.id))):
    out = await run_model(prompt)
    await protai.report(ctx["user_id"], "tokens", out.tokens_used)
    return out`}</Code>
        </div>

        <H2>Webhooks</H2>
        <P>
          Push quota events to your own backend instead of polling. Add an endpoint in the dashboard
          under <strong className="text-zinc-200">Webhooks</strong> — ProtAI signs every delivery with
          an <code className="font-mono text-xs text-zinc-200">X-ProtAI-Signature</code> header
          (<code className="font-mono text-xs">sha256=HMAC(your_secret, body)</code>):
        </P>
        <div className="mt-4">
          <Code>{`// verify in your endpoint (Node example)
import { createHmac, timingSafeEqual } from "node:crypto";

const sig = req.headers["x-protai-signature"]; // "sha256=…"
const expected = "sha256=" + createHmac("sha256", process.env.PROTAI_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body)).digest("hex");
if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
  return res.status(401).end();
}
// body: { event, project_id, meter_slug, end_user_id, usage_pct, balance_after, occurred_at }
// events: usage.threshold · quota.exhausted · kill_switch.toggled`}</Code>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-6 text-center">
          <p className="font-medium text-zinc-100">Ready to meter your first user?</p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Create a free account
          </Link>
        </div>
      </main>
    </>
  );
}

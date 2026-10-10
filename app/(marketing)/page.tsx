import Link from "next/link";
import { CodeTabs } from "./code-tabs";
import { CostCalculator } from "./cost-calculator";

/* ---------------------------------- data ---------------------------------- */

const providers = ["OpenAI", "Anthropic", "Google", "Mistral", "DeepSeek", "Open weights", "Self-hosted"];

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
    ),
    title: "Per-user credit balances",
    body: "Every end user gets their own balance on any meter you define — tokens, generations, minutes, API calls. Monthly free quotas reset automatically; every unit lands in an immutable ledger.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    ),
    title: "Alerts before the invoice",
    body: "Email the moment a user crosses 80% of quota — or when project-wide spend passes your line. The project kill-switch freezes all usage in one click when things look wrong.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
    title: "Stripe credit packs",
    body: "Sell top-ups without writing billing code. Create a pack, share the link, and completed purchases land on the buyer's balance automatically. Heavy users fund themselves.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
    title: "3-line integration",
    body: "check() before you spend, report() after. JavaScript and Python SDKs, or plain HTTP for anything else. No proxy, no middleware, no changes to your model calls.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18m-6-6 6 6 6-6M5 7h14" />
      </svg>
    ),
    title: "Overage your way",
    body: "Per meter, choose hard block (return allowed: false and show an upgrade prompt) or allow-and-alert (never interrupt a paying customer mid-task, just tell yourself).",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Boring in the best way",
    body: "Atomic balance updates, idempotent webhooks, per-key rate limits. The unglamorous correctness work you'd otherwise spend a sprint on — done.",
  },
];

const steps = [
  {
    n: "01",
    title: "Define a meter",
    body: "Name your unit — tokens, generations, minutes — set a free monthly quota and overage behavior. Sixty seconds in the dashboard.",
  },
  {
    n: "02",
    title: "Wrap your AI call",
    body: "check() before spending, report() after. Three lines with the SDK. Your prompts, models, and pipelines stay untouched.",
  },
  {
    n: "03",
    title: "Set guardrails",
    body: "Arm spend alerts and the project kill-switch. Then stop thinking about your token bill.",
  },
];

const comparison: Array<[string, string, string]> = [
  ["Per-user balances", "2–3 days", "Included"],
  ["Monthly quota resets", "Half a day", "Included"],
  ["Immutable usage ledger", "1 day", "Included"],
  ["Spend alerts", "1 day + email infra", "Included"],
  ["Kill-switch", "Half a day", "Included"],
  ["Stripe top-ups", "3–5 days", "Included"],
  ["Race-condition safety", "Hope", "Atomic updates"],
  ["Ongoing maintenance", "Forever", "$0 extra"],
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    cta: "Start free",
    href: "/signup",
    highlight: false,
    items: ["1 project", "3 meters", "100 end users", "Email spend alerts", "Community support"],
  },
  {
    name: "Starter",
    price: "$19",
    per: "/month",
    cta: "Choose Starter",
    href: "/signup",
    highlight: true,
    items: [
      "3 projects",
      "Unlimited meters",
      "10,000 end users",
      "Email spend alerts",
      "Automatic kill-switch",
      "Stripe credit packs",
    ],
  },
  {
    name: "Pro",
    price: "$39",
    per: "/month",
    cta: "Choose Pro",
    href: "/signup",
    highlight: false,
    items: [
      "Unlimited projects",
      "Unlimited meters",
      "100,000 end users",
      "Everything in Starter",
      "Priority support",
    ],
  },
];

const faqs = [
  {
    q: "Does ProtAI work with my AI provider?",
    a: "Yes — it's provider-agnostic and never touches your model calls. You report how many units a user spent (tokens, generations, minutes, whatever you define) and ProtAI handles balances, quotas, and guardrails. OpenAI, Anthropic, Google, open weights, self-hosted — identical integration.",
  },
  {
    q: "Do I have to rewrite my AI code?",
    a: "No. You wrap it: check() before spending tokens on a user, report() after. Three lines with the JavaScript or Python SDK, or plain HTTP in any other language. Prompts, models, and pipelines stay exactly as they are.",
  },
  {
    q: "What happens when a user runs out of credits?",
    a: "Your call, per meter. Hard block returns allowed: false so you can show an upgrade prompt. Allow-and-alert keeps usage flowing but emails you immediately — for paying customers you don't want to interrupt mid-task.",
  },
  {
    q: "How do paid credit packs work?",
    a: "Create a pack in the dashboard (e.g. 1,000 generations for $9), share the Stripe payment link, and completed purchases top up the buyer's balance automatically via webhook. No billing code on your side.",
  },
  {
    q: "Will ProtAI slow down my API?",
    a: "Check calls are single indexed-row reads — single-digit milliseconds. Report calls are fire-and-forget friendly. Nothing sits in front of your model traffic; there's no proxy to become a bottleneck.",
  },
];

/* ------------------------------ dashboard mock ----------------------------- */

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <span className="ml-3 font-mono text-xs text-zinc-500">app.protai.co.uk/dashboard</span>
        <span className="ml-auto rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">Live</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-zinc-800/60">
        {[
          { label: "Checks today", value: "48,201", sub: "+12% vs yesterday" },
          { label: "Tokens reported", value: "1.9M", sub: "across 3 meters" },
          { label: "Users over 80%", value: "7", sub: "2 alerted by email" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-950 px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{s.label}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-zinc-50">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 px-4 py-4">
        {[
          { user: "user_8f2a", meter: "tokens", pct: 92, hot: true },
          { user: "user_1c9d", meter: "tokens", pct: 84, hot: true },
          { user: "user_77b1", meter: "generations", pct: 61, hot: false },
          { user: "user_3e55", meter: "tokens", pct: 44, hot: false },
        ].map((r) => (
          <div key={r.user} className="flex items-center gap-3 rounded-xl bg-zinc-900/60 px-4 py-2.5">
            <span className="font-mono text-xs text-zinc-400">{r.user}</span>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400">{r.meter}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${r.hot ? "bg-amber-400" : "bg-emerald-500"}`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <span className={`font-mono text-xs ${r.hot ? "text-amber-300" : "text-zinc-400"}`}>{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(720px 340px at 50% -60px, rgba(52,211,153,0.10), transparent 70%), radial-gradient(500px 300px at 85% 20%, rgba(56,189,248,0.05), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 py-1.5 pl-1.5 pr-3.5">
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-zinc-950">New</span>
              <span className="text-xs text-zinc-400">Stripe credit packs are live — sell top-ups in minutes</span>
            </div>
            <h1 className="mt-7 text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-50 sm:text-6xl">
              Give every user a balance.<br />
              <span className="text-zinc-500">Keep your token bill.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              ProtAI is drop-in credit metering for AI apps — per-user balances, spend
              alerts, and a kill-switch, live in three lines of code. No proxy. Any provider.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="w-full rounded-xl bg-emerald-500 px-7 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto"
              >
                Start free
              </Link>
              <Link
                href="/docs"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-7 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
              >
                Read the docs
              </Link>
            </div>
            <p className="mt-4 font-mono text-xs text-zinc-600">
              npm i protai&nbsp;&nbsp;·&nbsp;&nbsp;pip install protai&nbsp;&nbsp;·&nbsp;&nbsp;no credit card
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-4xl">
            <DashboardMock />
            <p className="mt-3 text-center text-xs text-zinc-600">
              The actual dashboard — per-user usage, live. No mockups, no vaporware.
            </p>
          </div>
        </div>
      </section>

      {/* PROVIDERS */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-zinc-600">
            Provider-agnostic — works with whatever you already use
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-9 gap-y-3">
            {providers.map((p) => (
              <span key={p} className="text-sm font-medium text-zinc-500">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">Do the math</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              One abusive weekend costs more than a year of ProtAI
            </h2>
            <p className="mt-4 leading-relaxed text-zinc-400">
              Free tiers attract scripts, shared accounts, and prompt-injection loops.
              Drag the sliders to your numbers — then decide if metering is worth $19.
            </p>
          </div>
          <div className="mt-10">
            <CostCalculator />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div className="lg:sticky lg:top-24">
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">Integration</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                Three lines.<br />Five minutes.<br />No proxy.
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-400">
                Nothing sits in front of your model traffic. You tell ProtAI what a user
                spent; it handles the rest. Your prompts, models, and pipelines never change.
              </p>
              <Link href="/docs" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200">
                Read the integration guide
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
            </div>
            <div>
              <div className="space-y-4">
                {steps.map((s) => (
                  <div key={s.n} className="flex gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                    <span className="font-mono text-sm font-semibold text-emerald-400">{s.n}</span>
                    <div>
                      <h3 className="font-medium text-zinc-100">{s.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <CodeTabs />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">What you get</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Everything between your users and your token bill
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-zinc-700">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-medium text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILD VS BUY */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-emerald-400">Build vs buy</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            The honest cost of building it yourself
          </h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-5 py-3.5 font-medium text-zinc-400">Capability</th>
                  <th className="px-5 py-3.5 font-medium text-zinc-400">Build in-house</th>
                  <th className="px-5 py-3.5 font-medium text-emerald-300">ProtAI</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([cap, build, buy], i) => (
                  <tr key={cap} className={i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"}>
                    <td className="px-5 py-3.5 text-zinc-200">{cap}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{build}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-100">{buy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-zinc-600">
            Estimates from founders who built it twice — once themselves, once with ProtAI.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-emerald-400">Pricing</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Less than one bad weekend
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-zinc-400">
            Flat monthly. No per-call fees — ProtAI meters your usage, it doesn't run inference.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  t.highlight
                    ? "border-emerald-500/50 bg-emerald-500/[0.05]"
                    : "border-zinc-800 bg-zinc-900/40"
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-zinc-950">
                    Most popular
                  </span>
                )}
                <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-400">{t.name}</h3>
                <p className="mt-3">
                  <span className="text-4xl font-semibold tracking-tight text-zinc-50">{t.price}</span>
                  <span className="text-sm text-zinc-500"> {t.per}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.items.map((i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0 text-emerald-400"><path d="M20 6 9 17l-5-5" /></svg>
                      {i}
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.href}
                  className={`mt-7 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${
                    t.highlight
                      ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                      : "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500"
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-zinc-600">Prices in USD. Cancel anytime. No per-call fees, ever.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-emerald-400">FAQ</p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Answers, before you ask
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-5 open:border-zinc-700"
              >
                <summary className="cursor-pointer list-none font-medium text-zinc-100 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-zinc-500 transition group-open:rotate-180"><path d="m6 9 6 6 6-6" /></svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 px-6 py-16 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(600px 260px at 50% 0%, rgba(52,211,153,0.10), transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                Your next surprise invoice is optional.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                Five minutes to your first meter. Your future self — the one not
                staring at a $400 token bill on a Monday — says thanks.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="w-full rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto"
                >
                  Start free — no credit card
                </Link>
                <Link
                  href="/blog"
                  className="w-full rounded-xl border border-zinc-700 px-8 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
                >
                  Read the blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

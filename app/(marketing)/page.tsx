import Link from "next/link";
import { CodeTabs } from "./code-tabs";
import { CostCalculator } from "./cost-calculator";
import { Reveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";
import { RotatingWord } from "@/components/RotatingWord";
import { CursorGlow } from "@/components/CursorGlow";
import { TiltCard } from "@/components/TiltCard";
import { LiveDashboard } from "@/components/LiveDashboard";

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
    body: "Every user gets their own balance on any meter you define: tokens, generations, minutes, API calls. Monthly free quotas reset on their own, and every unit is written to a ledger you can audit.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    ),
    title: "Spend alerts before the invoice",
    body: "Get an email the moment a user crosses 80% of quota, or when project-wide AI spend passes your limit. The kill-switch freezes all usage in one click when something looks wrong.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
    title: "Stripe credit packs",
    body: "Sell top-ups without writing billing code. Create a pack, share the link, and completed purchases land on the buyer's balance automatically. Your heaviest users fund themselves.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
    title: "3-line integration",
    body: "Call check() before you spend, report() after. JavaScript and Python SDKs, or plain HTTP for anything else. No proxy, no middleware, no changes to your model calls.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v18m-6-6 6 6 6-6M5 7h14" />
      </svg>
    ),
    title: "Overage rules you control",
    body: "Per meter, pick hard block (returns allowed: false so you can show an upgrade prompt) or allow-and-alert (never interrupt a paying customer mid-task, just notify yourself).",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Built for real traffic",
    body: "Atomic balance updates, idempotent webhooks, per-key rate limits. The correctness work that takes a sprint to build yourself, already done.",
  },
];

const steps = [
  {
    n: "01",
    title: "Define a meter",
    body: "Name your unit (tokens, generations, minutes), set a free monthly quota and an overage rule. Takes about a minute in the dashboard.",
  },
  {
    n: "02",
    title: "Wrap your AI call",
    body: "check() before spending, report() after. Three lines with the SDK. Your prompts, models, and pipelines stay untouched.",
  },
  {
    n: "03",
    title: "Set guardrails",
    body: "Arm spend alerts and the project kill-switch. Then stop checking your token bill every morning.",
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
    q: "How do I control my OpenAI API costs?",
    a: "Give each user a quota. ProtAI meters every token or API call against a per-user balance, alerts you at 80% usage, and can hard-block or flag overage automatically. Most cost spikes come from a handful of users with no limits, and quotas fix that in an afternoon.",
  },
  {
    q: "What is metered billing for AI apps?",
    a: "It's usage-based billing where customers pay for what they consume: tokens, generations, minutes. ProtAI provides the metering layer (balances, quotas, ledgers) plus Stripe credit packs so users can buy top-ups. You define the unit, ProtAI tracks it.",
  },
  {
    q: "Does ProtAI work with my AI provider?",
    a: "Yes. It's provider-agnostic and never touches your model calls. You report how many units a user spent (tokens, generations, minutes, whatever you define) and ProtAI handles balances, quotas, and guardrails. OpenAI, Anthropic, Google, open weights, self-hosted: identical integration.",
  },
  {
    q: "Do I have to rewrite my AI code?",
    a: "No. You wrap it: check() before spending tokens on a user, report() after. Three lines with the JavaScript or Python SDK, or plain HTTP in any other language. Prompts, models, and pipelines stay exactly as they are.",
  },
  {
    q: "What happens when a user runs out of credits?",
    a: "Your call, per meter. Hard block returns allowed: false so you can show an upgrade prompt. Allow-and-alert keeps usage flowing but emails you immediately, for paying customers you don't want to interrupt mid-task.",
  },
  {
    q: "How do paid credit packs work?",
    a: "Create a pack in the dashboard (for example, 1,000 generations for $9), share the Stripe payment link, and completed purchases top up the buyer's balance automatically via webhook. No billing code on your side.",
  },
  {
    q: "Will ProtAI slow down my API?",
    a: "Check calls are single indexed-row reads, single-digit milliseconds. Report calls are fire-and-forget friendly. Nothing sits in front of your model traffic, so there's no proxy to become a bottleneck.",
  },
];

/* ---------------------------------- page ----------------------------------- */

export default function LandingPage() {
  return (
    <>
      {/* HERO */}
      <section className="noise relative overflow-hidden">
        <CursorGlow />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="aurora-orb absolute -top-32 left-[8%] h-96 w-96 rounded-full bg-emerald-500/12" />
          <div className="aurora-orb absolute top-10 right-[5%] h-80 w-80 rounded-full bg-sky-500/10" style={{ animationDelay: "-5s" }} />
          <div className="aurora-orb absolute top-64 left-[45%] h-72 w-72 rounded-full bg-emerald-400/8" style={{ animationDelay: "-9s" }} />
        </div>
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
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            {/* Copy */}
            <div>
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
                  <span className="live-ping relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
                  Live: metering 48k checks today
                </p>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-50 sm:text-6xl lg:text-7xl">
                  Give every user a balance.
                  <br />
                  <span className="text-zinc-500">Keep your </span>
                  <RotatingWord
                    words={["AI bill", "token spend", "margins", "budget"]}
                    className="text-shimmer bg-gradient-to-r from-emerald-300 via-emerald-400 to-sky-400 bg-clip-text text-transparent"
                  />
                  <br />
                  <span className="text-zinc-500">under control.</span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                  ProtAI is credit metering for AI apps. Set per-user quotas on tokens,
                  generations, or API calls, get alerted before spend spikes, and stop
                  runaway usage in one click. Works with OpenAI, Anthropic, and any other
                  provider. Live in three lines of code, no proxy.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/signup"
                    className="rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                  >
                    Start free
                  </Link>
                  <Link
                    href="/docs"
                    className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-7 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
                  >
                    Read the docs
                  </Link>
                </div>
                <p className="mt-4 font-mono text-xs text-zinc-600">
                  npm i protai&nbsp;&nbsp;·&nbsp;&nbsp;pip install protai&nbsp;&nbsp;·&nbsp;&nbsp;no credit card
                </p>
              </Reveal>
            </div>

            {/* Live product */}
            <Reveal delay={250} y={40}>
              <TiltCard max={8}>
                <div className="border-beam">
                  <LiveDashboard />
                </div>
              </TiltCard>
              <p className="mt-4 text-center text-xs text-zinc-600">
                Not a mockup. This is the real dashboard, simulated live. Move your mouse over it.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* PROVIDERS */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-zinc-600">
            Provider-agnostic — works with whatever you already use
          </p>
          <Marquee speed={28} className="mt-6 [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
            {providers.map((p) => (
              <span key={p} className="mx-8 text-sm font-medium text-zinc-500">{p}</span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">AI cost control, in numbers</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                One abusive weekend can cost more than a year of ProtAI
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-400">
                Free tiers attract scripts, shared accounts, and prompt loops that burn
                through your OpenAI or Anthropic credits. Drag the sliders to your
                numbers and see what unmetered AI usage really costs.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-10">
              <CostCalculator />
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div className="lg:sticky lg:top-24">
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">Integration</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                Three lines of code.<br />Five minutes.<br />No proxy.
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-400">
                Nothing sits in front of your model traffic. You tell ProtAI what a user
                spent in tokens or API calls, and it handles balances, quotas, and
                guardrails. Your prompts, models, and pipelines never change.
              </p>
              <Link href="/docs" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200">
                Read the integration guide
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </Link>
            </div>
            <div>
              <div className="space-y-4">
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 100}>
                    <div className="lift-card flex gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                      <span className="font-mono text-sm font-semibold text-emerald-400">{s.n}</span>
                      <div>
                        <h3 className="font-medium text-zinc-100">{s.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
                      </div>
                    </div>
                  </Reveal>
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
            AI spend management, end to end
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 3) * 100}
                className={i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}
              >
                <div className="lift-card group h-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-zinc-700">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    {f.icon}
                  </span>
                  <h3 className="mt-4 font-medium text-zinc-100">{f.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{f.body}</p>
                  {i === 0 && (
                    <div className="mt-5 space-y-2.5">
                      {[
                        { user: "user_8f2a", pct: 92, hot: true },
                        { user: "user_1c9d", pct: 61, hot: false },
                        { user: "user_77b1", pct: 34, hot: false },
                      ].map((r) => (
                        <div key={r.user} className="flex items-center gap-3">
                          <span className="w-20 font-mono text-xs text-zinc-500">{r.user}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${r.hot ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${r.pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-xs text-zinc-500">{r.pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BUILD VS BUY */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-center text-sm font-medium uppercase tracking-widest text-emerald-400">Build vs buy</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            What it really costs to build metering yourself
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
            Estimates from founders who built usage metering twice: once themselves, once with ProtAI.
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
            Flat monthly pricing. No per-call fees: ProtAI meters your AI usage, it never runs inference.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
            {tiers.map((t, i) => (
              <Reveal key={t.name} delay={i * 100} className="h-full">
                <div
                  className={`lift-card relative flex h-full flex-col rounded-2xl border p-6 ${
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
              </Reveal>
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
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={Math.min(i, 4) * 60}>
                <details
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
              </Reveal>
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
                Your next surprise AI invoice is optional.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                Five minutes to your first meter. Future you, the one not staring at
                a $400 token bill on a Monday morning, says thanks.
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

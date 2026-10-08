import Link from "next/link";
import { CodeTabs } from "./code-tabs";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
    ),
    title: "Per-user credits",
    body: "Give every end user their own balance on any meter you define — tokens, generations, minutes, API calls. Free monthly quotas included, usage tracked to the unit.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    ),
    title: "Spend alerts + kill-switch",
    body: "Get emailed the moment a user burns through 80% of quota — or when project-wide spend passes your threshold. One click freezes everything before the invoice lands.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
    title: "Stripe credit packs",
    body: "Sell top-ups directly: create a pack, share the payment link, and purchases land on the user's balance automatically via webhook. Heavy users fund themselves.",
  },
];

const steps = [
  {
    n: "1",
    title: "Create a meter",
    body: "Name your unit — tokens, generations, minutes — and set a free monthly quota. Takes sixty seconds in the dashboard.",
  },
  {
    n: "2",
    title: "Add three lines of code",
    body: "Wrap your AI call: check() before you spend, report() after. Works with any provider, any language with our SDKs.",
  },
  {
    n: "3",
    title: "Set your guardrails",
    body: "Pick per-meter overage behavior — hard block or allow-and-alert — and arm the project kill-switch. Sleep well.",
  },
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
    a: "Yes. ProtAI is provider-agnostic — it never touches your model calls. You tell it how many units a user spent (tokens, generations, minutes, whatever you define) and it handles balances, quotas, and guardrails. OpenAI, Anthropic, Google, open-weight models, self-hosted — all the same integration.",
  },
  {
    q: "Do I have to rewrite my AI code?",
    a: "No. You wrap it: call check() before spending tokens on a user, and report() after. That's three lines with our JavaScript or Python SDK, or a plain HTTP call in any other language. Your existing prompts, models, and pipelines stay exactly as they are.",
  },
  {
    q: "What happens when a user runs out of credits?",
    a: "You decide per meter. Hard block returns allowed: false so you can show an upgrade prompt. Allow-and-alert lets usage continue but emails you immediately — useful for paying customers you don't want to interrupt mid-task.",
  },
  {
    q: "How do paid credit packs work?",
    a: "Create a pack in the dashboard (e.g. 1,000 generations for $9), share the Stripe payment link with your users, and completed purchases top up their balance automatically via webhook. No code on your side.",
  },
  {
    q: "What does ProtAI cost me to run?",
    a: "Nothing per API call. ProtAI meters your usage — it doesn't run inference — so our own costs are near zero, and we pass that on. Pricing is a flat monthly subscription based on projects and end users, not on how many checks you make.",
  },
];

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
              "radial-gradient(600px 320px at 50% -40px, rgba(52,211,153,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
              Built for indie AI builders
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
              Stop free-tier users burning your AI budget.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              ProtAI is drop-in credit metering for your AI app. Per-user balances,
              spend alerts, and a kill-switch — live in three lines of code. Works
              with any AI provider.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="w-full rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 sm:w-auto"
              >
                Start free
              </Link>
              <Link
                href="/docs"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 sm:w-auto"
              >
                Read the docs
              </Link>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Free for 1 project · No credit card · 5-minute setup
            </p>
          </div>

          {/* Hero code card */}
          <div className="mx-auto mt-14 max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="ml-2 font-mono text-xs text-zinc-500">your-app.js</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed">
                <code>
                  <span className="text-zinc-500">{"// before spending tokens on a user"}</span>{"\n"}
                  <span className="text-zinc-300">const</span> <span className="text-sky-300">check</span> <span className="text-zinc-300">=</span> <span className="text-emerald-400">await</span> <span className="text-zinc-300">protai.</span><span className="text-sky-300">check</span><span className="text-zinc-300">(userId, </span><span className="text-amber-300">"tokens"</span><span className="text-zinc-300">);</span>{"\n"}
                  <span className="text-emerald-400">if</span> <span className="text-zinc-300">(!check.allowed) </span><span className="text-emerald-400">return</span> <span className="text-zinc-300">showUpgrade(check);</span>{"\n\n"}
                  <span className="text-zinc-500">{"// ... run your AI call as normal ..."}</span>{"\n\n"}
                  <span className="text-zinc-500">{"// after: report what was spent"}</span>{"\n"}
                  <span className="text-emerald-400">await</span> <span className="text-zinc-300">protai.</span><span className="text-sky-300">report</span><span className="text-zinc-300">(userId, </span><span className="text-amber-300">"tokens"</span><span className="text-zinc-300">, usage.totalTokens);</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            The free-tier trap is real
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "One power user, one weekend",
                body: "A single enthusiastic free-tier user can burn through $40+ of tokens before Monday. You find out from the invoice — not before.",
              },
              {
                title: "Abuse looks like enthusiasm",
                body: "Scripts, shared accounts, prompt-injection loops. Without per-user metering, you can't tell a fan from a freeloader until it costs you.",
              },
              {
                title: "Building it yourself takes days",
                body: "Balances, quotas, ledgers, alerts, Stripe top-ups — every AI founder rebuilds the same plumbing. Days you'll never get back.",
              },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h3 className="font-medium text-zinc-100">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Live in three steps
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-sm font-semibold text-emerald-300">
                  {s.n}
                </span>
                <h3 className="mt-4 font-medium text-zinc-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <CodeTabs />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Everything between your users and your token bill
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  {f.icon}
                </span>
                <h3 className="mt-4 font-medium text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Pricing that costs less than one bad weekend
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-500">
            Flat monthly pricing. No per-call fees — ProtAI meters your usage, it doesn't run inference.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col rounded-2xl border p-6 ${
                  t.highlight
                    ? "border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_40px_rgba(52,211,153,0.08)]"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
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
          <p className="mt-6 text-center text-xs text-zinc-600">Prices in USD. Cancel anytime.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-zinc-800/60">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 px-6 py-5"
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
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.05] px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(500px 240px at 50% 0%, rgba(52,211,153,0.12), transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                Ship your AI app without the billing anxiety.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-400">
                Set up your first meter in five minutes. Your future self — the one not staring at a surprise invoice — says thanks.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-block rounded-xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Start free — no credit card
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

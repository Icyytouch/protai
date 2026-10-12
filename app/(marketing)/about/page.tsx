import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SpotlightCard } from "@/components/SpotlightCard";

export const metadata: Metadata = {
  title: "About — ProtAI",
  description:
    "ProtAI exists for one reason: AI apps shouldn't go broke on token bills. Learn why we built credit metering for AI apps.",
};

const principles = [
  {
    title: "No proxy, ever",
    body: "ProtAI never sits in front of your model traffic. Your prompts, completions, and user data flow directly to your provider — we only meter what you tell us you spent. Less latency, fewer failure points, nothing to leak.",
  },
  {
    title: "Guardrails before invoices",
    body: "A surprise $4,000 token bill is a product failure, not a pricing strategy. Quotas, alerts, and the kill-switch exist so you hear about spend problems before your accountant does.",
  },
  {
    title: "Built for indie budgets",
    body: "We started ProtAI because enterprise cost-management tools cost more than the problem they solve. Flat pricing, a genuinely useful free tier, no per-call fees — the math should always favor the builder.",
  },
  {
    title: "Boring infrastructure",
    body: "Metering is the kind of thing that must simply never break. Atomic balance deductions, an immutable ledger, idempotent APIs. We'd rather be invisible than impressive.",
  },
];

const timeline = [
  {
    when: "The problem",
    text: "AI wrappers were taking off, and every founder we knew had the same story: a free tier, a prompt loop, a shared API key — and a token bill 40× what they expected. The providers give you a dashboard. Nobody gives you per-user control.",
  },
  {
    when: "The insight",
    text: "Prepaid mobile figured this out decades ago: give every user a balance, warn them before it runs out, cut them off cleanly. AI apps needed the same primitive — a tiny API that answers one question: is this spend allowed?",
  },
  {
    when: "ProtAI",
    text: "So we built it: check() before you spend, report() after. Per-user balances, monthly quotas, spend alerts, credit packs via Stripe, and a kill-switch for the bad days. Three lines of code, no proxy, works with any provider.",
  },
];

export default function AboutPage() {
  return (
    <div className="noise relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora-orb absolute -top-32 left-[10%] h-96 w-96 rounded-full bg-emerald-500/10" />
        <div className="aurora-orb absolute top-40 right-[5%] h-80 w-80 rounded-full bg-sky-500/8" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">About</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              AI apps shouldn't go broke on token bills.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              ProtAI is credit metering for AI apps. We give every one of your users
              their own balance — on tokens, generations, minutes, whatever you bill
              for — and the guardrails to make sure nobody burns through your margin.
              We're a small, independent team building the infrastructure we wished
              existed when we shipped our first AI wrapper.
            </p>
          </Reveal>
        </div>

        {/* story */}
        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {timeline.map((t, i) => (
            <Reveal key={t.when} delay={i * 100}>
              <SpotlightCard className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">{t.when}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{t.text}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* principles */}
        <div className="mt-20">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Principles</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50">
              What we believe
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={(i % 2) * 100}>
                <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <h3 className="font-medium text-zinc-100">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* facts */}
        <Reveal>
          <div className="mt-20 grid gap-5 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-8 sm:grid-cols-3">
            {[
              { k: "3 lines", v: "to integrate — check() before, report() after" },
              { k: "$0", v: "to start — the free tier is genuinely useful" },
              { k: "0", v: "proxies — your traffic never touches our servers" },
            ].map((f) => (
              <div key={f.k} className="text-center sm:text-left">
                <p className="text-3xl font-semibold tracking-tight text-emerald-300">{f.k}</p>
                <p className="mt-2 text-sm text-zinc-500">{f.v}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-16 text-center">
            <p className="text-zinc-400">Want to talk? We read everything.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-xl bg-emerald-500 px-7 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                Contact us
              </Link>
              <Link
                href="/docs"
                className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-7 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

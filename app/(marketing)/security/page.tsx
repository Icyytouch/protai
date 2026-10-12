import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { LegalPage, H2, P, UL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Security — ProtAI",
  description: "How ProtAI protects your data: no-proxy architecture, encrypted everything, hashed API keys, and responsible disclosure.",
};

const practices = [
  {
    title: "No-proxy architecture",
    body: "The single biggest security decision we made: ProtAI never sees your AI traffic. Your prompts, completions, and user content go directly to your provider. We meter only the numbers you report — units, balances, timestamps. An attacker can't steal what we never had.",
  },
  {
    title: "API keys, handled properly",
    body: "Keys are generated with 192 bits of entropy, stored as SHA-256 hashes (never plaintext), and shown exactly once at creation. Prefixes let you identify keys in the dashboard without exposing them. Revocation is instant.",
  },
  {
    title: "Encryption everywhere",
    body: "TLS 1.2+ in transit, AES-256 at rest via our infrastructure providers. Webhook payloads are HMAC-SHA256 signed so your endpoints can verify every delivery genuinely came from us.",
  },
  {
    title: "Least-privilege data access",
    body: "Row-level security on every table: your projects, meters, and ledger entries are visible only to your account. Service-role access is limited to the API and background jobs that need it, and every admin action is tied to an authenticated session.",
  },
  {
    title: "Atomic, auditable metering",
    body: "Balance deductions run as single atomic database operations with row locking — concurrent requests can't double-spend. Every unit is written to an append-only ledger, so balances are always reconcilable.",
  },
  {
    title: "Careful dependencies",
    body: "Small dependency surface, pinned versions, automated security updates. We don't add a package to solve what ten lines of code can do.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <LegalPage kicker="Trust" title="Security at ProtAI" updated="12 October 2026">
        <P>
          You trust us with your usage data and your users' balances. Here's
          plainly how we protect it — what we do, and what we deliberately
          don't do.
        </P>
      </LegalPage>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {practices.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <h3 className="mt-4 font-medium text-zinc-100">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="legal-prose mx-auto mt-12 max-w-3xl">
            <H2>What we don't claim</H2>
            <P>
              We don't have SOC 2 or ISO 27001 certification — we're a small
              team and we'd rather be honest than certified-ish. What we have
              is a minimal-attack-surface architecture, strong defaults, and
              fast response when something looks wrong. If you need a security
              questionnaire answered for procurement, ask us — we'll fill it in
              properly.
            </P>
            <H2>Responsible disclosure</H2>
            <P>
              Found a vulnerability? Please don't exploit it or disclose it
              publicly before we've had a chance to fix it. Send details via
              the <a href="/contact">contact page</a> (subject: "Report a
              bug") from an email we can reply to. We aim to acknowledge
              reports within 2 business days and will keep you updated on the
              fix. We won't take legal action against good-faith researchers.
            </P>
            <H2>Subprocessors</H2>
            <P>
              Our infrastructure runs on Supabase (database & auth), Vercel
              (hosting), Stripe (payments), and Resend (email) — each with
              their own audited security programs. See the{" "}
              <a href="/privacy">Privacy Policy</a> for details.
            </P>
          </div>
        </Reveal>
      </div>
    </>
  );
}

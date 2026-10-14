import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-seo";
import { LegalPage, H2, P, UL } from "@/components/LegalPage";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/privacy", {
    title: "Privacy Policy — ProtAI",
    description: "How ProtAI collects, uses, and protects your data — and your rights under UK GDPR.",
  });
}

export default function PrivacyPage() {
  return (
    <LegalPage kicker="Legal" title="Privacy Policy" updated="12 October 2026">
      <P>
        ProtAI ("we", "us", "our") takes privacy seriously. This policy explains
        what data we collect, why, who we share it with, and your rights. It
        applies to protai.co.uk, the dashboard, API, and SDKs.
      </P>

      <H2>1. Data we collect</H2>
      <P>
        <strong>Account data.</strong> When you sign up: your email address and
        anything you add to your profile. When you subscribe: billing details
        are processed by Stripe — we never see or store your card numbers.
      </P>
      <P>
        <strong>Metering data.</strong> To provide the service we store: project
        and meter configuration, API key metadata (prefixes and hashes — never
        raw keys), per-user balances, and an immutable ledger of check/report
        entries including the end-user IDs you send us, units, and timestamps.
      </P>
      <P>
        <strong>What we deliberately don't collect.</strong> ProtAI never proxies
        your AI traffic. We never see your prompts, completions, model
        parameters, or any content your users generate. There is nothing to
        leak because it never touches our servers.
      </P>
      <P>
        <strong>Technical data.</strong> Standard web logs (IP address, user
        agent, pages visited) for security and analytics, plus privacy-friendly
        usage analytics on the marketing site.
      </P>

      <H2>2. How we use it</H2>
      <UL
        items={[
          "To provide and operate the service: metering, quotas, alerts, billing.",
          "To secure the platform: fraud prevention, rate limiting, abuse detection.",
          "To communicate: transactional emails (alerts, receipts), and product updates you can opt out of.",
          "To improve: aggregated, anonymised analytics about feature usage.",
        ]}
      />
      <P>We do not sell your data. We do not use your data to train AI models.</P>

      <H2>3. Subprocessors</H2>
      <P>We share limited data with the services that run ProtAI:</P>
      <UL
        items={[
          <span key="1"><strong>Supabase</strong> — database and authentication (account + metering data).</span>,
          <span key="2"><strong>Stripe</strong> — subscription and credit-pack payments (billing data).</span>,
          <span key="3"><strong>Vercel</strong> — hosting and edge delivery (technical logs).</span>,
          <span key="4"><strong>Resend</strong> — transactional email (your email address, alert content).</span>,
          <span key="5"><strong>Google Analytics</strong> — marketing-site analytics (anonymised usage).</span>,
        ]}
      />
      <P>
        Each processes data only on our instructions under their own data
        processing terms. Where data leaves the UK/EEA, transfers rely on
        adequacy decisions or standard contractual clauses.
      </P>

      <H2>4. Your end users</H2>
      <P>
        When you send us end-user IDs and usage, you are the data controller for
        that data and we process it as your processor, solely to provide the
        metering service. Make sure your own privacy policy discloses this, and
        only send us identifiers you have a lawful basis to share. We recommend
        opaque IDs (e.g. <code>user_8f2a</code>) rather than emails or names.
      </P>

      <H2>5. Cookies</H2>
      <P>
        We use strictly-necessary cookies for authentication and security. The
        marketing site uses Google Analytics cookies to understand aggregate
        traffic. No advertising cookies, no cross-site tracking.
      </P>

      <H2>6. Retention</H2>
      <UL
        items={[
          "Account data: kept while your account is active, deleted within 90 days of closure on request.",
          "Metering ledger: kept while your account is active; ledger entries are append-only by design and cannot be edited, but can be deleted with your account.",
          "Contact messages: kept for 24 months.",
          "Web logs: kept for 12 months.",
        ]}
      />

      <H2>7. Your rights (UK GDPR)</H2>
      <P>
        If you're in the UK or EEA you have the right to access, correct,
        delete, or port your personal data, to restrict or object to processing,
        and to withdraw consent where processing is based on it. To exercise
        any of these, contact us via the <a href="/contact">contact page</a> —
        we respond within 30 days. You also have the right to complain to the
        ICO (ico.org.uk).
      </P>

      <H2>8. Security</H2>
      <P>
        Data is encrypted in transit (TLS) and at rest. API keys are stored as
        salted hashes and shown once. Access to production systems is limited
        and logged. See our <a href="/security">security page</a> for detail.
      </P>

      <H2>9. Changes</H2>
      <P>
        We'll notify you of material changes to this policy by email or in the
        dashboard before they take effect.
      </P>

      <H2>10. Contact</H2>
      <P>
        Data protection questions: <a href="/contact">contact page</a> or
        support@protai.co.uk.
      </P>
    </LegalPage>
  );
}

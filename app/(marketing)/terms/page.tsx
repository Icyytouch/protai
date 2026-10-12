import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — ProtAI",
  description: "The terms governing your use of ProtAI's credit metering platform.",
};

export default function TermsPage() {
  return (
    <LegalPage kicker="Legal" title="Terms of Service" updated="12 October 2026">
      <P>
        These Terms of Service ("Terms") govern your use of ProtAI ("we", "us",
        "our") — the credit metering platform at protai.co.uk, including the
        dashboard, API, SDKs, and documentation. By creating an account or using
        the service, you agree to these Terms.
      </P>

      <H2>1. What ProtAI does</H2>
      <P>
        ProtAI provides usage metering infrastructure for AI applications:
        per-user credit balances, monthly quotas, spend alerts, credit packs,
        and a kill-switch, delivered through an API and dashboard. ProtAI does{" "}
        <strong>not</strong> run AI inference and never proxies your model
        traffic — your prompts and completions go directly to your own AI
        provider. You are responsible for your relationship, usage, and bills
        with those providers.
      </P>

      <H2>2. Accounts</H2>
      <UL
        items={[
          "You must provide accurate account information and keep your credentials secure.",
          "You are responsible for all activity under your account, including API calls made with your keys.",
          "API keys are shown once at creation. If a key is exposed, revoke it immediately in the dashboard and create a new one.",
          "One account per person or organisation, unless we've agreed otherwise.",
        ]}
      />

      <H2>3. Acceptable use</H2>
      <P>You agree not to:</P>
      <UL
        items={[
          "Use ProtAI for unlawful activity, or to meter usage for unlawful activity.",
          "Attempt to breach, probe, or overload our systems, or circumvent rate limits and quotas.",
          "Resell or sublicense ProtAI as a standalone metering service without our written agreement.",
          "Use the service to harm minors, or to facilitate harassment, fraud, or the distribution of malware.",
          "Misrepresent your usage to obtain free-tier resources at unreasonable scale.",
        ]}
      />
      <P>
        We may suspend accounts that violate these rules, with or without
        notice depending on severity.
      </P>

      <H2>4. Plans and billing</H2>
      <UL
        items={[
          "Plans are billed monthly in USD: Free ($0), Starter ($19/month), Pro ($39/month). Prices exclude any taxes your jurisdiction requires.",
          "Subscriptions renew automatically each month until cancelled. Cancel anytime from the billing page — you keep access until the end of the paid period.",
          "Plan limits (projects, meters, end users) are enforced as described on the pricing page. Exceeding a limit returns a plan_limit response from the API.",
          "We may change prices with at least 30 days' notice. Existing paid periods are never repriced mid-cycle.",
        ]}
      />

      <H2>5. Credit packs</H2>
      <P>
        Credit packs are one-time purchases that add balance to an end user's
        meter. Packs are fulfilled via Stripe; once credits are applied to a
        meter they are considered consumed and are non-refundable except as
        described in our <a href="/refunds">Refund Policy</a>. It is your
        responsibility to price and describe packs accurately to your own users.
      </P>

      <H2>6. API and fair use</H2>
      <UL
        items={[
          "The API is rate-limited (currently 100 requests/minute per key). Limits may change to protect the platform.",
          "Metering data (balances, ledger entries) is provided as-is for your own records. Keep your own backups of business-critical data.",
          "We aim for high availability but do not guarantee uninterrupted service. Scheduled maintenance will be announced where practical.",
        ]}
      />

      <H2>7. Termination</H2>
      <P>
        You may close your account at any time from the dashboard. We may
        suspend or terminate accounts for violations of these Terms, non-payment,
        or prolonged inactivity. On termination, API access stops immediately;
        we retain account and ledger data as described in our{" "}
        <a href="/privacy">Privacy Policy</a>.
      </P>

      <H2>8. Liability</H2>
      <P>
        ProtAI is provided "as is" without warranties of any kind. To the
        maximum extent permitted by law, our total liability for any claim
        arising from the service is limited to the fees you paid in the 12
        months before the claim (or £100 if you paid nothing). We are not liable
        for indirect losses, including your AI provider bills, lost revenue, or
        data loss.
      </P>
      <P>
        Nothing in these Terms limits liability that cannot be limited under
        applicable law, including for death or personal injury caused by
        negligence, or fraud.
      </P>

      <H2>9. Changes to these Terms</H2>
      <P>
        We may update these Terms from time to time. Material changes will be
        announced by email or in the dashboard at least 14 days before they take
        effect. Continued use after the effective date means you accept the
        updated Terms.
      </P>

      <H2>10. Governing law</H2>
      <P>
        These Terms are governed by the laws of England and Wales. Disputes will
        be subject to the exclusive jurisdiction of the courts of England and
        Wales, though nothing prevents you from bringing a claim in your local
        courts where consumer protection law gives you that right.
      </P>

      <H2>11. Contact</H2>
      <P>
        Questions about these Terms? Reach us via the{" "}
        <a href="/contact">contact page</a> or at support@protai.co.uk.
      </P>
    </LegalPage>
  );
}

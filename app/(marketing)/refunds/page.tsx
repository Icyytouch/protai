import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy — ProtAI",
  description: "ProtAI's refund policy for subscriptions and credit packs.",
};

export default function RefundsPage() {
  return (
    <LegalPage kicker="Legal" title="Refund Policy" updated="12 October 2026">
      <P>
        Simple and fair: if we got it wrong, we make it right. Here's exactly
        how refunds work for subscriptions and credit packs.
      </P>

      <H2>Subscriptions</H2>
      <UL
        items={[
          "Cancel anytime from the billing page. You keep full access until the end of your paid month — we don't cut you off mid-cycle.",
          "We don't refund partial months: if you cancel on day 10 of a $19 month, you keep the service until day 30 but the $19 isn't prorated back.",
          "If a billing error charges you incorrectly (double charge, wrong plan), we'll refund the difference as soon as you tell us.",
        ]}
      />

      <H2>Credit packs</H2>
      <UL
        items={[
          "Credit packs are one-time purchases. Once credits are applied to an end user's meter, they're considered delivered and are non-refundable.",
          "If a pack purchase completes but the credits never arrive (a failed fulfillment on our side), we'll either apply the credits or refund the purchase — your choice.",
          "If you bought a pack by mistake and none of the credits have been used, contact us within 7 days and we'll refund it.",
        ]}
      />

      <H2>How to request a refund</H2>
      <P>
        Message us via the <a href="/contact">contact page</a> (subject:
        "Billing & subscriptions") from your account email, including what
        happened. We handle refund requests within 3 business days. Approved
        refunds go back to the original payment method via Stripe and typically
        arrive within 5–10 business days.
      </P>

      <H2>Chargebacks</H2>
      <P>
        Please talk to us before filing a chargeback — it's slower for you and
        expensive for us, and we'd almost always rather just refund you. Accounts
        with chargebacks may be suspended while the dispute is resolved.
      </P>

      <H2>Free tier</H2>
      <P>
        The free tier costs nothing, so there's nothing to refund — but if
        something's broken, we'd still like to hear about it.
      </P>
    </LegalPage>
  );
}

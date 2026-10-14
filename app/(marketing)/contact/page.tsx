import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-seo";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "./contact-form";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/contact", {
    title: "Contact — ProtAI",
    description: "Talk to the ProtAI team — billing questions, integration help, feature requests, or partnerships.",
  });
}

export default function ContactPage() {
  return (
    <div className="noise relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora-orb absolute -top-32 left-[10%] h-96 w-96 rounded-full bg-emerald-500/10" />
        <div className="aurora-orb absolute top-40 right-[5%] h-80 w-80 rounded-full bg-sky-500/8" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Contact</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                Talk to a human.
              </h1>
              <p className="mt-5 leading-relaxed text-zinc-400">
                Questions about billing, help wiring up the SDK, a bug to report,
                or a partnership idea — send it over. Every message is read by a
                real person on the ProtAI team.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <p className="text-sm font-medium text-zinc-200">Email</p>
                  <p className="mt-1 font-mono text-sm text-emerald-300">support@protai.co.uk</p>
                  <p className="mt-1 text-xs text-zinc-600">For anything the form doesn't cover.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <p className="text-sm font-medium text-zinc-200">Response time</p>
                  <p className="mt-1 text-sm text-zinc-400">Within one business day, usually much faster.</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <p className="text-sm font-medium text-zinc-200">Billing issues</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Include the email on your ProtAI account and we'll sort it out — refunds
                    included, no forms in triplicate.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={150}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CursorGlow } from "@/components/CursorGlow";

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

/** Premium split-screen auth shell: animated brand panel + glass form card. */
export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="noise relative flex min-h-[calc(100vh-4rem)] overflow-hidden">
      <CursorGlow />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora-orb absolute -top-24 left-[10%] h-80 w-80 rounded-full bg-emerald-500/10" />
        <div className="aurora-orb absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-sky-500/10" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr]">
        {/* Brand panel */}
        <div className="hidden lg:block">
          <Link href="/">
            <Logo />
          </Link>
          <h2 className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-zinc-50">
            The credit layer
            <br />
            for <span className="text-shimmer bg-gradient-to-r from-emerald-300 to-sky-400 bg-clip-text text-transparent">AI apps.</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-zinc-400">
            Per-user balances, spend alerts, and a kill-switch. The boring
            infrastructure your token bill wishes you had.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { k: "48k", v: "checks metered today" },
              { k: "3", v: "lines of code to integrate" },
              { k: "$0", v: "surprise invoices since launch" },
            ].map((s) => (
              <div key={s.v} className="flex items-baseline gap-3">
                <span className="font-mono text-2xl font-semibold text-emerald-300">{s.k}</span>
                <span className="text-sm text-zinc-500">{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="border-beam overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            <div className="p-8 sm:p-10">
              <div className="lg:hidden">
                <Logo />
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 lg:mt-0">{title}</h1>
              <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
              <div className="mt-7">{children}</div>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}

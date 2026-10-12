import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

/** Shared shell for About / Terms / Privacy / Refunds / Security pages. */
export function LegalPage({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="noise relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora-orb absolute -top-32 left-[10%] h-96 w-96 rounded-full bg-emerald-500/10" />
        <div className="aurora-orb absolute top-20 right-[5%] h-80 w-80 rounded-full bg-sky-500/8" style={{ animationDelay: "-6s" }} />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">{kicker}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">{title}</h1>
          {updated && <p className="mt-4 text-sm text-zinc-600">Last updated: {updated}</p>}
        </Reveal>
        <Reveal delay={120}>
          <div className="legal-prose mt-10">{children}</div>
        </Reveal>
      </div>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2>{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

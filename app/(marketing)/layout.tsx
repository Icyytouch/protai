import Link from "next/link";
import { Logo } from "@/components/Logo";

function NavLinks() {
  return (
    <>
      <Link href="#how" className="text-sm text-zinc-400 transition hover:text-zinc-100">How it works</Link>
      <Link href="#features" className="text-sm text-zinc-400 transition hover:text-zinc-100">Features</Link>
      <Link href="#pricing" className="text-sm text-zinc-400 transition hover:text-zinc-100">Pricing</Link>
      <Link href="#faq" className="text-sm text-zinc-400 transition hover:text-zinc-100">FAQ</Link>
      <Link href="/docs" className="text-sm text-zinc-400 transition hover:text-zinc-100">Docs</Link>
    </>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            <NavLinks />
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden rounded-xl px-3.5 py-2 text-sm text-zinc-300 transition hover:text-white sm:inline-block">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-zinc-500">
              Drop-in credit metering for AI apps. Per-user balances, spend alerts, and a kill-switch.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            <Link href="#features" className="hover:text-zinc-100">Features</Link>
            <Link href="#pricing" className="hover:text-zinc-100">Pricing</Link>
            <Link href="#faq" className="hover:text-zinc-100">FAQ</Link>
            <Link href="/docs" className="hover:text-zinc-100">Docs</Link>
            <Link href="/login" className="hover:text-zinc-100">Log in</Link>
            <Link href="/signup" className="hover:text-zinc-100">Sign up</Link>
          </nav>
        </div>
        <div className="border-t border-zinc-800/60">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
            <p className="text-xs text-zinc-600">© 2026 ProtAI. Prices in USD.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

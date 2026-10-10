import Link from "next/link";
import { Logo } from "@/components/Logo";

const productLinks = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const resourceLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/blog", label: "Blog" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {productLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-zinc-400 transition hover:text-zinc-100">
                {l.label}
              </Link>
            ))}
            <Link href="/docs" className="text-sm text-zinc-400 transition hover:text-zinc-100">Docs</Link>
            <Link href="/blog" className="text-sm text-zinc-400 transition hover:text-zinc-100">Blog</Link>
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

      <footer className="border-t border-zinc-800/80 bg-zinc-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Drop-in credit metering for AI apps. Per-user balances, spend alerts,
              and a kill-switch — live in three lines of code.
            </p>
            <p className="mt-4 font-mono text-xs text-zinc-600">npm i protai · pip install protai</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Product</p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {productLinks.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-zinc-400 transition hover:text-zinc-100">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Resources</p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {resourceLinks.map((l) => (
                <Link key={l.href} href={l.href} className="text-sm text-zinc-400 transition hover:text-zinc-100">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="border-t border-zinc-800/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-zinc-600">© 2026 ProtAI. All rights reserved.</p>
            <p className="text-xs text-zinc-600">Prices in USD. Made for indie AI builders.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

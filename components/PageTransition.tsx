"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";

type Phase = "idle" | "covering" | "holding" | "revealing";

/**
 * Cinematic page transition: intercepts internal link clicks, wipes a
 * full-screen curtain over the old page, swaps the route underneath,
 * then wipes away to reveal the new page. Feels like a proper page load.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const pendingHref = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function resetToIdle() {
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    setPhase("idle");
    pendingHref.current = null;
  }

  function beginReveal() {
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    setPhase("revealing");
    later(() => resetToIdle(), 520);
  }

  // Intercept internal link clicks.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Hash-only or identical URL: let the browser handle it natively
      // (anchor scrolling). Running the curtain here would strand it,
      // because the pathname never changes.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      if (phase !== "idle") return;
      pendingHref.current = url.pathname + url.search + url.hash;
      setPhase("covering");
      // Once covered, perform the navigation underneath.
      later(() => {
        setPhase("holding");
        // Safety net: if the route never lands (same-path edge cases,
        // failed navigations), lift the curtain anyway after 3s.
        safetyTimer.current = setTimeout(() => beginReveal(), 3000);
        router.push(pendingHref.current!);
      }, 480);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, router]);

  // When the route lands, reveal the new page.
  useEffect(() => {
    if (phase === "holding") {
      beginReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Browser back/forward: quick cover + reveal.
  useEffect(() => {
    function onPop() {
      if (phase !== "idle") return;
      setPhase("covering");
      later(() => setPhase("revealing"), 480);
      later(() => resetToIdle(), 1000);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    },
    []
  );

  const active = phase !== "idle";

  return (
    <>
      {children}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[100] ${active ? "" : "invisible"}`}
      >
        {/* curtain panels */}
        <div
          className="absolute inset-0 origin-bottom bg-zinc-950 transition-transform duration-[480ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
          style={{
            transform:
              phase === "covering" || phase === "holding" ? "scaleY(1)" : "scaleY(0)",
            transitionDelay: phase === "revealing" ? "60ms" : "0ms",
          }}
        />
        <div
          className="absolute inset-0 origin-bottom bg-emerald-500/10 transition-transform duration-[480ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
          style={{
            transform:
              phase === "covering" || phase === "holding" ? "scaleY(1)" : "scaleY(0)",
            transitionDelay: phase === "covering" ? "70ms" : phase === "revealing" ? "0ms" : "0ms",
          }}
        />
        {/* wordmark shown mid-transition */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            phase === "holding" ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="animate-pulse">
            <Logo />
          </div>
        </div>
        {/* progress hairline */}
        <div
          className="absolute inset-x-0 top-0 h-0.5 origin-left bg-emerald-400 transition-transform duration-[480ms] ease-out"
          style={{ transform: phase === "holding" ? "scaleX(1)" : "scaleX(0)" }}
        />
      </div>
    </>
  );
}

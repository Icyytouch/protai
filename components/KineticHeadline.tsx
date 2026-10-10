"use client";

import { useEffect, useRef } from "react";

/**
 * KineticHeadline — headline words react to the cursor: letters near the
 * pointer lift and glow, settling back with spring physics.
 */
export function KineticHeadline({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-l]"));
    let raf = 0;
    let mx = -9999, my = -9999;

    function onMove(e: MouseEvent) {
      mx = e.clientX; my = e.clientY;
    }
    window.addEventListener("mousemove", onMove);

    function tick() {
      for (const l of letters) {
        const r = l.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy);
        const radius = 140;
        const force = Math.max(0, 1 - dist / radius);
        // ease toward target
        const ty = -force * 10;
        const cur = parseFloat(l.dataset.y || "0");
        const next = cur + (ty - cur) * 0.18;
        l.dataset.y = String(next);
        l.style.transform = `translateY(${next.toFixed(2)}px)`;
        l.style.textShadow = force > 0.05
          ? `0 0 ${Math.round(force * 24)}px rgba(52,211,153,${(force * 0.8).toFixed(2)})`
          : "none";
        l.style.color = force > 0.4 ? "#a7f3d0" : "";
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} data-l data-y="0" className="inline-block will-change-transform" aria-hidden>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

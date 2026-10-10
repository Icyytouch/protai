"use client";

import { useEffect, useRef } from "react";

/** Soft radial glow that follows the cursor inside its parent section. */
export function CursorGlow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    let raf = 0;
    let tx = -500;
    let ty = -500;
    let x = tx;
    let y = ty;

    function onMove(e: MouseEvent) {
      const r = parent.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    }
    function loop() {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.transform = `translate(${x - 250}px, ${y - 250}px)`;
      raf = requestAnimationFrame(loop);
    }
    parent.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        ref={ref}
        className="h-[500px] w-[500px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)",
          willChange: "transform",
        }}
      />
    </div>
  );
}

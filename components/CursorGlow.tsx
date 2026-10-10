"use client";

import { useEffect, useRef } from "react";

/** Soft radial glow that follows the cursor inside its parent section. */
export function CursorGlow({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let tx = -500;
    let ty = -500;
    let x = tx;
    let y = ty;

    function onMove(e: MouseEvent) {
      const container = ref.current?.parentElement;
      if (!container) return;
      const r = container.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    }

    function loop() {
      const node = ref.current;
      if (node) {
        x += (tx - x) * 0.08;
        y += (ty - y) * 0.08;
        node.style.transform = `translate(${x - 250}px, ${y - 250}px)`;
      }
      raf = requestAnimationFrame(loop);
    }

    const container = ref.current?.parentElement;
    if (!container) return;
    container.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    const el: HTMLElement = container;
    return () => {
      el.removeEventListener("mousemove", onMove);
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

"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** final numeric value */
  to: number;
  /** decimals to show */
  decimals?: number;
  /** suffix like "M", "%", "+" */
  suffix?: string;
  /** prefix like "$" */
  prefix?: string;
  /** animation duration in ms */
  duration?: number;
  className?: string;
};

/** Counts up from 0 to `to` when scrolled into view. */
export function CountUp({ to, decimals = 0, suffix = "", prefix = "", duration = 1400, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const t0 = performance.now();
            const tick = (t: number) => {
              const p = Math.min(1, (t - t0) / duration);
              // ease-out cubic
              const eased = 1 - Math.pow(1 - p, 3);
              setValue(to * eased);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

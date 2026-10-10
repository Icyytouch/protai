"use client";

import { useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** max tilt in degrees */
  max?: number;
  className?: string;
};

/** 3D perspective tilt that follows the cursor. */
export function TiltCard({ children, max = 10, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, o: 0 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setStyle({
      transform: `perspective(1200px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: "transform 0.1s ease-out",
    });
    setGlare({ x: px * 100, y: py * 100, o: 1 });
  }

  function onLeave() {
    setStyle({
      transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
    });
    setGlare((g) => ({ ...g, o: 0 }));
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className}`}
      style={{ transformStyle: "preserve-3d", ...style }}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
        style={{
          opacity: glare.o * 0.5,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.12), transparent 60%)`,
        }}
      />
    </div>
  );
}

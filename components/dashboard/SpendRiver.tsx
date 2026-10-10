"use client";

import { useEffect, useRef } from "react";

type Stream = { userId: string; units: number; hue: number };

/**
 * SpendRiver — usage as a living visualization. Each end user is a stream;
 * particles flow left-to-right, denser and faster the more they burn.
 * Pure canvas, no dependencies.
 */
export function SpendRiver({ streams, height = 220 }: { streams: Stream[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamsRef = useRef(streams);
  streamsRef.current = streams;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; v: number; size: number; stream: number; alpha: number };
    let particles: P[] = [];

    const maxUnits = Math.max(1, ...streamsRef.current.map((s) => s.units));
    const lanes = Math.max(1, streamsRef.current.length);

    function spawn() {
      const list = streamsRef.current;
      if (list.length === 0) return;
      // weighted pick: heavier burners spawn more particles
      const total = list.reduce((s, x) => s + x.units, 0) || 1;
      let r = Math.random() * total;
      let idx = 0;
      for (let i = 0; i < list.length; i++) {
        r -= list[i].units;
        if (r <= 0) { idx = i; break; }
      }
      const s = list[idx];
      const laneH = h / lanes;
      const yCenter = laneH * idx + laneH / 2;
      const intensity = s.units / maxUnits;
      particles.push({
        x: -8,
        y: yCenter + (Math.random() - 0.5) * laneH * 0.55,
        v: 0.6 + intensity * 2.4 + Math.random() * 0.6,
        size: 1 + intensity * 2.2 + Math.random() * 1.2,
        stream: idx,
        alpha: 0.35 + intensity * 0.55,
      });
    }

    let frame = 0;
    function tick() {
      frame++;
      ctx!.clearRect(0, 0, w, h);

      const list = streamsRef.current;
      const laneH = h / Math.max(1, list.length);

      // lane guides + labels
      ctx!.font = "10px ui-monospace, monospace";
      list.forEach((s, i) => {
        const y = laneH * i + laneH / 2;
        ctx!.strokeStyle = "rgba(63,63,70,0.35)";
        ctx!.beginPath();
        ctx!.moveTo(0, laneH * i);
        ctx!.lineTo(w, laneH * i);
        ctx!.stroke();
        ctx!.fillStyle = "rgba(113,113,122,0.9)";
        const label = s.userId.length > 18 ? s.userId.slice(0, 17) + "…" : s.userId;
        ctx!.fillText(label, 8, y - 8);
        ctx!.fillStyle = "rgba(113,113,122,0.55)";
        ctx!.fillText(`${s.units.toLocaleString()}u`, 8, y + 12);
      });

      // spawn rate scales with total activity
      const total = list.reduce((s, x) => s + x.units, 0);
      const spawnN = list.length === 0 ? 0 : Math.min(6, 1 + Math.floor(total / Math.max(1, maxUnits) * 2));
      for (let i = 0; i < spawnN; i++) if (Math.random() < 0.7) spawn();

      // update + draw
      particles = particles.filter((p) => p.x < w + 10);
      for (const p of particles) {
        p.x += p.v;
        // gentle sine drift
        p.y += Math.sin((p.x + frame * 2) * 0.02) * 0.35;
        const s = list[p.stream];
        const hue = s ? s.hue : 160;
        // glow
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        g.addColorStop(0, `hsla(${hue}, 90%, 60%, ${p.alpha})`);
        g.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx!.fill();
        // core
        ctx!.fillStyle = `hsla(${hue}, 95%, 72%, ${Math.min(1, p.alpha + 0.25)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ height, width: "100%" }} className="block" />;
}

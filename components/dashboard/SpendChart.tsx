import { getUser } from "@/components/supabase/server";
import { Card } from "@/components/ui";

type Point = { day: string; units: number };

function AreaChart({ data, height = 120 }: { data: Point[]; height?: number }) {
  const w = 600;
  const h = height;
  const pad = 4;
  const max = Math.max(1, ...data.map((d) => d.units));
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;

  const pts = data.map((d, i) => ({
    x: pad + i * stepX,
    y: h - pad - (d.units / max) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${(w - pad).toFixed(1)},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="#27272a" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#spend-fill)" />
      <path d={line} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#34d399" opacity={data[i].units > 0 ? 1 : 0} />
      ))}
    </svg>
  );
}

/** Units reported per day over the last 14 days, per meter. */
export async function SpendChart({ projectId }: { projectId: string }) {
  const { supabase } = await getUser();
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data: meters } = await supabase
    .from("meters")
    .select("id,slug")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .limit(4);

  const meterList = (meters as Array<{ id: string; slug: string }>) ?? [];
  if (meterList.length === 0) return null;

  const { data: rows } = await supabase
    .from("ledger")
    .select("meter_id,units,created_at")
    .eq("project_id", projectId)
    .eq("kind", "report")
    .gte("created_at", since.toISOString())
    .limit(5000);

  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const byMeter = new Map<string, Point[]>(
    meterList.map((m) => [m.id, days.map((day) => ({ day, units: 0 }))])
  );
  for (const r of (rows as Array<{ meter_id: string; units: number; created_at: string }>) ?? []) {
    const series = byMeter.get(r.meter_id);
    if (!series) continue;
    const day = r.created_at.slice(0, 10);
    const pt = series.find((p) => p.day === day);
    if (pt) pt.units += Number(r.units) || 0;
  }

  const total = [...byMeter.values()].flat().reduce((s, p) => s + p.units, 0);

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-zinc-100">Usage — last 14 days</h3>
        <p className="font-mono text-xs text-zinc-500">{total.toLocaleString()} units reported</p>
      </div>
      <div className="mt-4 space-y-5">
        {meterList.map((m) => {
          const series = byMeter.get(m.id) ?? [];
          const mTotal = series.reduce((s, p) => s + p.units, 0);
          return (
            <div key={m.id}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <code className="font-mono text-xs text-emerald-300">{m.slug}</code>
                <span className="font-mono text-xs text-zinc-500">{mTotal.toLocaleString()} units</span>
              </div>
              <AreaChart data={series} />
              <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
                <span>{days[0].slice(5)}</span>
                <span>{days[13].slice(5)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

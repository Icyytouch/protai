"use client";

/**
 * Animated data-flow diagram: your app -> ProtAI check -> AI provider ->
 * ProtAI report -> alerts & dashboard. Dashes flow along every connection.
 */
export function FlowDiagram() {
  const nodes = [
    { x: 90, label: "Your app", sub: "user prompt", color: "#a1a1aa" },
    { x: 300, label: "ProtAI check()", sub: "balance ok?", color: "#34d399" },
    { x: 510, label: "AI provider", sub: "OpenAI / Anthropic", color: "#38bdf8" },
    { x: 720, label: "ProtAI report()", sub: "tokens spent", color: "#34d399" },
    { x: 930, label: "Alerts", sub: "80% · kill-switch", color: "#fbbf24" },
  ];
  const y = 70;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 1020 150"
        className="mx-auto min-w-[720px]"
        role="img"
        aria-label="How ProtAI meters your AI usage"
      >
        <defs>
          <linearGradient id="flow-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* connections */}
        {nodes.slice(0, -1).map((n, i) => (
          <g key={i}>
            <line
              x1={n.x + 62}
              y1={y}
              x2={nodes[i + 1].x - 62}
              y2={y}
              stroke="#3f3f46"
              strokeWidth="2"
            />
            <line
              x1={n.x + 62}
              y1={y}
              x2={nodes[i + 1].x - 62}
              y2={y}
              stroke="url(#flow-line)"
              strokeWidth="2"
              strokeDasharray="8 10"
              className="flow-dash"
            />
            {/* traveling pulse */}
            <circle r="3.5" fill="#34d399" className="flow-pulse" style={{ animationDelay: `${i * 0.9}s` }}>
              <animateMotion
                dur="3.6s"
                repeatCount="indefinite"
                path={`M ${n.x + 62} ${y} L ${nodes[i + 1].x - 62} ${y}`}
              />
            </circle>
          </g>
        ))}

        {/* nodes */}
        {nodes.map((n) => (
          <g key={n.label}>
            <rect
              x={n.x - 62}
              y={y - 34}
              width="124"
              height="68"
              rx="14"
              fill="#09090b"
              stroke={n.color}
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
            <text x={n.x} y={y - 2} textAnchor="middle" fill="#f4f4f5" fontSize="13" fontWeight="600" fontFamily="inherit">
              {n.label}
            </text>
            <text x={n.x} y={y + 17} textAnchor="middle" fill="#71717a" fontSize="11" fontFamily="ui-monospace, monospace">
              {n.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

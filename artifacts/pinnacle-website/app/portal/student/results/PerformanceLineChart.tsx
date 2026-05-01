"use client";

interface Point {
  exam: string;
  pct: number;
}

interface SeriesConfig {
  subject: string;
  color: string;
  points: Point[];
}

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#16a34a",
};

export function PerformanceLineChart({ series }: { series: { subject: string; points: Point[] }[] }) {
  if (series.length === 0 || series[0].points.length === 0) return null;

  const allExams = series[0].points.map((p) => p.exam);
  const W = 580;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 48, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  function x(i: number) {
    return PAD.left + (allExams.length === 1 ? chartW / 2 : (i / (allExams.length - 1)) * chartW);
  }
  function y(pct: number) {
    return PAD.top + chartH - (pct / 100) * chartH;
  }

  const configs: SeriesConfig[] = series.map((s) => ({
    subject: s.subject,
    color: SUBJECT_COLORS[s.subject] ?? "#64748b",
    points: s.points,
  }));

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Performance trend chart">
      {/* Y-axis grid lines and labels */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            y1={y(tick)}
            x2={W - PAD.right}
            y2={y(tick)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 6}
            y={y(tick) + 4}
            fontSize="10"
            fill="#94a3b8"
            textAnchor="end"
          >
            {tick}%
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {allExams.map((exam, i) => (
        <text
          key={exam}
          x={x(i)}
          y={H - 6}
          fontSize="9"
          fill="#64748b"
          textAnchor="middle"
        >
          {exam.replace("Unit Test ", "UT").replace("Monthly Test — ", "").slice(0, 16)}
        </text>
      ))}

      {/* Lines */}
      {configs.map((cfg) => {
        if (cfg.points.length < 2) return null;
        const d = cfg.points
          .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.pct)}`)
          .join(" ");
        return (
          <path
            key={cfg.subject}
            d={d}
            fill="none"
            stroke={cfg.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Dots and tooltips */}
      {configs.map((cfg) =>
        cfg.points.map((p, i) => (
          <g key={`${cfg.subject}-${i}`}>
            <circle
              cx={x(i)}
              cy={y(p.pct)}
              r="5"
              fill="white"
              stroke={cfg.color}
              strokeWidth="2.5"
            />
            <title>{`${cfg.subject} — ${p.exam}: ${p.pct}%`}</title>
          </g>
        ))
      )}

      {/* Legend */}
      {configs.map((cfg, i) => (
        <g key={`legend-${cfg.subject}`} transform={`translate(${PAD.left + i * 120}, ${H - PAD.bottom + 20})`}>
          <line x1="0" y1="5" x2="14" y2="5" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="7" cy="5" r="3" fill="white" stroke={cfg.color} strokeWidth="2" />
          <text x="18" y="9" fontSize="10" fill="#475569">{cfg.subject}</text>
        </g>
      ))}
    </svg>
  );
}

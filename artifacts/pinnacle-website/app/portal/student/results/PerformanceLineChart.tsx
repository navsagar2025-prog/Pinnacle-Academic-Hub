"use client";

interface Point {
  exam: string;
  pct: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#16a34a",
};

export function PerformanceLineChart({ series }: { series: { subject: string; points: Point[] }[] }) {
  if (series.length === 0) return null;

  // Build union of all exam names preserving order of first appearance
  const examSet = new Set<string>();
  series.forEach((s) => s.points.forEach((p) => examSet.add(p.exam)));
  const allExams = Array.from(examSet);
  if (allExams.length === 0) return null;

  // Align each series to the union axis (null where subject has no data)
  const aligned = series.map((s) => {
    const lookup = new Map(s.points.map((p) => [p.exam, p.pct]));
    return {
      subject: s.subject,
      color: SUBJECT_COLORS[s.subject] ?? "#64748b",
      values: allExams.map((e) => lookup.get(e) ?? null) as (number | null)[],
    };
  });

  const W = 580;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 48, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  function px(i: number) {
    return PAD.left + (allExams.length === 1 ? chartW / 2 : (i / (allExams.length - 1)) * chartW);
  }
  function py(pct: number) {
    return PAD.top + chartH - (pct / 100) * chartH;
  }

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Performance trend chart">
      {/* Y-axis grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} y1={py(tick)} x2={W - PAD.right} y2={py(tick)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PAD.left - 6} y={py(tick) + 4} fontSize="10" fill="#94a3b8" textAnchor="end">{tick}%</text>
        </g>
      ))}

      {/* X-axis labels */}
      {allExams.map((exam, i) => (
        <text key={exam} x={px(i)} y={H - 6} fontSize="9" fill="#64748b" textAnchor="middle">
          {exam.replace("Unit Test ", "UT").replace("Monthly Test — ", "").slice(0, 16)}
        </text>
      ))}

      {/* Lines — built per connected segment to handle null gaps */}
      {aligned.map((cfg) => {
        const segments: string[] = [];
        let d = "";
        cfg.values.forEach((v, i) => {
          if (v === null) {
            if (d) { segments.push(d); d = ""; }
          } else {
            d += `${d ? "L" : "M"}${px(i)},${py(v)}`;
          }
        });
        if (d) segments.push(d);
        return segments.map((seg, si) => (
          <path
            key={`${cfg.subject}-line-${si}`}
            d={seg}
            fill="none"
            stroke={cfg.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ));
      })}

      {/* Dots — only where data exists */}
      {aligned.map((cfg) =>
        cfg.values.map((v, i) =>
          v === null ? null : (
            <g key={`${cfg.subject}-dot-${i}`}>
              <circle cx={px(i)} cy={py(v)} r="5" fill="white" stroke={cfg.color} strokeWidth="2.5" />
              <title>{`${cfg.subject} — ${allExams[i]}: ${v}%`}</title>
            </g>
          )
        )
      )}

      {/* Legend */}
      {aligned.map((cfg, i) => (
        <g key={`legend-${cfg.subject}`} transform={`translate(${PAD.left + i * 120}, ${H - PAD.bottom + 20})`}>
          <line x1="0" y1="5" x2="14" y2="5" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="7" cy="5" r="3" fill="white" stroke={cfg.color} strokeWidth="2" />
          <text x="18" y="9" fontSize="10" fill="#475569">{cfg.subject}</text>
        </g>
      ))}
    </svg>
  );
}

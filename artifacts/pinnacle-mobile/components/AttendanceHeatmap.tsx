import React, { useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKS = 5;
const GAP = 4;

type CellStatus = "present" | "absent" | "future" | "holiday";

interface Cell {
  date: Date;
  status: CellStatus;
  label: string;
}

function generateCells(): Cell[] {
  const today = new Date();
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMon - (WEEKS - 1) * 7);
  monday.setHours(0, 0, 0, 0);

  const seed = (n: number) => {
    const x = Math.sin(n) * 10000;
    return x - Math.floor(x);
  };

  const cells: Cell[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 6; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + w * 7 + d);
      const label = `${date.getDate()}/${date.getMonth() + 1}`;
      if (date > today) {
        cells.push({ date, status: "future", label });
      } else {
        const r = seed(w * 100 + d * 7 + date.getDate());
        const status: CellStatus = r > 0.88 ? "absent" : r > 0.85 ? "holiday" : "present";
        cells.push({ date, status, label });
      }
    }
  }
  return cells;
}

function statusColor(status: CellStatus, colors: ReturnType<typeof import("@/hooks/useColors").useColors>): string {
  switch (status) {
    case "present": return "#22c55e";
    case "absent": return "#ef4444";
    case "holiday": return "#C9A84C";
    case "future": return colors.muted;
  }
}

export default function AttendanceHeatmap() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const cells = useMemo(() => generateCells(), []);

  const availableWidth = width - 32;
  const labelColWidth = 34;
  const gridWidth = availableWidth - labelColWidth;
  const cellSize = Math.floor((gridWidth - (WEEKS - 1) * GAP) / WEEKS);
  const svgHeight = 6 * cellSize + 5 * GAP + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>
        ATTENDANCE CALENDAR — LAST {WEEKS} WEEKS
      </Text>

      <View style={styles.grid}>
        <Svg width={availableWidth} height={svgHeight}>
          {DAY_LABELS.map((label, d) => (
            <SvgText
              key={d}
              x={labelColWidth - 4}
              y={24 + d * (cellSize + GAP) + cellSize / 2 + 4}
              fontSize={9}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {label}
            </SvgText>
          ))}

          {cells.map((cell, i) => {
            const w = Math.floor(i / 6);
            const d = i % 6;
            const x = labelColWidth + w * (cellSize + GAP);
            const y = 20 + d * (cellSize + GAP);
            const fill = statusColor(cell.status, colors);
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={4}
                fill={fill}
                opacity={cell.status === "future" ? 0.4 : 1}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.legend}>
        {[
          { status: "present" as CellStatus, label: "Present" },
          { status: "absent" as CellStatus, label: "Absent" },
          { status: "holiday" as CellStatus, label: "Holiday" },
          { status: "future" as CellStatus, label: "Upcoming" },
        ].map(({ status, label }) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: statusColor(status, colors), opacity: status === "future" ? 0.4 : 1 }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 14, marginBottom: 14 },
  title: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  grid: { alignItems: "flex-start" },
  legend: { flexDirection: "row", gap: 12, marginTop: 10, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { fontSize: 10 },
});

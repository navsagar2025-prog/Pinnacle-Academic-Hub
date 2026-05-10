import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import AttendanceHeatmap from "@/components/AttendanceHeatmap";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { lightHaptic } from "@/lib/haptics";
import { useRefresh } from "@/lib/useRefresh";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May"];

type SubjectRecord = { subject: string; present: number; total: number; color: string };

const subjects: SubjectRecord[] = [
  { subject: "Physics", present: 22, total: 24, color: "#0A1F5C" },
  { subject: "Chemistry", present: 21, total: 25, color: "#0D7377" },
  { subject: "Mathematics", present: 20, total: 25, color: "#8B1A1A" },
  { subject: "Biology", present: 22, total: 25, color: "#C9A84C" },
  { subject: "Mock Tests", present: 10, total: 12, color: "#6B7280" },
];

const monthAttendance: Record<string, number> = {
  Jan: 91, Feb: 88, Mar: 84, Apr: 88, May: 80,
};

const overallPresent = subjects.reduce((a, s) => a + s.present, 0);
const overallTotal = subjects.reduce((a, s) => a + s.total, 0);
const overallPct = Math.round((overallPresent / overallTotal) * 100);

function AnimatedBar({ percentage, color, delay = 0 }: { percentage: number; color: string; delay?: number }) {
  const colors = useColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    if (containerWidth > 0) {
      barWidth.value = withDelay(delay, withTiming(containerWidth * (percentage / 100), { duration: 750 }));
    }
  }, [containerWidth, percentage, delay, barWidth]);

  const barStyle = useAnimatedStyle(() => ({ width: barWidth.value }));

  return (
    <View
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      style={[styles.barBg, { backgroundColor: colors.muted }]}
    >
      <Animated.View style={[styles.barFill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}

export default function StudentAttendance() {
  const colors = useColors();
  const [activeMonth, setActiveMonth] = useState("Apr");

  const pct = (present: number, total: number) => Math.round((present / total) * 100);
  const barColor = (p: number) => (p >= 85 ? colors.success : p >= 75 ? colors.warning : colors.maroon);

  const fetchFn = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 600));
  }, []);
  const { refreshing, onRefresh } = useRefresh(fetchFn);

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <SectionHeader title="My Attendance" />

      <View
        style={[
          styles.overallCard,
          {
            backgroundColor: overallPct >= 75 ? colors.secondary + "15" : colors.maroon + "15",
            borderColor: overallPct >= 75 ? colors.secondary : colors.maroon,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.overallLeft}>
          <Text style={[styles.overallPct, { color: overallPct >= 75 ? colors.secondary : colors.maroon }]}>
            {overallPct}%
          </Text>
          <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>Overall Attendance</Text>
          <Text style={[styles.overallSub, { color: colors.mutedForeground }]}>
            {overallPresent} / {overallTotal} classes attended
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: overallPct >= 75 ? colors.success + "18" : colors.maroon + "18", borderRadius: 6 }]}>
          <Feather
            name={overallPct >= 75 ? "check-circle" : "alert-circle"}
            size={14}
            color={overallPct >= 75 ? colors.success : colors.maroon}
          />
          <Text style={[styles.statusText, { color: overallPct >= 75 ? colors.success : colors.maroon }]}>
            {overallPct >= 75 ? "On Track" : "Below 75%"}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <AttendanceHeatmap />
      </View>

      <View style={{ marginTop: 4 }}>
        <SectionHeader title="Monthly Trend" />
        <View style={styles.monthRow}>
          {MONTHS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { lightHaptic(); setActiveMonth(m); }}
              style={[
                styles.monthBtn,
                { backgroundColor: activeMonth === m ? colors.primary : colors.muted, borderRadius: colors.radius - 4 },
              ]}
            >
              <Text style={[styles.monthLabel, { color: activeMonth === m ? colors.primaryForeground : colors.mutedForeground }]}>{m}</Text>
              <Text style={[styles.monthPct, { color: activeMonth === m ? colors.primaryForeground : colors.foreground }]}>
                {monthAttendance[m]}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader title="Subject-Wise Breakdown" />
        {subjects.map((s, i) => {
          const p = pct(s.present, s.total);
          const bc = barColor(p);
          return (
            <View
              key={i}
              style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectDot, { backgroundColor: s.color + "30", borderRadius: 6 }]}>
                  <View style={[styles.dotInner, { backgroundColor: s.color, borderRadius: 3 }]} />
                </View>
                <Text style={[styles.subjectName, { color: colors.foreground }]}>{s.subject}</Text>
                <Text style={[styles.subjectCount, { color: colors.mutedForeground }]}>{s.present}/{s.total}</Text>
                <Text style={[styles.subjectPct, { color: bc, fontWeight: "700" }]}>{p}%</Text>
              </View>
              <AnimatedBar percentage={p} color={bc} delay={i * 120} />
              {p < 75 && (
                <Text style={[styles.warning, { color: colors.maroon }]}>
                  ⚠ Below minimum 75% — contact faculty
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overallCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, padding: 16, marginTop: 8 },
  overallLeft: { gap: 3 },
  overallPct: { fontSize: 36, fontWeight: "800" },
  overallLabel: { fontSize: 13, fontWeight: "600" },
  overallSub: { fontSize: 11 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, padding: 8 },
  statusText: { fontSize: 12, fontWeight: "700" },
  monthRow: { flexDirection: "row", gap: 8 },
  monthBtn: { flex: 1, paddingHorizontal: 4, paddingVertical: 10, alignItems: "center", gap: 4 },
  monthLabel: { fontSize: 11, fontWeight: "600" },
  monthPct: { fontSize: 13, fontWeight: "700" },
  subjectCard: { borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectDot: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  dotInner: { width: 10, height: 10 },
  subjectName: { flex: 1, fontSize: 14, fontWeight: "600" },
  subjectCount: { fontSize: 11 },
  subjectPct: { fontSize: 15, minWidth: 40, textAlign: "right" },
  barBg: { height: 7, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 7, borderRadius: 4 },
  warning: { fontSize: 11, fontWeight: "600", marginTop: 2 },
});

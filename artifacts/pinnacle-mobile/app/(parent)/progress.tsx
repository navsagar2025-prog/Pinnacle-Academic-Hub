import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const subjectAttendance = [
  { subject: "Physics", pct: 92, color: "#0A1F5C" },
  { subject: "Chemistry", pct: 84, color: "#0D7377" },
  { subject: "Mathematics", pct: 80, color: "#8B1A1A" },
  { subject: "Biology", pct: 88, color: "#C9A84C" },
];

const recentTests = [
  { name: "JEE Mains Mock 5", date: "28 Apr", score: 224, max: 300, rank: 4 },
  { name: "Physics Unit Test 4", date: "20 Apr", score: 82, max: 100, rank: 3 },
  { name: "Chemistry Unit Test 4", date: "18 Apr", score: 74, max: 100, rank: 7 },
  { name: "JEE Mains Mock 4", date: "10 Apr", score: 198, max: 300, rank: 8 },
];

const trendPcts = [62, 66, 70, 74, 72, 78, 75];
const trendLabels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

export default function ParentProgress() {
  const colors = useColors();
  const pct = (s: number, m: number) => Math.round((s / m) * 100);
  const scoreColor = (p: number) =>
    p >= 80 ? colors.success : p >= 60 ? colors.secondary : colors.warning;

  const avgAttendance = Math.round(
    subjectAttendance.reduce((a, s) => a + s.pct, 0) / subjectAttendance.length
  );
  const avgScore = Math.round(
    recentTests.reduce((a, t) => a + pct(t.score, t.max), 0) / recentTests.length
  );

  return (
    <ScreenContainer>
      <SectionHeader title="Arjun's Progress" />

      <View style={[styles.summaryRow, { marginTop: 8 }]}>
        {[
          { label: "Attendance", value: `${avgAttendance}%`, color: colors.secondary },
          { label: "Avg Score", value: `${avgScore}%`, color: colors.primary },
          { label: "Class Rank", value: "#4", color: colors.gold },
          { label: "Tests Done", value: "12", color: colors.maroon },
        ].map((s, i) => (
          <View
            key={i}
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader title="Performance Trend" />
        <View
          style={[
            styles.trendCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.trendBars}>
            {trendPcts.map((p, i) => {
              const bc = scoreColor(p);
              return (
                <View key={i} style={styles.trendCol}>
                  <Text style={[styles.trendPct, { color: bc }]}>{p}%</Text>
                  <View style={[styles.trendTrack, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.trendFill,
                        {
                          height: `${p}%` as unknown as number,
                          backgroundColor: bc,
                          borderRadius: 3,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.trendLabel, { color: colors.mutedForeground }]}>
                    {trendLabels[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader title="Attendance by Subject" />
        {subjectAttendance.map((s, i) => (
          <View
            key={i}
            style={[
              styles.attendanceRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={[styles.subjectDot, { backgroundColor: s.color + "25", borderRadius: 6 }]}>
              <View style={[{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }]} />
            </View>
            <Text style={[styles.subjectName, { color: colors.foreground }]}>{s.subject}</Text>
            <View style={[styles.barBg, { backgroundColor: colors.muted, borderRadius: 4 }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${s.pct}%` as unknown as number,
                    backgroundColor: s.pct >= 75 ? colors.success : colors.maroon,
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.subjectPct,
                { color: s.pct >= 75 ? colors.success : colors.maroon },
              ]}
            >
              {s.pct}%
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader title="Recent Test Scores" />
        {recentTests.map((t, i) => {
          const p = pct(t.score, t.max);
          const bc = scoreColor(p);
          return (
            <View
              key={i}
              style={[
                styles.testRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={[styles.rankBox, { backgroundColor: bc + "18", borderRadius: 6 }]}>
                <Text style={[styles.rankText, { color: bc }]}>#{t.rank}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.testName, { color: colors.foreground }]}>{t.name}</Text>
                <Text style={[styles.testDate, { color: colors.mutedForeground }]}>{t.date}</Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreFraction, { color: bc }]}>
                  {t.score}<Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>/{t.max}</Text>
                </Text>
                <Text style={[styles.scorePct, { color: bc }]}>{p}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: {
    width: "47%",
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  trendCard: { borderWidth: 1, padding: 14 },
  trendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 100,
    paddingBottom: 4,
  },
  trendCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  trendPct: { fontSize: 9, fontWeight: "700" },
  trendTrack: { flex: 1, width: "100%", borderRadius: 3, overflow: "hidden", justifyContent: "flex-end" },
  trendFill: { width: "100%", borderRadius: 3 },
  trendLabel: { fontSize: 9 },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  subjectDot: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  subjectName: { width: 90, fontSize: 13, fontWeight: "600" },
  barBg: { flex: 1, height: 7, overflow: "hidden" },
  barFill: { height: 7 },
  subjectPct: { fontSize: 13, fontWeight: "700", minWidth: 38, textAlign: "right" },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  rankBox: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 13, fontWeight: "800" },
  testName: { fontSize: 13, fontWeight: "600" },
  testDate: { fontSize: 11 },
  scoreCol: { alignItems: "flex-end", gap: 2 },
  scoreFraction: { fontSize: 16, fontWeight: "700" },
  scoreMax: { fontSize: 12, fontWeight: "400" },
  scorePct: { fontSize: 11, fontWeight: "600" },
});

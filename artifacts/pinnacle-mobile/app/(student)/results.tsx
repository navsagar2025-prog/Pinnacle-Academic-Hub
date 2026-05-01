import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type TestResult = {
  name: string;
  date: string;
  subject: string;
  score: number;
  maxScore: number;
  rank: number;
};

const tests: TestResult[] = [
  { name: "JEE Mains Mock 5", date: "28 Apr", subject: "PCM", score: 224, maxScore: 300, rank: 4 },
  { name: "Physics Unit Test 4", date: "20 Apr", subject: "Physics", score: 82, maxScore: 100, rank: 3 },
  { name: "Chemistry Unit Test 4", date: "18 Apr", subject: "Chemistry", score: 74, maxScore: 100, rank: 7 },
  { name: "JEE Mains Mock 4", date: "10 Apr", subject: "PCM", score: 198, maxScore: 300, rank: 8 },
  { name: "Maths Unit Test 3", date: "5 Apr", subject: "Maths", score: 88, maxScore: 100, rank: 2 },
  { name: "Physics Unit Test 3", date: "25 Mar", subject: "Physics", score: 76, maxScore: 100, rank: 5 },
  { name: "JEE Mains Mock 3", date: "15 Mar", subject: "PCM", score: 185, maxScore: 300, rank: 9 },
];

const FILTERS = ["All", "PCM", "Physics", "Chemistry", "Maths"];

export default function StudentResults() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? tests : tests.filter((t) => t.subject === filter);
  const pct = (s: number, m: number) => Math.round((s / m) * 100);
  const scoreColor = (p: number) =>
    p >= 80 ? colors.success : p >= 60 ? colors.secondary : colors.warning;

  const bestScore = Math.max(...tests.map((t) => pct(t.score, t.maxScore)));
  const avgScore = Math.round(
    tests.reduce((a, t) => a + pct(t.score, t.maxScore), 0) / tests.length
  );

  return (
    <ScreenContainer>
      <SectionHeader title="Test Performance" />

      <View style={[styles.summaryRow, { marginTop: 8 }]}>
        {[
          { label: "Tests Taken", value: String(tests.length), color: colors.primary },
          { label: "Best Score", value: `${bestScore}%`, color: colors.success },
          { label: "Average", value: `${avgScore}%`, color: colors.secondary },
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
        <SectionHeader title="Performance Chart" />
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.chartBars}>
            {tests
              .slice()
              .reverse()
              .map((t, i) => {
                const p = pct(t.score, t.maxScore);
                const bc = scoreColor(p);
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barPct, { color: bc }]}>{p}%</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${p}%` as unknown as number,
                            backgroundColor: bc,
                            borderRadius: 3,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                      M{tests.length - i}
                    </Text>
                  </View>
                );
              })}
          </View>
          <View
            style={[
              styles.chartLegend,
              { borderTopColor: colors.border },
            ]}
          >
            {[
              { label: "80%+  Excellent", color: colors.success },
              { label: "60–79%  Good", color: colors.secondary },
              { label: "< 60%  Needs Work", color: colors.warning },
            ].map((l, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Recent Tests" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16, marginBottom: 12 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: filter === f ? colors.primary : colors.muted,
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((t, i) => {
          const p = pct(t.score, t.maxScore);
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
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: bc + "18", borderRadius: 6 },
                ]}
              >
                <Text style={[styles.rankText, { color: bc }]}>#{t.rank}</Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.testName, { color: colors.foreground }]}>{t.name}</Text>
                <Text style={[styles.testMeta, { color: colors.mutedForeground }]}>
                  {t.subject} · {t.date}
                </Text>
                <View style={[styles.scoreBar, { backgroundColor: colors.muted, borderRadius: 3 }]}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      { width: `${p}%` as unknown as number, backgroundColor: bc, borderRadius: 3 },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreMain, { color: bc }]}>
                  {t.score}
                </Text>
                <Text style={[styles.scoreMax, { color: colors.mutedForeground }]}>/{t.maxScore}</Text>
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
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "500", textAlign: "center" },
  chartCard: { borderWidth: 1, padding: 14, gap: 0 },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 120,
    paddingBottom: 4,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barPct: { fontSize: 9, fontWeight: "700" },
  barTrack: { flex: 1, width: "100%", borderRadius: 3, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 3 },
  barLabel: { fontSize: 9 },
  chartLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontSize: 12, fontWeight: "600" },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  rankBadge: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 13, fontWeight: "800" },
  testName: { fontSize: 13, fontWeight: "600" },
  testMeta: { fontSize: 11 },
  scoreBar: { height: 4, overflow: "hidden", marginTop: 4 },
  scoreBarFill: { height: 4 },
  scoreCol: { alignItems: "center", gap: 2, minWidth: 48 },
  scoreMain: { fontSize: 18, fontWeight: "800" },
  scoreMax: { fontSize: 10 },
  scorePct: { fontSize: 11, fontWeight: "600" },
});

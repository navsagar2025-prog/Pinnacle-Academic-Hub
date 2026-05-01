import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May"];

type SubjectRecord = {
  subject: string;
  present: number;
  total: number;
  color: string;
};

const subjects: SubjectRecord[] = [
  { subject: "Physics", present: 22, total: 24, color: "#0A1F5C" },
  { subject: "Chemistry", present: 21, total: 25, color: "#0D7377" },
  { subject: "Mathematics", present: 20, total: 25, color: "#8B1A1A" },
  { subject: "Biology", present: 22, total: 25, color: "#C9A84C" },
  { subject: "Mock Tests", present: 10, total: 12, color: "#6B7280" },
];

const monthAttendance: Record<string, number> = {
  Jan: 91,
  Feb: 88,
  Mar: 84,
  Apr: 88,
  May: 80,
};

const overallPresent = subjects.reduce((a, s) => a + s.present, 0);
const overallTotal = subjects.reduce((a, s) => a + s.total, 0);
const overallPct = Math.round((overallPresent / overallTotal) * 100);

export default function StudentAttendance() {
  const colors = useColors();
  const [activeMonth, setActiveMonth] = useState("Apr");

  const pct = (present: number, total: number) => Math.round((present / total) * 100);
  const barColor = (p: number) => (p >= 85 ? colors.success : p >= 75 ? colors.warning : colors.maroon);

  return (
    <ScreenContainer>
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
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: overallPct >= 75 ? colors.success + "18" : colors.maroon + "18",
              borderRadius: 6,
            },
          ]}
        >
          <Feather
            name={overallPct >= 75 ? "check-circle" : "alert-circle"}
            size={14}
            color={overallPct >= 75 ? colors.success : colors.maroon}
          />
          <Text
            style={[
              styles.statusText,
              { color: overallPct >= 75 ? colors.success : colors.maroon },
            ]}
          >
            {overallPct >= 75 ? "On Track" : "Below 75%"}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader title="Monthly Trend" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {MONTHS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setActiveMonth(m)}
              style={[
                styles.monthBtn,
                {
                  backgroundColor: activeMonth === m ? colors.primary : colors.muted,
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Text
                style={[
                  styles.monthLabel,
                  { color: activeMonth === m ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {m}
              </Text>
              <Text
                style={[
                  styles.monthPct,
                  { color: activeMonth === m ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {monthAttendance[m]}%
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionHeader title="Subject-Wise Breakdown" />
        {subjects.map((s, i) => {
          const p = pct(s.present, s.total);
          const bc = barColor(p);
          return (
            <View
              key={i}
              style={[
                styles.subjectCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={styles.subjectHeader}>
                <View
                  style={[
                    styles.subjectDot,
                    { backgroundColor: s.color + "30", borderRadius: 6 },
                  ]}
                >
                  <View
                    style={[
                      styles.dotInner,
                      { backgroundColor: s.color, borderRadius: 3 },
                    ]}
                  />
                </View>
                <Text style={[styles.subjectName, { color: colors.foreground }]}>
                  {s.subject}
                </Text>
                <Text style={[styles.subjectCount, { color: colors.mutedForeground }]}>
                  {s.present}/{s.total} classes
                </Text>
                <Text style={[styles.subjectPct, { color: bc, fontWeight: "700" }]}>
                  {p}%
                </Text>
              </View>
              <View style={[styles.barBg, { backgroundColor: colors.muted, borderRadius: 4 }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${p}%` as unknown as number,
                      backgroundColor: bc,
                      borderRadius: 4,
                    },
                  ]}
                />
              </View>
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
  overallCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  overallLeft: { gap: 3 },
  overallPct: { fontSize: 36, fontWeight: "800" },
  overallLabel: { fontSize: 13, fontWeight: "600" },
  overallSub: { fontSize: 11 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, padding: 8 },
  statusText: { fontSize: 12, fontWeight: "700" },
  monthBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", gap: 4, minWidth: 68 },
  monthLabel: { fontSize: 12, fontWeight: "600" },
  monthPct: { fontSize: 14, fontWeight: "700" },
  subjectCard: { borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectDot: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  dotInner: { width: 10, height: 10 },
  subjectName: { flex: 1, fontSize: 14, fontWeight: "600" },
  subjectCount: { fontSize: 11 },
  subjectPct: { fontSize: 15, minWidth: 40, textAlign: "right" },
  barBg: { height: 7, overflow: "hidden" },
  barFill: { height: 7 },
  warning: { fontSize: 11, fontWeight: "600", marginTop: 2 },
});

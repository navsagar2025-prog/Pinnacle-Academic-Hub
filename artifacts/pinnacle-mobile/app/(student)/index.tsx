import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import Svg, { Circle, Polyline } from "react-native-svg";
import ClassRow from "@/components/ClassRow";
import NoticeRow from "@/components/NoticeRow";
import RoleHeader from "@/components/RoleHeader";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import StreakBadge from "@/components/StreakBadge";
import { useColors } from "@/hooks/useColors";
import { lightHaptic } from "@/lib/haptics";
import { fetchPublicNotices, formatNoticeDate } from "@/lib/api";

const upcomingClasses = [
  { subject: "Physics", topic: "Thermodynamics", time: "5:00 – 7:00 PM", date: "Today", teacher: "Dr. Ramesh Kumar" },
  { subject: "Chemistry", topic: "Organic Chemistry", time: "5:00 – 7:00 PM", date: "Tomorrow", teacher: "Ms. Priya Sharma" },
  { subject: "Mathematics", topic: "Integral Calculus", time: "5:00 – 7:00 PM", date: "26 Apr", teacher: "Mr. Ajay Tiwari" },
];

const fallbackNotices = [
  { date: "20 Apr", title: "Mock Test: JEE Mains Full Syllabus on May 1" },
  { date: "18 Apr", title: "Physics Notes Updated – Thermodynamics Module" },
  { date: "15 Apr", title: "Holiday: April 25 — Institute Closed" },
];

const scoreHistory = [66, 68, 70, 74, 70, 74, 75];

function SparklineChart() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const chartWidth = width - 32;
  const chartHeight = 48;
  const pad = { x: 8, y: 8 };
  const plotW = chartWidth - pad.x * 2;
  const plotH = chartHeight - pad.y * 2;
  const min = Math.min(...scoreHistory) - 2;
  const max = Math.max(...scoreHistory) + 2;
  const range = max - min;
  const pts = scoreHistory
    .map((v, i) => {
      const x = pad.x + (i / (scoreHistory.length - 1)) * plotW;
      const y = pad.y + ((max - v) / range) * plotH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={[styles.sparkCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[styles.sparkLabel, { color: colors.mutedForeground }]}>Score trend (last 7 tests)</Text>
      <Svg width={chartWidth} height={chartHeight}>
        <Polyline points={pts} fill="none" stroke={colors.secondary} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {scoreHistory.map((v, i) => {
          const x = pad.x + (i / (scoreHistory.length - 1)) * plotW;
          const y = pad.y + ((max - v) / range) * plotH;
          return <Circle key={i} cx={x} cy={y} r={i === scoreHistory.length - 1 ? 4 : 2.5} fill={colors.secondary} />;
        })}
      </Svg>
      <View style={styles.sparkFooter}>
        <Text style={[styles.sparkStat, { color: colors.mutedForeground }]}>Lowest: {Math.min(...scoreHistory)}%</Text>
        <Text style={[styles.sparkStat, { color: colors.secondary, fontWeight: "700" }]}>Latest: {scoreHistory[scoreHistory.length - 1]}%</Text>
        <Text style={[styles.sparkStat, { color: colors.mutedForeground }]}>Best: {Math.max(...scoreHistory)}%</Text>
      </View>
    </View>
  );
}

export default function StudentDashboard() {
  const colors = useColors();
  const [feeAlertVisible, setFeeAlertVisible] = useState(true);

  const noticesQuery = useQuery({
    queryKey: ["public-notices", 5],
    queryFn: () => fetchPublicNotices(5),
    staleTime: 60_000,
  });

  const refetch = useCallback(async () => {
    await noticesQuery.refetch();
  }, [noticesQuery]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const liveNotices = (noticesQuery.data ?? []).map((n) => ({
    date: formatNoticeDate(n.publishedAt ?? n.updatedAt),
    title: n.title,
  }));
  const noticesToShow = liveNotices.length > 0 ? liveNotices : fallbackNotices;

  return (
    <>
      <RoleHeader
        name="Arjun Mehta"
        sub="JEE 2026 Batch · Roll No: JEE26-047"
        roleLabel="Student"
        onMenuPress={() => { lightHaptic(); router.push("/(student)/more"); }}
      />
      <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
        <StreakBadge days={7} />

        <View style={[styles.statsRow, { marginBottom: 14 }]}>
          <StatCard value="6" label="Classes This Week" />
          <StatCard value="48" label="Materials" />
          <StatCard value="88%" label="Attendance" color={colors.secondary} />
          <StatCard value="12" label="Tests Done" />
        </View>

        <SparklineChart />

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Upcoming Classes" />
          {upcomingClasses.map((c, i) => (
            <TouchableOpacity key={i} activeOpacity={0.8} onPress={() => lightHaptic()}>
              <ClassRow {...c} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionHeader title="Notices" />
          {noticesQuery.isLoading && liveNotices.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : (
            noticesToShow.map((n, i) => <NoticeRow key={i} {...n} />)
          )}
        </View>

        {feeAlertVisible && (
          <View style={[styles.feeAlert, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary, borderRadius: colors.radius }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.feeLabel, { color: colors.secondary }]}>Next Fee Due</Text>
              <Text style={[styles.feeValue, { color: colors.foreground }]}>₹12,500 — May 10, 2025</Text>
            </View>
            <TouchableOpacity
              onPress={() => { lightHaptic(); setFeeAlertVisible(false); }}
              style={styles.feeDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: colors.secondary, fontSize: 16, fontWeight: "700" }}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: 8 },
  sparkCard: { borderWidth: 1, paddingTop: 10, paddingHorizontal: 0, marginBottom: 0 },
  sparkLabel: { fontSize: 11, fontWeight: "600", paddingHorizontal: 12, marginBottom: 4 },
  sparkFooter: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 10, marginTop: 4 },
  sparkStat: { fontSize: 10 },
  feeAlert: { marginTop: 12, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  feeLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  feeValue: { fontSize: 15, fontWeight: "600", marginTop: 2 },
  feeDismiss: { padding: 4 },
});

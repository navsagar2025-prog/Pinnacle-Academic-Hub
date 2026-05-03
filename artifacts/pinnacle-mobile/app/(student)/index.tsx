import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import ClassRow from "@/components/ClassRow";
import NoticeRow from "@/components/NoticeRow";
import RoleHeader from "@/components/RoleHeader";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";
import { fetchPublicNotices, formatNoticeDate } from "@/lib/api";

const upcomingClasses = [
  {
    subject: "Physics",
    topic: "Thermodynamics",
    time: "5:00 – 7:00 PM",
    date: "Today",
    teacher: "Dr. Ramesh Kumar",
  },
  {
    subject: "Chemistry",
    topic: "Organic Chemistry",
    time: "5:00 – 7:00 PM",
    date: "Tomorrow",
    teacher: "Ms. Priya Sharma",
  },
  {
    subject: "Mathematics",
    topic: "Integral Calculus",
    time: "5:00 – 7:00 PM",
    date: "26 Apr",
    teacher: "Mr. Ajay Tiwari",
  },
];

const fallbackNotices = [
  { date: "20 Apr", title: "Mock Test: JEE Mains Full Syllabus on May 1" },
  { date: "18 Apr", title: "Physics Notes Updated – Thermodynamics Module" },
  { date: "15 Apr", title: "Holiday: April 25 — Institute Closed" },
];

export default function StudentDashboard() {
  const colors = useColors();
  const noticesQuery = useQuery({
    queryKey: ["public-notices", 5],
    queryFn: () => fetchPublicNotices(5),
    staleTime: 60_000,
  });

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
      />
      <ScreenContainer>
        <View style={[styles.statsRow, { marginTop: 16 }]}>
          <StatCard value="6" label="Classes This Week" />
          <StatCard value="48" label="Materials" />
          <StatCard value="88%" label="Attendance" color={colors.secondary} />
          <StatCard value="12" label="Tests Done" />
        </View>

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Upcoming Classes" />
          {upcomingClasses.map((c, i) => (
            <ClassRow key={i} {...c} />
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

        <View
          style={[
            styles.feeAlert,
            {
              backgroundColor: colors.secondary + "15",
              borderColor: colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.feeLabel, { color: colors.secondary }]}>
            Next Fee Due
          </Text>
          <Text style={[styles.feeValue, { color: colors.foreground }]}>
            ₹12,500 — May 10, 2025
          </Text>
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  feeAlert: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  feeLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feeValue: {
    fontSize: 15,
    fontWeight: "600",
  },
});

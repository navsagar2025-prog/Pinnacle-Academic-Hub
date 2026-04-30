import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ClassRow from "@/components/ClassRow";
import NoticeRow from "@/components/NoticeRow";
import RoleHeader from "@/components/RoleHeader";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";

const todayClasses = [
  { subject: "Physics", topic: "Thermodynamics", time: "5:00 PM", batch: "JEE 2026 — Eve" },
  { subject: "Physics", topic: "Wave Optics", time: "7:00 PM", batch: "NEET 2026 — Eve" },
];

const recentNotices = [
  { date: "20 Apr", title: "Upload May syllabus plan by April 30" },
  { date: "18 Apr", title: "Staff meeting — April 22, 11:00 AM" },
];

export default function TeacherDashboard() {
  const colors = useColors();
  return (
    <>
      <RoleHeader
        name="Dr. Ramesh Kumar"
        sub="Physics Faculty · JEE / NEET Batches"
        roleLabel="Teacher"
      />
      <ScreenContainer>
        <View style={[styles.statsRow, { marginTop: 16 }]}>
          <StatCard value="3" label="Batches" color={colors.gold} />
          <StatCard value="127" label="Students" color={colors.gold} />
          <StatCard value="6" label="Classes/Week" color={colors.gold} />
          <StatCard value="48" label="Materials" color={colors.gold} />
        </View>

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Today's Classes" />
          {todayClasses.map((c, i) => (
            <ClassRow key={i} {...c} />
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionHeader title="Pending Tasks" />
          {[
            { text: "Upload Physics — Thermodynamics notes", urgent: true },
            { text: "Submit April attendance report", urgent: true },
            { text: "Prepare May mock test questions", urgent: false },
          ].map((t, i) => (
            <View
              key={i}
              style={[
                styles.task,
                {
                  backgroundColor: colors.card,
                  borderColor: t.urgent ? colors.gold : colors.border,
                  borderRadius: colors.radius,
                  borderLeftColor: t.urgent ? colors.gold : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.taskDot,
                  { backgroundColor: t.urgent ? colors.gold : colors.border },
                ]}
              />
              <Text style={[styles.taskText, { color: colors.foreground }]}>
                {t.text}
              </Text>
              {t.urgent && (
                <View
                  style={[
                    styles.urgentBadge,
                    { backgroundColor: colors.gold + "20", borderRadius: 4 },
                  ]}
                >
                  <Text style={[styles.urgentText, { color: colors.gold }]}>
                    Urgent
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <SectionHeader title="Notices" />
          {recentNotices.map((n, i) => (
            <NoticeRow key={i} {...n} />
          ))}
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
  task: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 8,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: "700",
  },
});

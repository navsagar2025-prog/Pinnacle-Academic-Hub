import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import NoticeRow from "@/components/NoticeRow";
import RoleHeader from "@/components/RoleHeader";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";

const notices = [
  { date: "20 Apr", title: "Mock Test: JEE Mains Full Syllabus on May 1" },
  { date: "18 Apr", title: "Physics Notes Updated – Thermodynamics Module" },
  { date: "15 Apr", title: "Holiday: April 25 — Institute Closed" },
];

const todayClasses = [
  { subject: "Physics", teacher: "Dr. Ramesh Kumar", time: "5:00 PM" },
  { subject: "Study Hour", teacher: "Self-study", time: "7:00 PM" },
];

export default function ParentDashboard() {
  const colors = useColors();
  return (
    <>
      <RoleHeader
        name="Suresh Mehta"
        sub="Parent of Arjun Mehta · JEE 2026"
        roleLabel="Parent"
      />
      <ScreenContainer>
        <View
          style={[
            styles.childCard,
            {
              backgroundColor: colors.secondary + "12",
              borderColor: colors.secondary,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.secondary, borderRadius: 22 },
            ]}
          >
            <Feather name="user" size={22} color={colors.secondaryForeground} />
          </View>
          <View style={{ gap: 3 }}>
            <Text style={[styles.childName, { color: colors.foreground }]}>
              Arjun Mehta
            </Text>
            <Text style={[styles.childSub, { color: colors.mutedForeground }]}>
              JEE 2026 Batch · Roll: JEE26-047
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { marginTop: 16 }]}>
          <StatCard value="88%" label="Attendance" color={colors.secondary} />
          <StatCard value="6" label="Classes/Week" />
          <StatCard value="12" label="Tests Done" />
        </View>

        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Today's Classes" />
          {todayClasses.map((c, i) => (
            <View
              key={i}
              style={[
                styles.classRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.classTime, { color: colors.secondary }]}>
                {c.time}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.classSubject, { color: colors.foreground }]}>
                  {c.subject}
                </Text>
                <Text
                  style={[styles.classTeacher, { color: colors.mutedForeground }]}
                >
                  {c.teacher}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.feeAlert,
            {
              backgroundColor: colors.warning + "15",
              borderColor: colors.warning,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="alert-circle" size={16} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.feeTitle, { color: colors.foreground }]}>
              Next Fee Due
            </Text>
            <Text style={[styles.feeAmt, { color: colors.warning }]}>
              ₹12,500 — May 10, 2025
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Notices" />
          {notices.map((n, i) => (
            <NoticeRow key={i} {...n} />
          ))}
        </View>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  childName: {
    fontSize: 16,
    fontWeight: "700",
  },
  childSub: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  classTime: {
    fontSize: 12,
    fontWeight: "700",
    width: 64,
  },
  classSubject: {
    fontSize: 13,
    fontWeight: "600",
  },
  classTeacher: {
    fontSize: 11,
    marginTop: 2,
  },
  feeAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  feeTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  feeAmt: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
});

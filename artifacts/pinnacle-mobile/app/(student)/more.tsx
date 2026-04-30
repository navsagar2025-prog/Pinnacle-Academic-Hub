import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useRole } from "@/context/RoleContext";
import { useColors } from "@/hooks/useColors";

const recordings = [
  { subject: "Physics", topic: "Kinematics — Session 1", date: "22 Apr", duration: "1h 52m" },
  { subject: "Chemistry", topic: "Chemical Bonding", date: "20 Apr", duration: "1h 47m" },
  { subject: "Mathematics", topic: "Limits — Full Lecture", date: "19 Apr", duration: "2h 03m" },
  { subject: "Biology", topic: "Cell Division", date: "17 Apr", duration: "1h 28m" },
];

const papers = [
  { title: "JEE Mains — Full Mock Test 1", date: "15 Apr", questions: 90, marks: 300 },
  { title: "Physics — Thermodynamics Test", date: "10 Apr", questions: 30, marks: 120 },
  { title: "Chemistry — Organic Practice Set", date: "8 Apr", questions: 40, marks: 160 },
  { title: "Mathematics — Calculus Mini Test", date: "5 Apr", questions: 20, marks: 80 },
];

const feeHistory = [
  { month: "April 2025", amount: "₹12,500", status: "Paid", date: "2 Apr" },
  { month: "March 2025", amount: "₹12,500", status: "Paid", date: "1 Mar" },
  { month: "February 2025", amount: "₹12,500", status: "Paid", date: "3 Feb" },
];

export default function StudentMore() {
  const colors = useColors();
  const { setRole } = useRole();

  const demo = () => Alert.alert("Demo Mode", "This action is disabled in demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <SectionHeader title="Recorded Classes" />
      {recordings.map((r, i) => (
        <TouchableOpacity
          key={i}
          onPress={demo}
          activeOpacity={0.7}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.playIcon,
              { backgroundColor: colors.secondary + "18", borderRadius: 20 },
            ]}
          >
            <Feather name="play-circle" size={22} color={colors.secondary} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {r.subject} — {r.topic}
            </Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {r.date} · {r.duration}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Practice Papers" />
        {papers.map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={demo}
            activeOpacity={0.7}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.playIcon,
                { backgroundColor: colors.maroon + "18", borderRadius: 20 },
              ]}
            >
              <Feather name="edit-3" size={20} color={colors.maroon} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.foreground }]}>{p.title}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {p.date} · {p.questions} Questions · {p.marks} Marks
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Fee Status" />
        <View
          style={[
            styles.feeBox,
            {
              backgroundColor: colors.primary + "12",
              borderColor: colors.primary,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.feeTitle, { color: colors.primary }]}>Next Due</Text>
          <Text style={[styles.feeAmount, { color: colors.foreground }]}>₹12,500</Text>
          <Text style={[styles.feeDue, { color: colors.mutedForeground }]}>Due: May 10, 2025</Text>
        </View>
        {feeHistory.map((f, i) => (
          <View
            key={i}
            style={[
              styles.feeRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View>
              <Text style={[styles.month, { color: colors.foreground }]}>{f.month}</Text>
              <Text style={[styles.feeDate, { color: colors.mutedForeground }]}>Paid on {f.date}</Text>
            </View>
            <View style={styles.feeRight}>
              <Text style={[styles.feeAmt, { color: colors.foreground }]}>{f.amount}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.success + "20", borderRadius: 4 },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.success }]}>{f.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setRole(null)}
        style={[
          styles.signOut,
          {
            backgroundColor: colors.muted,
            borderRadius: colors.radius,
            marginTop: 16,
          },
        ]}
      >
        <Feather name="log-out" size={16} color={colors.mutedForeground} />
        <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>
          Switch Role
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  playIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  meta: {
    fontSize: 11,
  },
  feeBox: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    gap: 4,
  },
  feeTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  feeAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  feeDue: {
    fontSize: 12,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  month: {
    fontSize: 13,
    fontWeight: "600",
  },
  feeDate: {
    fontSize: 11,
    marginTop: 2,
  },
  feeRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  feeAmt: {
    fontSize: 15,
    fontWeight: "700",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

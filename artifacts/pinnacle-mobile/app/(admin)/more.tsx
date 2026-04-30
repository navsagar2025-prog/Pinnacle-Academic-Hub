import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useRole } from "@/context/RoleContext";
import { useColors } from "@/hooks/useColors";

const teachers = [
  { name: "Dr. Ramesh Kumar", subject: "Physics", batches: "JEE 2026, NEET 2026, Cl-12 PCM" },
  { name: "Ms. Priya Sharma", subject: "Chemistry", batches: "JEE 2026, NEET 2026" },
  { name: "Mr. Ajay Tiwari", subject: "Mathematics", batches: "JEE 2026, Cl-12 PCM" },
  { name: "Ms. Nidhi Verma", subject: "Biology", batches: "NEET 2026, Foundation" },
];

const results = [
  { exam: "JEE Mains — April 2025", topScore: "298/300", average: "182", passRate: "76%" },
  { exam: "NEET Mock — March 2025", topScore: "680/720", average: "510", passRate: "81%" },
  { exam: "Class 12 Board — Mock Test 1", topScore: "485/500", average: "412", passRate: "92%" },
];

const enquiries = [
  { name: "Ananya Singh", course: "JEE 2026", phone: "98765-XXXXX", date: "Today", status: "New" },
  { name: "Rohan Gupta", course: "NEET 2026", phone: "87654-XXXXX", date: "Today", status: "New" },
  { name: "Priya Sharma", course: "Class 12 PCM", phone: "76543-XXXXX", date: "Yesterday", status: "Contacted" },
  { name: "Vaibhav Jain", course: "Foundation", phone: "65432-XXXXX", date: "Yesterday", status: "Enrolled" },
];

const settingsItems = [
  { label: "Institute Profile", icon: "settings" },
  { label: "Batch Management", icon: "grid" },
  { label: "OCR Engine Settings", icon: "cpu" },
  { label: "Portal Access Control", icon: "lock" },
  { label: "Backup & Export Data", icon: "archive" },
];

export default function AdminMore() {
  const colors = useColors();
  const { setRole } = useRole();
  const demo = () => Alert.alert("Demo Mode", "This action is disabled in demo.", [{ text: "OK" }]);

  const statusColor = (s: string) => {
    if (s === "New") return colors.secondary;
    if (s === "Enrolled") return colors.success;
    return colors.mutedForeground;
  };

  return (
    <ScreenContainer>
      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Teachers" />
        {teachers.map((t, i) => (
          <View
            key={i}
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
                styles.avatar,
                { backgroundColor: colors.gold + "20", borderRadius: 22 },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.gold }]}>{t.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.teacherName, { color: colors.foreground }]}>{t.name}</Text>
              <Text style={[styles.teacherMeta, { color: colors.mutedForeground }]}>
                {t.subject}
              </Text>
              <Text style={[styles.teacherBatches, { color: colors.mutedForeground }]}>
                {t.batches}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Exam Results" />
          {results.map((r, i) => (
            <View
              key={i}
              style={[
                styles.resultCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.examName, { color: colors.foreground }]}>{r.exam}</Text>
              <View style={styles.resultRow}>
                {[
                  { label: "Top Score", value: r.topScore },
                  { label: "Average", value: r.average },
                  { label: "Pass Rate", value: r.passRate },
                ].map((s, j) => (
                  <View key={j} style={styles.resultStat}>
                    <Text style={[styles.resultValue, { color: colors.primary }]}>{s.value}</Text>
                    <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Enquiries" />
          {enquiries.map((e, i) => (
            <View
              key={i}
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
                  styles.avatar,
                  { backgroundColor: colors.primary + "18", borderRadius: 22 },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>{e.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.teacherName, { color: colors.foreground }]}>{e.name}</Text>
                <Text style={[styles.teacherMeta, { color: colors.mutedForeground }]}>
                  {e.course} · {e.date}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: statusColor(e.status) + "18", borderRadius: 4 },
                ]}
              >
                <Text style={[styles.badgeText, { color: statusColor(e.status) }]}>{e.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Settings" />
          {settingsItems.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={demo}
              activeOpacity={0.7}
              style={[
                styles.settingRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.muted, borderRadius: 8 },
                ]}
              >
                <Feather name={s.icon as any} size={18} color={colors.foreground} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>{s.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setRole(null)}
          style={[
            styles.signOut,
            { backgroundColor: colors.muted, borderRadius: colors.radius, marginTop: 16 },
          ]}
        >
          <Feather name="log-out" size={16} color={colors.mutedForeground} />
          <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>Switch Role</Text>
        </TouchableOpacity>
      </View>
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
  avatar: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  teacherName: {
    fontSize: 13,
    fontWeight: "700",
  },
  teacherMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  teacherBatches: {
    fontSize: 11,
    marginTop: 2,
  },
  resultCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 10,
  },
  examName: {
    fontSize: 13,
    fontWeight: "700",
  },
  resultRow: {
    flexDirection: "row",
    gap: 0,
  },
  resultStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  settingIcon: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
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

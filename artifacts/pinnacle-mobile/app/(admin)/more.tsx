import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { type ComponentProps } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useRole } from "@/context/RoleContext";
import { useColors } from "@/hooks/useColors";

type FeatherName = ComponentProps<typeof Feather>["name"];

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

const settingsItems: { label: string; icon: FeatherName }[] = [
  { label: "Institute Profile", icon: "settings" },
  { label: "Batch Management", icon: "grid" },
  { label: "OCR Engine Settings", icon: "cpu" },
  { label: "Portal Access Control", icon: "lock" },
  { label: "Backup & Export Data", icon: "archive" },
];

async function sendTestNotification() {
  if (Platform.OS === "web") {
    Alert.alert("Notifications", "Push notifications are not supported on web.", [{ text: "OK" }]);
    return;
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      Alert.alert("Permission Required", "Enable notifications in device Settings to test this feature.", [{ text: "OK" }]);
      return;
    }
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pinnacle Admin Alert",
      body: "This is a test push notification from Pinnacle Admin portal.",
      data: { type: "test" },
    },
    trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
  Alert.alert("Notification Sent", "A test notification will appear in ~2 seconds.", [{ text: "OK" }]);
}

export default function AdminMore() {
  const colors = useColors();
  const { setRole } = useRole();
  const router = useRouter();
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
          <SectionHeader title="Batch Management" />
          <TouchableOpacity
            onPress={() => router.push("/(admin)/batches")}
            activeOpacity={0.7}
            style={[
              styles.settingRow,
              {
                backgroundColor: colors.secondary + "10",
                borderColor: colors.secondary + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary + "18", borderRadius: 8 }]}>
              <Feather name="users" size={18} color={colors.secondary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Manage Batches</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 4 }}>
          <SectionHeader title="Scan Document" />
          <TouchableOpacity
            onPress={() => router.push("/(admin)/scan")}
            activeOpacity={0.7}
            style={[
              styles.settingRow,
              {
                backgroundColor: colors.maroon + "12",
                borderColor: colors.maroon + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.maroon + "20", borderRadius: 8 }]}>
              <Feather name="camera" size={18} color={colors.maroon} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Open Scanner</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 4 }}>
          <SectionHeader title="Settings" />
          <TouchableOpacity
            onPress={sendTestNotification}
            activeOpacity={0.7}
            style={[
              styles.settingRow,
              {
                backgroundColor: colors.primary + "10",
                borderColor: colors.primary + "30",
                borderRadius: colors.radius,
                marginBottom: 8,
              },
            ]}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + "18", borderRadius: 8 }]}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Test Push Notification</Text>
            <Feather name="send" size={14} color={colors.primary} />
          </TouchableOpacity>
          {settingsItems.map((s, i) => (
            <TouchableOpacity
              key={i}
              disabled
              onPress={demo}
              activeOpacity={0.7}
              style={[
                styles.settingRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: 0.6,
                },
              ]}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: colors.muted, borderRadius: 8 },
                ]}
              >
                <Feather name={s.icon} size={18} color={colors.foreground} />
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

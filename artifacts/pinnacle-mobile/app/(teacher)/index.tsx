import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ClassRow from "@/components/ClassRow";
import NoticeRow from "@/components/NoticeRow";
import RoleHeader from "@/components/RoleHeader";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import { useColors } from "@/hooks/useColors";

async function sendTestNotification() {
  if (Platform.OS === "web") {
    Alert.alert("Notifications", "Push notifications are not supported on web.", [{ text: "OK" }]);
    return;
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      Alert.alert("Permission Required", "Enable notifications in device Settings.", [{ text: "OK" }]);
      return;
    }
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Pinnacle Teacher Alert",
      body: "This is a test push notification from Pinnacle Teacher portal.",
      data: { type: "test" },
    },
    trigger: { seconds: 2, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
  Alert.alert("Notification Sent", "A test notification will appear in ~2 seconds.", [{ text: "OK" }]);
}

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

        <View style={{ marginTop: 8 }}>
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
              },
            ]}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + "18", borderRadius: 8 }]}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground, flex: 1 }]}>
              Test Push Notification
            </Text>
            <Feather name="send" size={14} color={colors.primary} />
          </TouchableOpacity>
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
    fontSize: 14,
    fontWeight: "500",
  },
});

import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { type ComponentProps } from "react";
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useRole } from "@/context/RoleContext";
import { useColors } from "@/hooks/useColors";
import { useAISettings } from "@/lib/aiSettings";
import { lightHaptic, successHaptic } from "@/lib/haptics";

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

type QuickLink = { label: string; sub: string; icon: FeatherName; route: string; color: string };

const quickLinks: QuickLink[] = [
  {
    label: "Gallery",
    sub: "Manage photo gallery & media",
    icon: "image",
    route: "/(admin)/gallery",
    color: "#0D7377",
  },
  {
    label: "Batch Management",
    sub: "View and manage all batches",
    icon: "users",
    route: "/(admin)/batches",
    color: "#0A1F5C",
  },
  {
    label: "Notices",
    sub: "Post notices for all roles",
    icon: "bell",
    route: "/(admin)/notices",
    color: "#C9A84C",
  },
  {
    label: "Scan Document",
    sub: "OCR scan a question paper",
    icon: "camera",
    route: "/(admin)/scan",
    color: "#8B1A1A",
  },
];

const settingsItems: { label: string; icon: FeatherName }[] = [
  { label: "Institute Profile", icon: "settings" },
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
      Alert.alert("Permission Required", "Enable notifications in device Settings.", [{ text: "OK" }]);
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
  const { settings: aiSettings, setDoubtResolverEnabled } = useAISettings();
  const demo = () => Alert.alert("Demo Mode", "This action is disabled in demo.", [{ text: "OK" }]);

  const toggleAIResolver = async (next: boolean) => {
    if (next) successHaptic();
    else lightHaptic();
    await setDoubtResolverEnabled(next);
  };

  return (
    <ScreenContainer>
      <View style={{ marginTop: 8 }}>
        <SectionHeader title="Quick Links" />
        {quickLinks.map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as never)}
            activeOpacity={0.7}
            style={[
              styles.navCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.navIcon,
                { backgroundColor: item.color + "15", borderRadius: colors.radius - 4 },
              ]}
            >
              <Feather name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.navText}>
              <Text style={[styles.navLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.navSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

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
              <Text style={[styles.teacherMeta, { color: colors.mutedForeground }]}>{t.subject}</Text>
              <Text style={[styles.teacherBatches, { color: colors.mutedForeground }]}>{t.batches}</Text>
            </View>
          </View>
        ))}
      </View>

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
        <SectionHeader title="AI Dashboard" />
        <View
          style={[
            styles.aiCard,
            {
              backgroundColor: colors.card,
              borderColor: aiSettings.doubtResolverEnabled ? "#7C3AED" : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.aiRow}>
            <View style={[styles.aiIcon, { backgroundColor: "#7C3AED15", borderRadius: 8 }]}>
              <Feather name="zap" size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiLabel, { color: colors.foreground }]}>AI Doubt Resolver</Text>
              <Text style={[styles.aiSub, { color: colors.mutedForeground }]}>
                Show students an instant AI-generated answer when they post a doubt.
              </Text>
            </View>
            <Switch
              value={aiSettings.doubtResolverEnabled}
              onValueChange={toggleAIResolver}
              trackColor={{ false: colors.border, true: "#7C3AED" }}
              thumbColor="#fff"
              ios_backgroundColor={colors.border}
            />
          </View>
          <View style={[styles.aiStatusPill, { backgroundColor: aiSettings.doubtResolverEnabled ? colors.success + "18" : colors.muted }]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: aiSettings.doubtResolverEnabled ? colors.success : colors.mutedForeground },
              ]}
            />
            <Text
              style={[
                styles.aiStatusText,
                { color: aiSettings.doubtResolverEnabled ? colors.success : colors.mutedForeground },
              ]}
            >
              {aiSettings.doubtResolverEnabled
                ? "Active for all students"
                : "Disabled — students see only teacher replies"}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
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
            <View style={[styles.settingIcon, { backgroundColor: colors.muted, borderRadius: 8 }]}>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  navIcon: { width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  navText: { flex: 1, gap: 3 },
  navLabel: { fontSize: 15, fontWeight: "700" },
  navSub: { fontSize: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  teacherName: { fontSize: 13, fontWeight: "700" },
  teacherMeta: { fontSize: 12, marginTop: 1 },
  teacherBatches: { fontSize: 11, marginTop: 2 },
  resultCard: { borderWidth: 1, padding: 14, marginBottom: 8, gap: 10 },
  examName: { fontSize: 13, fontWeight: "700" },
  resultRow: { flexDirection: "row" },
  resultStat: { flex: 1, alignItems: "center", gap: 2 },
  resultValue: { fontSize: 15, fontWeight: "700" },
  resultLabel: { fontSize: 10, fontWeight: "500" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  settingIcon: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    marginBottom: 8,
  },
  signOutText: { fontSize: 14, fontWeight: "600" },
  aiCard: { borderWidth: 1, padding: 14, marginBottom: 8, gap: 12 },
  aiRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIcon: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  aiLabel: { fontSize: 14, fontWeight: "700" },
  aiSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  aiStatusPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignSelf: "flex-start" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  aiStatusText: { fontSize: 11, fontWeight: "700" },
});

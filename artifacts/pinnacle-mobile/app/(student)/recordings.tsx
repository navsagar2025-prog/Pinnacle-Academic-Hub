import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

// Sample recordings shared with the demo. In production these come from
// /api/v1/recordings; tapping them routes to the in-app player which renders
// the same personalised CSS-style watermark overlay as the web portal.
const recordings = [
  { id: "demo-1", subject: "Physics", topic: "Kinematics — Session 1", date: "22 Apr", duration: "1h 52m" },
  { id: "demo-2", subject: "Physics", topic: "Newton's Laws of Motion", date: "18 Apr", duration: "1h 38m" },
  { id: "demo-3", subject: "Chemistry", topic: "Chemical Bonding", date: "20 Apr", duration: "1h 47m" },
  { id: "demo-4", subject: "Mathematics", topic: "Limits — Full Lecture", date: "19 Apr", duration: "2h 03m" },
  { id: "demo-5", subject: "Biology", topic: "Cell Division", date: "17 Apr", duration: "1h 28m" },
];

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#C9A84C",
};

export default function StudentRecordings() {
  const colors = useColors();

  return (
    <ScreenContainer>
      <SectionHeader title="All Recorded Lectures" />
      {recordings.map((r) => {
        const color = subjectColor[r.subject] ?? colors.primary;
        return (
          <TouchableOpacity
            key={r.id}
            onPress={() =>
              router.push({
                pathname: "/(student)/recording-player",
                params: { id: r.id, title: r.topic, subject: r.subject },
              })
            }
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
            <View style={[styles.thumb, { backgroundColor: color + "18", borderRadius: 8 }]}>
              <Feather name="play-circle" size={24} color={color} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.subject, { color, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                {r.subject}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.topic, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}
              >
                {r.topic}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {r.date} · {r.duration}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })}
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
  thumb: { width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  info: { flex: 1, gap: 3 },
  subject: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 },
  topic: { fontSize: 13 },
  meta: { fontSize: 11 },
});

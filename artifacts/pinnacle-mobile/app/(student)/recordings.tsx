import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const recordings = [
  { subject: "Physics", topic: "Kinematics — Session 1", date: "22 Apr", duration: "1h 52m", thumb: "P" },
  { subject: "Physics", topic: "Newton's Laws of Motion", date: "18 Apr", duration: "1h 38m", thumb: "P" },
  { subject: "Chemistry", topic: "Chemical Bonding", date: "20 Apr", duration: "1h 47m", thumb: "C" },
  { subject: "Chemistry", topic: "Coordination Compounds", date: "15 Apr", duration: "1h 55m", thumb: "C" },
  { subject: "Mathematics", topic: "Limits — Full Lecture", date: "19 Apr", duration: "2h 03m", thumb: "M" },
  { subject: "Mathematics", topic: "Integration — Part 2", date: "12 Apr", duration: "1h 50m", thumb: "M" },
  { subject: "Biology", topic: "Cell Division", date: "17 Apr", duration: "1h 28m", thumb: "B" },
  { subject: "Biology", topic: "Genetics — Mendelian Laws", date: "10 Apr", duration: "1h 41m", thumb: "B" },
];

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#C9A84C",
};

export default function StudentRecordings() {
  const colors = useColors();
  const demo = () => Alert.alert("Demo Mode", "Video playback is disabled in demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <SectionHeader title="All Recorded Lectures" />
      {recordings.map((r, i) => {
        const color = subjectColor[r.subject] ?? colors.primary;
        return (
          <TouchableOpacity
            key={i}
            onPress={demo}
            disabled
            activeOpacity={0.7}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: 0.9,
              },
            ]}
          >
            <View style={[styles.thumb, { backgroundColor: color + "18", borderRadius: 8 }]}>
              <Feather name="play-circle" size={24} color={color} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.subject, { color: color, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
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
            <View style={[styles.demoBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.demoBadgeText, { color: colors.mutedForeground }]}>Demo</Text>
            </View>
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
  thumb: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  subject: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  topic: {
    fontSize: 13,
  },
  meta: {
    fontSize: 11,
  },
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

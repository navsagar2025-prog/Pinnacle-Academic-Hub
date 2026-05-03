import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type Test = {
  id: string;
  title: string;
  subject: string;
  questions: number;
  duration: number;
  marks: number;
  status: "available" | "completed" | "scheduled";
  score?: number;
  scheduledFor?: string;
};

const TESTS: Test[] = [
  { id: "t1", title: "JEE Main Mock #4 — Full Syllabus", subject: "Physics + Chem + Math", questions: 75, duration: 180, marks: 300, status: "available" },
  { id: "t2", title: "Physics — Mechanics Sprint", subject: "Physics", questions: 25, duration: 45, marks: 100, status: "available" },
  { id: "t3", title: "NEET Mock #3 — Bio Focus", subject: "Biology", questions: 90, duration: 180, marks: 360, status: "scheduled", scheduledFor: "Sun, 10 May · 6 PM" },
  { id: "t4", title: "JEE Main Mock #3", subject: "PCM", questions: 75, duration: 180, marks: 300, status: "completed", score: 224 },
  { id: "t5", title: "Chemistry — Organic Test", subject: "Chemistry", questions: 30, duration: 60, marks: 120, status: "completed", score: 95 },
];

const STATUS_META: Record<Test["status"], { color: string; label: string; icon: keyof typeof Feather.glyphMap }> = {
  available: { color: "#0D7377", label: "Start now", icon: "play-circle" },
  completed: { color: "#0A1F5C", label: "View report", icon: "bar-chart-2" },
  scheduled: { color: "#C9A84C", label: "Scheduled", icon: "clock" },
};

export default function StudentMockTests() {
  const colors = useColors();
  const demo = () => Alert.alert("Demo Mode", "Mock test taking is enabled in the full account.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <SectionHeader title="Mock Tests"  />

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: "#0A1F5C",
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: "#C9A84C" }]}>YOUR PROGRESS</Text>
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "PlusJakartaSans_700Bold" }]}>
            12 attempts · Avg 71%
          </Text>
          <Text style={[styles.heroSub, { color: "#fff", opacity: 0.75 }]}>
            Keep practicing — your rank improves every week.
          </Text>
        </View>
        <Feather name="award" size={36} color="#C9A84C" />
      </View>

      {TESTS.map((t) => {
        const meta = STATUS_META[t.status];
        return (
          <TouchableOpacity
            key={t.id}
            onPress={demo}
            disabled={t.status !== "available" && t.status !== "completed"}
            activeOpacity={0.75}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: meta.color + "15", borderRadius: 8 }]}>
              <Feather name={meta.icon} size={20} color={meta.color} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                numberOfLines={1}
                style={[styles.title, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}
              >
                {t.title}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {t.subject} · {t.questions} Qs · {t.duration} min · {t.marks} marks
              </Text>
              <View style={styles.statusRow}>
                <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                {t.status === "completed" && t.score != null && (
                  <Text style={[styles.scoreText, { color: colors.foreground }]}>
                    · Score {t.score}/{t.marks} ({Math.round((t.score / t.marks) * 100)}%)
                  </Text>
                )}
                {t.status === "scheduled" && (
                  <Text style={[styles.scoreText, { color: colors.mutedForeground }]}>· {t.scheduledFor}</Text>
                )}
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  heroLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  heroTitle: { fontSize: 18, marginTop: 4 },
  heroSub: { fontSize: 12, marginTop: 4 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  iconWrap: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 13 },
  meta: { fontSize: 11 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: "700" },
  scoreText: { fontSize: 11 },
});

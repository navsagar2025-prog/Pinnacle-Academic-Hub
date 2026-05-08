import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SkeletonList } from "@/components/SkeletonLoader";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { lightHaptic, mediumHaptic } from "@/lib/haptics";
import { useRefresh } from "@/lib/useRefresh";
import { fetchMockTests, hasWebsiteBase, type MockTest } from "@/lib/api";

function statusFor(t: MockTest): "available" | "scheduled" {
  if (t.scheduledStart) {
    const start = new Date(t.scheduledStart).getTime();
    if (!Number.isNaN(start) && start > Date.now()) return "scheduled";
  }
  return "available";
}

const STATUS_META = {
  available: { color: "#0D7377", label: "Start now", icon: "play-circle" as const },
  scheduled: { color: "#C9A84C", label: "Scheduled", icon: "clock" as const },
};

function formatScheduled(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

export default function StudentMockTests() {
  const colors = useColors();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFn = useCallback(async () => {
    const items = await fetchMockTests();
    setTests(items);
  }, []);

  useEffect(() => {
    fetchFn().finally(() => setLoading(false));
  }, [fetchFn]);

  const { refreshing, onRefresh } = useRefresh(fetchFn);

  const onStart = (t: MockTest) => {
    const status = statusFor(t);
    if (status !== "available") {
      lightHaptic();
      Alert.alert("Scheduled", `This test opens on ${formatScheduled(t.scheduledStart)}.`);
      return;
    }
    mediumHaptic();
    router.push({
      pathname: "/(student)/mock-test-runner" as never,
      params: {
        testId: t.id,
        title: t.title,
        questionCount: String(t.questionCount ?? 5),
        durationMinutes: String(t.durationMinutes),
        subject: t.subject,
      },
    });
  };

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <SectionHeader title="Mock Tests" />

      <View style={[styles.heroCard, { backgroundColor: "#0A1F5C", borderRadius: colors.radius }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: "#C9A84C" }]}>AVAILABLE</Text>
          <Text style={[styles.heroTitle, { color: "#fff", fontFamily: "PlusJakartaSans_700Bold" }]}>
            {loading ? "Loading…" : `${tests.length} test${tests.length === 1 ? "" : "s"} ready`}
          </Text>
          <Text style={[styles.heroSub, { color: "#fff", opacity: 0.75 }]}>
            Timed MCQs with auto-scoring — keep practicing to improve your rank.
          </Text>
        </View>
        <Feather name="award" size={36} color="#C9A84C" />
      </View>

      {loading ? (
        <SkeletonList count={4} />
      ) : tests.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="inbox" size={28} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13, textAlign: "center" }}>
            {hasWebsiteBase()
              ? "No tests available yet. Check back soon!"
              : "Connect to the web portal to load mock tests."}
          </Text>
        </View>
      ) : (
        tests.map((t) => {
          const status = statusFor(t);
          const meta = STATUS_META[status];
          const maxMarks = (t.questionCount ?? 0) * t.marksPerQuestion;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => onStart(t)}
              activeOpacity={0.75}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: meta.color + "15", borderRadius: 8 }]}>
                <Feather name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text numberOfLines={1} style={[styles.title, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                  {t.title}
                </Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {t.subject} · {t.questionCount} Qs · {t.durationMinutes} min · {maxMarks} marks
                </Text>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  {status === "scheduled" && (
                    <Text style={[styles.scoreText, { color: colors.mutedForeground }]}>· {formatScheduled(t.scheduledStart)}</Text>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          );
        })
      )}

      <View style={[styles.demoNote, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
        <Feather name="info" size={13} color={colors.mutedForeground} />
        <Text style={[styles.demoNoteText, { color: colors.mutedForeground }]}>
          In-app runner uses demo questions. Connect to web portal for live test content.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: { flexDirection: "row", padding: 16, alignItems: "center", gap: 12, marginBottom: 14 },
  heroLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  heroTitle: { fontSize: 18, marginTop: 4 },
  heroSub: { fontSize: 12, marginTop: 4 },
  empty: { padding: 32, alignItems: "center", borderWidth: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  iconWrap: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 13 },
  meta: { fontSize: 11 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: "700" },
  scoreText: { fontSize: 11 },
  demoNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, marginTop: 8 },
  demoNoteText: { fontSize: 11, flex: 1, lineHeight: 16 },
});

import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { fetchStudentRecordings, hasWebsiteBase, type StudentRecording } from "@/lib/api";

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#C9A84C",
};

function formatDuration(min: number | null): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function StudentRecordings() {
  const colors = useColors();
  const apiAvailable = hasWebsiteBase();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["student-recordings"],
    queryFn: fetchStudentRecordings,
    enabled: apiAvailable,
    staleTime: 60_000,
  });

  const recordings: StudentRecording[] = data ?? [];

  return (
    <ScreenContainer>
      <SectionHeader title="All Recorded Lectures" />

      {!apiAvailable && (
        <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="wifi-off" size={16} color={colors.mutedForeground} />
          <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
            Sign in to load your batch recordings.
          </Text>
        </View>
      )}

      {apiAvailable && isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {apiAvailable && !isLoading && isError && (
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="alert-circle" size={16} color="#B45309" />
          <Text style={[styles.bannerText, { color: colors.foreground }]}>
            Couldn't load recordings. Tap to retry.
          </Text>
        </TouchableOpacity>
      )}

      {apiAvailable && !isLoading && !isError && recordings.length === 0 && (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="video-off" size={20} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No recordings available for your batch yet.
          </Text>
        </View>
      )}

      {recordings.map((r) => {
        const color = subjectColor[r.subject] ?? colors.primary;
        const dur = formatDuration(r.durationMinutes);
        const dateLabel = formatDate(r.classDate ?? r.createdAt);
        return (
          <TouchableOpacity
            key={r.id}
            onPress={() =>
              router.push({
                pathname: "/(student)/recording-player" as never,
                params: { id: r.id, title: r.title, subject: r.subject },
              } as never)
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
                {r.title}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {[dateLabel, dur].filter(Boolean).join(" · ") || "Recorded class"}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        );
      })}

      {isFetching && !isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.mutedForeground} size="small" />
        </View>
      )}
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
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  bannerText: { fontSize: 12, flex: 1 },
  empty: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
  },
  emptyText: { fontSize: 12, textAlign: "center" },
  center: { alignItems: "center", paddingVertical: 18 },
});

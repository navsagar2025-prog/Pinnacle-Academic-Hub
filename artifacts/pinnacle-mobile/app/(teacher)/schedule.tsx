import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const schedule: Record<string, { subject: string; topic: string; time: string; batch: string }[]> = {
  Mon: [
    { subject: "Physics", topic: "Thermodynamics", time: "5:00 PM", batch: "JEE 2026 — Eve" },
    { subject: "Physics", topic: "Wave Optics", time: "7:00 PM", batch: "NEET 2026 — Eve" },
  ],
  Tue: [
    { subject: "Physics", topic: "Modern Physics", time: "10:00 AM", batch: "Cl-12 PCM — Day" },
    { subject: "Physics", topic: "Thermodynamics Revision", time: "5:00 PM", batch: "JEE 2025 — Eve" },
  ],
  Wed: [
    { subject: "Physics", topic: "Kinematics — Advanced", time: "5:00 PM", batch: "JEE 2026 — Eve" },
  ],
  Thu: [
    { subject: "Physics", topic: "Electricity & Magnetism", time: "5:00 PM", batch: "NEET 2026 — Eve" },
    { subject: "Physics", topic: "Wave Optics Revision", time: "7:00 PM", batch: "Cl-12 PCM — Eve" },
  ],
  Fri: [
    { subject: "Physics", topic: "Doubt Session — Open", time: "5:00 PM", batch: "All Batches" },
  ],
  Sat: [
    { subject: "Physics", topic: "Mock Test Review", time: "11:00 AM", batch: "JEE 2026 — Eve" },
  ],
};

export default function TeacherSchedule() {
  const colors = useColors();
  const [day, setDay] = useState("Mon");
  const slots = schedule[day] ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 16, marginBottom: 16, marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDay(d)}
            style={[
              styles.dayBtn,
              {
                backgroundColor: day === d ? colors.gold : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                {
                  color: day === d ? "#FFFFFF" : colors.mutedForeground,
                },
              ]}
            >
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionHeader title={`${slots.length} class${slots.length !== 1 ? "es" : ""} scheduled`} />

      {slots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No classes scheduled
          </Text>
        </View>
      ) : (
        slots.map((s, i) => (
          <View
            key={i}
            style={[
              styles.scheduleCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.scheduleTop}>
              <View
                style={[
                  styles.scheduleIcon,
                  { backgroundColor: colors.primary + "18", borderRadius: colors.radius - 4 },
                ]}
              >
                <Feather name="video" size={18} color={colors.primary} />
              </View>
              <View style={styles.scheduleInfo}>
                <Text
                  style={[
                    styles.scheduleSubject,
                    { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" },
                  ]}
                >
                  {s.subject} — {s.topic}
                </Text>
                <Text style={[styles.scheduleMeta, { color: colors.mutedForeground }]}>
                  {s.time} · {s.batch}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              disabled
              onPress={() =>
                Alert.alert("Demo Mode", "Live class streaming is disabled in demo.", [{ text: "OK" }])
              }
              activeOpacity={0.8}
              style={[
                styles.startClassBtn,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  borderRadius: colors.radius - 4,
                  opacity: 0.5,
                },
              ]}
            >
              <Feather name="video" size={14} color={colors.mutedForeground} />
              <Text style={[styles.startClassText, { color: colors.mutedForeground }]}>
                Start Class (Demo Disabled)
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scheduleCard: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  scheduleTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleIcon: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleInfo: {
    flex: 1,
    gap: 3,
  },
  scheduleSubject: {
    fontSize: 13,
  },
  scheduleMeta: {
    fontSize: 12,
  },
  startClassBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderWidth: 1,
  },
  startClassText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  empty: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});

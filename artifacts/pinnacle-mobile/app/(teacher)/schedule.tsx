import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ClassRow from "@/components/ClassRow";
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
        slots.map((s, i) => <ClassRow key={i} {...s} />)
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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

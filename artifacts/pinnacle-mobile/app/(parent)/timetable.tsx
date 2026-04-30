import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import { useColors } from "@/hooks/useColors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const schedule: Record<string, { time: string; subject: string; teacher: string }[]> = {
  Mon: [
    { time: "5:00 PM", subject: "Physics", teacher: "Dr. Ramesh Kumar" },
    { time: "7:00 PM", subject: "Study Hour", teacher: "Self-study" },
  ],
  Tue: [
    { time: "5:00 PM", subject: "Chemistry", teacher: "Ms. Priya Sharma" },
    { time: "7:00 PM", subject: "Mathematics", teacher: "Mr. Ajay Tiwari" },
  ],
  Wed: [
    { time: "10:00 AM", subject: "Biology", teacher: "Ms. Nidhi Verma" },
    { time: "5:00 PM", subject: "Physics", teacher: "Dr. Ramesh Kumar" },
  ],
  Thu: [
    { time: "5:00 PM", subject: "Mathematics", teacher: "Mr. Ajay Tiwari" },
    { time: "7:00 PM", subject: "Chemistry", teacher: "Ms. Priya Sharma" },
  ],
  Fri: [
    { time: "5:00 PM", subject: "Physics — Doubt Session", teacher: "Dr. Ramesh Kumar" },
  ],
  Sat: [
    { time: "9:00 AM", subject: "Mock Test", teacher: "All Faculty" },
    { time: "12:00 PM", subject: "Test Discussion", teacher: "All Faculty" },
  ],
};

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#C9A84C",
};

export default function ParentTimetable() {
  const colors = useColors();
  const [day, setDay] = useState("Mon");
  const slots = schedule[day] ?? [];

  return (
    <ScreenContainer>
      <View
        style={[
          styles.childInfo,
          {
            backgroundColor: colors.secondary + "12",
            borderColor: colors.secondary,
            borderRadius: colors.radius,
            marginTop: 16,
            marginBottom: 16,
          },
        ]}
      >
        <Text style={[styles.childLabel, { color: colors.mutedForeground }]}>
          Viewing timetable for
        </Text>
        <Text style={[styles.childName, { color: colors.foreground }]}>
          Arjun Mehta · JEE 2026 Batch
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20, marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDay(d)}
            style={[
              styles.dayBtn,
              {
                backgroundColor: day === d ? colors.secondary : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.dayLabel,
                { color: day === d ? colors.secondaryForeground : colors.mutedForeground },
              ]}
            >
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {slots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No classes scheduled</Text>
        </View>
      ) : (
        slots.map((slot, i) => {
          const color =
            Object.entries(subjectColor).find(([key]) => slot.subject.startsWith(key))?.[1] ??
            colors.secondary;
          return (
            <View key={i} style={styles.slotRow}>
              <View style={styles.timeCol}>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{slot.time}</Text>
                {i < slots.length - 1 && (
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                )}
              </View>
              <View
                style={[
                  styles.slotCard,
                  {
                    backgroundColor: color + "12",
                    borderLeftColor: color,
                    borderRadius: colors.radius - 4,
                  },
                ]}
              >
                <Text style={[styles.slotSubject, { color: colors.foreground }]}>{slot.subject}</Text>
                <Text style={[styles.slotTeacher, { color: colors.mutedForeground }]}>{slot.teacher}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  childInfo: {
    borderWidth: 1,
    padding: 12,
    gap: 2,
  },
  childLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  childName: {
    fontSize: 14,
    fontWeight: "700",
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
  slotRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  timeCol: {
    width: 72,
    alignItems: "center",
  },
  time: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  line: {
    width: 1,
    flex: 1,
    marginTop: 6,
  },
  slotCard: {
    flex: 1,
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  slotSubject: {
    fontSize: 14,
    fontWeight: "700",
  },
  slotTeacher: {
    fontSize: 12,
  },
});

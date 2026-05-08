import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import { useColors } from "@/hooks/useColors";
import { lightHaptic } from "@/lib/haptics";
import { useRefresh } from "@/lib/useRefresh";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CACHE_KEY = "pinnacle_student_timetable";

type Slot = { time: string; subject: string; teacher: string; room: string };
type Schedule = Record<string, Slot[]>;

const SCHEDULE: Schedule = {
  Mon: [
    { time: "5:00 PM", subject: "Physics", teacher: "Dr. Ramesh Kumar", room: "Room 101" },
    { time: "7:00 PM", subject: "Study Hour", teacher: "Self-study", room: "Library" },
  ],
  Tue: [
    { time: "5:00 PM", subject: "Chemistry", teacher: "Ms. Priya Sharma", room: "Room 102" },
    { time: "7:00 PM", subject: "Mathematics", teacher: "Mr. Ajay Tiwari", room: "Room 103" },
  ],
  Wed: [
    { time: "10:00 AM", subject: "Biology", teacher: "Ms. Nidhi Verma", room: "Room 104" },
    { time: "5:00 PM", subject: "Physics", teacher: "Dr. Ramesh Kumar", room: "Room 101" },
  ],
  Thu: [
    { time: "5:00 PM", subject: "Mathematics", teacher: "Mr. Ajay Tiwari", room: "Room 103" },
    { time: "7:00 PM", subject: "Chemistry", teacher: "Ms. Priya Sharma", room: "Room 102" },
  ],
  Fri: [{ time: "5:00 PM", subject: "Physics — Doubt Session", teacher: "Dr. Ramesh Kumar", room: "Room 101" }],
  Sat: [
    { time: "9:00 AM", subject: "Mock Test", teacher: "All Faculty", room: "Exam Hall" },
    { time: "12:00 PM", subject: "Test Discussion", teacher: "All Faculty", room: "Exam Hall" },
  ],
};

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#C9A84C",
  "Study Hour": "#6B7280",
  "Mock Test": "#8B1A1A",
  "Test Discussion": "#8B1A1A",
};

export default function StudentTimetable() {
  const colors = useColors();
  const [day, setDay] = useState("Mon");
  const [schedule, setSchedule] = useState<Schedule>(SCHEDULE);
  const [fromCache, setFromCache] = useState(false);

  const loadAndSave = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) { setSchedule(JSON.parse(cached)); setFromCache(true); }
    } catch {}
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(SCHEDULE)).catch(() => {});
    setSchedule(SCHEDULE);
    setFromCache(false);
  }, []);

  useEffect(() => { loadAndSave(); }, [loadAndSave]);

  const { refreshing, onRefresh } = useRefresh(loadAndSave);

  const slots = schedule[day] ?? [];

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      {fromCache && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "50", borderRadius: colors.radius - 4 }]}>
          <Feather name="wifi-off" size={12} color={colors.warning} />
          <Text style={[styles.offlineText, { color: colors.warning }]}>Showing cached timetable</Text>
        </View>
      )}

      <View style={styles.dayRow}>
        {DAYS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => { lightHaptic(); setDay(d); }}
            style={[styles.dayBtn, { backgroundColor: day === d ? colors.primary : colors.muted, borderRadius: colors.radius - 4 }]}
          >
            <Text style={[styles.dayLabel, { color: day === d ? colors.primaryForeground : colors.mutedForeground, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
              {d}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {slots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No classes scheduled</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {slots.map((slot, i) => {
            const color =
              Object.entries(subjectColor).find(([key]) => slot.subject.startsWith(key))?.[1] ?? colors.primary;
            return (
              <View key={i} style={styles.slotRow}>
                <View style={styles.timeCol}>
                  <Text style={[styles.time, { color: colors.mutedForeground, fontFamily: "PlusJakartaSans_500Medium" }]}>{slot.time}</Text>
                  {i < slots.length - 1 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
                </View>
                <View style={[styles.slotCard, { backgroundColor: color + "12", borderLeftColor: color, borderRadius: colors.radius - 4 }]}>
                  <Text style={[styles.slotSubject, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}>{slot.subject}</Text>
                  <Text style={[styles.slotMeta, { color: colors.mutedForeground, fontFamily: "PlusJakartaSans_400Regular" }]}>
                    {slot.teacher} · {slot.room}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  offlineBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, marginBottom: 12 },
  offlineText: { fontSize: 11, fontWeight: "600" },
  dayRow: { flexDirection: "row", gap: 6, marginBottom: 20, flexWrap: "wrap" },
  dayBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  dayLabel: { fontSize: 12, fontWeight: "600" },
  empty: { marginTop: 60, alignItems: "center" },
  emptyText: { fontSize: 14 },
  timeline: { gap: 0 },
  slotRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  timeCol: { width: 72, alignItems: "center" },
  time: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  line: { width: 1, flex: 1, marginTop: 6 },
  slotCard: { flex: 1, borderLeftWidth: 3, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  slotSubject: { fontSize: 14, fontWeight: "700" },
  slotMeta: { fontSize: 12 },
});

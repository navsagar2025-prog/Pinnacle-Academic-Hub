import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const BATCHES = ["JEE 2026 — Eve", "NEET 2026 — Eve", "Class 12 PCM — Eve"];

type Student = { id: number; name: string; roll: string };
type Attendance = Record<number, "present" | "absent">;

const studentsByBatch: Record<string, Student[]> = {
  "JEE 2026 — Eve": [
    { id: 1, name: "Arjun Mehta", roll: "JEE26-047" },
    { id: 2, name: "Sneha Patel", roll: "JEE26-012" },
    { id: 3, name: "Rohit Sharma", roll: "JEE26-033" },
    { id: 4, name: "Kavya Singh", roll: "JEE26-019" },
    { id: 5, name: "Aditya Rao", roll: "JEE26-055" },
    { id: 6, name: "Priya Nair", roll: "JEE26-028" },
  ],
  "NEET 2026 — Eve": [
    { id: 7, name: "Ananya Singh", roll: "NEET26-004" },
    { id: 8, name: "Rahul Joshi", roll: "NEET26-021" },
    { id: 9, name: "Divya Menon", roll: "NEET26-039" },
    { id: 10, name: "Karan Gupta", roll: "NEET26-016" },
  ],
  "Class 12 PCM — Eve": [
    { id: 11, name: "Vaibhav Jain", roll: "PCM12-007" },
    { id: 12, name: "Pooja Tiwari", roll: "PCM12-014" },
    { id: 13, name: "Nikhil Verma", roll: "PCM12-031" },
    { id: 14, name: "Simran Kaur", roll: "PCM12-022" },
    { id: 15, name: "Aman Dubey", roll: "PCM12-045" },
  ],
};

const today = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function TeacherAttendance() {
  const colors = useColors();
  const [batch, setBatch] = useState(BATCHES[0]);
  const [attendance, setAttendance] = useState<Attendance>({});

  const students = studentsByBatch[batch] ?? [];

  const toggle = (id: number) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : "present",
    }));
  };

  const markAll = (status: "present" | "absent") => {
    const all: Attendance = {};
    students.forEach((s) => { all[s.id] = status; });
    setAttendance(all);
  };

  const presentCount = students.filter((s) => attendance[s.id] === "present").length;
  const absentCount = students.filter((s) => attendance[s.id] === "absent").length;
  const unmarked = students.length - presentCount - absentCount;

  const handleSubmit = () => {
    if (unmarked > 0) {
      Alert.alert(
        "Incomplete Attendance",
        `${unmarked} student(s) are not marked. Please mark all students before submitting.`,
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      "Demo Mode",
      `Attendance for ${batch} on ${today} would be submitted.\nPresent: ${presentCount} | Absent: ${absentCount}`,
      [{ text: "OK" }]
    );
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Mark Attendance" />

      <View
        style={[
          styles.dateCard,
          {
            backgroundColor: colors.primary + "10",
            borderColor: colors.primary + "30",
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="calendar" size={16} color={colors.primary} />
        <Text style={[styles.dateText, { color: colors.primary }]}>{today}</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionHeader title="Select Batch" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {BATCHES.map((b) => (
            <TouchableOpacity
              key={b}
              onPress={() => { setBatch(b); setAttendance({}); }}
              style={[
                styles.batchBtn,
                {
                  backgroundColor: batch === b ? colors.gold : colors.muted,
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Text
                style={[
                  styles.batchText,
                  { color: batch === b ? "#FFFFFF" : colors.mutedForeground },
                ]}
              >
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ marginTop: 16 }}>
        <View style={styles.statsRow}>
          {[
            { label: "Present", value: presentCount, color: colors.success },
            { label: "Absent", value: absentCount, color: colors.maroon },
            { label: "Unmarked", value: unmarked, color: colors.warning },
          ].map((s, i) => (
            <View
              key={i}
              style={[
                styles.statBox,
                {
                  backgroundColor: s.color + "12",
                  borderColor: s.color + "30",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <View style={styles.bulkRow}>
          <SectionHeader title="Students" />
          <View style={styles.bulkBtns}>
            <TouchableOpacity
              onPress={() => markAll("present")}
              style={[styles.bulkBtn, { backgroundColor: colors.success + "18", borderRadius: 6 }]}
            >
              <Text style={[styles.bulkText, { color: colors.success }]}>All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => markAll("absent")}
              style={[styles.bulkBtn, { backgroundColor: colors.maroon + "18", borderRadius: 6 }]}
            >
              <Text style={[styles.bulkText, { color: colors.maroon }]}>All Absent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {students.map((s) => {
          const status = attendance[s.id];
          return (
            <View
              key={s.id}
              style={[
                styles.studentRow,
                {
                  backgroundColor: colors.card,
                  borderColor:
                    status === "present"
                      ? colors.success
                      : status === "absent"
                        ? colors.maroon
                        : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor:
                      status === "present"
                        ? colors.success + "20"
                        : status === "absent"
                          ? colors.maroon + "20"
                          : colors.muted,
                    borderRadius: 20,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color:
                        status === "present"
                          ? colors.success
                          : status === "absent"
                            ? colors.maroon
                            : colors.mutedForeground,
                    },
                  ]}
                >
                  {s.name[0]}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.studentName, { color: colors.foreground }]}>{s.name}</Text>
                <Text style={[styles.rollNo, { color: colors.mutedForeground }]}>{s.roll}</Text>
              </View>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  onPress={() => setAttendance((p) => ({ ...p, [s.id]: "present" }))}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor:
                        status === "present" ? colors.success : colors.muted,
                      borderRadius: 6,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: status === "present" ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    P
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAttendance((p) => ({ ...p, [s.id]: "absent" }))}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor:
                        status === "absent" ? colors.maroon : colors.muted,
                      borderRadius: 6,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: status === "absent" ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    A
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        style={[
          styles.submitBtn,
          {
            backgroundColor: unmarked === 0 ? colors.primary : colors.muted,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather
          name="check-circle"
          size={18}
          color={unmarked === 0 ? "#fff" : colors.mutedForeground}
        />
        <Text
          style={[
            styles.submitText,
            { color: unmarked === 0 ? "#fff" : colors.mutedForeground },
          ]}
        >
          Submit Attendance
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  dateText: { fontSize: 13, fontWeight: "600" },
  batchBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  batchText: { fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, borderWidth: 1, padding: 12, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  bulkRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bulkBtns: { flexDirection: "row", gap: 8 },
  bulkBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  bulkText: { fontSize: 11, fontWeight: "700" },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" },
  studentName: { fontSize: 13, fontWeight: "600" },
  rollNo: { fontSize: 11 },
  toggleRow: { flexDirection: "row", gap: 6 },
  toggleBtn: { width: 34, height: 34, justifyContent: "center", alignItems: "center" },
  toggleText: { fontSize: 13, fontWeight: "800" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 15,
    marginTop: 16,
    marginBottom: 8,
  },
  submitText: { fontSize: 15, fontWeight: "700" },
});

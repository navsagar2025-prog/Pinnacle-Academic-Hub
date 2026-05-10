import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DemoButton from "@/components/DemoButton";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const notices = [
  {
    title: "Mock Test: JEE Mains Full Syllabus on May 1",
    date: "20 Apr",
    target: "All JEE Students",
    priority: "high",
    body: "A full-syllabus JEE Mains mock test will be conducted on May 1 from 9:00 AM to 12:00 PM in the exam hall. Attendance is mandatory.",
  },
  {
    title: "Physics Notes Updated – Thermodynamics Module",
    date: "18 Apr",
    target: "JEE / Class 12 PCM",
    priority: "normal",
    body: "Updated notes for Thermodynamics have been uploaded to the portal under Study Materials.",
  },
  {
    title: "Holiday: April 25 — Institute Closed",
    date: "15 Apr",
    target: "All Students & Staff",
    priority: "normal",
    body: "The institute will remain closed on April 25 due to a national holiday. All classes stand cancelled.",
  },
  {
    title: "Fee Reminder — Last Date April 30",
    date: "14 Apr",
    target: "All Students",
    priority: "high",
    body: "Students who have not submitted the April fee are requested to do so by April 30.",
  },
  {
    title: "Staff Meeting — April 22, 11:00 AM",
    date: "12 Apr",
    target: "All Faculty",
    priority: "normal",
    body: "A mandatory staff meeting is scheduled for April 22 at 11:00 AM in the faculty room.",
  },
];

export default function AdminNotices() {
  const colors = useColors();

  return (
    <ScreenContainer>
      <View style={{ marginTop: 16 }}>
        <SectionHeader
          title={`${notices.length} Notices`}
          action={<DemoButton label="+ Post" variant="primary" small />}
        />
        {notices.map((n, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => Alert.alert(n.title, n.body)}
            activeOpacity={0.7}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: n.priority === "high" ? colors.maroon + "50" : colors.border,
                borderRadius: colors.radius,
                borderLeftColor: n.priority === "high" ? colors.maroon : colors.secondary,
              },
            ]}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.title, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {n.title}
                </Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {n.date} · {n.target}
                </Text>
              </View>
              {n.priority === "high" && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.maroon + "18", borderRadius: 4 },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.maroon }]}>
                    Important
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.body, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {n.body}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 3,
  },
  meta: {
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
});

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type Notice = {
  id: number;
  title: string;
  body: string;
  date: string;
  type: "Academic" | "Fee" | "Holiday" | "Exam" | "General";
};

const notices: Notice[] = [
  {
    id: 1,
    title: "Mock Test: JEE Mains Full Syllabus — May 1",
    body: "All JEE 2026 batch students must report by 8:45 AM. Bring your admit card and stationery. Duration: 3 hours.",
    date: "20 Apr 2025",
    type: "Exam",
  },
  {
    id: 2,
    title: "May Fee Payment Reminder",
    body: "Fee for May 2025 is due by May 10. Late fee of ₹500 will be charged after the due date. Pay online via portal or at the front desk.",
    date: "18 Apr 2025",
    type: "Fee",
  },
  {
    id: 3,
    title: "Holiday: April 25 — Institute Closed",
    body: "The institute will remain closed on April 25 on account of a public holiday. Classes will resume on April 26 as scheduled.",
    date: "15 Apr 2025",
    type: "Holiday",
  },
  {
    id: 4,
    title: "Physics Notes Updated — Thermodynamics Module",
    body: "Dr. Ramesh Kumar has uploaded updated notes for Thermodynamics. Students can download from the study materials section.",
    date: "12 Apr 2025",
    type: "Academic",
  },
  {
    id: 5,
    title: "Parent-Teacher Meeting — April 28",
    body: "A parent-teacher meeting is scheduled for April 28 from 10 AM to 1 PM. Please confirm attendance at the front desk.",
    date: "10 Apr 2025",
    type: "General",
  },
  {
    id: 6,
    title: "Revised Batch Timings from May",
    body: "JEE 2026 evening batch timing has been revised to 5:00 PM – 7:30 PM starting from May 1. Please plan accordingly.",
    date: "8 Apr 2025",
    type: "Academic",
  },
];

const FILTERS = ["All", "Academic", "Exam", "Fee", "Holiday", "General"];

const typeColor: Record<Notice["type"] | "All", string> = {
  All: "#6B7280",
  Academic: "#0A1F5C",
  Exam: "#8B1A1A",
  Fee: "#C9A84C",
  Holiday: "#0D7377",
  General: "#6B7280",
};

const typeIcon: Record<Notice["type"], "book-open" | "edit-3" | "credit-card" | "sun" | "bell"> = {
  Academic: "book-open",
  Exam: "edit-3",
  Fee: "credit-card",
  Holiday: "sun",
  General: "bell",
};

export default function ParentNotices() {
  const colors = useColors();
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = filter === "All" ? notices : notices.filter((n) => n.type === filter);

  return (
    <ScreenContainer>
      <SectionHeader title="Notices" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16, marginTop: 8, marginBottom: 8 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f ? colors.secondary : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? colors.secondaryForeground : colors.mutedForeground },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ marginTop: 8 }}>
        {filtered.map((n) => {
          const color = typeColor[n.type];
          const icon = typeIcon[n.type];
          const isOpen = expanded === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              onPress={() => setExpanded(isOpen ? null : n.id)}
              activeOpacity={0.8}
              style={[
                styles.noticeCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isOpen ? color : colors.border,
                  borderRadius: colors.radius,
                  borderLeftColor: color,
                },
              ]}
            >
              <View style={styles.noticeHeader}>
                <View style={[styles.iconBox, { backgroundColor: color + "18", borderRadius: 8 }]}>
                  <Feather name={icon} size={15} color={color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.noticeTitleRow}>
                    <Text style={[styles.noticeTitle, { color: colors.foreground }]} numberOfLines={isOpen ? undefined : 2}>
                      {n.title}
                    </Text>
                  </View>
                  <View style={styles.noticeMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: color + "18", borderRadius: 4 }]}>
                      <Text style={[styles.typeText, { color }]}>{n.type}</Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{n.date}</Text>
                  </View>
                </View>
                <Feather
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              {isOpen && (
                <Text style={[styles.noticeBody, { color: colors.mutedForeground }]}>
                  {n.body}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <Feather name="bell-off" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notices in this category</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontSize: 12, fontWeight: "600" },
  noticeCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 10,
    gap: 0,
  },
  noticeHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconBox: { width: 32, height: 32, justifyContent: "center", alignItems: "center", marginTop: 1 },
  noticeTitleRow: { flexDirection: "row", alignItems: "flex-start" },
  noticeTitle: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  noticeMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: "700" },
  dateText: { fontSize: 11 },
  noticeBody: { fontSize: 13, lineHeight: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E2E6F0" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});

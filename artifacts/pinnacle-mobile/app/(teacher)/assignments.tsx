import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type Assignment = {
  id: number;
  title: string;
  batch: string;
  subject: string;
  dueDate: string;
  status: "Active" | "Closed" | "Draft";
  submissions: number;
  total: number;
};

const assignments: Assignment[] = [
  {
    id: 1,
    title: "Thermodynamics — Problem Set 4",
    batch: "JEE 2026 — Eve",
    subject: "Physics",
    dueDate: "May 3, 2025",
    status: "Active",
    submissions: 28,
    total: 42,
  },
  {
    id: 2,
    title: "Wave Optics — Derivation Sheet",
    batch: "NEET 2026 — Eve",
    subject: "Physics",
    dueDate: "May 5, 2025",
    status: "Active",
    submissions: 18,
    total: 36,
  },
  {
    id: 3,
    title: "Kinematics — Unit Test Preparation",
    batch: "Class 12 PCM — Eve",
    subject: "Physics",
    dueDate: "Apr 28, 2025",
    status: "Closed",
    submissions: 38,
    total: 40,
  },
  {
    id: 4,
    title: "Electrostatics — Conceptual Questions",
    batch: "JEE 2026 — Eve",
    subject: "Physics",
    dueDate: "May 10, 2025",
    status: "Draft",
    submissions: 0,
    total: 42,
  },
];

const FILTERS = ["All", "Active", "Closed", "Draft"];

const statusColor: Record<Assignment["status"], string> = {
  Active: "#0D7377",
  Closed: "#6B7280",
  Draft: "#C9A84C",
};

export default function TeacherAssignments() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? assignments : assignments.filter((a) => a.status === filter);

  const demo = () =>
    Alert.alert("Demo Mode", "This action is disabled in the demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <SectionHeader title="Assignments" />
        <TouchableOpacity
          onPress={demo}
          style={[
            styles.addBtn,
            { backgroundColor: colors.gold, borderRadius: colors.radius - 4 },
          ]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Post New</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryRow, { marginTop: 8 }]}>
        {[
          {
            label: "Active",
            value: String(assignments.filter((a) => a.status === "Active").length),
            color: colors.secondary,
          },
          {
            label: "Closed",
            value: String(assignments.filter((a) => a.status === "Closed").length),
            color: colors.mutedForeground,
          },
          {
            label: "Draft",
            value: String(assignments.filter((a) => a.status === "Draft").length),
            color: colors.gold,
          },
        ].map((s, i) => (
          <View
            key={i}
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16, marginTop: 16, marginBottom: 4 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f ? colors.gold : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ marginTop: 12 }}>
        {filtered.map((a) => {
          const sc = statusColor[a.status];
          const subPct =
            a.total > 0 ? Math.round((a.submissions / a.total) * 100) : 0;
          return (
            <TouchableOpacity
              key={a.id}
              onPress={demo}
              activeOpacity={0.8}
              style={[
                styles.assignCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  borderLeftColor: sc,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.assignTitle, { color: colors.foreground }]}>
                    {a.title}
                  </Text>
                  <Text style={[styles.assignMeta, { color: colors.mutedForeground }]}>
                    {a.batch} · {a.subject}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: sc + "18", borderRadius: 5 },
                  ]}
                >
                  <Text style={[styles.statusText, { color: sc }]}>{a.status}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.dueRow}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.dueText, { color: colors.mutedForeground }]}>
                    Due: {a.dueDate}
                  </Text>
                </View>
                {a.status !== "Draft" && (
                  <View style={styles.submissionInfo}>
                    <Text style={[styles.subCount, { color: colors.foreground }]}>
                      {a.submissions}/{a.total}
                    </Text>
                    <View
                      style={[
                        styles.subBar,
                        { backgroundColor: colors.muted, borderRadius: 3 },
                      ]}
                    >
                      <View
                        style={[
                          styles.subBarFill,
                          {
                            width: `${subPct}%` as unknown as number,
                            backgroundColor:
                              subPct >= 80 ? colors.success : colors.secondary,
                            borderRadius: 3,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.subPct, { color: colors.mutedForeground }]}>
                      {subPct}% submitted
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 3,
  },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "500" },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontSize: 12, fontWeight: "600" },
  assignCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  assignTitle: { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  assignMeta: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardBottom: { gap: 6 },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dueText: { fontSize: 12 },
  submissionInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  subCount: { fontSize: 12, fontWeight: "600", minWidth: 40 },
  subBar: { flex: 1, height: 5, overflow: "hidden" },
  subBarFill: { height: 5 },
  subPct: { fontSize: 11, minWidth: 80, textAlign: "right" },
});

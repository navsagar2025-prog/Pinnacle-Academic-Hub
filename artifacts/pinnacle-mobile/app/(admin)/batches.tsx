import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const BATCHES = [
  {
    id: "jee26",
    name: "JEE 2026 — Evening",
    students: 28,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    timing: "5:00 PM – 7:00 PM",
    days: "Mon, Wed, Thu, Fri",
    teacher: "Dr. Ramesh Kumar / Ms. Priya Sharma",
    status: "Active",
    room: "Room 101",
  },
  {
    id: "neet26",
    name: "NEET 2026 — Evening",
    students: 34,
    subjects: ["Physics", "Chemistry", "Biology"],
    timing: "5:00 PM – 7:00 PM",
    days: "Mon, Tue, Thu",
    teacher: "Dr. Ramesh Kumar / Ms. Nidhi Verma",
    status: "Active",
    room: "Room 102",
  },
  {
    id: "cl12pcm",
    name: "Class 12 PCM — Day",
    students: 22,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    timing: "10:00 AM – 12:00 PM",
    days: "Tue, Wed",
    teacher: "Mr. Ajay Tiwari / Ms. Priya Sharma",
    status: "Active",
    room: "Room 103",
  },
  {
    id: "jee25",
    name: "JEE 2025 — Evening",
    students: 18,
    subjects: ["Physics", "Chemistry", "Mathematics"],
    timing: "5:00 PM – 7:00 PM",
    days: "Tue, Fri",
    teacher: "Dr. Ramesh Kumar",
    status: "Completing",
    room: "Room 104",
  },
  {
    id: "foundation",
    name: "Foundation — Grade 10",
    students: 20,
    subjects: ["Science", "Mathematics"],
    timing: "4:00 PM – 6:00 PM",
    days: "Mon, Wed, Fri",
    teacher: "Ms. Anita Gupta",
    status: "Active",
    room: "Room 105",
  },
];

const statusColor: Record<string, string> = {
  Active: "#16A34A",
  Completing: "#C9A84C",
  Inactive: "#6B7280",
};

export default function AdminBatches() {
  const colors = useColors();
  const [selected, setSelected] = useState<(typeof BATCHES)[0] | null>(null);
  const demo = () => Alert.alert("Demo Mode", "Batch editing is disabled in demo.", [{ text: "OK" }]);

  return (
    <>
      <ScreenContainer>
        <SectionHeader title={`${BATCHES.length} Batches`} />
        {BATCHES.map((b) => {
          const sc = statusColor[b.status] ?? colors.primary;
          return (
            <TouchableOpacity
              key={b.id}
              onPress={() => setSelected(b)}
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
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.batchName,
                    { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" },
                  ]}
                >
                  {b.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: sc + "18" }]}>
                  <Text style={[styles.statusText, { color: sc }]}>{b.status}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Feather name="users" size={12} color={colors.mutedForeground} />
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {b.students} students
                </Text>
                <Text style={[styles.sep, { color: colors.border }]}>·</Text>
                <Feather name="clock" size={12} color={colors.mutedForeground} />
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{b.timing}</Text>
              </View>
              <Text style={[styles.subjects, { color: colors.mutedForeground }]}>
                {b.subjects.join(" · ")}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.days, { color: colors.mutedForeground }]}>{b.days}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          disabled
          onPress={demo}
          style={[
            styles.addBtn,
            {
              backgroundColor: colors.muted,
              borderRadius: colors.radius,
              opacity: 0.5,
            },
          ]}
        >
          <Feather name="plus" size={18} color={colors.mutedForeground} />
          <Text style={[styles.addBtnText, { color: colors.mutedForeground }]}>
            Add New Batch (Demo Disabled)
          </Text>
        </TouchableOpacity>
      </ScreenContainer>

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={styles.handle} />
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={[styles.closeBtn, { backgroundColor: colors.muted }]}
              >
                <Feather name="x" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor[selected.status] + "18", alignSelf: "flex-start" }]}>
                <Text style={[styles.statusText, { color: statusColor[selected.status] }]}>{selected.status}</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "PlayfairDisplay_700Bold" }]}>
                {selected.name}
              </Text>
              {[
                { icon: "users" as const, label: "Students", value: `${selected.students} enrolled` },
                { icon: "book-open" as const, label: "Subjects", value: selected.subjects.join(", ") },
                { icon: "clock" as const, label: "Timing", value: selected.timing },
                { icon: "calendar" as const, label: "Days", value: selected.days },
                { icon: "user" as const, label: "Faculty", value: selected.teacher },
                { icon: "map-pin" as const, label: "Room", value: selected.room },
              ].map((row) => (
                <View
                  key={row.label}
                  style={[
                    styles.detailRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Feather name={row.icon} size={14} color={colors.secondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                disabled
                onPress={demo}
                style={[styles.editBtn, { backgroundColor: colors.muted, borderRadius: colors.radius, opacity: 0.5 }]}
              >
                <Feather name="edit-2" size={16} color={colors.mutedForeground} />
                <Text style={[styles.editBtnText, { color: colors.mutedForeground }]}>
                  Edit Batch (Demo Disabled)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  batchName: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sep: {
    marginHorizontal: 2,
  },
  meta: {
    fontSize: 11,
  },
  subjects: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  days: {
    fontSize: 11,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modal: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    marginBottom: 12,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

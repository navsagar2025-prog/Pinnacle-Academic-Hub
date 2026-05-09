import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type Enquiry = {
  id: number;
  name: string;
  course: string;
  phone: string;
  date: string;
  status: "New" | "Contacted" | "Enrolled" | "Not Interested";
  source: string;
};

const ALL_ENQUIRIES: Enquiry[] = [
  { id: 1, name: "Ananya Singh", course: "JEE 2026", phone: "98765-XXXXX", date: "Today, 10:12 AM", status: "New", source: "Website" },
  { id: 2, name: "Rohan Gupta", course: "NEET 2026", phone: "87654-XXXXX", date: "Today, 9:04 AM", status: "New", source: "Walk-in" },
  { id: 3, name: "Priya Sharma", course: "Class 12 PCM", phone: "76543-XXXXX", date: "Yesterday", status: "Contacted", source: "Referral" },
  { id: 4, name: "Vaibhav Jain", course: "Foundation", phone: "65432-XXXXX", date: "Yesterday", status: "Enrolled", source: "Website" },
  { id: 5, name: "Meera Nair", course: "JEE 2026", phone: "54321-XXXXX", date: "26 Apr", status: "Contacted", source: "Social Media" },
  { id: 6, name: "Abhishek Singh", course: "NEET 2026", phone: "43210-XXXXX", date: "25 Apr", status: "Not Interested", source: "Phone" },
  { id: 7, name: "Nisha Patel", course: "Class 11 PCB", phone: "32109-XXXXX", date: "24 Apr", status: "Enrolled", source: "Referral" },
  { id: 8, name: "Kartik Rao", course: "JEE 2026", phone: "21098-XXXXX", date: "23 Apr", status: "New", source: "Website" },
  { id: 9, name: "Deepika Verma", course: "Foundation", phone: "10987-XXXXX", date: "22 Apr", status: "Contacted", source: "Walk-in" },
];

const FILTERS = ["All", "New", "Contacted", "Enrolled", "Not Interested"];

const statusConfig = {
  New: { color: "#0D7377", bg: "#0D737718" },
  Contacted: { color: "#C9A84C", bg: "#C9A84C18" },
  Enrolled: { color: "#16A34A", bg: "#16A34A18" },
  "Not Interested": { color: "#6B7280", bg: "#6B728018" },
};

export default function AdminEnquiries() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = ALL_ENQUIRIES.filter((e) => {
    const matchFilter = filter === "All" || e.status === filter;
    const matchSearch =
      search === "" ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.course.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    New: ALL_ENQUIRIES.filter((e) => e.status === "New").length,
    Contacted: ALL_ENQUIRIES.filter((e) => e.status === "Contacted").length,
    Enrolled: ALL_ENQUIRIES.filter((e) => e.status === "Enrolled").length,
    "Not Interested": ALL_ENQUIRIES.filter((e) => e.status === "Not Interested").length,
  };

  const demo = () =>
    Alert.alert("Demo Mode", "This action is disabled in the demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <SectionHeader title="Enquiries" />
        <TouchableOpacity
          onPress={demo}
          style={[styles.addBtn, { backgroundColor: colors.secondary, borderRadius: colors.radius - 4 }]}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryRow, { marginTop: 8 }]}>
        {[
          { label: "New", value: counts.New, color: statusConfig.New.color },
          { label: "Contacted", value: counts.Contacted, color: statusConfig.Contacted.color },
          { label: "Enrolled", value: counts.Enrolled, color: statusConfig.Enrolled.color },
        ].map((s, i) => (
          <View
            key={i}
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or course…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16, marginBottom: 8 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filter === f ? colors.maroon : colors.muted,
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
              {f !== "All" && ` (${counts[f as keyof typeof counts]})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map((e) => {
        const sc = statusConfig[e.status];
        return (
          <TouchableOpacity
            key={e.id}
            onPress={demo}
            activeOpacity={0.8}
            style={[
              styles.enquiryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "18", borderRadius: 22 },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {e.name[0]}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.enquiryName, { color: colors.foreground }]}>{e.name}</Text>
              <Text style={[styles.enquiryMeta, { color: colors.mutedForeground }]}>
                {e.course} · {e.date}
              </Text>
              <View style={styles.enquiryFooter}>
                <View style={[styles.sourceBadge, { backgroundColor: colors.muted, borderRadius: 4 }]}>
                  <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>{e.source}</Text>
                </View>
                <Text style={[styles.phoneText, { color: colors.mutedForeground }]}>
                  <Feather name="phone" size={10} color={colors.mutedForeground} /> {e.phone}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderRadius: 5 }]}>
              <Text style={[styles.statusText, { color: sc.color }]}>{e.status}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <Feather name="inbox" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No matching enquiries</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryCard: { flex: 1, borderWidth: 1, padding: 12, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 22, fontWeight: "800" },
  summaryLabel: { fontSize: 11, fontWeight: "500" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  filterText: { fontSize: 11, fontWeight: "600" },
  enquiryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  enquiryName: { fontSize: 14, fontWeight: "700" },
  enquiryMeta: { fontSize: 11 },
  enquiryFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2 },
  sourceText: { fontSize: 10, fontWeight: "600" },
  phoneText: { fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" },
  statusText: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});

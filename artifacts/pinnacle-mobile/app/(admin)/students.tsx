import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DemoButton from "@/components/DemoButton";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const students = [
  { name: "Arjun Mehta", batch: "JEE 2026", roll: "JEE26-047", phone: "98765-XXXXX", fee: "Paid", attendance: "88%" },
  { name: "Priya Singh", batch: "NEET 2026", roll: "NEE26-023", phone: "87654-XXXXX", fee: "Paid", attendance: "92%" },
  { name: "Rohan Sharma", batch: "JEE 2026", roll: "JEE26-051", phone: "76543-XXXXX", fee: "Due", attendance: "74%" },
  { name: "Ananya Verma", batch: "Cl-12 PCM", roll: "C12-018", phone: "65432-XXXXX", fee: "Paid", attendance: "96%" },
  { name: "Karan Patel", batch: "NEET 2026", roll: "NEE26-031", phone: "54321-XXXXX", fee: "Due", attendance: "68%" },
  { name: "Divya Joshi", batch: "JEE 2026", roll: "JEE26-058", phone: "43210-XXXXX", fee: "Paid", attendance: "82%" },
  { name: "Vaibhav Gupta", batch: "Foundation", roll: "FDN-012", phone: "32109-XXXXX", fee: "Paid", attendance: "90%" },
];

export default function AdminStudents() {
  const colors = useColors();
  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.batch.toLowerCase().includes(search.toLowerCase()) ||
      s.roll.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScreenContainer>
      <View style={{ marginTop: 16, gap: 12, marginBottom: 4 }}>
        <View style={styles.topRow}>
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
              placeholder="Search students..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
          </View>
          <DemoButton label="+ Add" variant="primary" small />
        </View>

        <SectionHeader title={`${filtered.length} students`} />

        {filtered.map((s, i) => (
          <View
            key={i}
            style={[
              styles.card,
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
                {s.name[0]}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.foreground }]}>{s.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {s.batch} · {s.roll}
              </Text>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        s.fee === "Paid" ? colors.success + "18" : colors.destructive + "18",
                      borderRadius: 4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: s.fee === "Paid" ? colors.success : colors.destructive },
                    ]}
                  >
                    {s.fee}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.muted, borderRadius: 4 },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                    {s.attendance}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert("Demo Mode", "Student profile view is disabled in demo.", [{ text: "OK" }])}
              style={styles.chevron}
            >
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    fontSize: 11,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  chevron: {
    padding: 4,
  },
});

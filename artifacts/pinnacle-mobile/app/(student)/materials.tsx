import { Feather } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { lightHaptic, mediumHaptic } from "@/lib/haptics";
import { useRefresh } from "@/lib/useRefresh";

const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics", "Biology"];

const materials = [
  { subject: "Physics", title: "Thermodynamics — Complete Notes", type: "PDF", size: "2.4 MB", date: "18 Apr" },
  { subject: "Chemistry", title: "Organic Chemistry — Reaction Mechanisms", type: "PDF", size: "1.8 MB", date: "17 Apr" },
  { subject: "Mathematics", title: "Integral Calculus — Practice Set", type: "PDF", size: "3.1 MB", date: "16 Apr" },
  { subject: "Physics", title: "Wave Optics — Formulae Sheet", type: "PDF", size: "0.9 MB", date: "14 Apr" },
  { subject: "Chemistry", title: "Periodic Table — Extended Reference", type: "PDF", size: "1.2 MB", date: "12 Apr" },
  { subject: "Mathematics", title: "Differential Equations — Solved Examples", type: "PDF", size: "2.0 MB", date: "10 Apr" },
  { subject: "Biology", title: "Human Physiology — Diagrams", type: "PDF", size: "4.3 MB", date: "9 Apr" },
];

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Biology: "#C9A84C",
};

export default function StudentMaterials() {
  const colors = useColors();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? materials : materials.filter((m) => m.subject === filter);

  const fetchFn = useCallback(async () => { await new Promise((r) => setTimeout(r, 500)); }, []);
  const { refreshing, onRefresh } = useRefresh(fetchFn);

  const handleDownload = () => {
    mediumHaptic();
    Alert.alert("Demo Mode", "Downloads are disabled in the demo. Available in the live platform.", [{ text: "OK" }]);
  };

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <View style={[styles.filterRow, { marginTop: 16, marginBottom: 16 }]}>
        {SUBJECTS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => { lightHaptic(); setFilter(s); }}
            style={[styles.chip, { backgroundColor: filter === s ? colors.primary : colors.muted, borderRadius: 20 }]}
          >
            <Text style={[styles.chipLabel, { color: filter === s ? colors.primaryForeground : colors.mutedForeground }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title={`${filtered.length} documents`} />

      {filtered.map((m, i) => (
        <View
          key={i}
          style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        >
          <View style={[styles.fileIcon, { backgroundColor: (subjectColor[m.subject] ?? colors.primary) + "18", borderRadius: 8 }]}>
            <Feather name="file-text" size={20} color={subjectColor[m.subject] ?? colors.primary} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={2}>{m.title}</Text>
            <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
              {m.subject} · {m.type} · {m.size} · {m.date}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} style={styles.dlBtn}>
            <Feather name="download" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6 },
  chipLabel: { fontSize: 12, fontWeight: "600" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  fileIcon: { width: 42, height: 42, justifyContent: "center", alignItems: "center" },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  itemMeta: { fontSize: 11 },
  dlBtn: { padding: 6 },
});

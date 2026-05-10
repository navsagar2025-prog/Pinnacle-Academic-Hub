import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const papers = [
  { title: "JEE Mains — Full Mock Test 1", date: "15 Apr", questions: 90, marks: 300, score: 212, type: "Mock" },
  { title: "JEE Mains — Full Mock Test 2", date: "22 Apr", questions: 90, marks: 300, score: null, type: "Mock" },
  { title: "Physics — Thermodynamics Test", date: "10 Apr", questions: 30, marks: 120, score: 98, type: "Subject" },
  { title: "Chemistry — Organic Practice Set", date: "8 Apr", questions: 40, marks: 160, score: 125, type: "Subject" },
  { title: "Mathematics — Calculus Mini Test", date: "5 Apr", questions: 20, marks: 80, score: 68, type: "Subject" },
  { title: "Biology — Cell Biology Test", date: "2 Apr", questions: 25, marks: 100, score: 84, type: "Subject" },
];

const typeColor: Record<string, string> = {
  Mock: "#8B1A1A",
  Subject: "#0D7377",
};

export default function StudentPapers() {
  const colors = useColors();
  const demo = () => Alert.alert("Demo Mode", "Paper download is disabled in demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <SectionHeader title="Practice Papers & Tests" />
      {papers.map((p, i) => {
        const color = typeColor[p.type] ?? colors.primary;
        const scorePercent = p.score != null ? Math.round((p.score / p.marks) * 100) : null;
        return (
          <TouchableOpacity
            key={i}
            onPress={demo}
            disabled
            activeOpacity={0.7}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: 0.9,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: color + "15", borderRadius: 8 }]}>
              <Feather name="edit-3" size={20} color={color} />
            </View>
            <View style={styles.info}>
              <View style={styles.typeRow}>
                <View style={[styles.typePill, { backgroundColor: color + "15" }]}>
                  <Text style={[styles.typeText, { color }]}>{p.type}</Text>
                </View>
                {p.score != null && (
                  <Text style={[styles.scorePct, { color: scorePercent! >= 60 ? colors.success : colors.destructive }]}>
                    {scorePercent}%
                  </Text>
                )}
                {p.score == null && (
                  <View style={[styles.typePill, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.typeText, { color: colors.mutedForeground }]}>New</Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.title, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}
              >
                {p.title}
              </Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                {p.date} · {p.questions} Qs · {p.marks} Marks
                {p.score != null && ` · Score: ${p.score}`}
              </Text>
            </View>
            <View style={[styles.demoBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.demoBadgeText, { color: colors.mutedForeground }]}>Demo</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  scorePct: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 13,
  },
  meta: {
    fontSize: 11,
  },
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

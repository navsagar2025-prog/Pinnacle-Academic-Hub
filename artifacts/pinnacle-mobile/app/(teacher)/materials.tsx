import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DemoButton from "@/components/DemoButton";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const uploaded = [
  { title: "Thermodynamics — Complete Notes", batch: "JEE 2026", size: "2.4 MB", date: "18 Apr", downloads: 42 },
  { title: "Wave Optics — Formulae Sheet", batch: "NEET 2026", size: "0.9 MB", date: "14 Apr", downloads: 37 },
  { title: "Modern Physics — Derivations", batch: "Cl-12 PCM", size: "1.6 MB", date: "11 Apr", downloads: 31 },
  { title: "Electricity — Problem Set", batch: "JEE 2026", size: "2.1 MB", date: "9 Apr", downloads: 45 },
];

export default function TeacherMaterials() {
  const colors = useColors();

  return (
    <ScreenContainer>
      <TouchableOpacity
        onPress={() => Alert.alert("Demo Mode", "File upload is disabled in demo.", [{ text: "OK" }])}
        activeOpacity={0.8}
        style={[
          styles.uploadArea,
          {
            borderColor: colors.gold,
            backgroundColor: colors.gold + "08",
            borderRadius: colors.radius,
            marginTop: 16,
            marginBottom: 20,
          },
        ]}
      >
        <View
          style={[
            styles.uploadIcon,
            {
              backgroundColor: colors.gold + "20",
              borderRadius: 32,
            },
          ]}
        >
          <Feather name="upload-cloud" size={28} color={colors.gold} />
        </View>
        <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
          Upload Study Material
        </Text>
        <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
          PDF, DOC, PPT up to 50 MB
        </Text>
      </TouchableOpacity>

      <SectionHeader title={`${uploaded.length} Materials Uploaded`} />

      {uploaded.map((m, i) => (
        <View
          key={i}
          style={[
            styles.item,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.fileIcon,
              { backgroundColor: colors.gold + "18", borderRadius: 8 },
            ]}
          >
            <Feather name="file-text" size={20} color={colors.gold} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
              {m.title}
            </Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {m.batch} · {m.size} · {m.date}
            </Text>
            <View style={styles.dlRow}>
              <Feather name="download" size={11} color={colors.mutedForeground} />
              <Text style={[styles.dlCount, { color: colors.mutedForeground }]}>
                {m.downloads} downloads
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert("Demo Mode", "This action is disabled in demo.", [{ text: "OK" }])}
            style={styles.menuBtn}
          >
            <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  uploadArea: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  uploadSub: {
    fontSize: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  fileIcon: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  meta: {
    fontSize: 11,
  },
  dlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  dlCount: {
    fontSize: 11,
  },
  menuBtn: {
    padding: 4,
  },
});

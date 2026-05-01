import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IMG_SIZE = (SCREEN_WIDTH - 32 - 8) / 3;

const CATEGORIES = ["All", "Events", "Achievements", "Campus", "Activities"];

type GalleryItem = {
  id: number;
  title: string;
  category: string;
  imageUri: string;
  date: string;
};

const gallery: GalleryItem[] = [
  { id: 1, title: "JEE 2024 Toppers Felicitation", category: "Achievements", imageUri: "https://placehold.co/400x400/0A1F5C/FFFFFF?text=🏆", date: "15 Apr 2025" },
  { id: 2, title: "Annual Science Fair", category: "Events", imageUri: "https://placehold.co/400x400/0D7377/FFFFFF?text=🔬", date: "10 Apr 2025" },
  { id: 3, title: "Campus Library Wing", category: "Campus", imageUri: "https://placehold.co/400x400/1a2e6b/FFFFFF?text=📚", date: "5 Apr 2025" },
  { id: 4, title: "Mock Test Day", category: "Activities", imageUri: "https://placehold.co/400x400/8B1A1A/FFFFFF?text=📝", date: "1 Apr 2025" },
  { id: 5, title: "NEET 2024 Selections", category: "Achievements", imageUri: "https://placehold.co/400x400/C9A84C/FFFFFF?text=🎓", date: "28 Mar 2025" },
  { id: 6, title: "Physics Lab Session", category: "Activities", imageUri: "https://placehold.co/400x400/0A3A5C/FFFFFF?text=⚗️", date: "22 Mar 2025" },
  { id: 7, title: "Parents Day 2025", category: "Events", imageUri: "https://placehold.co/400x400/2D7337/FFFFFF?text=👨‍👩‍👧", date: "15 Mar 2025" },
  { id: 8, title: "New Classroom Block", category: "Campus", imageUri: "https://placehold.co/400x400/3A1A5C/FFFFFF?text=🏫", date: "10 Mar 2025" },
  { id: 9, title: "IIT Selections 2024", category: "Achievements", imageUri: "https://placehold.co/400x400/7C1A1A/FFFFFF?text=🌟", date: "5 Mar 2025" },
];

export default function AdminGallery() {
  const colors = useColors();
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const filtered =
    category === "All" ? gallery : gallery.filter((g) => g.category === category);

  const demo = () =>
    Alert.alert("Demo Mode", "Gallery upload is disabled in the demo.", [{ text: "OK" }]);

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <SectionHeader title="Gallery" />
        <TouchableOpacity
          onPress={demo}
          style={[
            styles.addBtn,
            { backgroundColor: colors.secondary, borderRadius: colors.radius - 4 },
          ]}
        >
          <Feather name="upload" size={15} color="#fff" />
          <Text style={styles.addBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16, marginTop: 8, marginBottom: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[
              styles.catBtn,
              {
                backgroundColor: category === c ? colors.secondary : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.catText,
                { color: category === c ? "#fff" : colors.mutedForeground },
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setSelected(item)}
            activeOpacity={0.85}
            style={[
              styles.gridItem,
              { borderRadius: colors.radius - 2, borderColor: colors.border },
            ]}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={[styles.thumb, { borderRadius: colors.radius - 2 }]}
              contentFit="cover"
            />
            <View
              style={[
                styles.thumbOverlay,
                { borderRadius: colors.radius - 2 },
              ]}
            >
              <Text style={styles.thumbTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={!!selected}
        animationType="fade"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.muted, borderRadius: 20 },
              ]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </TouchableOpacity>
            {selected && (
              <>
                <Image
                  source={{ uri: selected.imageUri }}
                  style={[styles.fullImg, { borderRadius: colors.radius - 2 }]}
                  contentFit="cover"
                />
                <View style={styles.modalInfo}>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                    {selected.title}
                  </Text>
                  <View style={styles.modalMeta}>
                    <View
                      style={[
                        styles.catBadge,
                        { backgroundColor: colors.secondary + "18", borderRadius: 5 },
                      ]}
                    >
                      <Text style={[styles.catBadgeText, { color: colors.secondary }]}>
                        {selected.category}
                      </Text>
                    </View>
                    <Text style={[styles.modalDate, { color: colors.mutedForeground }]}>
                      {selected.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={demo}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.maroon + "12", borderRadius: colors.radius - 4 },
                    ]}
                  >
                    <Feather name="trash-2" size={16} color={colors.maroon} />
                    <Text style={[styles.actionText, { color: colors.maroon }]}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={demo}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.secondary + "12", borderRadius: colors.radius - 4 },
                    ]}
                  >
                    <Feather name="edit-2" size={16} color={colors.secondary} />
                    <Text style={[styles.actionText, { color: colors.secondary }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  catBtn: { paddingHorizontal: 14, paddingVertical: 7 },
  catText: { fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  gridItem: {
    width: IMG_SIZE,
    height: IMG_SIZE,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%" },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
    padding: 5,
  },
  thumbTitle: { color: "#fff", fontSize: 9, fontWeight: "600", lineHeight: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: { width: "100%", maxWidth: 420, overflow: "hidden" },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImg: { width: "100%", height: 240 },
  modalInfo: { padding: 16, gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 11, fontWeight: "600" },
  modalDate: { fontSize: 12 },
  modalActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
});

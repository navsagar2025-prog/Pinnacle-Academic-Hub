import { Feather } from "@expo/vector-icons";
import React, { type ComponentProps, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type FeatherName = ComponentProps<typeof Feather>["name"];

const NOTICE_TYPES: { label: string; icon: FeatherName; color: string }[] = [
  { label: "General", icon: "info", color: "#0A1F5C" },
  { label: "Exam", icon: "clipboard", color: "#8B1A1A" },
  { label: "Holiday", icon: "calendar", color: "#C9A84C" },
  { label: "Result", icon: "award", color: "#0D7377" },
];

const NOTICES = [
  {
    id: "1",
    title: "Dussehra Holiday",
    body: "The institute will remain closed on 12th October (Wednesday) on account of Dussehra. Regular classes resume on 13th October.",
    type: "Holiday",
    date: "2 days ago",
    batches: "All Batches",
    pinned: true,
  },
  {
    id: "2",
    title: "Monthly Test — October",
    body: "The monthly test for JEE 2026 and NEET 2026 batches will be held on 15th October (Saturday) from 9:00 AM to 12:00 PM in the Exam Hall.",
    type: "Exam",
    date: "4 days ago",
    batches: "JEE 2026, NEET 2026",
    pinned: false,
  },
  {
    id: "3",
    title: "Extra Doubt Session — Physics",
    body: "An additional Physics doubt session has been arranged on 10th October (Monday) at 4:00 PM for Class 12 PCM students.",
    type: "General",
    date: "1 week ago",
    batches: "Cl-12 PCM",
    pinned: false,
  },
  {
    id: "4",
    title: "Result Declaration — September Test",
    body: "September monthly test results have been uploaded to the portal. Students can view their detailed performance report from the Materials section.",
    type: "Result",
    date: "1 week ago",
    batches: "All Batches",
    pinned: false,
  },
];

const typeColor: Record<string, string> = {
  General: "#0A1F5C",
  Exam: "#8B1A1A",
  Holiday: "#C9A84C",
  Result: "#0D7377",
};

const typeIcon: Record<string, FeatherName> = {
  General: "info",
  Exam: "clipboard",
  Holiday: "calendar",
  Result: "award",
};

export default function TeacherNotices() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<(typeof NOTICES)[0] | null>(null);

  const demo = () => Alert.alert("Demo Mode", "Notice creation is disabled in demo.", [{ text: "OK" }]);

  const openNotice = (n: (typeof NOTICES)[0]) => {
    setSelected(n);
    setModalVisible(true);
  };

  return (
    <>
      <ScreenContainer>
        <View style={styles.newRow}>
          <TouchableOpacity
            onPress={demo}
            disabled
            activeOpacity={0.8}
            style={[
              styles.newBtn,
              {
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
                opacity: 0.6,
              },
            ]}
          >
            <Feather name="plus" size={16} color={colors.mutedForeground} />
            <Text style={[styles.newBtnLabel, { color: colors.mutedForeground }]}>
              New Notice (Demo Disabled)
            </Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="Pinned" />
        {NOTICES.filter((n) => n.pinned).map((n) => (
          <NoticeCard key={n.id} notice={n} colors={colors} onPress={openNotice} />
        ))}

        <SectionHeader title="Recent Notices" />
        {NOTICES.filter((n) => !n.pinned).map((n) => (
          <NoticeCard key={n.id} notice={n} colors={colors} onPress={openNotice} />
        ))}
      </ScreenContainer>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {selected && (
            <View style={styles.modalBody}>
              <View style={styles.typeRow}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: typeColor[selected.type] + "15" },
                  ]}
                >
                  <Feather
                    name={typeIcon[selected.type]}
                    size={12}
                    color={typeColor[selected.type]}
                  />
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: typeColor[selected.type] },
                    ]}
                  >
                    {selected.type}
                  </Text>
                </View>
                <Text style={[styles.noticeDate, { color: colors.mutedForeground }]}>
                  {selected.date}
                </Text>
              </View>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.foreground, fontFamily: "PlayfairDisplay_700Bold" },
                ]}
              >
                {selected.title}
              </Text>
              <View
                style={[
                  styles.batchRow,
                  { backgroundColor: colors.muted, borderRadius: colors.radius - 4 },
                ]}
              >
                <Feather name="users" size={12} color={colors.mutedForeground} />
                <Text style={[styles.batchText, { color: colors.mutedForeground }]}>
                  {selected.batches}
                </Text>
              </View>
              <Text style={[styles.modalBody2, { color: colors.foreground }]}>
                {selected.body}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

function NoticeCard({
  notice,
  colors,
  onPress,
}: {
  notice: (typeof NOTICES)[0];
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onPress: (n: (typeof NOTICES)[0]) => void;
}) {
  const color = typeColor[notice.type] ?? colors.primary;
  return (
    <TouchableOpacity
      onPress={() => onPress(notice)}
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
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.typePill, { backgroundColor: color + "15" }]}>
            <Feather name={typeIcon[notice.type]} size={10} color={color} />
            <Text style={[styles.typePillText, { color }]}>{notice.type}</Text>
          </View>
          {notice.pinned && (
            <Feather name="bookmark" size={14} color={colors.gold} />
          )}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.cardTitle, { color: colors.foreground }]}
        >
          {notice.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.cardPreview, { color: colors.mutedForeground }]}
        >
          {notice.body}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
            {notice.batches}
          </Text>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {notice.date}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  newRow: {
    marginBottom: 4,
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  newBtnLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardAccent: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardPreview: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 11,
  },
  cardDate: {
    fontSize: 11,
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
  modalHandle: {
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
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  noticeDate: {
    fontSize: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  batchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  batchText: {
    fontSize: 12,
  },
  modalBody2: {
    fontSize: 14,
    lineHeight: 24,
  },
});

import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import type { DoubtFeedItem } from "@/lib/api";

interface Props {
  doubt: DoubtFeedItem | null;
  visible: boolean;
  onClose: () => void;
}

const STATUS_COLOR = { open: "#C9A84C", resolved: "#6B7280" };

export default function DoubtDetailSheet({ doubt, visible, onClose }: Props) {
  const colors = useColors();
  const translateY = useSharedValue(700);

  useEffect(() => {
    translateY.value = visible ? withSpring(0, { damping: 18, stiffness: 120 }) : withTiming(700, { duration: 280 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!doubt) return null;

  const status = doubt.isResolved ? "resolved" : "open";
  const ans = doubt.topAnswer;
  const isStaff = ans?.authorRole === "teacher" || ans?.authorRole === "admin";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.sheet, { backgroundColor: colors.card }, sheetStyle]}
          onStartShouldSetResponder={() => true}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <View style={styles.metaRow}>
                  <View style={[styles.subjectPill, { backgroundColor: "#0A1F5C15" }]}>
                    <Text style={[styles.subjectText, { color: "#0A1F5C" }]}>{doubt.subject}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[status] + "20" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>{status}</Text>
                  </View>
                </View>
                <Text style={[styles.question, { color: colors.foreground }]}>{doubt.questionText}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  By {doubt.studentName ?? "Student"} · {doubt.answerCount} repl{doubt.answerCount === 1 ? "y" : "ies"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>TOP ANSWER</Text>

              {ans ? (
                <View
                  style={[
                    styles.answerBox,
                    {
                      backgroundColor: ans.isOfficial ? "#C9A84C10" : isStaff ? "#0D737710" : colors.background,
                      borderLeftColor: ans.isOfficial ? "#C9A84C" : isStaff ? "#0D7377" : colors.border,
                      borderRadius: colors.radius - 4,
                    },
                  ]}
                >
                  <View style={styles.answerHeader}>
                    <Text style={[styles.authorName, { color: isStaff ? "#0D7377" : colors.foreground }]}>
                      {isStaff ? "👨‍🏫 " : "👤 "}
                      {ans.authorName ?? "Anonymous"}
                    </Text>
                    {ans.isOfficial && (
                      <View style={styles.officialBadge}>
                        <Feather name="shield" size={9} color="#fff" />
                        <Text style={styles.officialText}>OFFICIAL</Text>
                      </View>
                    )}
                    <Text style={[styles.upvoteCount, { color: colors.mutedForeground }]}>
                      ▲ {ans.upvotes}
                    </Text>
                  </View>
                  <Text style={[styles.answerBody, { color: colors.foreground }]}>{ans.answerText}</Text>
                </View>
              ) : (
                <View style={styles.noAnswer}>
                  <Feather name="message-circle" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.noAnswerText, { color: colors.mutedForeground }]}>
                    No answers yet — check back later!
                  </Text>
                </View>
              )}

              {doubt.answerCount > 1 && (
                <View style={[styles.moreAnswersCard, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}>
                  <Feather name="external-link" size={14} color={colors.primary} />
                  <Text style={[styles.moreAnswersText, { color: colors.primary }]}>
                    {doubt.answerCount - 1} more repl{doubt.answerCount - 1 === 1 ? "y" : "ies"} · Open in web portal to see all
                  </Text>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 10, maxHeight: "85%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 18, paddingBottom: 14 },
  metaRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  subjectPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  subjectText: { fontSize: 10, fontWeight: "700" },
  statusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  question: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  meta: { fontSize: 11, marginTop: 6 },
  closeBtn: { padding: 4 },
  divider: { height: 1, marginBottom: 16 },
  body: { paddingHorizontal: 18 },
  sectionTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  answerBox: { borderLeftWidth: 3, padding: 12, gap: 8 },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  authorName: { fontSize: 12, fontWeight: "700", flex: 1 },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#C9A84C",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  officialText: { fontSize: 8, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  upvoteCount: { fontSize: 11, fontWeight: "600" },
  answerBody: { fontSize: 14, lineHeight: 22 },
  noAnswer: { alignItems: "center", paddingVertical: 24, gap: 10 },
  noAnswerText: { fontSize: 13, textAlign: "center" },
  moreAnswersCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginTop: 12 },
  moreAnswersText: { fontSize: 12, fontWeight: "600", flex: 1 },
});

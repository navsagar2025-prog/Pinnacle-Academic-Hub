import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import DoubtDetailSheet from "@/components/DoubtDetailSheet";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { SkeletonList } from "@/components/SkeletonLoader";
import { useColors } from "@/hooks/useColors";
import { lightHaptic, mediumHaptic, successHaptic } from "@/lib/haptics";
import { useRefresh } from "@/lib/useRefresh";
import {
  fetchDoubtsFeed,
  formatRelativeTime,
  hasWebsiteBase,
  postDoubt,
  upvoteDoubtAnswer,
  type DoubtFeedItem,
} from "@/lib/api";

const STATUS_COLOR = { open: "#C9A84C", resolved: "#6B7280" };
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];

export default function StudentDoubts() {
  const colors = useColors();
  const [tab, setTab] = useState<"mine" | "community">("community");
  const [draft, setDraft] = useState("");
  const [draftSubject, setDraftSubject] = useState("Physics");
  const [posting, setPosting] = useState(false);
  const [items, setItems] = useState<DoubtFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteState, setVoteState] = useState<Record<string, { voted: boolean; count: number }>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sheetDoubt, setSheetDoubt] = useState<DoubtFeedItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const indicatorX = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  useEffect(() => {
    if (tabContainerWidth > 0) {
      const halfW = (tabContainerWidth - 8) / 2;
      indicatorX.value = tab === "mine" ? 4 : 4 + halfW;
    }
  }, [tabContainerWidth, tab, indicatorX]);

  const handleTabSwitch = (t: "mine" | "community") => {
    lightHaptic();
    setTab(t);
    if (tabContainerWidth > 0) {
      const halfW = (tabContainerWidth - 8) / 2;
      indicatorX.value = withTiming(t === "mine" ? 4 : 4 + halfW, { duration: 200 });
    }
  };

  const fetchFn = useCallback(async () => {
    const rows = await fetchDoubtsFeed({ mine: tab === "mine" });
    setItems(rows);
    const next: Record<string, { voted: boolean; count: number }> = {};
    for (const d of rows) {
      if (d.topAnswer) next[d.topAnswer.id] = { voted: d.topAnswer.voted, count: d.topAnswer.upvotes };
    }
    setVoteState(next);
  }, [tab]);

  const load = useCallback(() => {
    setLoading(true);
    fetchFn().finally(() => setLoading(false));
  }, [fetchFn]);

  useEffect(() => { load(); }, [load]);

  const { refreshing, onRefresh } = useRefresh(fetchFn);

  const onUpvote = async (doubtId: string, answerId: string) => {
    mediumHaptic();
    const current = voteState[answerId] ?? { voted: false, count: 0 };
    const optimistic = { voted: !current.voted, count: current.count + (current.voted ? -1 : 1) };
    setVoteState((s) => ({ ...s, [answerId]: optimistic }));
    const result = await upvoteDoubtAnswer(doubtId, answerId);
    if (!result) {
      setVoteState((s) => ({ ...s, [answerId]: current }));
      Alert.alert("Sign in required", "Please sign in on the web portal to upvote answers.");
      return;
    }
    setVoteState((s) => ({
      ...s,
      [answerId]: { voted: result.upvoted, count: current.count + (result.upvoted ? 1 : current.voted ? -1 : 0) },
    }));
  };

  const pickImage = async () => {
    lightHaptic();
    Alert.alert("Attach Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permission needed", "Allow camera access in Settings."); return; }
          const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!r.canceled) { setSelectedImage(r.assets[0].uri); lightHaptic(); }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
          if (!r.canceled) { setSelectedImage(r.assets[0].uri); lightHaptic(); }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const submit = async () => {
    if (!draft.trim()) return;
    mediumHaptic();
    setPosting(true);
    const ok = await postDoubt({ subject: draftSubject, questionText: draft.trim() });
    setPosting(false);
    if (!ok) {
      Alert.alert("Sign in required", "Please sign in on the web portal so your doubt is linked to your enrollment.");
      return;
    }
    successHaptic();
    Alert.alert("Doubt posted", "Your question has been posted. Teachers usually reply within 24h.");
    setDraft("");
    setSelectedImage(null);
    load();
  };

  const openSheet = (d: DoubtFeedItem) => {
    lightHaptic();
    setSheetDoubt(d);
    setSheetVisible(true);
  };

  const indWidth = tabContainerWidth > 0 ? (tabContainerWidth - 8) / 2 : 0;

  return (
    <>
      <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
        <SectionHeader title="Doubt Forum" />

        <View
          style={[styles.tabs, { backgroundColor: colors.muted, borderRadius: colors.radius - 2 }]}
          onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width)}
        >
          {tabContainerWidth > 0 && (
            <Animated.View
              style={[
                styles.indicator,
                {
                  position: "absolute",
                  top: 4,
                  bottom: 4,
                  width: indWidth,
                  backgroundColor: colors.card,
                  borderRadius: colors.radius - 4,
                },
                indicatorStyle,
              ]}
            />
          )}
          {(["mine", "community"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => handleTabSwitch(t)} style={styles.tab}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: tab === t ? colors.foreground : colors.mutedForeground,
                    fontFamily: tab === t ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_600SemiBold",
                  },
                ]}
              >
                {t === "mine" ? "My Doubts" : "Community Feed"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "mine" && (
          <View style={[styles.askCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.askTitle, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}>Ask a new doubt</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {SUBJECTS.map((s) => {
                const active = draftSubject === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { lightHaptic(); setDraftSubject(s); }}
                    style={[styles.subjectChip, { backgroundColor: active ? colors.primary : "transparent", borderColor: active ? colors.primary : colors.border, borderRadius: colors.radius - 4 }]}
                  >
                    <Text style={{ color: active ? "#fff" : colors.foreground, fontSize: 11, fontWeight: "600" }}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Describe your doubt with context, what you tried, and where you got stuck…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius - 4, minHeight: 80 }]}
            />

            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImg} resizeMode="cover" />
                <TouchableOpacity onPress={() => { lightHaptic(); setSelectedImage(null); }} style={styles.removeImg}>
                  <Feather name="x-circle" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.askActions}>
              <TouchableOpacity
                onPress={pickImage}
                style={[styles.cameraBtn, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}
              >
                <Feather name="camera" size={15} color={colors.mutedForeground} />
                <Text style={[styles.cameraBtnText, { color: colors.mutedForeground }]}>Attach Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submit}
                disabled={!draft.trim() || posting}
                style={[styles.askBtn, { backgroundColor: draft.trim() && !posting ? "#C9A84C" : colors.muted, borderRadius: colors.radius - 4 }]}
              >
                {posting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Feather name="send" size={14} color={draft.trim() ? "#fff" : colors.mutedForeground} />
                )}
                <Text style={[styles.askBtnText, { color: draft.trim() ? "#fff" : colors.mutedForeground }]}>
                  {posting ? "Posting…" : "Post Doubt"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Feather name="message-square" size={28} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13, textAlign: "center" }}>
              {!hasWebsiteBase()
                ? "Connect to the web portal to load the doubt forum."
                : tab === "mine"
                ? "You haven't posted any doubts yet — ask one above!"
                : "No doubts in the community yet — be the first to ask!"}
            </Text>
          </View>
        ) : (
          items.map((d) => {
            const status = d.isResolved ? "resolved" : "open";
            const ans = d.topAnswer;
            const ansVote = ans ? voteState[ans.id] ?? { voted: ans.voted, count: ans.upvotes } : null;
            const isStaff = ans?.authorRole === "teacher" || ans?.authorRole === "admin";
            return (
              <TouchableOpacity
                key={d.id}
                activeOpacity={0.85}
                onPress={() => openSheet(d)}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              >
                <View style={styles.metaRow}>
                  <View style={[styles.subjectPill, { backgroundColor: "#0A1F5C15" }]}>
                    <Text style={[styles.subjectText, { color: "#0A1F5C" }]}>{d.subject}</Text>
                  </View>
                  {d.topic && <Text style={[styles.topicText, { color: colors.mutedForeground }]}>· {d.topic}</Text>}
                  <View style={{ flex: 1 }} />
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[status] + "15" }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>{status}</Text>
                  </View>
                </View>

                <Text style={[styles.qText, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                  {d.questionText}
                </Text>

                <View style={styles.footerRow}>
                  <Text style={[styles.askerText, { color: colors.mutedForeground }]}>
                    By {d.studentName ?? "Student"} · {formatRelativeTime(d.createdAt)} · {d.answerCount}{" "}
                    repl{d.answerCount === 1 ? "y" : "ies"}
                  </Text>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </View>

                {ans && ansVote && (
                  <View
                    style={[
                      styles.answerBox,
                      {
                        backgroundColor: ans.isOfficial ? "#C9A84C12" : isStaff ? "#0D737712" : colors.muted,
                        borderLeftColor: ans.isOfficial ? "#C9A84C" : isStaff ? "#0D7377" : colors.border,
                        borderRadius: colors.radius - 4,
                      },
                    ]}
                  >
                    <View style={styles.answerHeader}>
                      <Text style={[styles.answerAuthor, { color: isStaff ? "#0D7377" : colors.foreground }]}>
                        {isStaff ? "👨‍🏫 " : "👤 "}{ans.authorName ?? "Anonymous"}
                      </Text>
                      {ans.isOfficial && (
                        <View style={[styles.officialPill, { backgroundColor: "#C9A84C" }]}>
                          <Feather name="shield" size={9} color="#fff" />
                          <Text style={styles.officialText}>OFFICIAL</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.answerText, { color: colors.foreground }]}>{ans.answerText}</Text>
                    <View style={styles.answerActions}>
                      <TouchableOpacity
                        onPress={() => onUpvote(d.id, ans.id)}
                        style={[styles.upvoteBtn, { borderColor: ansVote.voted ? "#0D7377" : colors.border, backgroundColor: ansVote.voted ? "#0D737715" : "transparent", borderRadius: colors.radius - 6 }]}
                      >
                        <Feather name="thumbs-up" size={11} color={ansVote.voted ? "#0D7377" : colors.mutedForeground} />
                        <Text style={[styles.upvoteText, { color: ansVote.voted ? "#0D7377" : colors.mutedForeground }]}>{ansVote.count}</Text>
                      </TouchableOpacity>
                      {d.answerCount > 1 && (
                        <Text style={[styles.moreReplies, { color: colors.mutedForeground }]}>
                          +{d.answerCount - 1} more repl{d.answerCount - 1 === 1 ? "y" : "ies"}
                        </Text>
                      )}
                      <View style={{ flex: 1 }} />
                      <Text style={[{ fontSize: 10, color: colors.primary }]}>Tap to expand →</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScreenContainer>

      <DoubtDetailSheet doubt={sheetDoubt} visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", padding: 4, marginBottom: 14, overflow: "hidden" },
  indicator: {},
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", zIndex: 1 },
  tabText: { fontSize: 12 },
  askCard: { borderWidth: 1, padding: 12, marginBottom: 14, gap: 8 },
  askTitle: { fontSize: 13 },
  subjectChip: { paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  input: { borderWidth: 1, padding: 10, fontSize: 13, textAlignVertical: "top" },
  imagePreview: { position: "relative" },
  previewImg: { width: "100%", height: 140, borderRadius: 8 },
  removeImg: { position: "absolute", top: 6, right: 6, backgroundColor: "#fff", borderRadius: 10 },
  askActions: { flexDirection: "row", gap: 8 },
  cameraBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  cameraBtnText: { fontSize: 12, fontWeight: "600" },
  askBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  askBtnText: { fontSize: 13, fontWeight: "700" },
  empty: { padding: 32, alignItems: "center", borderWidth: 1 },
  card: { borderWidth: 1, padding: 12, marginBottom: 10, gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  subjectPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  subjectText: { fontSize: 10, fontWeight: "700" },
  topicText: { fontSize: 11 },
  statusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  qText: { fontSize: 13, lineHeight: 18 },
  footerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  askerText: { fontSize: 11, flex: 1 },
  answerBox: { borderLeftWidth: 3, padding: 10, gap: 6, marginTop: 4 },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  answerAuthor: { fontSize: 11, fontWeight: "700" },
  officialPill: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  officialText: { fontSize: 8, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  answerText: { fontSize: 12, lineHeight: 16 },
  answerActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  upvoteText: { fontSize: 11, fontWeight: "700" },
  moreReplies: { fontSize: 10 },
});

import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import { fetchQuestionBank, hasWebsiteBase, toggleQuestionBookmark, type QBQuestion } from "@/lib/api";

const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics"];

const DIFF_COLOR: Record<string, string> = {
  easy: "#0D7377",
  medium: "#C9A84C",
  hard: "#8B1A1A",
};

type Pick = "A" | "B" | "C" | "D";

export default function QuestionBank() {
  const colors = useColors();
  const [subject, setSubject] = useState("All");
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, Pick>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [questions, setQuestions] = useState<QBQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchQuestionBank({ subject, pageSize: 50 }).then(({ items, bookmarkedIds }) => {
      if (cancelled) return;
      setQuestions(items);
      setBookmarks((prev) => {
        const next = { ...prev };
        for (const id of bookmarkedIds) next[id] = true;
        return next;
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [subject]);

  const filtered = useMemo(() => {
    return bookmarksOnly ? questions.filter((q) => bookmarks[q.id]) : questions;
  }, [questions, bookmarksOnly, bookmarks]);

  const onToggleBookmark = async (id: string) => {
    const next = !bookmarks[id];
    setBookmarks((prev) => ({ ...prev, [id]: next }));
    const ok = await toggleQuestionBookmark(id, next);
    if (!ok) setBookmarks((prev) => ({ ...prev, [id]: !next }));
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Question Bank" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {SUBJECTS.map((s) => {
          const active = subject === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setSubject(s)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: colors.radius - 2,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          onPress={() => setBookmarksOnly((b) => !b)}
          style={[
            styles.chip,
            {
              backgroundColor: bookmarksOnly ? "#C9A84C" : colors.card,
              borderColor: bookmarksOnly ? "#C9A84C" : colors.border,
              borderRadius: colors.radius - 2,
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
            },
          ]}
        >
          <Feather name="bookmark" size={12} color={bookmarksOnly ? "#fff" : colors.foreground} />
          <Text style={[styles.chipText, { color: bookmarksOnly ? "#fff" : colors.foreground }]}>Bookmarks</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13 }}>
            Loading questions…
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="inbox" size={28} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13, textAlign: "center" }}>
            {!hasWebsiteBase()
              ? "Connect to the web portal to load live questions."
              : bookmarksOnly
              ? "No bookmarks yet."
              : "No questions in this subject yet."}
          </Text>
        </View>
      ) : (
        filtered.map((q) => {
          const isOpen = openId === q.id;
          const userPick = picked[q.id];
          const isRevealed = revealed[q.id];
          const isBookmarked = !!bookmarks[q.id];
          const isMcq = q.questionType === "mcq" && q.options;
          const correct = isMcq && userPick === q.correctAnswer;

          return (
            <View
              key={q.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setOpenId(isOpen ? null : q.id)}
                activeOpacity={0.7}
                style={styles.cardHeader}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.metaRow}>
                    <View style={[styles.subjectPill, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.subjectText, { color: colors.primary }]}>{q.subject}</Text>
                    </View>
                    <View style={[styles.diffPill, { backgroundColor: DIFF_COLOR[q.difficulty] + "15" }]}>
                      <Text style={[styles.diffText, { color: DIFF_COLOR[q.difficulty] }]}>{q.difficulty}</Text>
                    </View>
                    {q.year && (
                      <Text style={[styles.yearText, { color: colors.mutedForeground }]}>PYQ {q.year}</Text>
                    )}
                  </View>
                  <Text
                    numberOfLines={isOpen ? undefined : 2}
                    style={[styles.qText, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}
                  >
                    {q.questionText}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onToggleBookmark(q.id)}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <Feather
                    name="bookmark"
                    size={18}
                    color={isBookmarked ? "#C9A84C" : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.body}>
                  {isMcq ? (
                    (["A", "B", "C", "D"] as const).map((opt) => {
                      const text = q.options?.[opt];
                      if (!text) return null;
                      const showCorrect = isRevealed && opt === q.correctAnswer;
                      const showWrong = isRevealed && userPick === opt && opt !== q.correctAnswer;
                      return (
                        <TouchableOpacity
                          key={opt}
                          disabled={isRevealed}
                          onPress={() => setPicked((p) => ({ ...p, [q.id]: opt }))}
                          style={[
                            styles.option,
                            {
                              borderColor: showCorrect
                                ? "#0D7377"
                                : showWrong
                                ? "#8B1A1A"
                                : userPick === opt
                                ? colors.primary
                                : colors.border,
                              backgroundColor: showCorrect
                                ? "#0D737710"
                                : showWrong
                                ? "#8B1A1A10"
                                : userPick === opt
                                ? colors.primary + "10"
                                : "transparent",
                              borderRadius: colors.radius - 4,
                            },
                          ]}
                        >
                          <Text style={[styles.optKey, { color: colors.mutedForeground }]}>{opt}.</Text>
                          <Text style={[styles.optText, { color: colors.foreground, flex: 1 }]}>{text}</Text>
                          {showCorrect && <Feather name="check" size={14} color="#0D7377" />}
                          {showWrong && <Feather name="x" size={14} color="#8B1A1A" />}
                        </TouchableOpacity>
                      );
                    })
                  ) : null}

                  {!isRevealed ? (
                    <TouchableOpacity
                      disabled={isMcq ? !userPick : false}
                      onPress={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                      style={[
                        styles.revealBtn,
                        {
                          backgroundColor: !isMcq || userPick ? "#C9A84C" : colors.muted,
                          borderRadius: colors.radius - 4,
                        },
                      ]}
                    >
                      <Feather name="eye" size={14} color={!isMcq || userPick ? "#fff" : colors.mutedForeground} />
                      <Text style={[styles.revealText, { color: !isMcq || userPick ? "#fff" : colors.mutedForeground }]}>
                        Reveal Solution
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.solution,
                        { backgroundColor: colors.primary + "08", borderRadius: colors.radius - 4 },
                      ]}
                    >
                      <Text style={[styles.solutionTitle, { color: colors.primary }]}>
                        {isMcq
                          ? correct
                            ? "Correct! 🎉"
                            : `Correct answer: ${q.correctAnswer}`
                          : `Expected: ${q.correctAnswer}`}
                      </Text>
                      {q.solution ? (
                        <Text style={[styles.solutionText, { color: colors.foreground }]}>{q.solution}</Text>
                      ) : (
                        <Text style={[styles.solutionText, { color: colors.mutedForeground, fontStyle: "italic" }]}>
                          No detailed solution provided.
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={() => {
                          setRevealed((r) => ({ ...r, [q.id]: false }));
                          setPicked((p) => {
                            const { [q.id]: _, ...rest } = p;
                            return rest;
                          });
                        }}
                        style={{ marginTop: 8 }}
                      >
                        <Text style={[styles.tryAgain, { color: colors.primary }]}>↻ Try again</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chipRow: { gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  empty: { padding: 32, alignItems: "center", borderWidth: 1 },
  card: { borderWidth: 1, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  metaRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  subjectPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  subjectText: { fontSize: 10, fontWeight: "700" },
  diffPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  diffText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  yearText: { fontSize: 11 },
  qText: { fontSize: 13, lineHeight: 18 },
  body: { marginTop: 12, gap: 6 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optKey: { fontWeight: "700", fontSize: 13 },
  optText: { fontSize: 13 },
  revealBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  revealText: { fontSize: 13, fontWeight: "700" },
  solution: { padding: 12, marginTop: 4, gap: 4 },
  solutionTitle: { fontSize: 12, fontWeight: "700" },
  solutionText: { fontSize: 12, lineHeight: 17 },
  tryAgain: { fontSize: 12, fontWeight: "600" },
});

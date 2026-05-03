import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type Question = {
  id: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  year?: number;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correct: "A" | "B" | "C" | "D";
  solution: string;
  bookmarked?: boolean;
};

const QUESTIONS: Question[] = [
  {
    id: "q1", subject: "Physics", topic: "Kinematics", difficulty: "medium", year: 2023,
    text: "A particle moves in a straight line with velocity v = 3t² − 6t + 2 m/s. Its acceleration at t = 2 s is:",
    options: { A: "2 m/s²", B: "4 m/s²", C: "6 m/s²", D: "8 m/s²" }, correct: "C",
    solution: "a = dv/dt = 6t − 6. At t = 2 s, a = 6(2) − 6 = 6 m/s².",
    bookmarked: true,
  },
  {
    id: "q2", subject: "Chemistry", topic: "Atomic Structure", difficulty: "easy", year: 2022,
    text: "Number of unpaired electrons in Fe³⁺ (Z = 26) is:",
    options: { A: "3", B: "4", C: "5", D: "6" }, correct: "C",
    solution: "Fe³⁺: [Ar] 3d⁵ — five unpaired electrons in the half-filled d-subshell.",
  },
  {
    id: "q3", subject: "Mathematics", topic: "Calculus", difficulty: "hard", year: 2024,
    text: "If f(x) = ∫₀ˣ (t² + 1) dt, then f'(2) is:",
    options: { A: "3", B: "4", C: "5", D: "6" }, correct: "C",
    solution: "By FTC, f'(x) = x² + 1, so f'(2) = 5.",
  },
  {
    id: "q4", subject: "Physics", topic: "Optics", difficulty: "medium", year: 2021,
    text: "The refractive index of glass with respect to air is 1.5. The speed of light in glass is:",
    options: { A: "1.5 × 10⁸ m/s", B: "2.0 × 10⁸ m/s", C: "2.5 × 10⁸ m/s", D: "3.0 × 10⁸ m/s" }, correct: "B",
    solution: "v = c / n = (3 × 10⁸) / 1.5 = 2 × 10⁸ m/s.",
  },
];

const SUBJECTS = ["All", "Physics", "Chemistry", "Mathematics"];

const DIFF_COLOR: Record<string, string> = {
  easy: "#0D7377",
  medium: "#C9A84C",
  hard: "#8B1A1A",
};

export default function QuestionBank() {
  const colors = useColors();
  const [subject, setSubject] = useState("All");
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(
    Object.fromEntries(QUESTIONS.filter((q) => q.bookmarked).map((q) => [q.id, true]))
  );

  let filtered = QUESTIONS.filter((q) => subject === "All" || q.subject === subject);
  if (bookmarksOnly) filtered = filtered.filter((q) => bookmarks[q.id]);

  return (
    <ScreenContainer>
      <SectionHeader
        title="Question Bank"
        
      />

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

      {filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="inbox" size={28} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13 }}>
            {bookmarksOnly ? "No bookmarks yet." : "No questions in this subject yet."}
          </Text>
        </View>
      ) : (
        filtered.map((q) => {
          const isOpen = openId === q.id;
          const userPick = picked[q.id];
          const isRevealed = revealed[q.id];
          const isBookmarked = !!bookmarks[q.id];
          const correct = userPick === q.correct;

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
                    {q.text}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setBookmarks((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
                  }}
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
                  {(["A", "B", "C", "D"] as const).map((opt) => {
                    const showCorrect = isRevealed && opt === q.correct;
                    const showWrong = isRevealed && userPick === opt && opt !== q.correct;
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
                        <Text style={[styles.optText, { color: colors.foreground, flex: 1 }]}>{q.options[opt]}</Text>
                        {showCorrect && <Feather name="check" size={14} color="#0D7377" />}
                        {showWrong && <Feather name="x" size={14} color="#8B1A1A" />}
                      </TouchableOpacity>
                    );
                  })}

                  {!isRevealed ? (
                    <TouchableOpacity
                      disabled={!userPick}
                      onPress={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                      style={[
                        styles.revealBtn,
                        {
                          backgroundColor: userPick ? "#C9A84C" : colors.muted,
                          borderRadius: colors.radius - 4,
                        },
                      ]}
                    >
                      <Feather name="eye" size={14} color={userPick ? "#fff" : colors.mutedForeground} />
                      <Text style={[styles.revealText, { color: userPick ? "#fff" : colors.mutedForeground }]}>
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
                        {correct ? "Correct! 🎉" : `Correct answer: ${q.correct}`}
                      </Text>
                      <Text style={[styles.solutionText, { color: colors.foreground }]}>{q.solution}</Text>
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

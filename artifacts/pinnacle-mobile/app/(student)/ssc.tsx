import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import {
  fetchSscQuestionBank, fetchSscExamTemplates,
  type SscQuestion, type ExamTemplate, hasWebsiteBase,
} from "@/lib/api";

type Track = "SSC_CGL" | "SSC_CHSL";
type Lang = "en" | "hi";
type Pick = "A" | "B" | "C" | "D";

const SUBJECTS = ["All", "Quantitative Aptitude", "Reasoning", "English", "General Awareness"];

const DIFF_COLOR: Record<string, string> = {
  easy: "#0D7377",
  medium: "#C9A84C",
  hard: "#8B1A1A",
};

function localized(q: SscQuestion, lang: Lang) {
  if (lang === "hi" && q.questionTextHi) {
    return { text: q.questionTextHi, opts: q.optionsHi, sol: q.solutionHi };
  }
  return { text: q.questionText, opts: q.options, sol: q.solution };
}

export default function SscScreen() {
  const colors = useColors();
  const [track, setTrack] = useState<Track>("SSC_CGL");
  const [subject, setSubject] = useState("All");
  const [lang, setLang] = useState<Lang>("en");
  const [questions, setQuestions] = useState<SscQuestion[]>([]);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, Pick>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetchSscExamTemplates(track).then((items) => { if (!cancelled) setTemplates(items); });
    return () => { cancelled = true; };
  }, [track]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSscQuestionBank({ track, subject, pageSize: 30 }).then(({ items }) => {
      if (cancelled) return;
      setQuestions(items);
      setRevealed({});
      setPicked({});
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [track, subject]);

  if (!hasWebsiteBase()) {
    return (
      <ScreenContainer>
        <SectionHeader title="SSC" subtitle="Public question bank" />
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={{ color: colors.textMuted }}>Set EXPO_PUBLIC_DOMAIN to load SSC content.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <SectionHeader title="SSC CGL & CHSL" subtitle="Bilingual practice — PYQ-flavoured" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Track picker */}
        <View style={styles.row}>
          {(["SSC_CGL", "SSC_CHSL"] as Track[]).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTrack(t)}
              style={[styles.pill, { backgroundColor: track === t ? colors.primary : colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: track === t ? "#fff" : colors.text, fontWeight: "700", fontSize: 13 }}>
                {t === "SSC_CGL" ? "SSC CGL" : "SSC CHSL"}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          {(["en", "hi"] as Lang[]).map((l) => (
            <TouchableOpacity key={l} onPress={() => setLang(l)}
              style={[styles.langPill, { backgroundColor: lang === l ? colors.surface : "transparent", borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 11 }}>{l === "en" ? "EN" : "हिं"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subject chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SUBJECTS.map((s) => (
            <TouchableOpacity key={s} onPress={() => setSubject(s)}
              style={[styles.chip, { backgroundColor: subject === s ? colors.primary : colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: subject === s ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Templates summary */}
        {templates.length > 0 && (
          <View style={[styles.templatesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.h3, { color: colors.text }]}>Mock Test Blueprints</Text>
            {templates.map((t) => (
              <View key={t.id} style={styles.templateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }}>{t.name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    {t.totalDurationMinutes} min · {t.totalQuestions} Qs · +{t.marksPerCorrect}/-{t.negativeMarks}
                  </Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800" }}>{t.tier}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Questions */}
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : questions.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted }}>No SSC questions yet for this filter.</Text>
          </View>
        ) : questions.map((q, idx) => {
          const view = localized(q, lang);
          const isOpen = openId === q.id;
          const isRevealed = !!revealed[q.id];
          const userPick = picked[q.id];
          const isMcq = q.questionType === "mcq" && view.opts;
          return (
            <View key={q.id} style={[styles.qCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setOpenId(isOpen ? null : q.id)} style={styles.qHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700", fontSize: 13 }} numberOfLines={isOpen ? undefined : 2}>
                    Q{idx + 1}. {view.text}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>{q.subject}</Text>
                    <View style={[styles.diffDot, { backgroundColor: DIFF_COLOR[q.difficulty] ?? "#888" }]} />
                    <Text style={{ color: DIFF_COLOR[q.difficulty] ?? colors.textMuted, fontSize: 11, fontWeight: "700" }}>
                      {q.difficulty}
                    </Text>
                    {q.language === "bi" && <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "800" }}>EN+हि</Text>}
                  </View>
                </View>
                <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {isOpen && isMcq && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 6 }}>
                  {(["A", "B", "C", "D"] as Pick[]).map((opt) => {
                    const text = view.opts?.[opt];
                    if (!text) return null;
                    const correct = q.correctAnswer === opt;
                    const chosen = userPick === opt;
                    let bg = colors.background;
                    let bc = colors.border;
                    if (isRevealed) {
                      if (correct) { bg = "#DCFCE7"; bc = "#16A34A"; }
                      else if (chosen && !correct) { bg = "#FEE2E2"; bc = "#DC2626"; }
                    } else if (chosen) {
                      bg = colors.primary + "15"; bc = colors.primary;
                    }
                    return (
                      <TouchableOpacity key={opt} disabled={isRevealed}
                        onPress={() => setPicked((p) => ({ ...p, [q.id]: opt }))}
                        style={[styles.opt, { backgroundColor: bg, borderColor: bc }]}>
                        <Text style={{ color: colors.text, fontSize: 12 }}>
                          <Text style={{ fontWeight: "800" }}>{opt}.</Text> {text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {!isRevealed ? (
                    <TouchableOpacity onPress={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                      style={[styles.revealBtn, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Reveal Solution</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: "#16A34A", fontSize: 12, fontWeight: "700", marginTop: 4 }}>
                      Correct: {q.correctAnswer}
                    </Text>
                  )}
                  {isRevealed && view.sol && (
                    <View style={[styles.sol, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 4 }}>
                        SOLUTION
                      </Text>
                      <Text style={{ color: colors.text, fontSize: 12, lineHeight: 18 }}>{view.sol}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  langPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  chipRow: { flexDirection: "row", gap: 8, paddingBottom: 12, paddingRight: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  templatesCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  h3: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
  templateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  empty: { padding: 24, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", alignItems: "center" },
  qCard: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  qHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  opt: { padding: 10, borderRadius: 10, borderWidth: 1 },
  revealBtn: { paddingVertical: 9, borderRadius: 10, alignItems: "center", marginTop: 4 },
  sol: { padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 6 },
});

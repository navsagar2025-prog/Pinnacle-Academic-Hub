import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { lightHaptic, mediumHaptic, successHaptic, errorHaptic } from "@/lib/haptics";

type Option = { id: string; label: string };
type Question = {
  id: string;
  text: string;
  options: Option[];
  correctId: string;
  explanation: string;
};

const DEMO_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "A particle moves in a straight line with uniform acceleration. If it covers distances s₁ and s₂ in the first and second seconds respectively, the acceleration is:",
    options: [
      { id: "A", label: "s₂ − s₁" },
      { id: "B", label: "2(s₂ − s₁)" },
      { id: "C", label: "s₁ + s₂" },
      { id: "D", label: "(s₁ + s₂)/2" },
    ],
    correctId: "A",
    explanation: "Using equations of motion, the acceleration a = s₂ − s₁, since in the nth second: sₙ = u + a(n − ½).",
  },
  {
    id: "q2",
    text: "The equilibrium constant for the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g) is Kc. The unit of Kc is:",
    options: [
      { id: "A", label: "mol² L⁻²" },
      { id: "B", label: "L² mol⁻²" },
      { id: "C", label: "mol⁻² L²" },
      { id: "D", label: "Dimensionless" },
    ],
    correctId: "B",
    explanation: "Kc = [NH₃]² / ([N₂][H₂]³). The units work out to L² mol⁻².",
  },
  {
    id: "q3",
    text: "If f(x) = x³ − 3x² + 2x, then the local minimum of f(x) occurs at x =",
    options: [
      { id: "A", label: "0" },
      { id: "B", label: "1" },
      { id: "C", label: "2" },
      { id: "D", label: "3" },
    ],
    correctId: "C",
    explanation: "f′(x) = 3x² − 6x + 2. Setting to zero: x = (6 ± √12)/6. Local min is at x ≈ 2 (confirmed by f″(2) > 0).",
  },
  {
    id: "q4",
    text: "A convex lens of focal length 20 cm produces a virtual image 3 times the size of the object. The object distance is:",
    options: [
      { id: "A", label: "−13.3 cm" },
      { id: "B", label: "−40 cm" },
      { id: "C", label: "−20/3 cm" },
      { id: "D", label: "−10 cm" },
    ],
    correctId: "A",
    explanation: "For a virtual image: m = +3, v = 3u. Lens formula: 1/f = 1/v − 1/u → u = −40/3 ≈ −13.3 cm.",
  },
  {
    id: "q5",
    text: "The number of structural isomers of C₄H₁₀ is:",
    options: [
      { id: "A", label: "1" },
      { id: "B", label: "2" },
      { id: "C", label: "3" },
      { id: "D", label: "4" },
    ],
    correctId: "B",
    explanation: "Butane (n-butane) and 2-methylpropane (isobutane) are the only two structural isomers of C₄H₁₀.",
  },
];

type Phase = "test" | "result";

export default function MockTestRunner() {
  const colors = useColors();
  const params = useLocalSearchParams<{
    testId: string;
    title: string;
    questionCount: string;
    durationMinutes: string;
    subject: string;
  }>();
  const { width } = useWindowDimensions();

  const title = params.title ?? "Practice Test";
  const totalSeconds = (parseInt(params.durationMinutes ?? "10", 10) || 10) * 60;
  const questions = DEMO_QUESTIONS.slice(0, Math.min(parseInt(params.questionCount ?? "5", 10) || 5, DEMO_QUESTIONS.length));

  const [phase, setPhase] = useState<Phase>("test");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerProgress = useSharedValue(1);

  const handleSubmit = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    successHaptic();
    setPhase("result");
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        timerProgress.value = withTiming(next / totalSeconds, { duration: 900 });
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          handleSubmit();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [handleSubmit, totalSeconds, timerProgress]);

  const timerBarStyle = useAnimatedStyle(() => ({
    width: timerProgress.value * (width - 32),
  }));

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = timeLeft < totalSeconds * 0.2 ? "#ef4444" : timeLeft < totalSeconds * 0.5 ? "#C9A84C" : colors.secondary;

  const selectAnswer = (optionId: string) => {
    lightHaptic();
    setAnswers((a) => ({ ...a, [questions[current].id]: optionId }));
  };

  const goNext = () => {
    if (current < questions.length - 1) { lightHaptic(); setCurrent((c) => c + 1); }
  };
  const goPrev = () => {
    if (current > 0) { lightHaptic(); setCurrent((c) => c - 1); }
  };

  if (phase === "result") {
    const correct = questions.filter((q) => answers[q.id] === q.correctId).length;
    const wrong = questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctId).length;
    const skipped = questions.filter((q) => !answers[q.id]).length;
    const score = correct * 4 - wrong;
    const maxScore = questions.length * 4;
    const pct = Math.round((correct / questions.length) * 100);

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <View style={[styles.resultCard, { backgroundColor: "#0A1F5C", borderRadius: colors.radius }]}>
            <Text style={styles.resultTitle}>Test Complete!</Text>
            <Text style={[styles.resultTestName, { color: "rgba(255,255,255,0.7)" }]}>{title}</Text>
            <Text style={styles.resultScore}>
              {score} <Text style={styles.resultScoreMax}>/ {maxScore}</Text>
            </Text>
            <Text style={styles.resultPct}>{pct}% correct</Text>
          </View>

          <View style={styles.resultStats}>
            {[
              { label: "Correct", value: String(correct), color: "#22c55e" },
              { label: "Wrong", value: String(wrong), color: "#ef4444" },
              { label: "Skipped", value: String(skipped), color: "#6B7280" },
            ].map((s) => (
              <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.reviewTitle, { color: colors.foreground }]}>Review</Text>
          {questions.map((q, i) => {
            const chosen = answers[q.id];
            const isCorrect = chosen === q.correctId;
            const isSkipped = !chosen;
            const borderColor = isSkipped ? colors.border : isCorrect ? "#22c55e" : "#ef4444";
            return (
              <View key={q.id} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor, borderRadius: colors.radius, borderWidth: 1.5 }]}>
                <Text style={[styles.reviewQ, { color: colors.mutedForeground }]}>Q{i + 1}</Text>
                <Text style={[styles.reviewText, { color: colors.foreground }]}>{q.text}</Text>
                {!isSkipped && (
                  <Text style={[styles.reviewAnswer, { color: isCorrect ? "#22c55e" : "#ef4444" }]}>
                    {isCorrect ? "✓" : "✗"} Your answer: ({chosen}) {q.options.find((o) => o.id === chosen)?.label}
                  </Text>
                )}
                {!isSkipped && !isCorrect && (
                  <Text style={[styles.reviewAnswer, { color: "#22c55e" }]}>
                    ✓ Correct: ({q.correctId}) {q.options.find((o) => o.id === q.correctId)?.label}
                  </Text>
                )}
                {isSkipped && (
                  <Text style={[styles.reviewAnswer, { color: colors.mutedForeground }]}>Skipped</Text>
                )}
                <Text style={[styles.reviewExplain, { color: colors.mutedForeground }]}>💡 {q.explanation}</Text>
              </View>
            );
          })}

          <TouchableOpacity
            onPress={() => { mediumHaptic(); router.back(); }}
            style={[styles.doneBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const q = questions[current];
  const selectedOption = answers[q.id];
  const answeredCount = Object.keys(answers).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {Platform.OS === "android" && <StatusBar backgroundColor={colors.background} barStyle="dark-content" />}

      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => { errorHaptic(); router.back(); }} style={styles.backBtn}>
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text numberOfLines={1} style={[styles.topTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.topMeta, { color: colors.mutedForeground }]}>
            {answeredCount}/{questions.length} answered
          </Text>
        </View>
        <View style={[styles.timerBadge, { backgroundColor: timerColor + "18" }]}>
          <Feather name="clock" size={13} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={[styles.timerBarTrack, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.timerBarFill, { backgroundColor: timerColor }, timerBarStyle]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.qHeader}>
          <Text style={[styles.qNumber, { color: colors.mutedForeground }]}>Question {current + 1} of {questions.length}</Text>
        </View>

        <View style={[styles.qBubble, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.qText, { color: colors.foreground }]}>{q.text}</Text>
        </View>

        <View style={styles.options}>
          {q.options.map((opt) => {
            const isSelected = selectedOption === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => selectAnswer(opt.id)}
                activeOpacity={0.75}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? colors.primary + "15" : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: colors.radius - 2,
                    borderWidth: isSelected ? 1.5 : 1,
                  },
                ]}
              >
                <View style={[styles.optionBadge, { backgroundColor: isSelected ? colors.primary : colors.muted, borderRadius: 6 }]}>
                  <Text style={[styles.optionBadgeText, { color: isSelected ? "#fff" : colors.mutedForeground }]}>{opt.id}</Text>
                </View>
                <Text style={[styles.optionText, { color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? "700" : "400" }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.navBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={current === 0}
          style={[styles.navBtn, { opacity: current === 0 ? 0.3 : 1, backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}
        >
          <Feather name="chevron-left" size={18} color={colors.foreground} />
          <Text style={[styles.navBtnText, { color: colors.foreground }]}>Prev</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {questions.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => { lightHaptic(); setCurrent(i); }}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === current ? colors.primary : answers[questions[i].id] ? colors.secondary : colors.muted,
                    width: i === current ? 10 : 7,
                    height: i === current ? 10 : 7,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {current < questions.length - 1 ? (
          <TouchableOpacity
            onPress={goNext}
            style={[styles.navBtn, { backgroundColor: colors.muted, borderRadius: colors.radius - 4 }]}
          >
            <Text style={[styles.navBtnText, { color: colors.foreground }]}>Next</Text>
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.navBtn, { backgroundColor: colors.primary, borderRadius: colors.radius - 4 }]}
          >
            <Text style={[styles.navBtnText, { color: "#fff" }]}>Submit</Text>
            <Feather name="check" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  topTitle: { fontSize: 14, fontWeight: "700" },
  topMeta: { fontSize: 10, marginTop: 2 },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  timerText: { fontSize: 15, fontWeight: "800" },
  timerBarTrack: { height: 4 },
  timerBarFill: { height: 4 },
  body: { padding: 16, gap: 0 },
  qHeader: { marginBottom: 12 },
  qNumber: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  qBubble: { borderWidth: 1, padding: 16, marginBottom: 16 },
  qText: { fontSize: 15, lineHeight: 23 },
  options: { gap: 10 },
  optionCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  optionBadge: { width: 30, height: 30, justifyContent: "center", alignItems: "center" },
  optionBadgeText: { fontSize: 13, fontWeight: "700" },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  navBar: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, gap: 12 },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  navBtnText: { fontSize: 13, fontWeight: "700" },
  dots: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  dot: { borderRadius: 5 },
  resultScroll: { padding: 16, gap: 0 },
  resultCard: { padding: 24, alignItems: "center", gap: 8, marginBottom: 16 },
  resultTitle: { color: "#C9A84C", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  resultTestName: { fontSize: 13 },
  resultScore: { color: "#fff", fontSize: 48, fontWeight: "800", marginTop: 8 },
  resultScoreMax: { color: "rgba(255,255,255,0.6)", fontSize: 24, fontWeight: "400" },
  resultPct: { color: "rgba(255,255,255,0.75)", fontSize: 15 },
  resultStats: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statBox: { flex: 1, padding: 14, alignItems: "center", gap: 4, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  reviewTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  reviewCard: { padding: 14, marginBottom: 10, gap: 6 },
  reviewQ: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  reviewText: { fontSize: 13, lineHeight: 18 },
  reviewAnswer: { fontSize: 12, fontWeight: "600" },
  reviewExplain: { fontSize: 11, lineHeight: 16, marginTop: 4, fontStyle: "italic" },
  doneBtn: { padding: 16, alignItems: "center", marginTop: 16, marginBottom: 8 },
  doneBtnText: { fontSize: 15, fontWeight: "700" },
});

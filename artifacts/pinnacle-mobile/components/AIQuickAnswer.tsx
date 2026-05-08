import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { generateAIAnswer, type AIAnswer } from "@/lib/aiDoubtAnswer";
import { lightHaptic, successHaptic } from "@/lib/haptics";

type Props = {
  subject: string;
  question: string;
  onClose?: () => void;
};

/**
 * Displays an AI-generated "Quick Answer" while the student is waiting
 * for a teacher reply. Renders a loading state, then the structured
 * answer with thumbs-up/thumbs-down feedback.
 */
export default function AIQuickAnswer({ subject, question, onClose }: Props) {
  const colors = useColors();
  const [answer, setAnswer] = useState<AIAnswer | null>(null);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    setAnswer(null);
    setError(false);
    setFeedback(null);
    fadeAnim.setValue(0);

    // Animate the typing dots while loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();

    generateAIAnswer(subject, question)
      .then((r) => {
        if (cancelled) return;
        setAnswer(r);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      dotAnim.stopAnimation();
    };
  }, [subject, question, fadeAnim, dotAnim]);

  const giveFeedback = (kind: "up" | "down") => {
    if (feedback === kind) return;
    if (kind === "up") successHaptic();
    else lightHaptic();
    setFeedback(kind);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: "#7C3AED",
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.aiBadge, { backgroundColor: "#7C3AED" }]}>
          <Feather name="zap" size={11} color="#fff" />
          <Text style={styles.aiBadgeText}>AI Quick Answer</Text>
        </View>
        <View style={{ flex: 1 }} />
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.loadingRow}>
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Couldn't generate an AI answer. A teacher will reply soon.
          </Text>
        </View>
      ) : !answer ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Animated.Text
            style={[
              styles.loadingText,
              {
                color: colors.mutedForeground,
                opacity: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              },
            ]}
          >
            Thinking through your {subject.toLowerCase()} question…
          </Animated.Text>
        </View>
      ) : (
        <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
          <Text style={[styles.summary, { color: colors.foreground }]}>{answer.summary}</Text>

          <View style={styles.stepsBlock}>
            <Text style={[styles.stepsLabel, { color: colors.mutedForeground }]}>STEP-BY-STEP</Text>
            {answer.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: "#7C3AED15" }]}>
                  <Text style={[styles.stepNumText, { color: "#7C3AED" }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>{s}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.note, { color: colors.mutedForeground }]}>{answer.finalNote}</Text>

          {answer.sources.length > 0 && (
            <View style={styles.sourcesRow}>
              <Feather name="book" size={11} color={colors.mutedForeground} />
              <Text style={[styles.sourcesText, { color: colors.mutedForeground }]} numberOfLines={1}>
                Refs: {answer.sources.join(" · ")}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.footer}>
            <View style={styles.disclaimerRow}>
              <Feather name="info" size={11} color={colors.mutedForeground} />
              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]} numberOfLines={2}>
                AI-generated · Always verify with your teacher
              </Text>
            </View>
            <View style={styles.feedbackRow}>
              <TouchableOpacity
                onPress={() => giveFeedback("up")}
                accessibilityRole="button"
                accessibilityLabel="Mark answer as helpful"
                style={[
                  styles.fbBtn,
                  {
                    backgroundColor: feedback === "up" ? colors.success + "20" : "transparent",
                    borderColor: feedback === "up" ? colors.success : colors.border,
                  },
                ]}
              >
                <Feather
                  name="thumbs-up"
                  size={12}
                  color={feedback === "up" ? colors.success : colors.mutedForeground}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => giveFeedback("down")}
                accessibilityRole="button"
                accessibilityLabel="Mark answer as not helpful"
                style={[
                  styles.fbBtn,
                  {
                    backgroundColor: feedback === "down" ? colors.destructive + "20" : "transparent",
                    borderColor: feedback === "down" ? colors.destructive : colors.border,
                  },
                ]}
              >
                <Feather
                  name="thumbs-down"
                  size={12}
                  color={feedback === "down" ? colors.destructive : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 12, marginBottom: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  aiBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 0.4 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 12, flex: 1 },
  errorText: { fontSize: 12, flex: 1, fontWeight: "600" },
  summary: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  stepsBlock: { gap: 8, marginTop: 2 },
  stepsLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  stepRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  stepNum: { width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", marginTop: 1 },
  stepNumText: { fontSize: 10, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 12, lineHeight: 17 },
  note: { fontSize: 11, lineHeight: 15, fontStyle: "italic" },
  sourcesRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sourcesText: { fontSize: 10, flex: 1 },
  divider: { height: 1, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8 },
  disclaimerRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  disclaimer: { fontSize: 10, flex: 1 },
  feedbackRow: { flexDirection: "row", gap: 6 },
  fbBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: "center", alignItems: "center", borderWidth: 1 },
});

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

type Doubt = {
  id: string;
  subject: string;
  topic: string;
  text: string;
  asker: string;
  isMine?: boolean;
  status: "open" | "answered" | "resolved";
  replies: number;
  upvotes: number;
  postedAgo: string;
  topAnswer?: { author: string; role: "Teacher" | "Student"; text: string; isOfficial?: boolean; upvotes: number };
};

const DOUBTS: Doubt[] = [
  {
    id: "d1", subject: "Physics", topic: "Rotational Motion", isMine: true,
    text: "Why does a spinning top precess? I understand torque causes angular momentum to change but can't visualize the direction.",
    asker: "You", status: "answered", replies: 3, upvotes: 4, postedAgo: "2h ago",
    topAnswer: {
      author: "Dr. Verma", role: "Teacher", isOfficial: true, upvotes: 12,
      text: "Torque from gravity is horizontal and perpendicular to L. Since dL/dt = τ, L changes only in direction, tracing a cone — that's precession.",
    },
  },
  {
    id: "d2", subject: "Chemistry", topic: "Organic Reactions",
    text: "In the SN1 mechanism, why do tertiary carbocations form faster than primary?",
    asker: "Aarav S.", status: "resolved", replies: 5, upvotes: 9, postedAgo: "1d ago",
    topAnswer: {
      author: "Mrs. Iyer", role: "Teacher", isOfficial: true, upvotes: 18,
      text: "Hyperconjugation + inductive effect from three alkyl groups stabilize the positive charge much better than in a primary cation.",
    },
  },
  {
    id: "d3", subject: "Mathematics", topic: "Vectors",
    text: "How do I check if three vectors are coplanar without computing determinant?",
    asker: "Riya K.", status: "open", replies: 1, upvotes: 2, postedAgo: "5h ago",
    topAnswer: {
      author: "Karan M.", role: "Student", upvotes: 3,
      text: "If the scalar triple product [a b c] is zero — but that IS the determinant. You can also check if one is a linear combination of the others.",
    },
  },
  {
    id: "d4", subject: "Biology", topic: "Genetics",
    text: "What's the difference between epistasis and pleiotropy?",
    asker: "Meera P.", status: "open", replies: 0, upvotes: 1, postedAgo: "30m ago",
  },
];

const STATUS_COLOR: Record<Doubt["status"], string> = {
  open: "#C9A84C",
  answered: "#0D7377",
  resolved: "#6B7280",
};

export default function StudentDoubts() {
  const colors = useColors();
  const [tab, setTab] = useState<"mine" | "community">("mine");
  const [draft, setDraft] = useState("");
  const [upvoted, setUpvoted] = useState<Record<string, boolean>>({});

  const list = DOUBTS.filter((d) => (tab === "mine" ? d.isMine : true));

  const submit = () => {
    if (!draft.trim()) return;
    Alert.alert("Doubt Posted", "Your question has been posted to the forum. Teachers usually reply within 24h.");
    setDraft("");
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Doubt Forum"  />

      <View style={[styles.tabs, { backgroundColor: colors.muted, borderRadius: colors.radius - 2 }]}>
        {(["mine", "community"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tab,
              {
                backgroundColor: tab === t ? colors.card : "transparent",
                borderRadius: colors.radius - 4,
              },
            ]}
          >
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
        <View
          style={[
            styles.askCard,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.askTitle, { color: colors.foreground, fontFamily: "PlusJakartaSans_700Bold" }]}>
            Ask a new doubt
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Describe your doubt with context, what you tried, and where you got stuck…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                borderRadius: colors.radius - 4,
                minHeight: 80,
              },
            ]}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={!draft.trim()}
            style={[
              styles.askBtn,
              {
                backgroundColor: draft.trim() ? "#C9A84C" : colors.muted,
                borderRadius: colors.radius - 4,
              },
            ]}
          >
            <Feather name="send" size={14} color={draft.trim() ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.askBtnText, { color: draft.trim() ? "#fff" : colors.mutedForeground }]}>
              Post Doubt
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {list.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="message-square" size={28} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 13 }}>No doubts yet — ask above!</Text>
        </View>
      ) : (
        list.map((d) => {
          const voted = !!upvoted[d.id];
          return (
            <View
              key={d.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={styles.metaRow}>
                <View style={[styles.subjectPill, { backgroundColor: "#0A1F5C15" }]}>
                  <Text style={[styles.subjectText, { color: "#0A1F5C" }]}>{d.subject}</Text>
                </View>
                <Text style={[styles.topicText, { color: colors.mutedForeground }]}>· {d.topic}</Text>
                <View style={{ flex: 1 }} />
                <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[d.status] + "15" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[d.status] }]}>{d.status}</Text>
                </View>
              </View>

              <Text style={[styles.qText, { color: colors.foreground, fontFamily: "PlusJakartaSans_600SemiBold" }]}>
                {d.text}
              </Text>

              <View style={styles.footerRow}>
                <Text style={[styles.askerText, { color: colors.mutedForeground }]}>
                  By {d.asker} · {d.postedAgo} · {d.replies} repl{d.replies === 1 ? "y" : "ies"}
                </Text>
              </View>

              {d.topAnswer && (
                <View
                  style={[
                    styles.answerBox,
                    {
                      backgroundColor:
                        d.topAnswer.isOfficial ? "#C9A84C12" : d.topAnswer.role === "Teacher" ? "#0D737712" : colors.muted,
                      borderLeftColor:
                        d.topAnswer.isOfficial ? "#C9A84C" : d.topAnswer.role === "Teacher" ? "#0D7377" : colors.border,
                      borderRadius: colors.radius - 4,
                    },
                  ]}
                >
                  <View style={styles.answerHeader}>
                    <Text
                      style={[
                        styles.answerAuthor,
                        { color: d.topAnswer.role === "Teacher" ? "#0D7377" : colors.foreground },
                      ]}
                    >
                      {d.topAnswer.role === "Teacher" ? "👨‍🏫 " : "👤 "}
                      {d.topAnswer.author}
                    </Text>
                    {d.topAnswer.isOfficial && (
                      <View style={[styles.officialPill, { backgroundColor: "#C9A84C" }]}>
                        <Feather name="shield" size={9} color="#fff" />
                        <Text style={styles.officialText}>OFFICIAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.answerText, { color: colors.foreground }]}>{d.topAnswer.text}</Text>
                  <View style={styles.answerActions}>
                    <TouchableOpacity
                      onPress={() => setUpvoted((u) => ({ ...u, [d.id]: !u[d.id] }))}
                      style={[
                        styles.upvoteBtn,
                        {
                          borderColor: voted ? "#0D7377" : colors.border,
                          backgroundColor: voted ? "#0D737715" : "transparent",
                          borderRadius: colors.radius - 6,
                        },
                      ]}
                    >
                      <Feather name="thumbs-up" size={11} color={voted ? "#0D7377" : colors.mutedForeground} />
                      <Text style={[styles.upvoteText, { color: voted ? "#0D7377" : colors.mutedForeground }]}>
                        {d.topAnswer.upvotes + (voted ? 1 : 0)}
                      </Text>
                    </TouchableOpacity>
                    {d.replies > 1 && (
                      <Text style={[styles.moreReplies, { color: colors.mutedForeground }]}>
                        +{d.replies - 1} more repl{d.replies - 1 === 1 ? "y" : "ies"}
                      </Text>
                    )}
                  </View>
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
  tabs: { flexDirection: "row", padding: 4, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center" },
  tabText: { fontSize: 12 },
  askCard: { borderWidth: 1, padding: 12, marginBottom: 14, gap: 8 },
  askTitle: { fontSize: 13 },
  input: { borderWidth: 1, padding: 10, fontSize: 13, textAlignVertical: "top" },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
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
  footerRow: { flexDirection: "row", alignItems: "center" },
  askerText: { fontSize: 11 },
  answerBox: { borderLeftWidth: 3, padding: 10, gap: 6, marginTop: 4 },
  answerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  answerAuthor: { fontSize: 11, fontWeight: "700" },
  officialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  officialText: { fontSize: 8, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  answerText: { fontSize: 12, lineHeight: 16 },
  answerActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  upvoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  upvoteText: { fontSize: 11, fontWeight: "700" },
  moreReplies: { fontSize: 10 },
});

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { lightHaptic, mediumHaptic, successHaptic } from "@/lib/haptics";
import { addLiveClass, type LiveClassPlatform } from "@/lib/liveClassStore";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScheduled?: () => void;
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const PLATFORMS: { key: LiveClassPlatform; label: string }[] = [
  { key: "zoom", label: "Zoom" },
  { key: "meet", label: "Google Meet" },
  { key: "teams", label: "MS Teams" },
  { key: "custom", label: "Custom" },
];

const QUICK_OFFSETS: { label: string; minutes: number }[] = [
  { label: "Now", minutes: 0 },
  { label: "+15 min", minutes: 15 },
  { label: "+1 hr", minutes: 60 },
  { label: "+3 hrs", minutes: 180 },
  { label: "Tomorrow 5PM", minutes: -1 }, // sentinel
];

const DURATION_OPTIONS = [60, 90, 120, 180];

function tomorrowAt5PM(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return d.getTime();
}

function formatPreviewTime(epoch: number): string {
  const d = new Date(epoch);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${time}`;
}

export default function ScheduleClassSheet({ visible, onClose, onScheduled }: Props) {
  const colors = useColors();
  const [subject, setSubject] = useState<string>("Physics");
  const [topic, setTopic] = useState("");
  const [teacher, setTeacher] = useState("");
  const [batch, setBatch] = useState("JEE 2026 — Eve");
  const [platform, setPlatform] = useState<LiveClassPlatform>("meet");
  const [meetUrl, setMeetUrl] = useState("");
  const [startsAt, setStartsAt] = useState<number>(Date.now() + 15 * 60 * 1000);
  const [durationMin, setDurationMin] = useState<number>(120);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSubject("Physics");
    setTopic("");
    setTeacher("");
    setBatch("JEE 2026 — Eve");
    setPlatform("meet");
    setMeetUrl("");
    setStartsAt(Date.now() + 15 * 60 * 1000);
    setDurationMin(120);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleQuickTime = (offsetMinutes: number) => {
    lightHaptic();
    if (offsetMinutes === -1) {
      setStartsAt(tomorrowAt5PM());
    } else {
      setStartsAt(Date.now() + offsetMinutes * 60 * 1000);
    }
  };

  const handleSchedule = async () => {
    if (!topic.trim()) {
      Alert.alert("Topic required", "Please enter the class topic so students know what's being covered.");
      return;
    }
    if (!teacher.trim()) {
      Alert.alert("Teacher required", "Please enter the teacher's name.");
      return;
    }
    if (!meetUrl.trim() || !/^https?:\/\//i.test(meetUrl.trim())) {
      Alert.alert(
        "Valid link required",
        "Please paste a valid Zoom / Meet / Teams URL starting with https://",
      );
      return;
    }

    mediumHaptic();
    setSubmitting(true);
    try {
      await addLiveClass({
        subject,
        topic: topic.trim(),
        teacher: teacher.trim(),
        batch: batch.trim() || "All Batches",
        platform,
        meetUrl: meetUrl.trim(),
        startsAt,
        endsAt: startsAt + durationMin * 60 * 1000,
      });
      successHaptic();
      reset();
      onScheduled?.();
      onClose();
      Alert.alert(
        "Class scheduled",
        `${subject} class is scheduled for ${formatPreviewTime(startsAt)}. Students will see it on their dashboard.`,
      );
    } catch {
      Alert.alert("Couldn't schedule", "Something went wrong saving the class. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Schedule Live Class</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Subject */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>SUBJECT</Text>
              <View style={styles.chipRow}>
                {SUBJECTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      lightHaptic();
                      setSubject(s);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: subject === s ? colors.primary : colors.muted,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: subject === s ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Topic */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>TOPIC</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Thermodynamics — Laws & Applications"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />

              {/* Teacher */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>TEACHER</Text>
              <TextInput
                value={teacher}
                onChangeText={setTeacher}
                placeholder="e.g. Dr. Ramesh Kumar"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />

              {/* Batch */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>BATCH</Text>
              <TextInput
                value={batch}
                onChangeText={setBatch}
                placeholder="e.g. JEE 2026 — Eve"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />

              {/* Platform */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PLATFORM</Text>
              <View style={styles.chipRow}>
                {PLATFORMS.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => {
                      lightHaptic();
                      setPlatform(p.key);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: platform === p.key ? colors.primary : colors.muted,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: platform === p.key ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meet URL */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>MEETING LINK</Text>
              <TextInput
                value={meetUrl}
                onChangeText={setMeetUrl}
                placeholder="https://meet.google.com/..."
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[
                  styles.input,
                  { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
                ]}
              />

              {/* Quick time */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>STARTS</Text>
              <View style={styles.chipRow}>
                {QUICK_OFFSETS.map((q) => (
                  <TouchableOpacity
                    key={q.label}
                    onPress={() => handleQuickTime(q.minutes)}
                    style={[styles.chip, { backgroundColor: colors.muted, borderRadius: 6 }]}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View
                style={[
                  styles.preview,
                  { backgroundColor: colors.primary + "12", borderColor: colors.primary, borderRadius: 6 },
                ]}
              >
                <Feather name="clock" size={13} color={colors.primary} />
                <Text style={[styles.previewText, { color: colors.primary }]}>
                  {formatPreviewTime(startsAt)}
                </Text>
              </View>

              {/* Duration */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>DURATION</Text>
              <View style={styles.chipRow}>
                {DURATION_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      lightHaptic();
                      setDurationMin(d);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: durationMin === d ? colors.primary : colors.muted,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: durationMin === d ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ""}` : `${d}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={handleSchedule}
              disabled={submitting}
              activeOpacity={0.8}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 },
              ]}
            >
              <Feather name="video" size={15} color={colors.primaryForeground} />
              <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
                {submitting ? "Scheduling…" : "Schedule Class"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    height: "92%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: "800" },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: { paddingHorizontal: 11, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  preview: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  previewText: { fontSize: 12, fontWeight: "700" },
  footer: { padding: 14, borderTopWidth: 1 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitText: { fontSize: 14, fontWeight: "800" },
});

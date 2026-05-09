import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import {
  formatClockTime,
  formatCountdown,
  formatDateLabel,
  getStatus,
  type LiveClass,
} from "@/lib/liveClassStore";
import { mediumHaptic, successHaptic } from "@/lib/haptics";

type Props = {
  liveClass: LiveClass;
  /** Compact rows are used for list items; the featured card is full-size. */
  variant?: "featured" | "row";
};

const subjectColor: Record<string, string> = {
  Physics: "#0A1F5C",
  Chemistry: "#0D7377",
  Mathematics: "#8B1A1A",
  Maths: "#8B1A1A",
  Biology: "#C9A84C",
};

const platformLabel: Record<LiveClass["platform"], string> = {
  zoom: "Zoom",
  meet: "Google Meet",
  teams: "Microsoft Teams",
  custom: "Live Stream",
};

const platformIcon: Record<LiveClass["platform"], keyof typeof Feather.glyphMap> = {
  zoom: "video",
  meet: "video",
  teams: "video",
  custom: "radio",
};

export default function LiveClassCard({ liveClass, variant = "row" }: Props) {
  const colors = useColors();
  const [now, setNow] = useState(Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Tick once per second for live countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const status = getStatus(liveClass, now);
  const isLive = status === "live";
  const isStartingSoon = status === "starting-soon";
  const isUpcoming = status === "upcoming";
  const isEnded = status === "ended";
  const canJoin = isLive || isStartingSoon;

  // Pulse the LIVE dot
  useEffect(() => {
    if (!isLive) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, pulseAnim]);

  const handleJoin = async () => {
    mediumHaptic();
    try {
      const supported = await Linking.canOpenURL(liveClass.meetUrl);
      if (!supported) {
        Alert.alert(
          "Can't open link",
          `The ${platformLabel[liveClass.platform]} link couldn't be opened on this device.`,
        );
        return;
      }
      await Linking.openURL(liveClass.meetUrl);
      successHaptic();
    } catch {
      Alert.alert(
        "Couldn't launch",
        `We couldn't open ${platformLabel[liveClass.platform]}. Please try again.`,
      );
    }
  };

  const accentColor = subjectColor[liveClass.subject] ?? colors.primary;

  // Status badge text + colors
  let statusBg: string;
  let statusFg: string;
  let statusText: string;
  if (isLive) {
    statusBg = colors.destructive + "20";
    statusFg = colors.destructive;
    statusText = "LIVE NOW";
  } else if (isStartingSoon) {
    statusBg = colors.warning + "20";
    statusFg = colors.warning;
    statusText = "STARTING SOON";
  } else if (isEnded) {
    statusBg = colors.muted;
    statusFg = colors.mutedForeground;
    statusText = "ENDED";
  } else {
    statusBg = colors.primary + "15";
    statusFg = colors.primary;
    statusText = "UPCOMING";
  }

  // Countdown text
  let countdownText: string;
  if (isLive) {
    countdownText = `Live · ends in ${formatCountdown(liveClass.endsAt - now)}`;
  } else if (isStartingSoon) {
    countdownText = `Starts in ${formatCountdown(liveClass.startsAt - now)}`;
  } else if (isUpcoming) {
    countdownText = `Starts in ${formatCountdown(liveClass.startsAt - now)}`;
  } else {
    countdownText = `Ended ${formatDateLabel(liveClass.endsAt)}`;
  }

  if (variant === "featured") {
    return (
      <View
        style={[
          styles.featured,
          {
            backgroundColor: colors.card,
            borderColor: isLive ? colors.destructive : accentColor,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.featuredHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            {isLive && (
              <Animated.View
                style={[
                  styles.liveDot,
                  { backgroundColor: colors.destructive, opacity: pulseAnim },
                ]}
              />
            )}
            <Text style={[styles.statusText, { color: statusFg }]}>{statusText}</Text>
          </View>
          <View style={styles.platformBadge}>
            <Feather name={platformIcon[liveClass.platform]} size={11} color={colors.mutedForeground} />
            <Text style={[styles.platformText, { color: colors.mutedForeground }]}>
              {platformLabel[liveClass.platform]}
            </Text>
          </View>
        </View>

        <Text style={[styles.featuredSubject, { color: accentColor }]}>{liveClass.subject}</Text>
        <Text style={[styles.featuredTopic, { color: colors.foreground }]} numberOfLines={2}>
          {liveClass.topic}
        </Text>
        <Text style={[styles.featuredMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {liveClass.teacher} · {liveClass.batch}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.featuredFooter}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.countdownLabel, { color: colors.mutedForeground }]}>
              {isEnded ? "" : "COUNTDOWN"}
            </Text>
            <Text
              style={[
                styles.countdownValue,
                { color: isLive ? colors.destructive : isEnded ? colors.mutedForeground : colors.foreground },
              ]}
            >
              {countdownText}
            </Text>
            <Text style={[styles.timeRange, { color: colors.mutedForeground }]}>
              {formatDateLabel(liveClass.startsAt)} · {formatClockTime(liveClass.startsAt)} –{" "}
              {formatClockTime(liveClass.endsAt)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleJoin}
            disabled={!canJoin}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Join ${liveClass.subject} class on ${platformLabel[liveClass.platform]}`}
            style={[
              styles.joinBtn,
              {
                backgroundColor: canJoin ? colors.destructive : colors.muted,
                opacity: canJoin ? 1 : 0.6,
              },
            ]}
          >
            <Feather name="video" size={14} color={canJoin ? "#fff" : colors.mutedForeground} />
            <Text
              style={[
                styles.joinText,
                { color: canJoin ? "#fff" : colors.mutedForeground },
              ]}
            >
              {isLive ? "Join Now" : isStartingSoon ? "Join" : isEnded ? "Ended" : "Not Yet"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Row variant
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: accentColor,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.rowHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg, paddingHorizontal: 6, paddingVertical: 2 }]}>
            {isLive && (
              <Animated.View
                style={[
                  styles.liveDot,
                  { backgroundColor: colors.destructive, opacity: pulseAnim, width: 5, height: 5 },
                ]}
              />
            )}
            <Text style={[styles.statusText, { color: statusFg, fontSize: 9 }]}>{statusText}</Text>
          </View>
          <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
            {formatClockTime(liveClass.startsAt)}
          </Text>
        </View>
        <Text style={[styles.rowSubject, { color: colors.foreground }]} numberOfLines={1}>
          {liveClass.subject} — {liveClass.topic}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {liveClass.teacher} · {countdownText}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleJoin}
        disabled={!canJoin}
        activeOpacity={0.8}
        style={[
          styles.rowJoin,
          {
            backgroundColor: canJoin ? colors.destructive : "transparent",
            borderColor: canJoin ? colors.destructive : colors.border,
            opacity: isEnded ? 0.5 : 1,
          },
        ]}
      >
        <Feather
          name={isEnded ? "check" : "video"}
          size={12}
          color={canJoin ? "#fff" : isEnded ? colors.mutedForeground : colors.mutedForeground}
        />
        <Text
          style={[
            styles.rowJoinText,
            { color: canJoin ? "#fff" : colors.mutedForeground },
          ]}
        >
          {isLive ? "Join" : isStartingSoon ? "Join" : isEnded ? "Done" : "Soon"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Featured card
  featured: { borderWidth: 2, padding: 14, marginBottom: 12, gap: 6 },
  featuredHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  featuredSubject: { fontSize: 11, fontWeight: "800", marginTop: 4, letterSpacing: 0.5, textTransform: "uppercase" },
  featuredTopic: { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  featuredMeta: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginVertical: 10 },
  featuredFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  countdownLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  countdownValue: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  timeRange: { fontSize: 10, marginTop: 3 },

  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },

  // Platform badge
  platformBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  platformText: { fontSize: 10, fontWeight: "600" },

  // Join button (featured)
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  joinText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },

  // Row variant
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
    marginBottom: 8,
  },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTime: { fontSize: 10, fontWeight: "600" },
  rowSubject: { fontSize: 13, fontWeight: "700" },
  rowMeta: { fontSize: 11 },
  rowJoin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
  },
  rowJoinText: { fontSize: 11, fontWeight: "700" },
});

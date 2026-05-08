import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LiveClassCard from "@/components/LiveClassCard";
import ScreenContainer from "@/components/ScreenContainer";
import { useColors } from "@/hooks/useColors";
import { lightHaptic } from "@/lib/haptics";
import { bucketize, useLiveClasses } from "@/lib/liveClassStore";
import { useRefresh } from "@/lib/useRefresh";

const TABS = ["Live Now", "Upcoming", "Completed"] as const;
type Tab = (typeof TABS)[number];

export default function StudentClasses() {
  const colors = useColors();
  const { items, refresh } = useLiveClasses();
  const [tab, setTab] = useState<Tab>("Live Now");
  const pulse = useMemo(() => new Animated.Value(1), []);

  const { liveNow, upcoming, completed } = useMemo(() => bucketize(items), [items]);

  // Auto-jump to "Upcoming" if there's nothing live right now
  React.useEffect(() => {
    if (liveNow.length === 0 && tab === "Live Now" && upcoming.length > 0) {
      setTab("Upcoming");
    }
  }, [liveNow.length, upcoming.length, tab]);

  // Pulse animation for the LIVE tab badge when there are live classes
  React.useEffect(() => {
    if (liveNow.length === 0) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [liveNow.length, pulse]);

  const data = tab === "Live Now" ? liveNow : tab === "Upcoming" ? upcoming : completed;
  const { refreshing, onRefresh } = useRefresh(async () => {
    await refresh();
  });

  return (
    <ScreenContainer onRefresh={onRefresh} refreshing={refreshing}>
      <View style={[styles.tabRow, { marginTop: 16, marginBottom: 12 }]}>
        {TABS.map((t) => {
          const count =
            t === "Live Now" ? liveNow.length : t === "Upcoming" ? upcoming.length : completed.length;
          const isActive = tab === t;
          const showLiveDot = t === "Live Now" && liveNow.length > 0;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => {
                lightHaptic();
                setTab(t);
              }}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              {showLiveDot && (
                <Animated.View
                  style={[
                    styles.tabLiveDot,
                    { backgroundColor: isActive ? "#fff" : colors.destructive, opacity: pulse },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {t}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === "Live Now" && liveNow.length > 0 && (
        <View
          style={[
            styles.liveBanner,
            {
              backgroundColor: colors.destructive + "12",
              borderColor: colors.destructive,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          <Text style={[styles.liveText, { color: colors.destructive }]}>
            {liveNow.length === 1
              ? "1 class is happening now — tap Join to enter"
              : `${liveNow.length} classes are happening now — tap Join to enter any`}
          </Text>
        </View>
      )}

      {data.map((c) => (
        <LiveClassCard key={c.id} liveClass={c} variant={tab === "Live Now" ? "featured" : "row"} />
      ))}

      {data.length === 0 && (
        <View style={styles.empty}>
          <Feather
            name={tab === "Live Now" ? "video-off" : tab === "Upcoming" ? "calendar" : "check-circle"}
            size={32}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {tab === "Live Now"
              ? "No classes are live right now"
              : tab === "Upcoming"
                ? "No upcoming classes scheduled"
                : "No completed classes yet"}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  tabLiveDot: { width: 6, height: 6, borderRadius: 3 },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  liveText: { fontSize: 12, fontWeight: "600", flex: 1 },
  empty: { marginTop: 48, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});

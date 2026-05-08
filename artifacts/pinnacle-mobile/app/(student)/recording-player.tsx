import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";

// Mobile RN counterpart to the web portal player. Renders the same
// personalised, position-cycling watermark overlay above the video. We
// don't ship a heavyweight native video lib in this template — the View
// below is a placeholder where `expo-video`'s <VideoView> would mount in
// production. The overlay component itself is real and exercises the same
// anchor-cycling logic the web build uses.
type Anchor = "tl" | "tr" | "bl" | "br" | "center";

const ANCHORS: Anchor[] = ["tl", "tr", "bl", "br", "center"];
const CYCLE_MS = 8000;

const ANCHOR_STYLE: Record<Anchor, object> = {
  tl: { top: 8, left: 8 },
  tr: { top: 8, right: 8 },
  bl: { bottom: 8, left: 8 },
  br: { bottom: 8, right: 8 },
  center: { top: "50%", left: "50%", transform: [{ translateX: -90 }, { translateY: -8 }] },
};

export default function RecordingPlayerScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id?: string; title?: string; subject?: string }>();
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  // Production: viewer name + phone come from the authenticated session
  // (same source as `getDbUser()` on the web), never from a client store.
  const viewerName = "Demo Student";
  const viewerPhone = "+91 9XXXX XXXXX";

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ANCHORS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const overlayText = `Pinnacle • ${viewerName} • ${viewerPhone}`;
  const anchor = ANCHORS[idx];

  return (
    <ScreenContainer>
      <SectionHeader title={params.title ?? "Recorded class"} subtitle={params.subject ?? ""} />
      <View
        style={[
          styles.player,
          { backgroundColor: "#0A0A0A", borderColor: colors.border, borderRadius: colors.radius },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeholder}>[ video frame ]</Text>
        )}
        <View style={[styles.watermark, ANCHOR_STYLE[anchor]]} pointerEvents="none">
          <Text style={styles.watermarkText}>{overlayText}</Text>
        </View>
      </View>
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Watermark cycles every {CYCLE_MS / 1000}s. Every play start is logged in the audit trail.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  player: {
    aspectRatio: 16 / 9,
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  placeholder: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  watermark: { position: "absolute" },
  watermarkText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.55,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  disclaimer: { fontSize: 11, marginTop: 4 },
});

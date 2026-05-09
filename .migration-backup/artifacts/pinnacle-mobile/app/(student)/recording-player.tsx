import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import ScreenContainer from "@/components/ScreenContainer";
import SectionHeader from "@/components/SectionHeader";
import { useColors } from "@/hooks/useColors";
import {
  postRecordingTelemetry,
  requestRecordingStream,
  resolveRecordingSource,
  type RecordingWatermark,
} from "@/lib/api";

// Mobile counterpart to `RecordingPlayer.tsx` on the web. Mirrors the same
// flow:
//   1. POST /stream-url — get a signed, single-use proxy URL + watermark cfg
//   2. GET that proxy URL with `redirect: "manual"` to read the underlying
//      source URL out of the Location header (lib/api.ts handles this).
//   3. Hand the source URL to a minimal HTML5 <video> hosted in a WebView,
//      mute/play it, and overlay a personalised watermark on top in RN.
// The watermark cycles its anchor every N seconds (matching admin
// settings) and its presence is what gates playback: if the overlay
// component unmounts (a curious user yanking it from the React tree),
// we pause the video and report `watermark_removed` to the audit log.
type Anchor = "tl" | "tr" | "bl" | "br" | "center" | "tm";

const ANCHOR_STYLE: Record<Anchor, ViewStyle> = {
  tl: { top: 8, left: 8 },
  tr: { top: 8, right: 8 },
  bl: { bottom: 8, left: 8 },
  br: { bottom: 8, right: 8 },
  tm: { top: 8, alignSelf: "center" },
  center: { top: "45%", alignSelf: "center" },
};

const VALID_ANCHORS: Anchor[] = ["tl", "tr", "bl", "br", "center", "tm"];

function buildPlayerHtml(sourceUrl: string): string {
  // Tiny self-contained doc. We escape into a single attribute so a hostile
  // source URL can't break out into HTML — although the URL has been
  // freshly minted by our own backend, defence-in-depth is cheap. We post
  // 'seeked' messages back to RN so we can record `play_seek` telemetry.
  const safe = sourceUrl.replace(/"/g, "&quot;");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>
html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
video{width:100%;height:100%;object-fit:contain;background:#000}
</style></head><body>
<video id="v" src="${safe}" controls playsinline webkit-playsinline preload="metadata" controlslist="nodownload noplaybackrate" disablepictureinpicture oncontextmenu="return false"></video>
<script>
(function(){
  var v=document.getElementById('v');
  function post(m){try{window.ReactNativeWebView.postMessage(JSON.stringify(m));}catch(e){}}
  v.addEventListener('seeked',function(){post({type:'seeked',position:Math.round(v.currentTime||0)});});
  v.addEventListener('play',function(){post({type:'play',position:Math.round(v.currentTime||0)});});
  v.addEventListener('error',function(){post({type:'error'});});
  window.__pause=function(){try{v.pause();}catch(e){}};
})();
true;
</script>
</body></html>`;
}

export default function RecordingPlayerScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id?: string; title?: string; subject?: string }>();
  const recordingId = params.id ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<RecordingWatermark | null>(null);
  const [tampered, setTampered] = useState(false);
  const [anchorIdx, setAnchorIdx] = useState(0);

  const webRef = useRef<WebView | null>(null);
  const overlayMountedRef = useRef<boolean>(false);
  const tamperedRef = useRef<boolean>(false);
  const lastSeekReportRef = useRef<number>(0);

  const load = useCallback(async () => {
    if (!recordingId) {
      setError("Missing recording id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const stream = await requestRecordingStream(recordingId);
      if (!stream) {
        setError("Could not get a stream URL. Please try again.");
        setLoading(false);
        return;
      }
      const src = await resolveRecordingSource(stream.streamUrl);
      if (!src) {
        setError("Stream link could not be resolved.");
        setLoading(false);
        return;
      }
      setSourceUrl(src);
      setWatermark(stream.watermark);
    } catch {
      setError("Could not load video.");
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cycle through configured anchor positions.
  const anchors = useMemo<Anchor[]>(() => {
    const fromCfg = (watermark?.anchors ?? []).filter((a): a is Anchor =>
      (VALID_ANCHORS as string[]).includes(a),
    );
    return fromCfg.length > 0 ? fromCfg : ["tl", "tr", "bl", "br", "center"];
  }, [watermark]);

  const cycleSeconds = Math.max(3, watermark?.cycleSeconds ?? 8);

  useEffect(() => {
    if (!sourceUrl || !watermark?.enabled) return;
    const t = setInterval(() => {
      setAnchorIdx((i) => (i + 1) % anchors.length);
    }, cycleSeconds * 1000);
    return () => clearInterval(t);
  }, [sourceUrl, watermark?.enabled, anchors.length, cycleSeconds]);

  // Tamper guard: if the overlay component unmounts while playback is
  // active, force-pause the underlying video, *unmount the WebView* so
  // playback can't resume from the native controls, and beacon the audit
  // trail. The screen has to be reloaded (which would request a fresh
  // signed token) to watch again. Deterrent only — a determined attacker
  // can patch the bundle — but it mirrors the web tamper guard.
  useEffect(() => {
    if (!sourceUrl || !watermark?.enabled) return;
    const t = setInterval(() => {
      if (!overlayMountedRef.current) {
        const firstHit = !tamperedRef.current;
        if (firstHit) {
          tamperedRef.current = true;
          setTampered(true);
          void postRecordingTelemetry(recordingId, "watermark_removed");
        }
        // Belt-and-braces: pause first (covers the brief frame between
        // detection and the WebView being torn down), then null the
        // source so the WebView is unmounted entirely on the next render.
        try {
          webRef.current?.injectJavaScript("window.__pause && window.__pause(); true;");
        } catch {}
        setSourceUrl(null);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [recordingId, sourceUrl, watermark?.enabled]);

  const reloadAfterTamper = useCallback(() => {
    tamperedRef.current = false;
    setTampered(false);
    void load();
  }, [load]);

  const onWebMessage = useCallback(
    (e: WebViewMessageEvent) => {
      let msg: { type?: string; position?: number } = {};
      try {
        msg = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (msg.type === "seeked") {
        const now = Date.now();
        if (now - lastSeekReportRef.current < 1500) return;
        lastSeekReportRef.current = now;
        void postRecordingTelemetry(recordingId, "play_seek", msg.position ?? 0);
      } else if (msg.type === "error") {
        setError("Playback failed. The link may have expired — try again.");
      }
    },
    [recordingId],
  );

  const html = useMemo(() => (sourceUrl ? buildPlayerHtml(sourceUrl) : null), [sourceUrl]);
  const anchor = anchors[anchorIdx % anchors.length];

  return (
    <ScreenContainer>
      <SectionHeader title={params.title ?? "Recorded class"} />
      {params.subject ? (
        <Text style={[styles.subjectLabel, { color: colors.mutedForeground }]}>
          {params.subject}
        </Text>
      ) : null}

      <View
        style={[
          styles.player,
          { backgroundColor: "#0A0A0A", borderColor: colors.border, borderRadius: colors.radius },
        ]}
      >
        {loading && (
          <View style={styles.centerFill}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {!loading && error && (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => void load()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && tampered && (
          <View style={styles.centerFill}>
            <Text style={styles.errorText}>
              Playback was disabled because the identifying overlay was removed.
            </Text>
            <TouchableOpacity onPress={reloadAfterTamper} style={styles.retry}>
              <Text style={styles.retryText}>Reload</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && !tampered && html && (
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html }}
            onMessage={onWebMessage}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            style={styles.web}
            containerStyle={styles.webContainer}
          />
        )}

        {!loading && !error && sourceUrl && watermark?.enabled && watermark.text && (
          <Watermark
            text={watermark.text}
            anchorStyle={ANCHOR_STYLE[anchor]}
            opacity={watermark.opacity}
            fontSize={watermark.fontSize}
            color={watermark.color}
            mountedRef={overlayMountedRef}
          />
        )}
      </View>

      {tampered && (
        <View style={[styles.tamper, { borderColor: "#F59E0B33", backgroundColor: "#FEF3C722" }]}>
          <Text style={[styles.tamperText, { color: "#92400E" }]}>
            Playback paused: the identifying overlay was removed. Reload the screen to resume.
          </Text>
        </View>
      )}

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Recordings are licensed for personal study only. Your name and phone are watermarked into
        the playback as a deterrent against redistribution; every play start is logged.
      </Text>
    </ScreenContainer>
  );
}

function Watermark({
  text,
  anchorStyle,
  opacity,
  fontSize,
  color,
  mountedRef,
}: {
  text: string;
  anchorStyle: ViewStyle;
  opacity: number;
  fontSize: number;
  color: string;
  mountedRef: React.MutableRefObject<boolean>;
}) {
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [mountedRef]);

  return (
    <View style={[styles.watermark, anchorStyle]} pointerEvents="none">
      <Text
        style={[
          styles.watermarkText,
          {
            color,
            fontSize,
            opacity: Math.max(0, Math.min(100, opacity)) / 100,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  player: {
    aspectRatio: 16 / 9,
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
  web: { flex: 1, backgroundColor: "#000" },
  webContainer: { flex: 1, backgroundColor: "#000" },
  centerFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: { color: "#fff", fontSize: 12, textAlign: "center", marginBottom: 10 },
  retry: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  retryText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  watermark: { position: "absolute", maxWidth: "85%" },
  watermarkText: {
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  tamper: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  tamperText: { fontSize: 12 },
  disclaimer: { fontSize: 11, marginTop: 4 },
  subjectLabel: { fontSize: 12, marginTop: -6, marginBottom: 10 },
});

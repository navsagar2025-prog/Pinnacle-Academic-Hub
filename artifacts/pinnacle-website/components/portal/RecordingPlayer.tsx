"use client";

// In-portal video player. Asks the backend for a short-lived signed stream
// URL, then sets <video src=...>. The raw source URL is NEVER embedded in
// the rendered HTML — only the signed proxy URL appears in the DOM, and
// even that 302s away to a one-shot Location header.
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { WatermarkOverlay, type Anchor } from "./WatermarkOverlay";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";

interface Props {
  recordingId: string;
  watermarkText: string;
  watermarkOpacity: number;
  watermarkFontSize: number;
  watermarkColor: string;
  cycleSeconds: number;
  anchors: Anchor[];
  watermarkEnabled: boolean;
  poster?: string;
}

export function RecordingPlayer({
  recordingId,
  watermarkText,
  watermarkOpacity,
  watermarkFontSize,
  watermarkColor,
  cycleSeconds,
  anchors,
  watermarkEnabled,
  poster,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tampered, setTampered] = useState(false);
  const lastSeekReportedRef = useRef<number>(0);

  const fetchStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/recordings/${recordingId}/stream-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Could not get stream URL");
      setStreamUrl(json.data.streamUrl as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load video");
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    void fetchStream();
  }, [fetchStream]);

  function reportSeek() {
    const v = videoRef.current;
    if (!v) return;
    const now = Date.now();
    // Throttle: at most one report per 1.5s.
    if (now - lastSeekReportedRef.current < 1500) return;
    lastSeekReportedRef.current = now;
    void fetch(`${BASE}/api/v1/recordings/${recordingId}/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "play_seek", positionSec: Math.round(v.currentTime) }),
      keepalive: true,
    }).catch(() => {});
  }

  function reportTamper() {
    if (tampered) return;
    setTampered(true);
    void fetch(`${BASE}/api/v1/recordings/${recordingId}/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "watermark_removed" }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <div className="space-y-3">
      <div
        className="relative w-full bg-black rounded-2xl overflow-hidden shadow-elevated"
        style={{ aspectRatio: "16 / 9" }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Loader2 size={28} className="animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <div className="text-white">
              <AlertCircle size={28} className="mx-auto mb-2 text-red-300" />
              <p className="text-sm">{error}</p>
              <button
                onClick={() => void fetchStream()}
                className="mt-3 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        {streamUrl && (
          <video
            ref={videoRef}
            src={streamUrl}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            poster={poster}
            onContextMenu={(e) => e.preventDefault()}
            onSeeked={reportSeek}
            onError={() => setError("Playback failed. The link may have expired — try again.")}
            className="absolute inset-0 w-full h-full"
          >
            Your browser cannot play this video.
          </video>
        )}
        {watermarkEnabled && streamUrl && watermarkText && (
          <WatermarkOverlay
            text={watermarkText}
            opacity={watermarkOpacity}
            fontSize={watermarkFontSize}
            color={watermarkColor}
            cycleSeconds={cycleSeconds}
            anchors={anchors}
            videoRef={videoRef}
            onTamper={reportTamper}
          />
        )}
      </div>
      {tampered && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} /> Playback paused: the identifying overlay was removed from the page.
          Reload to resume.
        </div>
      )}
    </div>
  );
}

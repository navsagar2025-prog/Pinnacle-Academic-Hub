"use client";

// WatermarkOverlay — personalised, position-cycling text overlay rendered
// on top of an in-portal video player. Receives the user-identifying text
// AS A PROP from the server component (NEVER from a client global / store)
// so DevTools tampering with localStorage cannot change the displayed
// identity without also breaking auth.
//
// IMPORTANT: this overlay is a deterrent, not a security boundary. A
// determined attacker can always patch the bundle, screen-record, or rip
// the underlying URL once it 302s out. The point is to make casual leaks
// trivially traceable to the leaker.
import { useEffect, useRef, useState } from "react";

export type Anchor = "tl" | "tr" | "bl" | "br" | "center" | "tm";

const ANCHOR_STYLES: Record<Anchor, React.CSSProperties> = {
  tl: { top: 12, left: 12 },
  tr: { top: 12, right: 12 },
  bl: { bottom: 16, left: 12 },
  br: { bottom: 16, right: 12 },
  center: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  tm: { top: 12, left: "50%", transform: "translateX(-50%)" },
};

export interface WatermarkOverlayProps {
  text: string;
  opacity: number; // 0..100
  fontSize: number; // px
  color: string;
  cycleSeconds: number;
  anchors: Anchor[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTamper?: () => void;
}

export function WatermarkOverlay({
  text,
  opacity,
  fontSize,
  color,
  cycleSeconds,
  anchors,
  videoRef,
  onTamper,
}: WatermarkOverlayProps) {
  const safeAnchors = anchors.length > 0 ? anchors : (["tl"] as Anchor[]);
  const [anchorIdx, setAnchorIdx] = useState(0);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Cycle through anchor positions.
  useEffect(() => {
    const ms = Math.max(3, cycleSeconds) * 1000;
    const t = window.setInterval(() => {
      setAnchorIdx((i) => (i + 1) % safeAnchors.length);
    }, ms);
    return () => window.clearInterval(t);
  }, [cycleSeconds, safeAnchors.length]);

  // Tamper guard: every 2 seconds, verify the overlay is still attached
  // to its parent (the video container). If somebody removes it via
  // DevTools we pause the video and surface a callback. Again — deterrent,
  // not enforcement.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = window.setInterval(() => {
      const node = overlayRef.current;
      if (!node || !node.isConnected) {
        try {
          v.pause();
        } catch {}
        onTamper?.();
      }
    }, 2000);
    return () => window.clearInterval(t);
  }, [videoRef, onTamper]);

  const anchor = safeAnchors[anchorIdx % safeAnchors.length];
  const style: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    userSelect: "none",
    fontWeight: 600,
    fontSize: `${fontSize}px`,
    color,
    opacity: Math.max(0, Math.min(100, opacity)) / 100,
    mixBlendMode: "difference",
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
    whiteSpace: "nowrap",
    transition: "top 0.6s, left 0.6s, right 0.6s, bottom 0.6s, transform 0.6s",
    zIndex: 10,
    ...ANCHOR_STYLES[anchor],
  };

  return (
    <div ref={overlayRef} style={style} aria-hidden="true" data-watermark="1">
      {text}
    </div>
  );
}

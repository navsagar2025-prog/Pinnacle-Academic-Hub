import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "pinnacle.liveClasses.v1";

export type LiveClassPlatform = "zoom" | "meet" | "teams" | "custom";

export type LiveClass = {
  id: string;
  subject: string;
  topic: string;
  teacher: string;
  batch: string;
  /** Unix epoch ms */
  startsAt: number;
  /** Unix epoch ms */
  endsAt: number;
  meetUrl: string;
  platform: LiveClassPlatform;
};

export type LiveStatus = "live" | "starting-soon" | "upcoming" | "ended";

const STARTING_SOON_WINDOW_MS = 15 * 60 * 1000; // 15 minutes before start

// ---- Seed data ------------------------------------------------------------

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayAt(hours: number, minutes = 0): number {
  const d = startOfToday();
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

function tomorrowAt(hours: number, minutes = 0): number {
  return todayAt(hours, minutes) + 24 * 60 * 60 * 1000;
}

function yesterdayAt(hours: number, minutes = 0): number {
  return todayAt(hours, minutes) - 24 * 60 * 60 * 1000;
}

/**
 * Build a fresh demo seed each time it's needed so the dataset stays
 * relative to "now" — important for the countdown to feel real even on
 * first launch days/weeks after the app was installed.
 */
function buildSeed(): LiveClass[] {
  const now = Date.now();
  // Pick a "live now" class that started 12 min ago and ends in 48 min.
  const liveStart = now - 12 * 60 * 1000;
  const liveEnd = now + 48 * 60 * 1000;

  return [
    {
      id: "live-1",
      subject: "Chemistry",
      topic: "Equilibrium — Live Walkthrough",
      teacher: "Ms. Priya Sharma",
      batch: "JEE 2026 — Eve",
      startsAt: liveStart,
      endsAt: liveEnd,
      meetUrl: "https://meet.google.com/abc-defg-hij",
      platform: "meet",
    },
    {
      id: "up-1",
      subject: "Physics",
      topic: "Thermodynamics — Laws & Applications",
      teacher: "Dr. Ramesh Kumar",
      batch: "JEE 2026 — Eve",
      startsAt: todayAt(17, 0), // 5:00 PM today
      endsAt: todayAt(19, 0),
      meetUrl: "https://us02web.zoom.us/j/812-345-6789",
      platform: "zoom",
    },
    {
      id: "up-2",
      subject: "Mathematics",
      topic: "Integral Calculus — Definite Integrals",
      teacher: "Mr. Ajay Tiwari",
      batch: "JEE 2026 — Eve",
      startsAt: tomorrowAt(17, 0),
      endsAt: tomorrowAt(19, 0),
      meetUrl: "https://meet.google.com/xyz-uvwx-pqr",
      platform: "meet",
    },
    {
      id: "up-3",
      subject: "Biology",
      topic: "Human Physiology — Digestive System",
      teacher: "Ms. Nidhi Verma",
      batch: "NEET 2026 — Day",
      startsAt: tomorrowAt(10, 0),
      endsAt: tomorrowAt(12, 0),
      meetUrl: "https://meet.google.com/bio-1234-neet",
      platform: "meet",
    },
    {
      id: "done-1",
      subject: "Physics",
      topic: "Motion — Kinematics",
      teacher: "Dr. Ramesh Kumar",
      batch: "JEE 2026 — Eve",
      startsAt: yesterdayAt(17, 0),
      endsAt: yesterdayAt(19, 0),
      meetUrl: "https://us02web.zoom.us/j/999-888-7777",
      platform: "zoom",
    },
  ];
}

// ---- Store ----------------------------------------------------------------

type Listener = (items: LiveClass[]) => void;
const listeners = new Set<Listener>();
let cache: LiveClass[] | null = null;

async function load(): Promise<LiveClass[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as LiveClass[];
    } else {
      cache = buildSeed();
      await AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
    }
  } catch {
    cache = buildSeed();
  }
  return cache;
}

async function save(next: LiveClass[]): Promise<void> {
  cache = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* best-effort */
  }
  listeners.forEach((fn) => fn(next));
}

export async function addLiveClass(c: Omit<LiveClass, "id">): Promise<LiveClass> {
  const cur = await load();
  const created: LiveClass = { ...c, id: `lc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  await save([created, ...cur]);
  return created;
}

export async function deleteLiveClass(id: string): Promise<void> {
  const cur = await load();
  await save(cur.filter((c) => c.id !== id));
}

export async function resetLiveClasses(): Promise<void> {
  await save(buildSeed());
}

// ---- Status helpers -------------------------------------------------------

export function getStatus(c: LiveClass, now: number = Date.now()): LiveStatus {
  if (now >= c.endsAt) return "ended";
  if (now >= c.startsAt) return "live";
  if (c.startsAt - now <= STARTING_SOON_WINDOW_MS) return "starting-soon";
  return "upcoming";
}

/** Returns the "next interesting" class — live now wins, else nearest upcoming. */
export function pickFeatured(items: LiveClass[], now: number = Date.now()): LiveClass | null {
  const live = items.filter((c) => getStatus(c, now) === "live").sort((a, b) => a.endsAt - b.endsAt);
  if (live.length > 0) return live[0];
  const upcoming = items
    .filter((c) => c.startsAt > now)
    .sort((a, b) => a.startsAt - b.startsAt);
  return upcoming[0] ?? null;
}

export function bucketize(items: LiveClass[], now: number = Date.now()) {
  const liveNow: LiveClass[] = [];
  const upcoming: LiveClass[] = [];
  const completed: LiveClass[] = [];
  for (const c of items) {
    const s = getStatus(c, now);
    if (s === "live" || s === "starting-soon") liveNow.push(c);
    else if (s === "upcoming") upcoming.push(c);
    else completed.push(c);
  }
  liveNow.sort((a, b) => a.startsAt - b.startsAt);
  upcoming.sort((a, b) => a.startsAt - b.startsAt);
  completed.sort((a, b) => b.startsAt - a.startsAt);
  return { liveNow, upcoming, completed };
}

/** Format a millisecond duration as "MM:SS" / "Hh Mm" / "Dd Hh". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatClockTime(epochMs: number): string {
  const d = new Date(epochMs);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDateLabel(epochMs: number): string {
  const d = new Date(epochMs);
  const today = startOfToday().getTime();
  const tomorrow = today + 24 * 60 * 60 * 1000;
  const yesterday = today - 24 * 60 * 60 * 1000;
  const day = new Date(epochMs);
  day.setHours(0, 0, 0, 0);
  const dayMs = day.getTime();
  if (dayMs === today) return "Today";
  if (dayMs === tomorrow) return "Tomorrow";
  if (dayMs === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// ---- Hook -----------------------------------------------------------------

export function useLiveClasses() {
  const [items, setItems] = useState<LiveClass[]>(cache ?? []);
  const [loaded, setLoaded] = useState(cache !== null);

  useEffect(() => {
    let mounted = true;
    load().then((d) => {
      if (mounted) {
        setItems(d);
        setLoaded(true);
      }
    });
    const fn: Listener = (d) => {
      if (mounted) setItems(d);
    };
    listeners.add(fn);
    return () => {
      mounted = false;
      listeners.delete(fn);
    };
  }, []);

  const refresh = useCallback(async () => {
    cache = null;
    const d = await load();
    setItems(d);
  }, []);

  return { items, loaded, refresh };
}

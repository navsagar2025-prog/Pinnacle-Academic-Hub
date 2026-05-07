/**
 * Health probes for the Operations Console "System Health" tab.
 *
 * Constraints from task #125:
 *   - Each probe runs with a per-probe 2 s timeout and never blocks the
 *     overall response.
 *   - Result is cached server-side for 10 s to avoid hammering external APIs
 *     when the UI auto-refreshes every 30 s across multiple admin tabs.
 */
import { db } from "@workspace/db";
import { auditLogs } from "@workspace/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { objectStorageClient } from "./object-storage";
import { isProviderConfigured, type AiProvider } from "./ai-models";

const PROBE_TIMEOUT_MS = 2000;
const CACHE_TTL_MS = 10_000;

export type ProbeStatus = "ok" | "degraded" | "fail" | "skipped";

export interface ProbeResult {
  status: ProbeStatus;
  latencyMs: number | null;
  detail: string | null;
}

export interface CronHeartbeat {
  job: string;
  lastRunAt: string | null;
  ageHours: number | null;
  // age-based traffic-light: green < 24h, amber < 48h, red >= 48h or never
  health: "green" | "amber" | "red";
}

export interface HealthSnapshot {
  generatedAt: string;
  database: ProbeResult;
  objectStorage: ProbeResult;
  resend: ProbeResult;
  ai: Record<AiProvider, ProbeResult>;
  process: {
    nodeVersion: string;
    uptimeSec: number;
    rssMb: number;
    heapUsedMb: number;
  };
  recentErrors: string[]; // tail of an in-process error ring buffer
  cronHeartbeats: CronHeartbeat[];
}

let cached: { snapshot: HealthSnapshot; expires: number } | null = null;

// In-process ring buffer for recent server errors. Populated by patching
// console.error once per process. 50 lines is enough to spot the latest
// blow-up without leaking memory.
const RECENT_ERRORS_MAX = 50;
const recentErrors: string[] = [];
let consolePatched = false;

function patchConsoleOnce() {
  if (consolePatched) return;
  consolePatched = true;
  const origErr = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = args
      .map((a) => (a instanceof Error ? `${a.message}\n${a.stack ?? ""}` : typeof a === "string" ? a : safeStringify(a)))
      .join(" ");
    recentErrors.push(`[${new Date().toISOString()}] ${msg.slice(0, 1000)}`);
    if (recentErrors.length > RECENT_ERRORS_MAX) recentErrors.shift();
    origErr(...args);
  };
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}

async function probeDatabase(): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    await withTimeout(db.execute(sql`SELECT 1`), PROBE_TIMEOUT_MS);
    return { status: "ok", latencyMs: Date.now() - t0, detail: null };
  } catch (e) {
    return { status: "fail", latencyMs: Date.now() - t0, detail: (e as Error).message };
  }
}

async function probeObjectStorage(): Promise<ProbeResult> {
  const t0 = Date.now();
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    return { status: "skipped", latencyMs: null, detail: "DEFAULT_OBJECT_STORAGE_BUCKET_ID not set" };
  }
  try {
    // exists() is the cheapest authenticated handshake against GCS / Replit sidecar.
    await withTimeout(objectStorageClient.bucket(bucketId).exists(), PROBE_TIMEOUT_MS);
    return { status: "ok", latencyMs: Date.now() - t0, detail: null };
  } catch (e) {
    return { status: "fail", latencyMs: Date.now() - t0, detail: (e as Error).message };
  }
}

async function probeResend(): Promise<ProbeResult> {
  const t0 = Date.now();
  if (!process.env.RESEND_API_KEY) {
    return { status: "skipped", latencyMs: null, detail: "RESEND_API_KEY not set" };
  }
  try {
    // GET /domains is read-only and doesn't consume send-quota.
    const res = await withTimeout(
      fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      }),
      PROBE_TIMEOUT_MS,
    );
    if (!res.ok) {
      return { status: "degraded", latencyMs: Date.now() - t0, detail: `HTTP ${res.status}` };
    }
    return { status: "ok", latencyMs: Date.now() - t0, detail: null };
  } catch (e) {
    return { status: "fail", latencyMs: Date.now() - t0, detail: (e as Error).message };
  }
}

async function probeAiProvider(provider: AiProvider): Promise<ProbeResult> {
  if (!isProviderConfigured(provider)) {
    return { status: "skipped", latencyMs: null, detail: "Not configured" };
  }
  const t0 = Date.now();
  try {
    let url: string;
    let headers: Record<string, string>;
    switch (provider) {
      case "openai":
        url = `${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/models`;
        headers = { Authorization: `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}` };
        break;
      case "openrouter":
        url = `${process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/models`;
        headers = { Authorization: `Bearer ${process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY}` };
        break;
      case "anthropic":
        url = `${process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? "https://api.anthropic.com/v1"}/models`;
        headers = {
          "x-api-key": process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        };
        break;
      case "gemini":
        // Gemini's models endpoint takes the key as a query param.
        url = `${process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com"}/v1beta/models?key=${process.env.AI_INTEGRATIONS_GEMINI_API_KEY}`;
        headers = {};
        break;
    }
    const res = await withTimeout(fetch(url, { headers }), PROBE_TIMEOUT_MS);
    if (!res.ok) {
      return { status: "degraded", latencyMs: Date.now() - t0, detail: `HTTP ${res.status}` };
    }
    return { status: "ok", latencyMs: Date.now() - t0, detail: null };
  } catch (e) {
    return { status: "fail", latencyMs: Date.now() - t0, detail: (e as Error).message };
  }
}

const KNOWN_CRON_JOBS = [
  "purge-deleted-questions",
  "materialise-assignments",
  "auto-publish-mock-tests",
  "mock-test-reminders",
  "parent-digest",
];

async function loadCronHeartbeats(): Promise<CronHeartbeat[]> {
  // Run all heartbeat lookups in parallel and bound the entire batch by the
  // probe timeout — a slow audit_logs read can't stall the health response.
  const tasks = KNOWN_CRON_JOBS.map(async (job): Promise<CronHeartbeat> => {
    try {
      const [row] = await withTimeout(
        db
          .select({ createdAt: auditLogs.createdAt })
          .from(auditLogs)
          .where(eq(auditLogs.entityId, job))
          .orderBy(desc(auditLogs.createdAt))
          .limit(1),
        PROBE_TIMEOUT_MS,
      );
      if (!row) return { job, lastRunAt: null, ageHours: null, health: "red" };
      const ageHours = (Date.now() - row.createdAt.getTime()) / 3_600_000;
      const health: CronHeartbeat["health"] =
        ageHours < 24 ? "green" : ageHours < 48 ? "amber" : "red";
      return { job, lastRunAt: row.createdAt.toISOString(), ageHours, health };
    } catch {
      return { job, lastRunAt: null, ageHours: null, health: "red" };
    }
  });
  return Promise.all(tasks);
}

export async function getHealthSnapshot(force = false): Promise<HealthSnapshot> {
  patchConsoleOnce();
  const now = Date.now();
  if (!force && cached && cached.expires > now) return cached.snapshot;

  // Run all probes in parallel; partial failures don't block.
  const [database, objectStorage, resend, openai, gemini, anthropic, openrouter, cronHeartbeats] =
    await Promise.all([
      probeDatabase(),
      probeObjectStorage(),
      probeResend(),
      probeAiProvider("openai"),
      probeAiProvider("gemini"),
      probeAiProvider("anthropic"),
      probeAiProvider("openrouter"),
      loadCronHeartbeats(),
    ]);

  const mem = process.memoryUsage();
  const snapshot: HealthSnapshot = {
    generatedAt: new Date().toISOString(),
    database,
    objectStorage,
    resend,
    ai: { openai, gemini, anthropic, openrouter },
    process: {
      nodeVersion: process.version,
      uptimeSec: Math.floor(process.uptime()),
      rssMb: +(mem.rss / 1_048_576).toFixed(1),
      heapUsedMb: +(mem.heapUsed / 1_048_576).toFixed(1),
    },
    recentErrors: [...recentErrors].reverse().slice(0, 20),
    cronHeartbeats,
  };

  cached = { snapshot, expires: now + CACHE_TTL_MS };
  return snapshot;
}

/**
 * POST /api/v1/admin/ops/health-snapshot
 *
 * Secured by the HEALTH_SNAPSHOT_SECRET env-var rather than Clerk so an
 * external cron / uptime service (e.g. UptimeRobot, cron-job.org) can call
 * it without a browser session.
 *
 * Gathers all metrics (CPU, memory, disk, DB size) and inserts a row into
 * the health_snapshots table for the 30-day sparkline.
 *
 * curl -X POST https://<your-domain>/api/v1/admin/ops/health-snapshot \
 *      -H "Authorization: Bearer <HEALTH_SNAPSHOT_SECRET>"
 */
import { db } from "@workspace/db";
import { healthSnapshots } from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import os from "os";
import { readFileSync } from "fs";
import { execSync } from "child_process";

export const runtime = "nodejs";

interface CpuSample { idle: number; total: number }

function readProcStatSample(): CpuSample | null {
  try {
    const line = readFileSync("/proc/stat", "utf8").split("\n")[0];
    const parts = line.trim().split(/\s+/).slice(1).map(Number);
    const idle = parts[3] + (parts[4] ?? 0);
    const total = parts.reduce((a, b) => a + b, 0);
    return { idle, total };
  } catch { return null; }
}

async function getCpuPercent(): Promise<number> {
  const s1 = readProcStatSample();
  if (!s1) return 0;
  await new Promise((r) => setTimeout(r, 500));
  const s2 = readProcStatSample();
  if (!s2) return 0;
  const deltaIdle  = s2.idle  - s1.idle;
  const deltaTotal = s2.total - s1.total;
  if (deltaTotal === 0) return 0;
  return +((1 - deltaIdle / deltaTotal) * 100).toFixed(1);
}

function getDiskUsage(): { usedGb: number; totalGb: number } {
  try {
    const out = execSync("df -k /", { timeout: 3000, encoding: "utf8" });
    const lines = out.trim().split("\n").filter((l) => l.trim());
    const parts = lines[lines.length - 1].trim().split(/\s+/);
    const totalKb = parseInt(parts[1], 10);
    const usedKb  = parseInt(parts[2], 10);
    if (isNaN(totalKb) || isNaN(usedKb)) return { usedGb: 0, totalGb: 0 };
    return {
      usedGb:  +(usedKb  / 1_048_576).toFixed(2),
      totalGb: +(totalKb / 1_048_576).toFixed(2),
    };
  } catch { return { usedGb: 0, totalGb: 0 }; }
}

async function getDbSizeMb(): Promise<number> {
  try {
    const rows = await db.execute(sql`
      SELECT pg_database_size(current_database()) AS size_bytes
    `);
    const bytes = (rows.rows[0]?.size_bytes as number) ?? 0;
    return +(bytes / 1_048_576).toFixed(2);
  } catch { return 0; }
}

export async function POST(request: Request) {
  const secret = process.env.HEALTH_SNAPSHOT_SECRET;
  if (!secret) return err("HEALTH_SNAPSHOT_SECRET not configured", 500);

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (token !== secret) return err("Unauthorized", 401);

  const [cpuPercent, disk, dbSizeMb] = await Promise.all([
    getCpuPercent(),
    Promise.resolve(getDiskUsage()),
    getDbSizeMb(),
  ]);

  const memTotalMb = +(os.totalmem() / 1_048_576).toFixed(1);
  const memUsedMb  = +((os.totalmem() - os.freemem()) / 1_048_576).toFixed(1);

  const [row] = await db.insert(healthSnapshots).values({
    cpuPercent,
    memUsedMb,
    memTotalMb,
    diskUsedGb:  disk.usedGb,
    diskTotalGb: disk.totalGb,
    dbSizeMb,
  }).returning();

  return ok({ id: row.id, cpuPercent, memUsedMb, memTotalMb, dbSizeMb, disk });
}

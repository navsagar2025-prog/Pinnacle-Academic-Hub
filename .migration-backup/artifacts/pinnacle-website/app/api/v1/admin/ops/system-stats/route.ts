/**
 * GET /api/v1/admin/ops/system-stats
 * Admin-only. Returns real-time server resource usage:
 *   - CPU % (sampled over 500 ms from /proc/stat on Linux)
 *   - Memory used / total (from os module)
 *   - Disk used / total (df -k /)
 *   - Process uptime, RSS, heap
 */
import { ok, err } from "@/lib/server/api-response";
import { getRealAdminUser } from "@/lib/server/portal-auth";
import os from "os";
import { readFileSync } from "fs";
import { execSync } from "child_process";

export const runtime = "nodejs";

interface CpuSample {
  idle: number;
  total: number;
}

function readProcStatSample(): CpuSample | null {
  try {
    const line = readFileSync("/proc/stat", "utf8").split("\n")[0]; // cpu  ...
    const parts = line.trim().split(/\s+/).slice(1).map(Number);
    // user, nice, system, idle, iowait, irq, softirq, steal, guest, guest_nice
    const idle = parts[3] + (parts[4] ?? 0);
    const total = parts.reduce((a, b) => a + b, 0);
    return { idle, total };
  } catch {
    return null;
  }
}

async function getCpuPercent(): Promise<number | null> {
  const s1 = readProcStatSample();
  if (!s1) return null;
  await new Promise((r) => setTimeout(r, 500));
  const s2 = readProcStatSample();
  if (!s2) return null;
  const deltaIdle = s2.idle - s1.idle;
  const deltaTotal = s2.total - s1.total;
  if (deltaTotal === 0) return 0;
  return +((1 - deltaIdle / deltaTotal) * 100).toFixed(1);
}

function getDiskUsage(): { usedGb: number; totalGb: number } | null {
  try {
    // df -k returns 1 KB blocks; parse the last data line for /
    const out = execSync("df -k /", { timeout: 3000, encoding: "utf8" });
    const lines = out.trim().split("\n").filter((l) => l.trim());
    const dataLine = lines[lines.length - 1];
    const parts = dataLine.trim().split(/\s+/);
    // Filesystem  1K-blocks  Used  Available  Use%  Mounted
    const totalKb = parseInt(parts[1], 10);
    const usedKb = parseInt(parts[2], 10);
    if (isNaN(totalKb) || isNaN(usedKb)) return null;
    return {
      usedGb: +(usedKb / 1_048_576).toFixed(2),
      totalGb: +(totalKb / 1_048_576).toFixed(2),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const actor = await getRealAdminUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden — admin only", 403);

  const [cpuPercent, disk] = await Promise.all([
    getCpuPercent(),
    Promise.resolve(getDiskUsage()),
  ]);

  const memTotalMb = +(os.totalmem() / 1_048_576).toFixed(1);
  const memFreeMb = +(os.freemem() / 1_048_576).toFixed(1);
  const memUsedMb = +(memTotalMb - memFreeMb).toFixed(1);

  const mem = process.memoryUsage();

  return ok({
    cpu: { percent: cpuPercent },
    memory: { usedMb: memUsedMb, totalMb: memTotalMb, freeMb: memFreeMb },
    disk: disk ?? { usedGb: null, totalGb: null },
    process: {
      uptimeSec: Math.floor(process.uptime()),
      rssMb: +(mem.rss / 1_048_576).toFixed(1),
      heapUsedMb: +(mem.heapUsed / 1_048_576).toFixed(1),
      heapTotalMb: +(mem.heapTotal / 1_048_576).toFixed(1),
      nodeVersion: process.version,
    },
  });
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { getHealthSnapshot } from "@/lib/server/ops-health";
import { db } from "@workspace/db";
import { healthSnapshots } from "@workspace/db/schema";
import { desc, gte } from "drizzle-orm";
import { HealthDashboard } from "./HealthDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "System Health — Operations" };

export default async function HealthPage() {
  await requirePortalRole("admin");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [initial, rawSnapshots] = await Promise.all([
    getHealthSnapshot(),
    db
      .select()
      .from(healthSnapshots)
      .where(gte(healthSnapshots.createdAt, thirtyDaysAgo))
      .orderBy(desc(healthSnapshots.createdAt))
      .limit(720), // max ~720 readings (30d × 24h × 1/h)
  ]);

  // Reverse so oldest is leftmost on the sparkline; deduplicate to one point
  // per day by taking the latest snapshot of each day.
  const byDay = new Map<string, typeof rawSnapshots[0]>();
  for (const row of rawSnapshots) {
    const day = row.createdAt.toISOString().split("T")[0];
    if (!byDay.has(day)) byDay.set(day, row); // rawSnapshots is DESC so first = latest per day
  }
  const sparkRows = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, r]) => ({
      day: new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      cpu:  r.cpuPercent,
      disk: r.diskUsedGb,
      mem:  r.memUsedMb,
    }));

  return <HealthDashboard initial={initial} initialSnapshots={sparkRows} />;
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { getHealthSnapshot } from "@/lib/server/ops-health";
import { HealthDashboard } from "./HealthDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "System Health — Operations" };

export default async function HealthPage() {
  await requirePortalRole("admin");
  const initial = await getHealthSnapshot();
  return <HealthDashboard initial={initial} />;
}

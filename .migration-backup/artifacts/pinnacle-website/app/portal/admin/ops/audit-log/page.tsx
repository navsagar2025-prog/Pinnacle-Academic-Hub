import { requirePortalRole } from "@/lib/server/portal-auth";
import { AuditLogViewer } from "./AuditLogViewer";

export const metadata = { title: "Audit Log Viewer — Operations" };

export default async function OpsAuditLogPage() {
  await requirePortalRole("admin");
  return <AuditLogViewer />;
}

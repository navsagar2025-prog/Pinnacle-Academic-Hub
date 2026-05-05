import { requirePortalRole } from "@/lib/server/portal-auth";
import { AttemptHistoryView } from "./AttemptHistoryView";

export const metadata = { title: "Attempt History — Student Portal" };

export default async function StudentAttemptHistoryPage() {
  await requirePortalRole("student");
  return <AttemptHistoryView />;
}

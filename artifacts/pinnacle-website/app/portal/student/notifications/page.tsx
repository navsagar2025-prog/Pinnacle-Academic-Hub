import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { notices, students } from "@workspace/db/schema";
import { desc, eq, and, or, isNull, gt } from "drizzle-orm";
import { Bell } from "lucide-react";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = { title: "Notifications — Student Portal" };

export default async function NotificationsPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const now = new Date();

  const allNotices = await db
    .select({
      id: notices.id,
      publishedAt: notices.publishedAt,
      title: notices.title,
      body: notices.body,
      category: notices.category,
    })
    .from(notices)
    .where(
      and(
        eq(notices.isPublic, true),
        or(isNull(notices.expiresAt), gt(notices.expiresAt, now)),
        enrollment?.batchId
          ? or(isNull(notices.targetBatchId), eq(notices.targetBatchId, enrollment.batchId))
          : isNull(notices.targetBatchId)
      )
    )
    .orderBy(desc(notices.publishedAt))
    .limit(50);

  const serialized = allNotices.map((n) => ({
    id: n.id,
    date: n.publishedAt instanceof Date ? n.publishedAt.toISOString() : String(n.publishedAt),
    title: n.title,
    body: n.body ?? "",
    category: n.category ?? "General",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {serialized.length} notice{serialized.length !== 1 ? "s" : ""} from Pinnacle Academic Classes
          </p>
        </div>
        <div className="w-10 h-10 bg-[var(--color-navy)]/10 rounded-xl flex items-center justify-center">
          <Bell size={18} className="text-[var(--color-navy)]" />
        </div>
      </div>

      <NotificationsClient notices={serialized} />
    </div>
  );
}

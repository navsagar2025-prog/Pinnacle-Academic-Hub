import { db } from "@workspace/db";
import { notices } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import TeacherNoticeForm from "@/components/portal/TeacherNoticeForm";

export const metadata = { title: "Notices — Teacher Portal" };

export default async function TeacherNoticesPage() {
  const recentNotices = await db.select().from(notices).orderBy(desc(notices.publishedAt)).limit(6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Post Notice</h1>
        <p className="text-slate-500 text-sm mt-1">Publish announcements visible to students and parents</p>
      </div>

      <TeacherNoticeForm />

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">Published Notices</h2>
        <div className="space-y-3">
          {recentNotices.length === 0 ? (
            <p className="text-slate-400 text-sm">No notices published yet.</p>
          ) : (
            recentNotices.map((n) => (
              <div key={n.id} className="p-3 bg-[var(--color-slate-light)] rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge text-xs bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{n.category}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(n.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="font-semibold text-sm text-[var(--color-navy)]">{n.title}</div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

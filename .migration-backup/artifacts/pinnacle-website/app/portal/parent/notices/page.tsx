import { db } from "@workspace/db";
import { notices } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { Bell } from "lucide-react";

export const metadata = { title: "Notices — Parent Portal" };

const CATEGORY_COLORS: Record<string, string> = {
  Test: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Fee: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
  Admissions: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Event: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Academic: "bg-purple-50 text-purple-700",
};

export default async function ParentNoticesPage() {
  const allNotices = await db.select().from(notices).orderBy(desc(notices.publishedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Notices & Updates</h1>
        <p className="text-slate-500 text-sm mt-1">Latest announcements from Pinnacle Academic Classes</p>
      </div>
      <div className="space-y-4">
        {allNotices.length === 0 ? (
          <div className="card text-center py-12 text-slate-400">No notices at this time.</div>
        ) : (
          allNotices.map((n) => (
            <div key={n.id} className="card hover:shadow-elevated transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell size={18} className="text-[var(--color-teal)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`badge text-xs ${CATEGORY_COLORS[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(n.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--color-navy)] text-sm mb-1">{n.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{n.body}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

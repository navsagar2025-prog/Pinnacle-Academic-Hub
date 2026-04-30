import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { NOTICES } from "@/lib/data";

export const metadata = { title: "Notices — Parent Portal" };

const CATEGORY_COLORS: Record<string, string> = {
  Test: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Fee: "bg-[var(--color-gold)]/15 text-[var(--color-navy)]",
  Admissions: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Event: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Academic: "bg-purple-50 text-purple-700",
};

export default async function ParentNoticesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Notices & Updates</h1>
        <p className="text-slate-500 text-sm mt-1">Latest announcements from Pinnacle Academic Classes</p>
      </div>
      <div className="space-y-4">
        {NOTICES.map((n) => (
          <div key={n.id} className="card hover:shadow-elevated transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[var(--color-teal)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-[var(--color-teal)]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`badge text-xs ${CATEGORY_COLORS[n.category] ?? "bg-slate-100 text-slate-600"}`}>{n.category}</span>
                  <span className="text-xs text-slate-400">{new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <h3 className="font-bold text-[var(--color-navy)] text-sm mb-1">{n.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{n.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { MessageSquare, CheckCircle, Clock, Phone, Mail, Download } from "lucide-react";
import { apiUrl } from "@/lib/utils";

export const metadata = { title: "Enquiries — Admin Panel" };

export default async function AdminEnquiriesPage() {
  const [rows, [{ total }], [{ pending }]] = await Promise.all([
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(enquiries),
    db.select({ pending: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.isFollowedUp, false)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Enquiries</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total · {pending} pending follow-up</p>
        </div>
        <a
          href={apiUrl("/api/v1/enquiries/export")}
          download
          className="inline-flex items-center gap-2 btn-secondary py-2.5 px-4 text-sm"
        >
          <Download size={14} /> Export CSV
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Enquiries", value: total, color: "navy" },
          { label: "Pending Follow-up", value: pending, color: "gold" },
          { label: "Followed Up", value: total - pending, color: "teal" },
        ].map((s) => (
          <div key={s.label} className={`card border-l-4 ${s.color === "navy" ? "border-l-[var(--color-navy)]" : s.color === "gold" ? "border-l-[var(--color-gold)]" : "border-l-[var(--color-teal)]"}`}>
            <div className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[var(--color-navy)]">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p>No enquiries yet. They will appear here when visitors fill the contact form.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Name", "Contact", "Course Interest", "Message", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-[var(--color-slate-light)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[var(--color-navy)]/10 rounded-full flex items-center justify-center text-[var(--color-navy)] text-xs font-bold flex-shrink-0">
                          {e.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[var(--color-navy)] whitespace-nowrap">{e.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600"><Phone size={11} />{e.phone}</div>
                        {e.email && <div className="flex items-center gap-1.5 text-xs text-slate-400"><Mail size={11} />{e.email}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{e.courseInterest ?? "General"}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-slate-500 line-clamp-2">{e.message ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs flex items-center gap-1 w-fit ${e.isFollowedUp ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-[var(--color-gold)]/15 text-[var(--color-navy)]"}`}>
                        {e.isFollowedUp ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {e.isFollowedUp ? "Done" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { Users2, Phone, Mail } from "lucide-react";
import { AdmissionStatusDropdown } from "./AdmissionStatus";

export const metadata = { title: "Admissions — Admin Panel" };

export default async function AdminAdmissionsPage() {
  const [rows, [{ total }], [{ converted }], [{ pending }]] = await Promise.all([
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(enquiries),
    db.select({ converted: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.admissionStatus, "converted")),
    db.select({ pending: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.isFollowedUp, false)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Admissions CRM</h1>
        <p className="text-slate-500 text-sm mt-1">Track enquiries through the full admission pipeline</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Enquiries", value: total, color: "border-l-[var(--color-navy)]" },
          { label: "Converted", value: converted, color: "border-l-[var(--color-teal)]" },
          { label: "Pending Follow-up", value: pending, color: "border-l-[var(--color-gold)]" },
          { label: "Conversion Rate", value: `${total > 0 ? Math.round((converted / total) * 100) : 0}%`, color: "border-l-[var(--color-maroon)]" },
        ].map((s) => (
          <div key={s.label} className={`card border-l-4 ${s.color}`}>
            <div className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[var(--color-navy)]">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Users2 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No enquiries yet. They appear here when visitors fill the contact form.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-slate-light)] border-b border-slate-100">
                <tr>
                  {["Name", "Contact", "Course Interest", "Message", "Date", "Pipeline Status"].map((h) => (
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
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-xs text-slate-500 line-clamp-2">{e.message ?? "—"}</p>
                      {e.notes && <p className="text-xs text-[var(--color-teal)] line-clamp-1 mt-0.5 italic">Note: {e.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <AdmissionStatusDropdown enquiryId={e.id} current={e.admissionStatus ?? "new"} />
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

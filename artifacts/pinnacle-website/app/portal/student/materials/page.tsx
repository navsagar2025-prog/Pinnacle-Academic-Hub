import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FileText, Download, Calendar } from "lucide-react";

export const metadata = { title: "Study Material" };

const MATERIALS = [
  { id: 1, subject: "Physics", title: "Wave Optics — Complete Notes", type: "Notes", date: "25 Apr 2026", size: "2.4 MB", batch: "JEE 2026" },
  { id: 2, subject: "Chemistry", title: "Organic Chemistry — Haloalkanes", type: "Notes", date: "23 Apr 2026", size: "1.8 MB", batch: "JEE 2026" },
  { id: 3, subject: "Mathematics", title: "Integral Calculus — Formula Sheet", type: "Formula", date: "22 Apr 2026", size: "0.8 MB", batch: "JEE 2026" },
  { id: 4, subject: "Physics", title: "Thermodynamics — NCERT Exercises", type: "Exercise", date: "20 Apr 2026", size: "3.1 MB", batch: "JEE 2026" },
  { id: 5, subject: "Chemistry", title: "Coordination Compounds — Notes", type: "Notes", date: "18 Apr 2026", size: "2.2 MB", batch: "JEE 2026" },
  { id: 6, subject: "Mathematics", title: "Differential Equations — Solved Examples", type: "Exercise", date: "15 Apr 2026", size: "1.9 MB", batch: "JEE 2026" },
  { id: 7, subject: "Physics", title: "Electrostatics — Chapter Summary", type: "Summary", date: "10 Apr 2026", size: "1.2 MB", batch: "JEE 2026" },
  { id: 8, subject: "Chemistry", title: "Physical Chemistry — Thermodynamics", type: "Notes", date: "8 Apr 2026", size: "2.7 MB", batch: "JEE 2026" },
];

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
};

const TYPE_COLORS: Record<string, string> = {
  Notes: "bg-blue-50 text-blue-700",
  Formula: "bg-purple-50 text-purple-700",
  Exercise: "bg-orange-50 text-orange-700",
  Summary: "bg-green-50 text-green-700",
};

export default async function MaterialsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Study Material
        </h1>
        <p className="text-slate-500 text-sm mt-1">{MATERIALS.length} documents available for your batch</p>
      </div>

      <div className="grid gap-3">
        {MATERIALS.map((m) => (
          <div
            key={m.id}
            className="card flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated transition-all"
          >
            <div className="w-12 h-12 bg-[var(--color-navy)]/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-[var(--color-navy)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge text-xs ${SUBJECT_COLORS[m.subject] ?? "bg-slate-100 text-slate-600"}`}>
                  {m.subject}
                </span>
                <span className={`badge text-xs ${TYPE_COLORS[m.type] ?? "bg-slate-100 text-slate-600"}`}>
                  {m.type}
                </span>
              </div>
              <div className="font-semibold text-[var(--color-navy)] mt-1 truncate">{m.title}</div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {m.date}
                </span>
                <span>{m.size}</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] transition-colors flex-shrink-0">
              <Download size={14} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

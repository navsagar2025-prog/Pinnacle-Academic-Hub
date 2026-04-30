import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FileText, Download, Calendar, Clock } from "lucide-react";

export const metadata = { title: "Practice Papers" };

const PAPERS = [
  { id: 1, title: "JEE Mains — Full Mock Test #8", type: "Full Mock", subject: "PCM", date: "27 Apr 2026", duration: "3 hrs", questions: 90, maxMarks: 300 },
  { id: 2, title: "JEE Advanced — Paper 1 Practice", type: "JEE Advanced", subject: "PCM", date: "20 Apr 2026", duration: "3 hrs", questions: 54, maxMarks: 183 },
  { id: 3, title: "Physics — Wave Optics DPP", type: "DPP", subject: "Physics", date: "18 Apr 2026", duration: "45 min", questions: 20, maxMarks: 60 },
  { id: 4, title: "Chemistry — Organic Chemistry Test", type: "Chapter Test", subject: "Chemistry", date: "15 Apr 2026", duration: "1 hr", questions: 30, maxMarks: 90 },
  { id: 5, title: "Mathematics — Calculus Test", type: "Chapter Test", subject: "Mathematics", date: "12 Apr 2026", duration: "1.5 hrs", questions: 30, maxMarks: 90 },
  { id: 6, title: "JEE Mains — Full Mock Test #7", type: "Full Mock", subject: "PCM", date: "6 Apr 2026", duration: "3 hrs", questions: 90, maxMarks: 300 },
  { id: 7, title: "Previous Year — JEE Mains 2024", type: "Previous Year", subject: "PCM", date: "1 Apr 2026", duration: "3 hrs", questions: 90, maxMarks: 300 },
  { id: 8, title: "Previous Year — JEE Mains 2023", type: "Previous Year", subject: "PCM", date: "28 Mar 2026", duration: "3 hrs", questions: 90, maxMarks: 300 },
];

const TYPE_COLORS: Record<string, string> = {
  "Full Mock": "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  "JEE Advanced": "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  "DPP": "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  "Chapter Test": "bg-orange-50 text-orange-700",
  "Previous Year": "bg-purple-50 text-purple-700",
};

export default async function PapersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
          Practice Papers
        </h1>
        <p className="text-slate-500 text-sm mt-1">{PAPERS.length} papers available</p>
      </div>

      <div className="grid gap-3">
        {PAPERS.map((p) => (
          <div
            key={p.id}
            className="card flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated transition-all"
          >
            <div className="w-12 h-12 bg-[var(--color-gold)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-[var(--color-gold)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge text-xs ${TYPE_COLORS[p.type] ?? "bg-slate-100 text-slate-600"}`}>
                  {p.type}
                </span>
                <span className="badge text-xs bg-slate-100 text-slate-600">{p.subject}</span>
              </div>
              <div className="font-semibold text-[var(--color-navy)] mt-1">{p.title}</div>
              <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={11} />{p.date}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{p.duration}</span>
                <span>{p.questions} Qs · {p.maxMarks} marks</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-maroon)] text-white text-sm font-semibold hover:bg-[var(--color-maroon-light)] transition-colors flex-shrink-0">
              <Download size={14} />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

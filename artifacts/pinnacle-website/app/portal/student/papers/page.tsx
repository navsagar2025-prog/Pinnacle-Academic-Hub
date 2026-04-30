import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, practicePapers, batches } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { FileText, Download, Clock, AlertCircle } from "lucide-react";

export const metadata = { title: "Practice Papers — Student Portal" };

const TYPE_COLORS: Record<string, string> = {
  "Full Mock": "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  "JEE Advanced": "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  "DPP": "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  "Chapter Test": "bg-orange-50 text-orange-700",
  "Previous Year": "bg-purple-50 text-purple-700",
  "NEET Mock": "bg-green-50 text-green-700",
};

export default async function PapersPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db.select({ name: batches.name }).from(batches).where(eq(batches.id, enrollment.batchId)).limit(1).then((r) => r[0]?.name ?? null)
    : null;

  const papers = enrollment?.batchId
    ? await db
        .select({ id: practicePapers.id, title: practicePapers.title, paperType: practicePapers.paperType, subject: practicePapers.subject, durationMinutes: practicePapers.durationMinutes, totalQuestions: practicePapers.totalQuestions, maxMarks: practicePapers.maxMarks, fileUrl: practicePapers.fileUrl, downloadCount: practicePapers.downloadCount, createdAt: practicePapers.createdAt })
        .from(practicePapers)
        .where(and(eq(practicePapers.batchId, enrollment.batchId), eq(practicePapers.isVisible, true)))
        .orderBy(desc(practicePapers.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Practice Papers</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment ? `${papers.length} paper${papers.length !== 1 ? "s" : ""} available · ${batchName ?? ""}` : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Practice papers will appear here once you are assigned to a batch.</p>
        </div>
      )}

      {enrollment && papers.length === 0 && (
        <div className="card text-center py-10">
          <FileText size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No practice papers uploaded for your batch yet.</p>
        </div>
      )}

      <div className="grid gap-3">
        {papers.map((p) => {
          const dur = p.durationMinutes ? `${Math.floor(p.durationMinutes / 60)}h${p.durationMinutes % 60 > 0 ? ` ${p.durationMinutes % 60}m` : ""}` : null;
          return (
            <div key={p.id} className="card flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated transition-all">
              <div className="w-12 h-12 bg-[var(--color-gold)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-[var(--color-gold)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge text-xs ${TYPE_COLORS[p.paperType] ?? "bg-slate-100 text-slate-600"}`}>{p.paperType}</span>
                  <span className="badge text-xs bg-slate-100 text-slate-600">{p.subject}</span>
                </div>
                <div className="font-semibold text-[var(--color-navy)] mt-1">{p.title}</div>
                <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-400 flex-wrap">
                  {dur && <span className="flex items-center gap-1"><Clock size={11} />{dur}</span>}
                  {p.totalQuestions && <span>{p.totalQuestions} Qs</span>}
                  {p.maxMarks && <span>{p.maxMarks} marks</span>}
                </div>
              </div>
              {p.fileUrl && p.fileUrl !== "#" ? (
                <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-maroon)] text-white text-sm font-semibold hover:bg-[var(--color-maroon-light)] transition-colors flex-shrink-0">
                  <Download size={14} /> Download
                </a>
              ) : (
                <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed flex-shrink-0">
                  <Download size={14} /> Download
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

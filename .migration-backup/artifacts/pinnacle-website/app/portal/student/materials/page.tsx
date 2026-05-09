import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, studyMaterials, batches } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { FileText, Download, Calendar, AlertCircle } from "lucide-react";

export const metadata = { title: "Study Materials — Student Portal" };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Biology: "bg-green-100 text-green-700",
};

const TYPE_COLORS: Record<string, string> = {
  notes: "bg-blue-50 text-blue-700",
  formula: "bg-purple-50 text-purple-700",
  exercise: "bg-orange-50 text-orange-700",
  summary: "bg-green-50 text-green-700",
  paper: "bg-rose-50 text-rose-700",
};

export default async function MaterialsPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db.select({ name: batches.name }).from(batches).where(eq(batches.id, enrollment.batchId)).limit(1).then((r) => r[0]?.name ?? null)
    : null;

  const materials = enrollment?.batchId
    ? await db
        .select({ id: studyMaterials.id, title: studyMaterials.title, subject: studyMaterials.subject, type: studyMaterials.type, fileUrl: studyMaterials.fileUrl, fileSize: studyMaterials.fileSize, createdAt: studyMaterials.createdAt })
        .from(studyMaterials)
        .where(and(eq(studyMaterials.batchId, enrollment.batchId), eq(studyMaterials.isVisible, true)))
        .orderBy(asc(studyMaterials.subject), asc(studyMaterials.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Study Materials</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment ? `${materials.length} document${materials.length !== 1 ? "s" : ""} available · ${batchName ?? ""}` : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Study materials will appear here once you are assigned to a batch.</p>
        </div>
      )}

      {enrollment && materials.length === 0 && (
        <div className="card text-center py-10">
          <FileText size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No materials uploaded for your batch yet.</p>
        </div>
      )}

      <div className="grid gap-3">
        {materials.map((m) => (
          <div key={m.id} className="card flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-elevated transition-all">
            <div className="w-12 h-12 bg-[var(--color-navy)]/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-[var(--color-navy)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge text-xs ${SUBJECT_COLORS[m.subject] ?? "bg-slate-100 text-slate-600"}`}>{m.subject}</span>
                <span className={`badge text-xs ${TYPE_COLORS[m.type] ?? "bg-slate-100 text-slate-600"}`}>{m.type}</span>
              </div>
              <div className="font-semibold text-[var(--color-navy)] mt-1 truncate">{m.title}</div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Calendar size={11} />{new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                {m.fileSize && <span>{m.fileSize}</span>}
              </div>
            </div>
            {m.fileUrl && m.fileUrl !== "#" ? (
              <a href={`/pinnacle-website/api/v1/downloads/study_material/${m.id}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] transition-colors flex-shrink-0">
                <Download size={14} /> Download
              </a>
            ) : (
              <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed flex-shrink-0">
                <Download size={14} /> Download
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { teachers, studyMaterials, batches } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { FileText, Download, Calendar } from "lucide-react";
import TeacherMaterialUpload from "./TeacherMaterialUpload";

export const metadata = { title: "Study Materials — Teacher Portal" };

export default async function TeacherMaterialsPage() {
  const dbUser = await requirePortalRole("teacher");

  const [teacher] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(and(eq(teachers.userId, dbUser.id), eq(teachers.isActive, true)))
    .limit(1);

  const allBatches = await db
    .select({ id: batches.id, name: batches.name, timingLabel: batches.timingLabel })
    .from(batches)
    .orderBy(batches.name);

  const materials = teacher
    ? await db
        .select({
          id: studyMaterials.id,
          title: studyMaterials.title,
          subject: studyMaterials.subject,
          type: studyMaterials.type,
          fileUrl: studyMaterials.fileUrl,
          fileSize: studyMaterials.fileSize,
          downloadCount: studyMaterials.downloadCount,
          isVisible: studyMaterials.isVisible,
          createdAt: studyMaterials.createdAt,
          batchName: batches.name,
        })
        .from(studyMaterials)
        .leftJoin(batches, eq(studyMaterials.batchId, batches.id))
        .where(eq(studyMaterials.uploadedBy, dbUser.id))
        .orderBy(desc(studyMaterials.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Study Materials</h1>
        <p className="text-slate-500 text-sm mt-1">Upload and manage study materials for your students</p>
      </div>

      <TeacherMaterialUpload batches={allBatches} teacherId={teacher?.id ?? undefined} uploaderId={dbUser.id} />

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Your Uploaded Materials ({materials.length})
        </h2>
        {materials.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No materials uploaded yet. Use the form above to add your first material.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {materials.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-3">
                <div className="w-10 h-10 bg-[var(--color-navy)]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[var(--color-navy)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[var(--color-navy)]">{m.title}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="badge text-xs bg-slate-100 text-slate-600">{m.type}</span>
                    <span className="badge text-xs bg-slate-100 text-slate-600">{m.subject}</span>
                    <span>{m.batchName}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} />
                      {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1"><Download size={10} />{m.downloadCount ?? 0} downloads</span>
                    {!m.isVisible && <span className="text-amber-600 font-semibold">Hidden</span>}
                  </div>
                </div>
                <a
                  href={m.fileUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Download size={12} />View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

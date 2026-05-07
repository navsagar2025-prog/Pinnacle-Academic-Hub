import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students, assignments, batches } from "@workspace/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { ClipboardList, Download, Calendar, Clock, AlertCircle, Repeat } from "lucide-react";
import { AssignmentSubmitButton } from "./AssignmentSubmitButton";

export const metadata = { title: "Assignments — Student Portal" };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[var(--color-navy)]/10 text-[var(--color-navy)]",
  Chemistry: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  Mathematics: "bg-[var(--color-maroon)]/10 text-[var(--color-maroon)]",
  Biology: "bg-green-100 text-green-700",
};

function dueDateStatus(dueDate: Date) {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Overdue", cls: "text-red-600 bg-red-50" };
  if (days === 0) return { label: "Due today", cls: "text-amber-600 bg-amber-50" };
  if (days <= 2) return { label: `Due in ${days}d`, cls: "text-orange-600 bg-orange-50" };
  return { label: `Due ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, cls: "text-slate-500 bg-slate-100" };
}

export default async function AssignmentsPage() {
  const dbUser = await requirePortalRole("student");

  const [enrollment] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(and(eq(students.userId, dbUser.id), eq(students.isActive, true)))
    .limit(1);

  const batchName = enrollment?.batchId
    ? await db.select({ name: batches.name }).from(batches).where(eq(batches.id, enrollment.batchId)).limit(1).then((r) => r[0]?.name ?? null)
    : null;

  const data = enrollment?.batchId
    ? await db
        .select({
          id: assignments.id,
          title: assignments.title,
          subject: assignments.subject,
          description: assignments.description,
          fileUrl: assignments.fileUrl,
          dueDate: assignments.dueDate,
          maxMarks: assignments.maxMarks,
          scheduleId: assignments.scheduleId,
        })
        .from(assignments)
        .where(and(eq(assignments.batchId, enrollment.batchId), eq(assignments.isVisible, true)))
        .orderBy(asc(assignments.dueDate))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Assignments</h1>
        <p className="text-slate-500 text-sm mt-1">
          {enrollment
            ? `${data.length} assignment${data.length !== 1 ? "s" : ""} · ${batchName ?? ""}`
            : "Not enrolled in a batch"}
        </p>
      </div>

      {!enrollment && (
        <div className="card bg-amber-50 border border-amber-100 flex items-start gap-3">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Your batch enrollment is pending. Assignments will appear here once you are assigned to a batch.</p>
        </div>
      )}

      <div className="space-y-4">
        {data.map((a) => {
          const due = dueDateStatus(a.dueDate);
          const sc = SUBJECT_COLORS[a.subject] ?? "bg-slate-100 text-slate-600";
          return (
            <div key={a.id} className="card hover:shadow-elevated transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 bg-[var(--color-navy)]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={22} className="text-[var(--color-navy)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`badge text-xs ${sc}`}>{a.subject}</span>
                    <span className={`badge text-xs font-semibold ${due.cls}`}>
                      <Clock size={10} className="inline mr-1" />{due.label}
                    </span>
                    {a.maxMarks && (
                      <span className="badge text-xs bg-slate-100 text-slate-500">{a.maxMarks} marks</span>
                    )}
                    {a.scheduleId && (
                      <span className="badge text-xs bg-[var(--color-teal)]/10 text-[var(--color-teal)] flex items-center gap-1">
                        <Repeat size={10} /> Recurring
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-[var(--color-navy)] text-base">{a.title}</div>
                  {a.description && (
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{a.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <Calendar size={11} />
                    Due: {a.dueDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  {a.fileUrl ? (
                    <a
                      href={a.fileUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-teal)] text-white text-sm font-semibold hover:bg-[var(--color-teal-light)] transition-colors"
                    >
                      <Download size={14} />Download
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-300 text-sm font-semibold cursor-not-allowed"
                    >
                      <Download size={14} />Download
                    </button>
                  )}
                  <AssignmentSubmitButton assignmentId={a.id} />
                </div>
              </div>
            </div>
          );
        })}

        {enrollment && data.length === 0 && (
          <div className="card text-center py-12">
            <ClipboardList size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No assignments posted for your batch yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

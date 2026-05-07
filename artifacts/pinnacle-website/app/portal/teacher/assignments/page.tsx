import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { assignments, batches } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { FileText, Calendar, Download, Users } from "lucide-react";
import AssignmentForm from "./AssignmentForm";
import RecurringSchedulesList from "./RecurringSchedulesList";

export const metadata = { title: "Assignments — Teacher Portal" };

export default async function TeacherAssignmentsPage() {
  const dbUser = await requirePortalRole("teacher");

  const allBatches = await db
    .select({ id: batches.id, name: batches.name, timingLabel: batches.timingLabel })
    .from(batches)
    .orderBy(batches.name);

  const rows = await db
    .select({
      id: assignments.id,
      title: assignments.title,
      subject: assignments.subject,
      description: assignments.description,
      fileUrl: assignments.fileUrl,
      dueDate: assignments.dueDate,
      maxMarks: assignments.maxMarks,
      isVisible: assignments.isVisible,
      createdAt: assignments.createdAt,
      batchName: batches.name,
    })
    .from(assignments)
    .leftJoin(batches, eq(assignments.batchId, batches.id))
    .where(eq(assignments.postedBy, dbUser.id))
    .orderBy(desc(assignments.createdAt));

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">
            Assignments
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create and manage assignments for your batches</p>
        </div>
        <AssignmentForm batches={allBatches} />
      </div>

      <RecurringSchedulesList />

      <div className="card">
        <h2 className="font-bold text-[var(--color-navy)] mb-4 font-[family-name:var(--font-playfair)]">
          Posted Assignments ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No assignments posted yet. Click <strong>New Assignment</strong> to create one.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((a) => {
              const due = new Date(a.dueDate);
              const isPast = due < now;
              return (
                <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-10 h-10 bg-[var(--color-navy)]/5 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={18} className="text-[var(--color-navy)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[var(--color-navy)]">{a.title}</span>
                      <span className="badge bg-slate-100 text-slate-600 text-xs">{a.subject}</span>
                      {!a.isVisible && <span className="badge bg-amber-100 text-amber-700 text-xs">Hidden</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users size={10} />{a.batchName ?? "All Batches"}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${isPast ? "text-[var(--color-maroon)]" : "text-[var(--color-teal)]"}`}>
                        <Calendar size={10} />Due {due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {isPast && " (overdue)"}
                      </span>
                      {a.maxMarks && <span>{a.maxMarks} marks</span>}
                    </div>
                    {a.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.description}</p>
                    )}
                  </div>
                  {a.fileUrl && (
                    <a
                      href={a.fileUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 self-start"
                    >
                      <Download size={12} /> Question Paper
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

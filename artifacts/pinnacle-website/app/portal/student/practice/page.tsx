import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { students } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { Sparkles, Calendar, Users, User as UserIcon, ChevronRight, FolderOpen, Target } from "lucide-react";
import { getStudentAssignedSets } from "@/lib/server/practice-sets";
import { WeakTopicsCard } from "@/components/portal/WeakTopicsCard";
import { getWeakTopics } from "@/lib/server/weak-topics";

export const metadata = { title: "Practice Sets — Student Portal" };

export default async function StudentPracticePage() {
  const user = await requirePortalRole("student");
  const [student] = await db.select({ id: students.id }).from(students)
    .where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  const sets = student ? await getStudentAssignedSets(student.id) : [];
  const weakTopics = student ? await getWeakTopics(student.id) : [];

  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Practice Sets</h1>
        <p className="text-slate-500 text-sm mt-1">
          Question bundles assigned to you by your teachers. Complete each set at your own pace.
        </p>
      </div>

      <WeakTopicsCard weakTopics={weakTopics} />

      {sets.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-500 mb-1">Nothing assigned yet</p>
          <p className="text-xs">Your teachers will assign practice sets here. Until then, try a <Link href="/portal/student/mock-tests" className="text-[var(--color-teal)] underline">mock test</Link>.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map((s) => {
            const pct = s.questionCount > 0 ? Math.round((s.attemptedCount / s.questionCount) * 100) : 0;
            const overdue = s.dueAt && s.dueAt.getTime() < now && s.attemptedCount < s.questionCount;
            const done = s.attemptedCount >= s.questionCount && s.questionCount > 0;
            return (
              <Link key={s.id} href={`/portal/student/practice/${s.id}`}
                className="card hover:shadow-elevated transition-all flex items-start gap-4 group">
                <FolderOpen size={20} className="text-[var(--color-teal)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[var(--color-navy)]">{s.name}</span>
                    {s.subject && <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)] text-[10px]">{s.subject}</span>}
                    {done && <span className="badge bg-green-50 text-green-700 text-[10px]">Completed</span>}
                    {overdue && <span className="badge bg-rose-50 text-rose-700 text-[10px]">Overdue</span>}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      {s.scope === "batch" ? <><Users size={10} /> batch</> : <><UserIcon size={10} /> personal</>}
                    </span>
                  </div>
                  {s.description && <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span><Target size={10} className="inline mr-1" />{s.attemptedCount}/{s.questionCount} attempted</span>
                    {s.correctCount > 0 && <span className="text-green-700">{s.correctCount} correct</span>}
                    {s.dueAt && (
                      <span className={`flex items-center gap-1 ${overdue ? "text-rose-700" : ""}`}>
                        <Calendar size={10} /> due {s.dueAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${done ? "bg-green-500" : "bg-[var(--color-teal)]"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] shrink-0 mt-1" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

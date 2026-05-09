import { db } from "@workspace/db";
import { doubts, students, users } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { MessageCircleQuestion, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Doubts Management — Admin Panel" };

export default async function AdminDoubtsPage() {
  const allDoubts = await db
    .select({
      id: doubts.id,
      subject: doubts.subject,
      topic: doubts.topic,
      questionText: doubts.questionText,
      isResolved: doubts.isResolved,
      answerCount: doubts.answerCount,
      createdAt: doubts.createdAt,
      studentName: users.name,
    })
    .from(doubts)
    .leftJoin(students, eq(doubts.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .orderBy(desc(doubts.createdAt));

  const open = allDoubts.filter((d) => !d.isResolved);
  const resolved = allDoubts.filter((d) => d.isResolved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Doubt Q&amp;A</h1>
        <p className="text-slate-500 text-sm mt-1">{open.length} pending · {resolved.length} resolved</p>
      </div>

      <div>
        <h2 className="font-bold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-lg">
          Awaiting Response ({open.length})
        </h2>
        {open.length === 0 ? (
          <div className="card text-center py-8 text-slate-400">
            <MessageCircleQuestion size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending doubts. Great work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {open.map((d) => (
              <Link key={d.id} href={`/portal/admin/doubts/${d.id}`}
                className="card hover:shadow-elevated transition-all flex items-start justify-between gap-3 group border-l-4 border-l-[var(--color-gold)]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{d.subject}</span>
                    {d.topic && <span className="text-slate-400">· {d.topic}</span>}
                    <span className="text-[var(--color-gold)] inline-flex items-center gap-1"><Clock size={12} />Pending</span>
                  </div>
                  <p className="text-sm text-[var(--color-navy)] font-medium line-clamp-2">{d.questionText}</p>
                  <p className="text-xs text-slate-400 mt-1">By {d.studentName ?? "Student"} · {d.answerCount} repl{d.answerCount === 1 ? "y" : "ies"} · {new Date(d.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="font-bold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-lg">
            Resolved ({resolved.length})
          </h2>
          <div className="space-y-3">
            {resolved.slice(0, 10).map((d) => (
              <Link key={d.id} href={`/portal/admin/doubts/${d.id}`}
                className="card hover:shadow-elevated transition-all flex items-start justify-between gap-3 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-xs">
                    <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{d.subject}</span>
                    <span className="text-[var(--color-teal)] inline-flex items-center gap-1"><CheckCircle2 size={12} />Resolved</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">{d.questionText}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

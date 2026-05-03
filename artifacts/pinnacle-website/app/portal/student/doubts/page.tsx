import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { doubts, students, users } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { MessageCircleQuestion, CheckCircle2, Clock, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { AskDoubtForm } from "./AskDoubtForm";

export const metadata = { title: "Doubt Forum — Student Portal" };

export default async function StudentDoubtsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requirePortalRole("student");
  const sp = await searchParams;
  const view = sp.view === "community" ? "community" : "mine";

  const [student] = await db.select({ id: students.id })
    .from(students).where(and(eq(students.userId, user.id), eq(students.isActive, true))).limit(1);

  const myDoubts = student ? await db.select().from(doubts)
    .where(eq(doubts.studentId, student.id)).orderBy(desc(doubts.createdAt)) : [];

  const community = view === "community" ? await db.select({
    id: doubts.id,
    subject: doubts.subject,
    topic: doubts.topic,
    questionText: doubts.questionText,
    isResolved: doubts.isResolved,
    answerCount: doubts.answerCount,
    createdAt: doubts.createdAt,
    askerName: users.name,
  })
    .from(doubts)
    .leftJoin(students, eq(doubts.studentId, students.id))
    .leftJoin(users, eq(students.userId, users.id))
    .orderBy(desc(doubts.createdAt))
    .limit(50) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--color-navy)]">Doubt Forum</h1>
          <p className="text-slate-500 text-sm mt-1">Stuck on a problem? Post your doubt — teachers and peers reply within 24 hours.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/portal/student/doubts" className={`px-3 py-1.5 rounded-lg ${view === "mine" ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600"}`}>My Doubts</Link>
          <Link href="/portal/student/doubts?view=community" className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${view === "community" ? "bg-[var(--color-navy)] text-white" : "bg-slate-100 text-slate-600"}`}>
            <Users size={13} />Community Feed
          </Link>
        </div>
      </div>

      {!student ? (
        <div className="card text-amber-700 bg-amber-50 border border-amber-100 text-sm">
          Your enrollment is not active yet. You&apos;ll be able to post doubts once enrolled.
        </div>
      ) : view === "mine" && (
        <AskDoubtForm />
      )}

      {view === "mine" ? (
        <div>
          <h2 className="font-bold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-lg">My Doubts ({myDoubts.length})</h2>
          {myDoubts.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <MessageCircleQuestion size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No doubts posted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myDoubts.map((d) => (
                <Link key={d.id} href={`/portal/student/doubts/${d.id}`}
                  className="card hover:shadow-elevated transition-all flex items-start justify-between gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{d.subject}</span>
                      {d.topic && <span className="text-slate-400">· {d.topic}</span>}
                      {d.isResolved ? (
                        <span className="text-[var(--color-teal)] inline-flex items-center gap-1"><CheckCircle2 size={12} />Resolved</span>
                      ) : (
                        <span className="text-[var(--color-gold)] inline-flex items-center gap-1"><Clock size={12} />{d.answerCount > 0 ? "Discussion" : "Awaiting reply"}</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-navy)] font-medium line-clamp-2">{d.questionText}</p>
                    <p className="text-xs text-slate-400 mt-1">{d.answerCount} repl{d.answerCount === 1 ? "y" : "ies"} · Posted {new Date(d.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="font-bold text-[var(--color-navy)] mb-3 font-[family-name:var(--font-playfair)] text-lg">Community Feed ({community.length})</h2>
          {community.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">
              <MessageCircleQuestion size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No doubts in the community yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {community.map((d) => (
                <Link key={d.id} href={`/portal/student/doubts/${d.id}`}
                  className="card hover:shadow-elevated transition-all flex items-start justify-between gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span className="badge bg-[var(--color-navy)]/10 text-[var(--color-navy)]">{d.subject}</span>
                      {d.topic && <span className="text-slate-400">· {d.topic}</span>}
                      {d.isResolved ? (
                        <span className="text-[var(--color-teal)] inline-flex items-center gap-1"><CheckCircle2 size={12} />Resolved</span>
                      ) : (
                        <span className="text-[var(--color-gold)] inline-flex items-center gap-1"><Clock size={12} />Open</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-navy)] font-medium line-clamp-2">{d.questionText}</p>
                    <p className="text-xs text-slate-400 mt-1">By {d.askerName ?? "Student"} · {d.answerCount} repl{d.answerCount === 1 ? "y" : "ies"} · {new Date(d.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-teal)] flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

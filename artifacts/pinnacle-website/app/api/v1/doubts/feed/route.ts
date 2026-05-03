import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doubts, students, users } from "@workspace/db/schema";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q");

  const conds: SQL[] = [];
  if (subject && subject !== "All") conds.push(eq(doubts.subject, subject));
  if (status === "open") conds.push(eq(doubts.isResolved, false));
  if (status === "resolved") conds.push(eq(doubts.isResolved, true));
  if (search) {
    const c = or(ilike(doubts.questionText, `%${search}%`), ilike(doubts.topic, `%${search}%`));
    if (c) conds.push(c);
  }

  const where = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  const rows = await db.select({
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
    .where(where ?? sql`true`)
    .orderBy(desc(doubts.createdAt))
    .limit(100);

  return NextResponse.json({ success: true, items: rows });
}

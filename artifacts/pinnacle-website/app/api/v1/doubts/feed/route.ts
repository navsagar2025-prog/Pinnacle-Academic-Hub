import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { doubts, doubtAnswerVotes, students, users } from "@workspace/db/schema";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";

type TopAnswerRow = {
  id: string;
  doubt_id: string;
  answer_text: string;
  author_role: string;
  author_name: string | null;
  upvotes: number;
  is_official: boolean;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("q");
  const mine = url.searchParams.get("mine") === "1";

  const conds: SQL[] = [];
  if (subject && subject !== "All") conds.push(eq(doubts.subject, subject));
  if (status === "open") conds.push(eq(doubts.isResolved, false));
  if (status === "resolved") conds.push(eq(doubts.isResolved, true));
  if (search) {
    const c = or(ilike(doubts.questionText, `%${search}%`), ilike(doubts.topic, `%${search}%`));
    if (c) conds.push(c);
  }

  const viewer = await getDbUser().catch(() => null);
  const viewerUserId = viewer?.id ?? null;

  if (mine) {
    if (!viewerUserId) return NextResponse.json({ success: true, items: [] });
    const [s] = await db.select({ id: students.id })
      .from(students).where(eq(students.userId, viewerUserId)).limit(1);
    if (!s) return NextResponse.json({ success: true, items: [] });
    conds.push(eq(doubts.studentId, s.id));
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

  const ids = rows.map((r) => r.id);
  const topByDoubt = new Map<string, {
    id: string;
    answerText: string;
    authorRole: string;
    authorName: string | null;
    upvotes: number;
    isOfficial: boolean;
    voted: boolean;
  }>();

  if (ids.length > 0) {
    const ranked = await db.execute(sql`
      SELECT a.id, a.doubt_id, a.answer_text, a.author_role,
             u.name AS author_name, a.upvotes, a.is_official
      FROM (
        SELECT da.*, ROW_NUMBER() OVER (
          PARTITION BY da.doubt_id
          ORDER BY da.is_official DESC, da.upvotes DESC, da.created_at ASC
        ) AS rn
        FROM doubt_answers da
        WHERE da.doubt_id = ANY(${ids})
      ) a
      LEFT JOIN users u ON u.id = a.author_id
      WHERE a.rn = 1
    `);

    const topRows = ranked.rows as unknown as TopAnswerRow[];
    const topAnswerIds = topRows.map((r) => r.id);

    let votedSet = new Set<string>();
    if (viewerUserId && topAnswerIds.length > 0) {
      const votes = await db.select({ answerId: doubtAnswerVotes.answerId })
        .from(doubtAnswerVotes)
        .where(and(
          eq(doubtAnswerVotes.userId, viewerUserId),
          inArray(doubtAnswerVotes.answerId, topAnswerIds),
        ));
      votedSet = new Set(votes.map((v) => v.answerId));
    }

    for (const r of topRows) {
      topByDoubt.set(r.doubt_id, {
        id: r.id,
        answerText: r.answer_text,
        authorRole: r.author_role,
        authorName: r.author_name,
        upvotes: Number(r.upvotes) || 0,
        isOfficial: !!r.is_official,
        voted: votedSet.has(r.id),
      });
    }
  }

  const items = rows.map((r) => ({
    ...r,
    topAnswer: topByDoubt.get(r.id) ?? null,
  }));

  return NextResponse.json({ success: true, items });
}

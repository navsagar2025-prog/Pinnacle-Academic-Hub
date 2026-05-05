import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Returns the distinct topics for a subject, with optional question counts.
// Used by the admin Question Bank page and the practice-set question picker.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const withCounts = url.searchParams.get("counts") === "1";

  if (!subject || subject === "All") {
    return NextResponse.json({ topics: [], counts: [] });
  }

  if (withCounts) {
    const rows = await db.select({
      topic: questionBank.topic,
      count: sql<number>`count(*)::int`,
    })
      .from(questionBank)
      .where(and(eq(questionBank.subject, subject), sql`${questionBank.topic} is not null`))
      .groupBy(questionBank.topic)
      .orderBy(sql`count(*) desc`);
    const counts = rows
      .filter((r): r is { topic: string; count: number } => !!r.topic)
      .map((r) => ({ topic: r.topic, count: r.count }));
    return NextResponse.json({ topics: counts.map((c) => c.topic), counts });
  }

  const rows = await db.selectDistinct({ topic: questionBank.topic })
    .from(questionBank)
    .where(and(eq(questionBank.subject, subject), sql`${questionBank.topic} is not null`))
    .orderBy(questionBank.topic);
  const topics = rows.map((r) => r.topic).filter((t): t is string => !!t);
  return NextResponse.json({ topics });
}

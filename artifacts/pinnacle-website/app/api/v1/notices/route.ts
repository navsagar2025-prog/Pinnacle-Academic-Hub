import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { notices, users } from "@workspace/db/schema";
import { desc, eq, and, isNull, or, gte, sql } from "drizzle-orm";

async function getDbUser(clerkUserId: string) {
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;
  const category = searchParams.get("category");

  try {
    const conditions = [
      eq(notices.isPublic, true),
      or(isNull(notices.expiresAt), gte(notices.expiresAt, sql`now()`)),
    ];

    if (category) {
      conditions.push(eq(notices.category, category as typeof notices.category._.data));
    }

    const rows = await db
      .select({
        id: notices.id,
        title: notices.title,
        body: notices.body,
        category: notices.category,
        publishedAt: notices.publishedAt,
        updatedAt: notices.updatedAt,
      })
      .from(notices)
      .where(and(...conditions))
      .orderBy(desc(notices.publishedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notices)
      .where(and(...conditions));

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error("GET /api/v1/notices error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getDbUser(userId);
  if (!dbUser || (dbUser.role !== "teacher" && dbUser.role !== "admin")) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Only teachers and admins can post notices" },
      { status: 403 }
    );
  }

  try {
    const reqBody = await request.json();
    const { title, body: noticeBody, category } = reqBody;

    if (!title || !noticeBody) {
      return NextResponse.json(
        { success: false, error: "title and body are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(notices)
      .values({
        title,
        body: noticeBody,
        category: category ?? "General",
        isPublic: true,
        postedBy: dbUser.id,
      })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/notices error:", err);
    return NextResponse.json({ success: false, error: "Failed to create notice" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { enquiries, users } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";

async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.clerkUserId, userId)).limit(1);
  return user?.role === "admin";
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!(await isAdmin(userId))) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(enquiries);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error("GET /api/v1/enquiries error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch enquiries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, courseInterest, message } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "name and phone are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(enquiries)
      .values({ name, phone, email, courseInterest, message, source: "website" })
      .returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/enquiries error:", err);
    return NextResponse.json({ success: false, error: "Failed to submit enquiry" }, { status: 500 });
  }
}

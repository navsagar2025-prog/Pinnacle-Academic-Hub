import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { enquiries, users } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { paginatedOk, created, err } from "@/lib/server/api-response";

async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.clerkUserId, userId)).limit(1);
  return user?.role === "admin";
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  if (!(await isAdmin(userId))) return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(enquiries);
    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/enquiries error:", e);
    return err("Failed to fetch enquiries");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, courseInterest, message } = body;
    if (!name || !phone) return err("name and phone are required", 400);

    const [row] = await db
      .insert(enquiries)
      .values({ name, phone, email, courseInterest, message, source: "website" })
      .returning();

    return created(row);
  } catch (e) {
    console.error("POST /api/v1/enquiries error:", e);
    return err("Failed to submit enquiry");
  }
}

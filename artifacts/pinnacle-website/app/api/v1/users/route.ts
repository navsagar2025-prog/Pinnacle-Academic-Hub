import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { users, students, teachers, parents } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(users),
    ]);
    return ok(rows, { total, page, limit });
  } catch (e) {
    console.error("GET /api/v1/users error:", e);
    return err("Failed to fetch users");
  }
}

import { auth } from "@clerk/nextjs/server";
import { db } from "@workspace/db";
import { enquiries, users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";

async function isAdmin(userId: string): Promise<boolean> {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.clerkUserId, userId)).limit(1);
  return user?.role === "admin";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return err("Unauthorized", 401);
  if (!(await isAdmin(userId))) return err("Forbidden", 403);

  const { id } = await params;
  try {
    const body = await request.json();
    const { isFollowedUp } = body;
    if (typeof isFollowedUp !== "boolean") return err("isFollowedUp (boolean) is required", 400);

    const [updated] = await db
      .update(enquiries)
      .set({ isFollowedUp, updatedAt: new Date() })
      .where(eq(enquiries.id, id))
      .returning();

    if (!updated) return err("Enquiry not found", 404);
    return ok(updated);
  } catch (e) {
    console.error("PATCH /api/v1/enquiries/[id] error:", e);
    return err("Failed to update enquiry");
  }
}

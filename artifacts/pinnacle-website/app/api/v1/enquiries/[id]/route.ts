import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { getDbUser } from "@/lib/server/portal-auth";
import { logAudit } from "@/lib/server/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  try {
    const body = await request.json();
    const { admissionStatus, notes, isFollowedUp } = body;

    const [row] = await db.update(enquiries).set({
      ...(admissionStatus !== undefined && { admissionStatus }),
      ...(notes !== undefined && { notes }),
      ...(isFollowedUp !== undefined && { isFollowedUp }),
      ...(admissionStatus === "converted" && { isFollowedUp: true }),
      updatedAt: new Date(),
    }).where(eq(enquiries.id, id)).returning();

    if (!row) return err("Enquiry not found", 404);
    await logAudit(actor.id, actor.name, "enquiry.update", "enquiry", id, { admissionStatus });
    return ok(row);
  } catch (e) {
    console.error("PATCH /api/v1/enquiries/[id] error:", e);
    return err("Failed to update enquiry");
  }
}

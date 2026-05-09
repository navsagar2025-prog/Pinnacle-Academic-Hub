import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ok, err } from "@/lib/server/api-response";
import { logAudit } from "@/lib/server/audit";

const VALID_ROLES = ["student", "parent", "teacher", "admin"] as const;
type Role = typeof VALID_ROLES[number];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getDbUser();
  if (!actor) return err("Unauthorized", 401);
  if (actor.role !== "admin") return err("Forbidden", 403);

  const { id } = await params;
  let body: { role?: string };
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }

  const { role } = body;
  if (!role) return err("role is required", 400);
  if (!VALID_ROLES.includes(role as Role)) {
    return err(`role must be one of: ${VALID_ROLES.join(", ")}`, 400);
  }

  if (id === actor.id && role !== "admin") {
    return err("You cannot demote your own admin account", 400);
  }

  try {
    const [updated] = await db
      .update(users)
      .set({ role: role as Role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) return err("User not found", 404);

    await logAudit(actor.id, actor.name, "UPDATE_USER_ROLE", "user", id, {
      newRole: role,
      targetEmail: updated.email,
    });

    return ok(updated);
  } catch (e) {
    console.error("PUT /api/v1/users/[id] error:", e);
    return err("Failed to update user");
  }
}

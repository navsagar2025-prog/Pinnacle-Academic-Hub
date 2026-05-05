import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { logQbAudit } from "@/lib/server/question-bank-deletion";

// POST = admin-only restore from the 7-day bin. Clears the soft-delete
// stamp AND the request fields, so the question returns to a fully clean
// state and can be edited/published again.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await ctx.params;
  const [existing] = await db.select({ id: questionBank.id }).from(questionBank)
    .where(and(eq(questionBank.id, id), isNotNull(questionBank.deletedAt)))
    .limit(1);
  if (!existing) return NextResponse.json({ error: "Not in bin" }, { status: 404 });

  await db.update(questionBank)
    .set({
      deletedAt: null,
      deletionRequestedAt: null,
      deletionRequestedBy: null,
      deletionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(questionBank.id, id));

  let restoreReason: string | null = null;
  try {
    const body = await req.json();
    const r = (body?.reason ?? "").toString().trim();
    if (r) restoreReason = r.slice(0, 1000);
  } catch { /* body optional */ }

  await logQbAudit({
    actorId: user.id,
    actorName: user.name,
    action: "qb.delete.restored",
    entityId: id,
    details: { restoreReason },
  });

  return NextResponse.json({ success: true });
}

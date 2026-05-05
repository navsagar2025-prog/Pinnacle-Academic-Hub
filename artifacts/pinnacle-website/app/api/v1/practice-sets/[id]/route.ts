import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { practiceSets } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getSetDetail } from "@/lib/server/practice-sets";

function isStaff(role: string | undefined) {
  return role === "admin" || role === "teacher";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const detail = await getSetDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || !isStaff(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { name?: string; description?: string | null; subject?: string | null; isActive?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string") {
    const n = body.name.trim();
    if (!n) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    patch.name = n;
  }
  if (body.description !== undefined) patch.description = body.description?.toString().trim() || null;
  if (body.subject !== undefined) patch.subject = body.subject?.toString().trim() || null;
  if (typeof body.isActive === "boolean") patch.isActive = body.isActive;

  const [updated] = await db.update(practiceSets).set(patch).where(eq(practiceSets.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ set: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getDbUser();
  if (!user || user.role !== "admin") {
    // Only admins can hard-delete; teachers should deactivate via PATCH.
    return NextResponse.json({ error: "Only admins can delete a set" }, { status: 403 });
  }
  const { id } = await params;
  const [deleted] = await db.delete(practiceSets).where(eq(practiceSets.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

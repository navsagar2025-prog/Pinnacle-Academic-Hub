import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBankSavedViews } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requirePortalRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Name must be 80 characters or fewer" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(questionBankSavedViews)
      .set({ name, updatedAt: new Date() })
      .where(and(
        eq(questionBankSavedViews.id, id),
        // Scope by userId so an admin can never mutate another admin's view.
        eq(questionBankSavedViews.userId, user.id),
      ))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ view: updated });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "You already have a saved view with that name" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requirePortalRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const [deleted] = await db
    .delete(questionBankSavedViews)
    .where(and(
      eq(questionBankSavedViews.id, id),
      eq(questionBankSavedViews.userId, user.id),
    ))
    .returning({ id: questionBankSavedViews.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

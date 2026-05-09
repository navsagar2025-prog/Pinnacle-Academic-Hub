import { NextRequest, NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBankSavedViews } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  let user;
  try {
    user = await requirePortalRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(questionBankSavedViews)
    .where(eq(questionBankSavedViews.userId, user.id))
    .orderBy(asc(questionBankSavedViews.name));

  return NextResponse.json({ views: rows });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requirePortalRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  // queryString is the URL search-params payload (no leading "?"). Empty is
  // valid — saving "all questions / no filters" is sometimes useful.
  const queryString = typeof body?.queryString === "string" ? body.queryString : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Name must be 80 characters or fewer" }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(questionBankSavedViews)
      .values({ userId: user.id, name, queryString })
      .returning();
    return NextResponse.json({ view: created }, { status: 201 });
  } catch (err: unknown) {
    // Unique (user_id, name) collision — surface a friendly error.
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "You already have a saved view with that name" }, { status: 409 });
    }
    throw err;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, inArray, sql, type SQL } from "drizzle-orm";

type Filter = {
  subject?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  type?: string | null;
  year?: string | number | null;
  examName?: string | null;
  pyq?: string | null;
  q?: string | null;
};

function buildWhere(f: Filter | undefined): SQL | undefined {
  if (!f) return undefined;
  const conds: SQL[] = [];
  if (f.subject && f.subject !== "All") conds.push(eq(questionBank.subject, String(f.subject)));
  if (f.topic) conds.push(eq(questionBank.topic, String(f.topic)));
  if (f.difficulty) conds.push(eq(questionBank.difficulty, f.difficulty as "easy" | "medium" | "hard"));
  if (f.type) conds.push(eq(questionBank.questionType, f.type as "mcq" | "short" | "long" | "numerical"));
  if (f.year) conds.push(eq(questionBank.year, Number(f.year)));
  if (f.examName) conds.push(eq(questionBank.examName, String(f.examName)));
  if (f.pyq === "1") conds.push(sql`${questionBank.year} is not null`);
  const search = (f.q ?? "").toString().trim();
  if (search) conds.push(sql`search_vector @@ plainto_tsquery('english', ${search})`);
  if (conds.length === 0) return undefined;
  return conds.length === 1 ? conds[0] : and(...conds);
}

async function requireAdminOrTeacher() {
  const user = await getDbUser();
  if (!user) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (user.role !== "admin" && user.role !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

// POST = expand a filter into the full id list, used by the
// "select all matching filter" affordance. We return ids only (not full rows)
// to keep the payload small even for 11k+ matches.
export async function POST(req: NextRequest) {
  const auth = await requireAdminOrTeacher();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || body.action !== "list-ids") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }
  const where = buildWhere(body.filter as Filter | undefined);
  const rows = await db.select({ id: questionBank.id }).from(questionBank).where(where);
  return NextResponse.json({ success: true, ids: rows.map((r) => r.id), total: rows.length });
}

// PATCH = bulk update. Caller may pass `ids` (explicit selection) or
// `filter` (everything matching the current filter). At least one is required.
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminOrTeacher();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const set = body.set as Record<string, unknown> | undefined;
  if (!set || typeof set !== "object") {
    return NextResponse.json({ error: "`set` is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if ("difficulty" in set) {
    const v = set.difficulty;
    if (v !== "easy" && v !== "medium" && v !== "hard") {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }
    updates.difficulty = v;
  }
  if ("topic" in set) {
    updates.topic = set.topic == null || set.topic === "" ? null : String(set.topic);
  }
  if ("isPublished" in set) {
    updates.isPublished = Boolean(set.isPublished);
  }
  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No supported fields in `set`" }, { status: 400 });
  }

  const where = await resolveTargetWhere(body);
  if ("error" in where) return where.error;
  if (where.empty) return NextResponse.json({ success: true, updated: 0 });

  const updated = await db.update(questionBank).set(updates).where(where.where).returning({ id: questionBank.id });
  return NextResponse.json({ success: true, updated: updated.length });
}

// DELETE = bulk delete. Same selection semantics as PATCH.
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminOrTeacher();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const where = await resolveTargetWhere(body);
  if ("error" in where) return where.error;
  if (where.empty) return NextResponse.json({ success: true, deleted: 0 });

  const deleted = await db.delete(questionBank).where(where.where).returning({ id: questionBank.id });
  return NextResponse.json({ success: true, deleted: deleted.length });
}

type ResolveResult =
  | { error: NextResponse }
  | { empty: true; where?: undefined }
  | { empty: false; where: SQL };

// Picks ids vs filter, validates, and returns a SQL WHERE the caller can use.
// Centralised so PATCH and DELETE share identical selection rules.
async function resolveTargetWhere(body: { ids?: unknown; filter?: unknown }): Promise<ResolveResult> {
  if (Array.isArray(body.ids)) {
    const ids = body.ids.filter((x): x is string => typeof x === "string" && x.length > 0);
    if (ids.length === 0) return { empty: true };
    return { empty: false, where: inArray(questionBank.id, ids) };
  }
  if (body.filter && typeof body.filter === "object") {
    const w = buildWhere(body.filter as Filter);
    if (!w) {
      return { error: NextResponse.json({ error: "Refusing to act on the entire bank without an explicit filter" }, { status: 400 }) };
    }
    return { empty: false, where: w };
  }
  return { error: NextResponse.json({ error: "Provide `ids` or `filter`" }, { status: 400 }) };
}

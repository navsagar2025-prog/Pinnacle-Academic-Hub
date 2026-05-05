import { NextRequest, NextResponse } from "next/server";
import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@/lib/db";
import { questionBank } from "@workspace/db/schema";
import { and, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
import { logQbAuditBulk } from "@/lib/server/question-bank-deletion";

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

async function requireAdmin() {
  const user = await getDbUser();
  if (!user) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (user.role !== "admin") {
    return { error: NextResponse.json({ error: "Admins only — teachers must request deletion" }, { status: 403 }) };
  }
  return { user };
}

// POST = expand a filter into the full id list (powers "select all matching
// filter"). Skips soft-deleted rows.
export async function POST(req: NextRequest) {
  const auth = await requireAdminOrTeacher();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || body.action !== "list-ids") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }
  const filterWhere = buildWhere(body.filter as Filter | undefined);
  const where = filterWhere
    ? and(filterWhere, isNull(questionBank.deletedAt))
    : isNull(questionBank.deletedAt);
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

  const updated = await db.update(questionBank).set(updates)
    .where(and(where.where, isNull(questionBank.deletedAt)))
    .returning({ id: questionBank.id });
  return NextResponse.json({ success: true, updated: updated.length });
}

// DELETE = ADMIN-ONLY soft-delete (move to bin). Hard delete is impossible
// from the UI — only the daily purge cron removes data permanently.
//
// `ackNoTeacherRequest=true` in the body acknowledges the warning when the
// admin deletes questions that nobody flagged. The default-false behaviour
// returns 409 with which ids are unflagged so the UI can show the warning.
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const where = await resolveTargetWhere(body);
  if ("error" in where) return where.error;
  if (where.empty) return NextResponse.json({ success: true, deleted: 0 });

  const baseWhere = and(where.where, isNull(questionBank.deletedAt));
  const targets = await db.select({
    id: questionBank.id,
    deletionRequestedAt: questionBank.deletionRequestedAt,
    deletionRequestedBy: questionBank.deletionRequestedBy,
    deletionReason: questionBank.deletionReason,
  }).from(questionBank).where(baseWhere);

  if (targets.length === 0) return NextResponse.json({ success: true, deleted: 0 });

  const unflagged = targets.filter((t) => !t.deletionRequestedAt);
  if (unflagged.length > 0 && !body.ackNoTeacherRequest) {
    return NextResponse.json({
      error: "no_teacher_request",
      message: `${unflagged.length} of ${targets.length} questions have no teacher deletion request.`,
      unflaggedCount: unflagged.length,
      totalCount: targets.length,
    }, { status: 409 });
  }

  const now = new Date();
  const ids = targets.map((t) => t.id);
  await db.update(questionBank)
    .set({ deletedAt: now, updatedAt: now })
    .where(inArray(questionBank.id, ids));

  await logQbAuditBulk({
    actorId: auth.user.id,
    actorName: auth.user.name,
    action: "qb.delete.bulk_approved",
    ids,
    details: { withTeacherRequest: targets.length - unflagged.length, withoutTeacherRequest: unflagged.length },
  });

  return NextResponse.json({ success: true, deleted: ids.length });
}

type ResolveResult =
  | { error: NextResponse }
  | { empty: true; where?: undefined }
  | { empty: false; where: SQL };

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

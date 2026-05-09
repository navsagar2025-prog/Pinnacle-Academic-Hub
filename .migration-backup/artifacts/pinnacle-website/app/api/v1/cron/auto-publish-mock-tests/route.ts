import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mockTests } from "@workspace/db/schema";
import { and, eq, isNotNull, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RunSummary {
  scanned: number;
  published: number;
  ids: string[];
  errors: string[];
}

async function runAutoPublish(): Promise<RunSummary> {
  const summary: RunSummary = { scanned: 0, published: 0, ids: [], errors: [] };
  const now = new Date();

  try {
    const updated = await db
      .update(mockTests)
      .set({ isPublished: true, updatedAt: now })
      .where(
        and(
          eq(mockTests.autoPublishAtStart, true),
          eq(mockTests.isPublished, false),
          isNotNull(mockTests.scheduledStart),
          lte(mockTests.scheduledStart, now),
        ),
      )
      .returning({ id: mockTests.id, title: mockTests.title });

    summary.scanned = updated.length;
    summary.published = updated.length;
    summary.ids = updated.map((u) => u.id);
    if (updated.length > 0) {
      console.info(
        `[auto-publish-mock-tests] published ${updated.length} test(s): ${updated
          .map((u) => `${u.id}(${u.title})`)
          .join(", ")}`,
      );
    }
  } catch (e) {
    summary.errors.push(e instanceof Error ? e.message : String(e));
  }

  return summary;
}

function authorize(req: Request): { ok: true } | { ok: false; status: number; message: string } {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, status: 503, message: "CRON_SECRET not configured" };
    }
    return { ok: true };
  }
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const xCron = req.headers.get("x-cron-secret");
  if (bearer === expected || xCron === expected) return { ok: true };
  return { ok: false, status: 401, message: "Unauthorized" };
}

async function handle(req: Request): Promise<Response> {
  const auth = authorize(req);
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
  try {
    const result = await runAutoPublish();
    return NextResponse.json({ success: true, ranAt: new Date().toISOString(), ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[auto-publish-mock-tests] fatal:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}

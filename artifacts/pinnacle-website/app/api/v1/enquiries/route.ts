import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";
import { paginatedOk, created, err } from "@/lib/server/api-response";
import { sendEnquiryAcknowledgement, sendAdminEnquiryAlert } from "@/lib/server/email";
import { rateLimit, extractIp } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return err("Unauthorized", 401);
  if (dbUser.role !== "admin") return err("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const offset = (page - 1) * limit;

  try {
    const rows = await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(enquiries);
    return paginatedOk(rows, count, page, limit);
  } catch (e) {
    console.error("GET /api/v1/enquiries error:", e);
    return err("Failed to fetch enquiries");
  }
}

export async function POST(request: Request) {
  // Rate-limit: 5 submissions per IP per 5 minutes (default; tunable via
  // site_settings key "security_rate_limits" → "api.enquiry.submit").
  const ip = extractIp(request);
  const { allowed } = await rateLimit(
    `ip:${ip}`,
    "api.enquiry.submit",
    5,
    5 * 60_000,
    { ip },
  );
  if (!allowed) return err("Too many enquiries submitted. Please wait a few minutes.", 429);

  try {
    const body = await request.json();
    const { name, phone, email, courseInterest, message, source } = body;
    if (!name || !phone) return err("name and phone are required", 400);

    const [row] = await db
      .insert(enquiries)
      .values({ name, phone, email, courseInterest, message, source: source ?? "website" })
      .returning();

    Promise.allSettled([
      email
        ? sendEnquiryAcknowledgement({ to: email, name, courseInterest })
        : Promise.resolve({ ok: true } as import("@/lib/server/email").SendResult),
      sendAdminEnquiryAlert({ name, phone, email, courseInterest, message }),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[email] enquiry email ${i} rejected:`, r.reason);
        } else if (!r.value.ok) {
          console.warn(`[email] enquiry email ${i} failed:`, r.value.error);
        }
      });
    });

    return created(row);
  } catch (e) {
    console.error("POST /api/v1/enquiries error:", e);
    return err("Failed to submit enquiry");
  }
}

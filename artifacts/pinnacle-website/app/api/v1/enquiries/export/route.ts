import { getDbUser } from "@/lib/server/portal-auth";
import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";
import { and, desc, gte, lte, eq } from "drizzle-orm";

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(vals: unknown[]): string {
  return vals.map(escapeCsv).join(",");
}

export async function GET(request: Request) {
  const dbUser = await getDbUser();
  if (!dbUser) return new Response("Unauthorized", { status: 401 });
  if (dbUser.role !== "admin") return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const conditions = [];
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); conditions.push(gte(enquiries.createdAt, d)); }
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); conditions.push(lte(enquiries.createdAt, d)); }
  }
  if (status === "pending") conditions.push(eq(enquiries.isFollowedUp, false));
  if (status === "done") conditions.push(eq(enquiries.isFollowedUp, true));

  const rows = await db
    .select()
    .from(enquiries)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(enquiries.createdAt));

  const headers = ["ID", "Name", "Phone", "Email", "Course Interest", "Message", "Source", "Status", "Pipeline Stage", "Notes", "Date"];
  const lines = [
    headers.join(","),
    ...rows.map((e) =>
      row([
        e.id,
        e.name,
        e.phone,
        e.email ?? "",
        e.courseInterest ?? "",
        e.message ?? "",
        e.source ?? "",
        e.isFollowedUp ? "Followed Up" : "Pending",
        e.admissionStatus ?? "",
        e.notes ?? "",
        e.createdAt.toISOString().split("T")[0],
      ])
    ),
  ];

  const csv = lines.join("\r\n");
  const filename = `enquiries-${new Date().toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

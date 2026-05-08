import { db } from "@workspace/db";
import { enquiries } from "@workspace/db/schema";
import { and, desc, gte, lte, eq, or, ilike, sql, SQL } from "drizzle-orm";
import EnquiriesClient from "./EnquiriesClient";

export const metadata = { title: "Enquiries — Admin Panel" };

interface PageProps {
  searchParams: Promise<{ keyword?: string; status?: string; from?: string; to?: string }>;
}

export default async function AdminEnquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const keyword = (params.keyword ?? "").trim();
  const status = params.status ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  const conditions: SQL[] = [];

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
  if (keyword) {
    const pattern = `%${keyword}%`;
    conditions.push(
      or(
        ilike(enquiries.name, pattern),
        ilike(enquiries.phone, pattern),
        ilike(enquiries.email, pattern),
        ilike(enquiries.courseInterest, pattern),
        ilike(enquiries.message, pattern),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }], [{ pending }]] = await Promise.all([
    db.select().from(enquiries).where(where).orderBy(desc(enquiries.createdAt)),
    db.select({ total: sql<number>`count(*)::int` }).from(enquiries),
    db.select({ pending: sql<number>`count(*)::int` }).from(enquiries).where(eq(enquiries.isFollowedUp, false)),
  ]);

  return (
    <EnquiriesClient
      rows={rows}
      total={total}
      pending={pending}
      initialKeyword={keyword}
      initialStatus={status}
      initialFrom={from}
      initialTo={to}
    />
  );
}

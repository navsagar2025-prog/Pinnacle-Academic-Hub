// GET /api/v1/downloads/{receipt|study_material|assignment|practice_paper|question_bank}/[id]
import { NextRequest } from "next/server";
import { db } from "@workspace/db";
import {
  feeRecords,
  students,
  users,
  batches,
  courses,
  studyMaterials,
  assignments,
  practicePapers,
  parents,
} from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { getDbUser } from "@/lib/server/portal-auth";
import { downloadObjectBytes } from "@/lib/server/object-storage";
import { getContactSettings } from "@/lib/server/site-settings";
import { logAudit } from "@/lib/server/audit";
import {
  WATERMARK_DOC_TYPES,
  type WatermarkDocType,
  buildWatermarkContext,
  withWatermark,
} from "@/lib/server/watermark";
import { buildReceiptPdf } from "@/lib/server/receipt-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDocType(s: string): s is WatermarkDocType {
  return (WATERMARK_DOC_TYPES as readonly string[]).includes(s);
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "";
}

function notFound() {
  return new Response("Not found", { status: 404 });
}
function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}
function forbidden() {
  return new Response("Forbidden", { status: 403 });
}

function objectPathFromFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  const idx = fileUrl.indexOf("/objects/");
  return idx < 0 ? null : fileUrl.slice(idx);
}

function attachmentHeaders(filename: string, size: number) {
  const safe = filename.replace(/[^\w.\-]+/g, "_");
  return {
    "Content-Type": "application/pdf",
    "Content-Length": String(size),
    "Content-Disposition": `attachment; filename="${safe}"`,
    "Cache-Control": "private, no-store, must-revalidate",
  } as Record<string, string>;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ docType: string; id: string }> },
) {
  const { docType: docTypeRaw, id } = await context.params;
  if (!isDocType(docTypeRaw)) return notFound();
  const docType = docTypeRaw;

  const user = await getDbUser();
  if (!user) return unauthorized();

  let bytes: Uint8Array | Buffer | null = null;
  let filename = `${docType}-${id}.pdf`;
  let resourceMeta: Record<string, unknown> = {};

  if (docType === "receipt") {
    const [fee] = await db.select().from(feeRecords).where(eq(feeRecords.id, id)).limit(1);
    if (!fee) return notFound();
    if (fee.status !== "paid") return notFound();

    const [studentRow] = await db
      .select({
        studentId: students.id,
        userId: students.userId,
        rollNumber: students.rollNumber,
        guardianName: students.guardianName,
        batchId: students.batchId,
      })
      .from(students)
      .where(eq(students.id, fee.studentId!))
      .limit(1);
    if (!studentRow) return notFound();

    // Authorisation: the student themselves, a parent specifically linked to
    // this student row, teachers, and admins. Plain `role === "parent"` is
    // not enough — we must verify the link in the `parents` table so a
    // parent cannot brute-force receipt UUIDs for other students.
    const isOwner = studentRow.userId === user.id;
    const isStaff = user.role === "admin" || user.role === "teacher";
    let isLinkedParent = false;
    if (!isOwner && !isStaff && user.role === "parent") {
      const [link] = await db
        .select({ id: parents.id })
        .from(parents)
        .where(and(eq(parents.userId, user.id), eq(parents.studentId, studentRow.studentId)))
        .limit(1);
      isLinkedParent = Boolean(link);
    }
    if (!isOwner && !isStaff && !isLinkedParent) return forbidden();

    const [targetUser] = await db.select().from(users).where(eq(users.id, studentRow.userId!)).limit(1);
    const batchInfo = studentRow.batchId
      ? await db
          .select({ batchName: batches.name, courseName: courses.title })
          .from(batches)
          .leftJoin(courses, eq(batches.courseId, courses.id))
          .where(eq(batches.id, studentRow.batchId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null;

    const contact = await getContactSettings();
    const receiptNo = `PAC-${fee.id.slice(0, 8).toUpperCase()}`;
    const paidOn = fee.paidDate
      ? new Date(fee.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "—";
    const paymentMethod = fee.razorpayPaymentId
      ? "Online (Razorpay)"
      : fee.paymentMethod ?? (fee.transactionRef ? "Manual Transfer" : "Cash");

    bytes = await buildReceiptPdf({
      centreName: "Pinnacle Academic Classes",
      centreAddress: contact.address_line1 || "Greater Noida",
      centreEmail: contact.contact_email,
      centrePhone: contact.contact_phone,
      receiptNo,
      studentName: targetUser?.name ?? "Student",
      rollNumber: studentRow.rollNumber,
      guardianName: studentRow.guardianName,
      studentPhone: targetUser?.phone ?? null,
      batchLabel: batchInfo ? `${batchInfo.courseName ?? ""} · ${batchInfo.batchName}`.trim() : null,
      period: fee.period,
      paidOn,
      paymentMethod,
      paymentId: fee.razorpayPaymentId,
      orderId: fee.razorpayOrderId,
      amountPaid: fee.paidAmount,
      amountTotal: fee.amount,
      notes: fee.notes,
    });
    filename = `Receipt-${receiptNo}.pdf`;
    resourceMeta = { feeId: fee.id, studentId: studentRow.studentId, period: fee.period };
  } else if (docType === "study_material") {
    const [m] = await db.select().from(studyMaterials).where(eq(studyMaterials.id, id)).limit(1);
    if (!m || !m.isVisible) return notFound();
    const objectPath = objectPathFromFileUrl(m.fileUrl);
    if (!objectPath) return notFound();

    const isStaff = user.role === "admin" || user.role === "teacher";
    if (!isStaff) {
      // Students must belong to the material's batch.
      if (user.role !== "student") return forbidden();
      const [enrollment] = await db
        .select({ batchId: students.batchId })
        .from(students)
        .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
        .limit(1);
      if (!enrollment || enrollment.batchId !== m.batchId) return forbidden();
    }

    const downloaded = await downloadObjectBytes(objectPath);
    bytes = downloaded.bytes;
    filename = `${(m.title ?? "material").replace(/\s+/g, "_")}.pdf`;
    resourceMeta = { materialId: m.id, batchId: m.batchId, fileObjectPath: objectPath };
  } else if (docType === "assignment") {
    const [a] = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
    if (!a || !a.isVisible) return notFound();
    const objectPath = objectPathFromFileUrl(a.fileUrl);
    if (!objectPath) return notFound();

    const isStaff = user.role === "admin" || user.role === "teacher";
    if (!isStaff) {
      if (user.role !== "student") return forbidden();
      const [enrollment] = await db
        .select({ batchId: students.batchId })
        .from(students)
        .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
        .limit(1);
      if (!enrollment || enrollment.batchId !== a.batchId) return forbidden();
    }

    const downloaded = await downloadObjectBytes(objectPath);
    bytes = downloaded.bytes;
    filename = `${(a.title ?? "assignment").replace(/\s+/g, "_")}.pdf`;
    resourceMeta = { assignmentId: a.id, batchId: a.batchId, fileObjectPath: objectPath };
  } else if (docType === "practice_paper") {
    const [p] = await db.select().from(practicePapers).where(eq(practicePapers.id, id)).limit(1);
    if (!p || !p.isVisible) return notFound();
    const objectPath = objectPathFromFileUrl(p.fileUrl);
    if (!objectPath) return notFound();

    const isStaff = user.role === "admin" || user.role === "teacher";
    if (!isStaff) {
      if (user.role !== "student") return forbidden();
      const [enrollment] = await db
        .select({ batchId: students.batchId })
        .from(students)
        .where(and(eq(students.userId, user.id), eq(students.isActive, true)))
        .limit(1);
      if (!enrollment || enrollment.batchId !== p.batchId) return forbidden();
    }

    const downloaded = await downloadObjectBytes(objectPath);
    bytes = downloaded.bytes;
    filename = `${(p.title ?? "paper").replace(/\s+/g, "_")}.pdf`;
    resourceMeta = { paperId: p.id, batchId: p.batchId, fileObjectPath: objectPath };
  } else if (docType === "question_bank") {
    // Question-bank exports are built and stored under /objects/private/exports
    // by the export generator; the proxy just streams them with watermark. To
    // keep this route isolated from the (separate) export builder, treat `id`
    // as the object path tail (admin-only, since exports are privileged).
    if (user.role !== "admin") return forbidden();
    const objectPath = `/objects/private/exports/${id}.pdf`;
    try {
      const downloaded = await downloadObjectBytes(objectPath);
      bytes = downloaded.bytes;
      filename = `question-bank-${id}.pdf`;
      resourceMeta = { exportId: id, fileObjectPath: objectPath };
    } catch {
      return notFound();
    }
  }

  if (!bytes) return notFound();

  const contact = await getContactSettings();
  const ip = clientIp(req);
  const ctx = buildWatermarkContext({
    userName: user.name,
    userPhone: user.phone,
    userEmail: user.email,
    ipAddress: ip,
    centreName: "Pinnacle Academic Classes",
    centreEmail: contact.contact_email,
  } as Parameters<typeof buildWatermarkContext>[0]);

  const { bytes: stamped, configHash } = await withWatermark(bytes, ctx, docType);

  // The "snapshot id" combines docType and the resolved config hash so each
  // audit entry pinpoints the exact watermark policy that was applied at the
  // moment of download. Useful when investigating leaks.
  const watermarkSnapshotId = `${docType}:${configHash}`;

  // Best-effort audit. Failures must not block the download but must be
  // surfaced in server logs so we notice silent gaps.
  try {
    await logAudit(user.id, user.name, "download.pdf", docType, id, {
      ...resourceMeta,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? "",
      watermarkConfigHash: configHash,
      watermarkSnapshotId,
      bytes: stamped.byteLength,
    });
  } catch (err) {
    console.error("[downloads] audit log failed", { docType, id, err });
  }

  return new Response(stamped as BodyInit, { headers: attachmentHeaders(filename, stamped.byteLength) });
}

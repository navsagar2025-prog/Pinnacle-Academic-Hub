// Admin-only on-demand question-bank export. Builds a PDF in memory, stamps
// it via the shared watermark pipeline, audits the download, and streams it.
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@workspace/db";
import { questionBank } from "@workspace/db/schema";
import { requirePortalRole } from "@/lib/server/portal-auth";
import { notDeleted } from "@/lib/server/question-bank-deletion";
import { logAudit } from "@/lib/server/audit";
import { withWatermark, buildWatermarkContext } from "@/lib/server/watermark";

export const runtime = "nodejs";

const MAX_ROWS = 200;

export async function GET(req: NextRequest) {
  const adminUser = await requirePortalRole("admin");
  const exportId = randomUUID();

  const sp = req.nextUrl.searchParams;
  const conds: SQL[] = [notDeleted];
  if (sp.get("subject") && sp.get("subject") !== "All") conds.push(eq(questionBank.subject, sp.get("subject")!));
  if (sp.get("topic")) conds.push(eq(questionBank.topic, sp.get("topic")!));
  if (sp.get("difficulty")) conds.push(eq(questionBank.difficulty, sp.get("difficulty") as "easy" | "medium" | "hard"));
  if (sp.get("type")) conds.push(eq(questionBank.questionType, sp.get("type") as "mcq" | "short" | "long" | "numerical"));
  if (sp.get("year")) conds.push(eq(questionBank.year, Number(sp.get("year"))));
  if (sp.get("examName")) conds.push(eq(questionBank.examName, sp.get("examName")!));
  if (sp.get("classGrade")) conds.push(eq(questionBank.classGrade, sp.get("classGrade")!));
  if (sp.get("source")) conds.push(eq(questionBank.source, sp.get("source")!));
  const search = (sp.get("q") ?? "").trim();
  if (search) {
    conds.push(sql`search_vector @@ plainto_tsquery('english', ${search})`);
  }

  const rows = await db
    .select({
      id: questionBank.id,
      subject: questionBank.subject,
      topic: questionBank.topic,
      classGrade: questionBank.classGrade,
      difficulty: questionBank.difficulty,
      questionType: questionBank.questionType,
      questionText: questionBank.questionText,
      options: questionBank.options,
      correctAnswer: questionBank.correctAnswer,
      year: questionBank.year,
      examName: questionBank.examName,
      marks: questionBank.marks,
    })
    .from(questionBank)
    .where(and(...conds))
    .orderBy(
      ...(search
        ? [sql`ts_rank(search_vector, plainto_tsquery('english', ${search})) DESC`, desc(questionBank.createdAt)]
        : [asc(questionBank.subject), asc(questionBank.topic), desc(questionBank.createdAt)]),
    )
    .limit(MAX_ROWS);

  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "No questions match those filters" }, { status: 404 });
  }

  // Build the PDF in memory. We keep the layout intentionally simple — one
  // question per block with its options inline — because the admin export is
  // a working document, not a designed handout.
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 48;
  const LINE = 14;
  const text = rgb(0.05, 0.05, 0.1);
  const muted = rgb(0.4, 0.4, 0.45);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let cursor = PAGE_H - MARGIN;

  function newPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    cursor = PAGE_H - MARGIN;
  }

  function drawWrapped(s: string, f = font, size = 10, color = text) {
    // Naïve wrap by character width; good enough for an export sheet.
    const maxW = PAGE_W - MARGIN * 2;
    const words = s.split(/\s+/);
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > maxW) {
        if (cursor < MARGIN + LINE) newPage();
        page.drawText(line, { x: MARGIN, y: cursor, size, font: f, color });
        cursor -= LINE;
        line = w;
      } else {
        line = next;
      }
    }
    if (line) {
      if (cursor < MARGIN + LINE) newPage();
      page.drawText(line, { x: MARGIN, y: cursor, size, font: f, color });
      cursor -= LINE;
    }
  }

  // Title.
  page.drawText("Question Bank Export", { x: MARGIN, y: cursor, size: 18, font: bold, color: text });
  cursor -= LINE * 1.5;
  page.drawText(
    `${rows.length} question${rows.length === 1 ? "" : "s"} · generated ${new Date().toLocaleString("en-IN")}`,
    { x: MARGIN, y: cursor, size: 9, font, color: muted },
  );
  cursor -= LINE * 1.6;

  rows.forEach((r, i) => {
    if (cursor < MARGIN + LINE * 4) newPage();
    const meta = [r.subject, r.topic, r.classGrade, r.year ? `Y${r.year}` : null, r.examName, `${r.marks}m`]
      .filter(Boolean)
      .join(" · ");
    drawWrapped(`Q${i + 1}. (${meta})`, bold, 9, muted);
    drawWrapped(r.questionText.replace(/\s+/g, " ").trim(), font, 10);
    if (r.questionType === "mcq" && r.options && Array.isArray(r.options)) {
      (r.options as unknown[]).forEach((opt, idx) => {
        const label = String.fromCharCode(65 + idx);
        drawWrapped(`(${label}) ${typeof opt === "string" ? opt : JSON.stringify(opt)}`, font, 10);
      });
    }
    drawWrapped(`Answer: ${r.correctAnswer}`, bold, 9, text);
    cursor -= LINE * 0.8;
  });

  const rawBytes = Buffer.from(await pdf.save());

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const wmCtx = buildWatermarkContext({
    userName: adminUser.name ?? null,
    userPhone: adminUser.phone ?? null,
    userEmail: adminUser.email ?? null,
    ipAddress: ip,
    centreName: null,
  });
  const { bytes: stamped, configHash: snapshotHash } = await withWatermark(
    rawBytes,
    wmCtx,
    "question_bank",
  );

  await logAudit(
    adminUser.id,
    adminUser.name ?? null,
    "download.pdf",
    "question_bank_export",
    exportId,
    {
      docType: "question_bank",
      rowCount: rows.length,
      filters: Object.fromEntries(sp.entries()),
      watermarkSnapshotId: `question_bank:${snapshotHash}`,
      ip,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  );

  return new NextResponse(Buffer.from(stamped), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="question-bank-export.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

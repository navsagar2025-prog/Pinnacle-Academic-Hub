/**
 * Server-side fee-receipt PDF builder. Used by the watermarked download
 * proxy at /api/v1/downloads/receipt/[id]. Replaces the previous browser
 * print flow so every receipt download passes through pdf-lib stamping.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface ReceiptInput {
  centreName: string;
  centreAddress: string;
  centreEmail: string;
  centrePhone: string;
  receiptNo: string;
  studentName: string;
  rollNumber: string | null;
  guardianName: string | null;
  studentPhone: string | null;
  batchLabel: string | null;
  period: string;
  paidOn: string;
  paymentMethod: string;
  paymentId: string | null;
  orderId: string | null;
  amountPaid: number;
  amountTotal: number;
  notes: string | null;
}

const NAVY = rgb(0.05, 0.18, 0.35);
const SLATE = rgb(0.4, 0.45, 0.55);
const TEAL = rgb(0.0, 0.55, 0.55);
const LIGHT = rgb(0.9, 0.92, 0.95);

function drawText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = NAVY) {
  page.drawText(text, { x, y, font, size, color });
}

export async function buildReceiptPdf(input: ReceiptInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait, points
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 800;

  // Header band
  page.drawRectangle({ x: 0, y: 760, width: 595.28, height: 80, color: rgb(0.97, 0.98, 0.99) });
  drawText(page, input.centreName, margin, 800, bold, 20, NAVY);
  drawText(page, input.centreAddress, margin, 782, helv, 9, SLATE);
  drawText(page, `${input.centreEmail}  ·  ${input.centrePhone}`, margin, 770, helv, 9, SLATE);

  // Paid badge
  page.drawRectangle({ x: 460, y: 795, width: 90, height: 22, color: rgb(0.86, 0.96, 0.93), borderColor: TEAL, borderWidth: 0.5 });
  drawText(page, "PAID", 488, 802, bold, 11, TEAL);

  drawText(page, "Receipt No.", 460, 778, helv, 8, SLATE);
  drawText(page, input.receiptNo, 460, 766, bold, 11, NAVY);

  y = 720;
  // Title strip
  drawText(page, "Payment Receipt", margin, y, bold, 22, NAVY);
  y -= 30;

  // Two columns: Student | Payment
  drawText(page, "STUDENT DETAILS", margin, y, bold, 9, SLATE);
  drawText(page, "PAYMENT DETAILS", 320, y, bold, 9, SLATE);
  y -= 16;

  const lh = 14;
  const drawRow = (label: string, value: string, leftX: number, yy: number) => {
    drawText(page, label, leftX, yy, helv, 9, SLATE);
    drawText(page, value, leftX, yy - 11, bold, 10, NAVY);
  };

  let leftY = y;
  drawRow("Name", input.studentName, margin, leftY); leftY -= 26;
  if (input.rollNumber) { drawRow("Roll No.", input.rollNumber, margin, leftY); leftY -= 26; }
  if (input.batchLabel) { drawRow("Batch", input.batchLabel, margin, leftY); leftY -= 26; }
  if (input.guardianName) { drawRow("Guardian", input.guardianName, margin, leftY); leftY -= 26; }
  if (input.studentPhone) { drawRow("Phone", input.studentPhone, margin, leftY); leftY -= 26; }

  let rightY = y;
  drawRow("Period", input.period, 320, rightY); rightY -= 26;
  drawRow("Date", input.paidOn, 320, rightY); rightY -= 26;
  drawRow("Method", input.paymentMethod, 320, rightY); rightY -= 26;
  if (input.paymentId) { drawRow("Payment ID", input.paymentId, 320, rightY); rightY -= 26; }
  if (input.orderId) { drawRow("Order ID", input.orderId, 320, rightY); rightY -= 26; }

  y = Math.min(leftY, rightY) - 12;

  // Amount panel
  page.drawRectangle({ x: margin, y: y - 70, width: 595.28 - margin * 2, height: 70, color: LIGHT });
  drawText(page, "AMOUNT PAID", margin + 16, y - 18, bold, 9, SLATE);
  drawText(page, `INR ${input.amountPaid.toLocaleString("en-IN")}`, margin + 16, y - 50, bold, 24, NAVY);
  if (input.amountPaid !== input.amountTotal) {
    drawText(page, `of INR ${input.amountTotal.toLocaleString("en-IN")} total`, margin + 16, y - lh * 4 - 4, helv, 9, SLATE);
  }
  drawText(page, "Status", 460, y - 18, helv, 8, SLATE);
  drawText(page, "SETTLED", 460, y - 36, bold, 12, TEAL);

  y -= 90;

  if (input.notes) {
    drawText(page, "Notes", margin, y, bold, 9, SLATE);
    y -= 14;
    drawText(page, input.notes, margin, y, helv, 9, NAVY);
    y -= 20;
  }

  // Footer
  drawText(
    page,
    "This is a computer-generated receipt and does not require a physical signature.",
    margin,
    60,
    helv,
    8,
    SLATE,
  );
  drawText(page, `${input.centreName} · ${input.centreAddress}`, margin, 48, helv, 8, SLATE);

  return await pdf.save();
}

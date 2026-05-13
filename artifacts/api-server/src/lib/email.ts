const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Pinnacle Academic Classes <noreply@pinnacle.edu.in>";

export function emailAvailable(): boolean {
  return !!(RESEND_API_KEY || SENDGRID_API_KEY);
}

interface SendOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendViaResend(opts: SendOptions): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

async function sendViaSendGrid(opts: SendOptions): Promise<void> {
  const sgMail = await import("@sendgrid/mail");
  sgMail.default.setApiKey(SENDGRID_API_KEY!);
  await sgMail.default.send({ from: EMAIL_FROM, to: opts.to, subject: opts.subject, html: opts.html });
}

export async function sendEmail(opts: SendOptions): Promise<void> {
  if (RESEND_API_KEY) {
    return sendViaResend(opts);
  }
  if (SENDGRID_API_KEY) {
    return sendViaSendGrid(opts);
  }
  throw new Error("No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY.");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = {
  navy: "#0A1F5C",
  teal: "#0D7377",
  gold: "#C9A84C",
};

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pinnacle Academic Classes</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND.navy};padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
              Pinnacle Academic Classes
            </h1>
            <p style="margin:6px 0 0;color:${BRAND.gold};font-size:13px;letter-spacing:1px;text-transform:uppercase;">
              Excellence in Education
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f6fb;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf4;">
            <p style="margin:0;color:#8892a4;font-size:12px;">
              &copy; ${new Date().getFullYear()} Pinnacle Academic Classes. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildFeeReceiptHtml(opts: {
  feeRecordId: string;
  studentName: string;
  period: string;
  amount: number;
  paidAmount: number;
  paidDate: string | null;
  dueDate: string | null;
  paymentMethod: string | null;
  transactionRef: string | null;
  notes: string | null;
  status: string;
  centreName?: string;
}): string {
  const safe = escapeHtml;
  const fmtINR = (n: number) => "&#x20B9;" + n.toLocaleString("en-IN");
  const centre = opts.centreName ?? "Pinnacle Academic Classes";
  const ref = opts.transactionRef ?? opts.feeRecordId.slice(0, 12).toUpperCase();
  const statusLabel: Record<string, string> = {
    paid: "Paid", partial: "Partially Paid", due: "Due", overdue: "Overdue", waived: "Waived",
  };
  const safeStatus = ["paid", "partial", "due", "overdue", "waived"].includes(opts.status) ? opts.status : "due";
  const statusColor: Record<string, string> = {
    paid: "#166534", partial: "#854d0e", due: "#991b1b", overdue: "#7f1d1d", waived: "#475569",
  };
  const statusBg: Record<string, string> = {
    paid: "#dcfce7", partial: "#fef9c3", due: "#fee2e2", overdue: "#fecaca", waived: "#f1f5f9",
  };
  // Returns a self-contained table fragment (no html/head/body wrappers) so it
  // can be safely embedded inside any email template without nesting documents.
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:16px 0;">
    <!-- Receipt header -->
    <tr>
      <td style="background:${BRAND.navy};padding:22px 28px;text-align:center;">
        <p style="margin:0;color:#ffffff;font-size:17px;font-weight:800;">${safe(centre)}</p>
        <p style="margin:5px 0 8px;color:rgba(255,255,255,0.7);font-size:11px;">Fee Payment Receipt</p>
        <span style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:20px;padding:2px 12px;font-size:11px;color:#ffffff;">Ref: ${safe(ref)}</span>
      </td>
    </tr>
    <!-- Student Details -->
    <tr>
      <td style="padding:20px 28px 0;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Student Details</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;width:50%;font-size:11px;color:#94a3b8;">Name</td>
            <td style="padding:4px 0;width:50%;font-size:11px;color:#94a3b8;">Period</td>
          </tr>
          <tr>
            <td style="padding:0 0 8px;font-size:13px;font-weight:600;color:#1e293b;">${safe(opts.studentName)}</td>
            <td style="padding:0 0 8px;font-size:13px;font-weight:600;color:#1e293b;">${safe(opts.period)}</td>
          </tr>
          ${opts.paidDate ? `<tr><td style="padding:4px 0;font-size:11px;color:#94a3b8;">Payment Date</td><td style="padding:4px 0;font-size:11px;color:#94a3b8;">${opts.paymentMethod ? "Payment Mode" : "&nbsp;"}</td></tr><tr><td style="padding:0 0 8px;font-size:13px;font-weight:600;color:#1e293b;">${safe(opts.paidDate)}</td><td style="padding:0 0 8px;font-size:13px;font-weight:600;color:#1e293b;">${opts.paymentMethod ? safe(opts.paymentMethod) : ""}</td></tr>` : ""}
          <tr>
            <td colspan="2" style="padding:4px 0;font-size:11px;color:#94a3b8;">Status</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0 0 8px;">
              <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${statusBg[safeStatus] ?? "#f1f5f9"};color:${statusColor[safeStatus] ?? "#475569"};">${safe(statusLabel[opts.status] ?? opts.status)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Divider -->
    <tr><td style="padding:0 28px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:4px 0 12px;" /></td></tr>
    <!-- Amount Details -->
    <tr>
      <td style="padding:0 28px 20px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;">Amount Details</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
          <tr>
            <td style="padding:8px 14px;font-size:12px;color:#64748b;">Total Fee</td>
            <td style="padding:8px 14px;font-size:12px;color:#1e293b;font-weight:600;text-align:right;">${fmtINR(opts.amount)}</td>
          </tr>
          <tr>
            <td style="padding:8px 14px;font-size:12px;color:#64748b;">Amount Paid</td>
            <td style="padding:8px 14px;font-size:13px;color:#166534;font-weight:700;text-align:right;">${fmtINR(opts.paidAmount)}</td>
          </tr>
          ${opts.paidAmount < opts.amount ? `<tr><td style="padding:8px 14px;font-size:12px;color:#64748b;">Balance Due</td><td style="padding:8px 14px;font-size:12px;color:#dc2626;font-weight:600;text-align:right;">${fmtINR(opts.amount - opts.paidAmount)}</td></tr>` : ""}
          <tr><td colspan="2" style="border-top:1px dashed #cbd5e1;padding:0;"></td></tr>
          <tr>
            <td style="padding:10px 14px;font-size:14px;color:#0A1F5C;font-weight:700;">Net Amount Paid</td>
            <td style="padding:10px 14px;font-size:14px;color:#0A1F5C;font-weight:700;text-align:right;">${fmtINR(opts.paidAmount)}</td>
          </tr>
        </table>
        ${opts.notes ? `<p style="margin:10px 0 0;font-size:11px;color:#64748b;line-height:1.5;">Note: ${safe(opts.notes)}</p>` : ""}
      </td>
    </tr>
    <!-- Receipt footer note -->
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 28px;text-align:center;">
        <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.5;">${safe(centre)} &bull; Computer-generated receipt. No signature required.</p>
      </td>
    </tr>
  </table>`;
}

export function buildFeePaymentConfirmationEmail(opts: {
  recipientName: string;
  studentName: string;
  feeRecordId: string;
  period: string;
  amount: number;
  paidAmount: number;
  paidDate: string | null;
  dueDate: string | null;
  paymentMethod: string | null;
  transactionRef: string | null;
  notes: string | null;
  status: string;
  portalUrl: string;
  centreName?: string;
}): { subject: string; html: string } {
  const safe = escapeHtml;
  const subject = `Fee Payment Receipt — ${opts.period}`;
  // buildFeeReceiptHtml returns a table fragment — embed it inside baseTemplate.
  const receiptFragment = buildFeeReceiptHtml({
    feeRecordId: opts.feeRecordId,
    studentName: opts.studentName,
    period: opts.period,
    amount: opts.amount,
    paidAmount: opts.paidAmount,
    paidDate: opts.paidDate,
    dueDate: opts.dueDate,
    paymentMethod: opts.paymentMethod,
    transactionRef: opts.transactionRef,
    notes: opts.notes,
    status: opts.status,
    centreName: opts.centreName,
  });
  const html = baseTemplate(`
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Dear <strong>${safe(opts.recipientName)}</strong>,<br/>
      The fee payment receipt for <strong>${safe(opts.studentName)}</strong> is shown below.
    </p>
    ${receiptFragment}
    <div style="margin-top:24px;text-align:center;">
      <a href="${safe(opts.portalUrl)}" style="display:inline-block;background:${BRAND.teal};color:#ffffff;padding:11px 26px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">
        View &amp; Download in Portal &rarr;
      </a>
    </div>
  `);
  return { subject, html };
}

export function buildFeeReminderEmail(opts: {
  recipientName: string;
  studentName: string;
  period: string;
  amountDue: number;
  dueDate: string;
  portalUrl: string;
}): { subject: string; html: string } {
  const safe = escapeHtml;
  const fmtINR = (n: number) => "&#x20B9;" + n.toLocaleString("en-IN");
  const subject = `Fee Due Reminder — ${opts.period} (Due ${opts.dueDate})`;
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">Fee Payment Reminder</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Dear <strong>${safe(opts.recipientName)}</strong>,<br/>
      This is a friendly reminder that a fee payment for <strong>${safe(opts.studentName)}</strong> is due soon.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;width:50%;"><strong>Period</strong></td>
          <td style="padding:6px 0;color:#374151;font-size:14px;">${safe(opts.period)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;"><strong>Amount Due</strong></td>
          <td style="padding:6px 0;color:#c2410c;font-size:15px;font-weight:700;">${fmtINR(opts.amountDue)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#374151;font-size:14px;"><strong>Due Date</strong></td>
          <td style="padding:6px 0;color:#c2410c;font-size:14px;font-weight:600;">${safe(opts.dueDate)}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Please clear the dues before the due date to avoid any inconvenience.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background:${BRAND.gold};border-radius:6px;">
          <a href="${safe(opts.portalUrl)}" style="display:block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
            Pay Now &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
      If you have already made this payment, please disregard this reminder.
      For any queries, contact the Pinnacle office.
    </p>
  `);
  return { subject, html };
}

export function buildApprovalEmail(name: string, portalUrl: string): { subject: string; html: string } {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(portalUrl);
  const subject = "Your Pinnacle Account Has Been Approved";
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">Welcome, ${safeName}!</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      We're pleased to let you know that your registration with <strong>Pinnacle Academic Classes</strong>
      has been reviewed and <span style="color:${BRAND.teal};font-weight:700;">approved</span>.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      You can now log in to your student portal to access your courses, results, notices, and more.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr>
        <td style="background:${BRAND.teal};border-radius:6px;">
          <a href="${safeUrl}" style="display:block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
            Log in to Your Portal &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
      If the button above doesn't work, copy and paste this link into your browser:<br />
      <a href="${safeUrl}" style="color:${BRAND.teal};">${safeUrl}</a>
    </p>
  `);
  return { subject, html };
}

export function buildRejectionEmail(name: string, contactNumber: string): { subject: string; html: string } {
  const safeName = escapeHtml(name);
  const safeContact = escapeHtml(contactNumber);
  const subject = "Update on Your Pinnacle Registration";
  const html = baseTemplate(`
    <h2 style="margin:0 0 16px;color:${BRAND.navy};font-size:20px;">Dear ${safeName},</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Thank you for your interest in <strong>Pinnacle Academic Classes</strong>.
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      After reviewing your registration, we are unable to approve your account at this time.
      We understand this may be disappointing, and we appreciate you taking the time to register.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      If you believe this decision was made in error, or if you have any questions,
      please don't hesitate to reach out to us directly — we're happy to help.
    </p>
    <div style="background:#f4f6fb;border-left:4px solid ${BRAND.gold};border-radius:4px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#374151;font-size:14px;">
        <strong>Contact us:</strong>&nbsp;
        <a href="tel:${safeContact}" style="color:${BRAND.teal};text-decoration:none;font-weight:600;">${safeContact}</a>
      </p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
      We wish you all the best in your academic journey.
    </p>
  `);
  return { subject, html };
}

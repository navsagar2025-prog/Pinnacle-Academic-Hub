import { Resend } from "resend";

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let _resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "Pinnacle Academic Classes <care@paconline.in>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "care@paconline.in";

export interface SendResult {
  ok: boolean;
  error?: string;
}

async function send(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — email skipped:", opts.subject);
    return { ok: false, error: "Email provider not configured" };
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, ...opts });
    if (error) {
      console.error("[email] send error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[email] exception:", msg);
    return { ok: false, error: msg };
  }
}

export async function sendEnquiryAcknowledgement(params: {
  to: string;
  name: string;
  courseInterest?: string;
}): Promise<SendResult> {
  const { to, name, courseInterest } = params;
  return send({
    to,
    subject: "We received your enquiry — Pinnacle Academic Classes",
    html: enquiryAckHtml({ name, courseInterest }),
  });
}

export async function sendAdminEnquiryAlert(params: {
  name: string;
  phone: string;
  email?: string;
  courseInterest?: string;
  message?: string;
}): Promise<SendResult> {
  return send({
    to: ADMIN_EMAIL,
    subject: `New Enquiry: ${params.name} — Pinnacle Academic Classes`,
    html: adminEnquiryHtml(params),
  });
}

export async function sendPaymentConfirmation(params: {
  to: string;
  name: string;
  period: string;
  amount: number;
  paymentId: string;
  orderId?: string;
  paidDate: Date;
  receiptPath: string;
}): Promise<SendResult> {
  return send({
    to: params.to,
    subject: `Payment Confirmed — ${params.period} | Pinnacle Academic Classes`,
    html: paymentConfirmHtml(params),
  });
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pinnacle-website";
const SITE_URL = `https://${process.env.REPLIT_DEV_DOMAIN ?? "pinnacleacademic.in"}${BASE_PATH}`;

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Pinnacle Academic Classes</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0A1F5C;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#C9A84C;font-size:18px;font-weight:700;letter-spacing:0.5px;">PINNACLE</span>
                  <span style="color:#ffffff;font-size:14px;font-weight:500;margin-left:6px;">Academic Classes</span>
                </td>
              </tr>
              <tr><td style="color:#94a3b8;font-size:11px;margin-top:4px;padding-top:4px;">Gaur City 2, Greater Noida · care@paconline.in</td></tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              Pinnacle Academic Classes · KCK Corporate Services Pvt. Ltd.<br/>
              Gaur City 2, Sec. 16C, Greater Noida, UP — 201009<br/>
              <a href="tel:+919971862138" style="color:#0D7377;text-decoration:none;">+91 99718 62138</a>
              &nbsp;·&nbsp;
              <a href="mailto:care@paconline.in" style="color:#0D7377;text-decoration:none;">care@paconline.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function enquiryAckHtml(p: { name: string; courseInterest?: string }): string {
  const name = escHtml(p.name);
  const course = p.courseInterest ? `<p style="margin:16px 0 0;color:#475569;">Programme of interest: <strong style="color:#0A1F5C;">${escHtml(p.courseInterest)}</strong></p>` : "";
  return emailLayout(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0A1F5C;">Hello ${name},</h1>
    <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
      Thank you for reaching out to <strong>Pinnacle Academic Classes</strong>! We have received your enquiry and our admissions counsellor will get back to you within <strong>24 hours</strong>.
    </p>
    ${course}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">What happens next?</p>
      <ul style="margin:8px 0 0;padding-left:20px;color:#15803d;font-size:14px;line-height:1.8;">
        <li>Our counsellor calls you within 24 hours</li>
        <li>We schedule a free demo class for you</li>
        <li>You choose your batch and complete admission</li>
      </ul>
    </div>
    <p style="margin:0 0 8px;color:#475569;font-size:14px;">In the meantime, feel free to WhatsApp us for a faster response:</p>
    <a href="https://wa.me/919971862138" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:10px 20px;border-radius:8px;">WhatsApp Us</a>
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">You received this email because you submitted an enquiry on our website. If this wasn't you, please ignore this email.</p>
  `);
}

function adminEnquiryHtml(p: { name: string; phone: string; email?: string; courseInterest?: string; message?: string }): string {
  const rows = [
    ["Name", escHtml(p.name)],
    ["Phone", escHtml(p.phone)],
    ["Email", p.email ? escHtml(p.email) : "—"],
    ["Course Interest", p.courseInterest ? escHtml(p.courseInterest) : "—"],
    ["Message", p.message ? escHtml(p.message) : "—"],
  ];
  const tableRows = rows.map(([k, v]) => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#64748b;font-weight:600;background:#f8fafc;border-bottom:1px solid #e2e8f0;width:140px;">${k}</td>
      <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #e2e8f0;">${v}</td>
    </tr>`).join("");
  return emailLayout(`
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0A1F5C;">New Admissions Enquiry</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:13px;">Received just now via the website admissions form.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      ${tableRows}
    </table>
    <div style="margin-top:20px;">
      <a href="${SITE_URL}/portal/admin/admissions" style="display:inline-block;background:#0A1F5C;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;padding:10px 20px;border-radius:8px;">View in Admin Panel</a>
    </div>
  `);
}

export async function sendAdmissionStatusEmail(params: {
  to: string;
  name: string;
  status: string;
  courseName?: string | null;
}): Promise<SendResult> {
  const { to, name, status, courseName } = params;
  const msgs: Record<string, { subject: string; headline: string; body: string }> = {
    contacted: {
      subject: "We'll be in touch soon — Pinnacle Academic Classes",
      headline: "Our team will contact you shortly",
      body: "Our admissions counsellor has noted your interest and will be reaching out within 24 hours to discuss next steps.",
    },
    interested: {
      subject: "Your application is progressing — Pinnacle Academic Classes",
      headline: "Application progressing!",
      body: "We are pleased to inform you that your application is under active review. Our team will contact you to schedule a visit or free demo class.",
    },
    converted: {
      subject: `Welcome to Pinnacle! — Admission Confirmed 🎉`,
      headline: "Admission Confirmed!",
      body: `Congratulations! Your admission to <strong>${escHtml(courseName ?? "Pinnacle Academic Classes")}</strong> is confirmed. Please visit the centre with your original documents to complete enrolment and meet your batch coordinator.`,
    },
    declined: {
      subject: "Regarding your enquiry — Pinnacle Academic Classes",
      headline: "Thank you for your interest",
      body: "Thank you for considering Pinnacle Academic Classes. Unfortunately, we are unable to offer admission at this time. Please do not hesitate to contact us about future batches.",
    },
  };
  const msg = msgs[status];
  if (!msg) return { ok: true };
  return send({
    to,
    subject: msg.subject,
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0A1F5C;">${msg.headline}</h1>
      <p style="margin:0 0 16px;color:#475569;font-size:15px;">Dear ${escHtml(name)},</p>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">${msg.body}</p>
      <p style="margin:0;font-size:14px;color:#94a3b8;">Questions? WhatsApp us at <a href="https://wa.me/919971862138" style="color:#0D7377;">+91 99718 62138</a> or email <a href="mailto:care@paconline.in" style="color:#0D7377;">care@paconline.in</a>.</p>
    `),
  });
}

export async function sendLowAttendanceAlert(params: {
  to: string;
  parentName: string;
  studentName: string;
  attendancePct: number;
  parentPortalUrl: string;
}): Promise<SendResult> {
  const { to, parentName, studentName, attendancePct, parentPortalUrl } = params;
  const pct = Math.round(attendancePct);
  return send({
    to,
    subject: `Attendance Alert: ${escHtml(studentName)}'s attendance has dropped below 75% — Pinnacle Academic Classes`,
    html: emailLayout(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#fff7ed;border:2px solid #fdba74;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;text-align:center;">⚠️</div>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0A1F5C;text-align:center;">Attendance Alert</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;">Dear ${escHtml(parentName)},</p>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        We want to bring to your attention that <strong>${escHtml(studentName)}</strong>'s attendance over the past 30 days has fallen below the required 75% threshold.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fdba74;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <tr>
          <td style="padding:16px 20px;text-align:center;">
            <span style="font-size:12px;color:#92400e;font-weight:600;display:block;margin-bottom:4px;">CURRENT ATTENDANCE (LAST 30 DAYS)</span>
            <span style="font-size:36px;font-weight:800;color:#b45309;">${pct}%</span>
            <span style="display:block;font-size:12px;color:#92400e;margin-top:4px;">Minimum required: 75%</span>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.6;">
        Regular attendance is essential for academic progress. We encourage you to speak with your child and help them attend classes consistently. If there are any circumstances affecting attendance, please contact us so we can assist.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${escHtml(parentPortalUrl)}" style="display:inline-block;background:#0A1F5C;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">View Parent Portal</a>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;">Questions? Contact us at <a href="mailto:care@paconline.in" style="color:#0D7377;">care@paconline.in</a> or WhatsApp <a href="https://wa.me/919971862138" style="color:#0D7377;">+91 99718 62138</a>.</p>
    `),
  });
}

export async function sendWeeklyParentDigest(params: {
  to: string;
  parentName: string;
  studentName: string;
  weekStart: Date;
  weekEnd: Date;
  attendance: { present: number; absent: number; late: number; total: number };
  mockTests: Array<{ title: string; score: number; maxScore: number; date: Date }>;
  upcomingClasses: Array<{ subject: string; topic: string | null; scheduledAt: Date }>;
  pendingFees: { count: number; totalAmount: number };
}): Promise<SendResult> {
  const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const fmtDateTime = (d: Date) => d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const a = params.attendance;
  const attPct = a.total > 0 ? Math.round(((a.present + a.late * 0.5) / a.total) * 100) : null;
  const attRow = a.total === 0
    ? `<tr><td colspan="2" style="padding:12px;color:#94a3b8;font-size:13px;text-align:center;">No attendance records this week.</td></tr>`
    : `<tr>
         <td style="padding:14px 16px;text-align:center;">
           <div style="font-size:28px;font-weight:800;color:${attPct! >= 75 ? "#059669" : "#b45309"};">${attPct}%</div>
           <div style="font-size:11px;color:#64748b;">attendance</div>
         </td>
         <td style="padding:14px 16px;text-align:center;border-left:1px solid #e2e8f0;font-size:13px;color:#475569;">
           Present: <strong>${a.present}</strong> · Absent: <strong>${a.absent}</strong> · Late: <strong>${a.late}</strong>
         </td>
       </tr>`;
  const testsBlock = params.mockTests.length === 0
    ? `<p style="margin:0;color:#94a3b8;font-size:13px;">No tests taken this week.</p>`
    : `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        ${params.mockTests.map((t) => {
          const pct = t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0;
          const color = pct >= 75 ? "#059669" : pct >= 50 ? "#b45309" : "#b91c1c";
          return `<tr>
            <td style="padding:10px 14px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">
              <div style="font-weight:600;">${escHtml(t.title)}</div>
              <div style="font-size:11px;color:#94a3b8;">${fmtDate(t.date)}</div>
            </td>
            <td style="padding:10px 14px;text-align:right;border-bottom:1px solid #f1f5f9;">
              <div style="font-weight:700;color:${color};">${t.score}/${t.maxScore}</div>
              <div style="font-size:11px;color:${color};">${pct}%</div>
            </td>
          </tr>`;
        }).join("")}
       </table>`;
  const upcomingBlock = params.upcomingClasses.length === 0
    ? `<p style="margin:0;color:#94a3b8;font-size:13px;">No live classes scheduled in the next 7 days.</p>`
    : `<ul style="margin:0;padding:0 0 0 18px;color:#475569;font-size:13px;line-height:1.7;">
        ${params.upcomingClasses.map((c) => `<li><strong>${escHtml(c.subject)}</strong>${c.topic ? ` — ${escHtml(c.topic)}` : ""} <span style="color:#94a3b8;">· ${fmtDateTime(c.scheduledAt)}</span></li>`).join("")}
       </ul>`;
  const feesBlock = params.pendingFees.count > 0
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
         <div style="font-weight:700;color:#b91c1c;font-size:14px;">Fees due: ₹${params.pendingFees.totalAmount.toLocaleString("en-IN")}</div>
         <div style="font-size:12px;color:#7f1d1d;margin-top:2px;">${params.pendingFees.count} pending instalment${params.pendingFees.count > 1 ? "s" : ""} — please clear at the parent portal.</div>
       </div>`
    : "";
  return send({
    to: params.to,
    subject: `${params.studentName}'s weekly progress — Pinnacle Academic Classes`,
    html: emailLayout(`
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0A1F5C;">Weekly progress for ${escHtml(params.studentName)}</h1>
      <p style="margin:0 0 24px;color:#64748b;font-size:13px;">${fmtDate(params.weekStart)} — ${fmtDate(params.weekEnd)} · Dear ${escHtml(params.parentName)},</p>
      ${feesBlock}
      <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0A1F5C;">📅 Attendance this week</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">${attRow}</table>
      <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0A1F5C;">📝 Mock tests this week</h2>
      <div style="margin-bottom:24px;">${testsBlock}</div>
      <h2 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0A1F5C;">🎓 Upcoming live classes</h2>
      <div style="margin-bottom:24px;">${upcomingBlock}</div>
      <div style="text-align:center;margin-top:8px;">
        <a href="${SITE_URL}/portal/parent" style="display:inline-block;background:#0A1F5C;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">Open Parent Portal</a>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">You receive this digest every Sunday. Manage notifications from your parent portal.</p>
    `),
  });
}

export async function sendTestEmail(to: string): Promise<SendResult> {
  return send({
    to,
    subject: "Test Email — Pinnacle Academic Classes",
    html: emailLayout(`
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0A1F5C;">Test Email ✓</h1>
      <p style="color:#475569;font-size:15px;line-height:1.6;">
        This is a test email sent from the Pinnacle Academic Classes admin panel to verify that email delivery is configured correctly.
      </p>
      <p style="font-size:13px;color:#94a3b8;">Sent: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
    `),
  });
}

function paymentConfirmHtml(p: { name: string; period: string; amount: number; paymentId: string; orderId?: string; paidDate: Date; receiptPath: string }): string {
  const name = escHtml(p.name);
  const period = escHtml(p.period);
  const paymentId = escHtml(p.paymentId);
  const dateStr = p.paidDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const amountStr = `₹${p.amount.toLocaleString("en-IN")}`;
  const receiptUrl = `${SITE_URL}${p.receiptPath}`;
  return emailLayout(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:#f0fdf4;border:2px solid #86efac;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;text-align:center;">✓</div>
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0A1F5C;text-align:center;">Payment Confirmed!</h1>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;text-align:center;">Hi ${name}, your fee payment has been successfully received.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:12px;color:#64748b;font-weight:600;display:block;">PERIOD</span>
          <span style="font-size:15px;color:#0A1F5C;font-weight:700;">${period}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;border-left:1px solid #e2e8f0;">
          <span style="font-size:12px;color:#64748b;font-weight:600;display:block;">AMOUNT PAID</span>
          <span style="font-size:15px;color:#0D7377;font-weight:700;">${amountStr}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;">
          <span style="font-size:12px;color:#64748b;font-weight:600;display:block;">DATE</span>
          <span style="font-size:14px;color:#1e293b;">${dateStr}</span>
        </td>
        <td style="padding:12px 16px;border-left:1px solid #e2e8f0;">
          <span style="font-size:12px;color:#64748b;font-weight:600;display:block;">PAYMENT ID</span>
          <span style="font-size:12px;color:#1e293b;font-family:monospace;">${paymentId}</span>
        </td>
      </tr>
    </table>
    <div style="text-align:center;">
      <a href="${receiptUrl}" style="display:inline-block;background:#0A1F5C;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 28px;border-radius:8px;">View & Download Receipt</a>
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;text-align:center;">Keep this email as proof of payment. For any queries, contact us at care@paconline.in.</p>
  `);
}

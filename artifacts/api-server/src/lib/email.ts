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

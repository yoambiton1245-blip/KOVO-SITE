import nodemailer from "nodemailer";
import { PROJECT_TYPES, EMAIL_PATTERN } from "../public/shared/constants.js";

/**
 * Email every new lead to the business inbox over SMTP (Gmail by default).
 * Settings come only from Vercel Environment Variables, never from the code:
 *   SMTP_USER       the sending Gmail address
 *   SMTP_PASS       a Gmail App Password (16 characters), not the normal password
 *   LEAD_EMAIL_TO   where leads go (default: SMTP_USER)
 *   SMTP_HOST / SMTP_PORT / LEAD_EMAIL_FROM   optional (default smtp.gmail.com / 465 / SMTP_USER)
 */
const cfg = () => {
  const e = process.env;
  const port = Number(e.SMTP_PORT || 465);
  return {
    host: e.SMTP_HOST || "smtp.gmail.com",
    port,
    user: e.SMTP_USER || "",
    pass: e.SMTP_PASS || "",
    to: e.LEAD_EMAIL_TO || e.SMTP_USER || "",
    from: e.LEAD_EMAIL_FROM || e.SMTP_USER || ""
  };
};

export const isEmailConfigured = () => { const c = cfg(); return Boolean(c.user && c.pass && c.to); };

let testTransport = null;
/** Tests only: route mail through an in-memory transport. */
export function setTestTransport(t) { testTransport = t; }

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = s => String(s ?? "").replace(/[\r\n]+/g, " ").trim();

export function buildLeadEmail(lead, c = cfg()) {
  const type = PROJECT_TYPES[lead.projectType] || lead.projectType;
  const rows = [
    ["שם", lead.fullName],
    ["טלפון", lead.phone],
    ["אימייל", lead.email || "לא נמסר"],
    ["מה מתכננים", type],
    ["הודעה", lead.message || "אין"],
    ["התקבל", new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })]
  ];
  const telDigits = String(lead.phone).replace(/[^\d+]/g, "");
  const waDigits = telDigits.replace(/^\+/, "");
  const text = "פנייה חדשה מהאתר KOVO\n\n" + rows.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n";
  const html = `<!doctype html><html dir="rtl" lang="he"><body style="font-family:Arial,sans-serif;color:#1d1a17;background:#f6f0e7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:24px;border-top:4px solid #630209">
<h2 style="margin:0 0 16px;color:#630209">פנייה חדשה מהאתר KOVO</h2>
<table style="width:100%;border-collapse:collapse;font-size:15px">${rows.map(([k, v]) =>
    `<tr><td style="padding:8px 0;color:#6b5f55;width:110px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")}</table>
<p style="margin:20px 0 0"><a href="tel:${esc(telDigits)}" style="background:#630209;color:#fff;padding:10px 16px;text-decoration:none">להתקשר ללקוח</a>
&nbsp; <a href="https://wa.me/${esc(waDigits)}" style="color:#630209">וואטסאפ ללקוח</a></p>
</div></body></html>`;
  return {
    from: { name: "אתר KOVO", address: c.from || "no-reply@localhost" },
    to: c.to,
    replyTo: lead.email && EMAIL_PATTERN.test(lead.email) ? lead.email : undefined,
    subject: oneLine(`פנייה חדשה מהאתר: ${lead.fullName} (${type})`).slice(0, 180),
    text,
    html
  };
}

/** Send the lead email. Throws if sending fails, so the visitor is told to try again or use WhatsApp. */
export async function emailNewLead(lead) {
  const c = cfg();
  const transport = testTransport || nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465,
    auth: { user: c.user, pass: c.pass },
    connectionTimeout: 10000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true
  });
  await transport.sendMail(buildLeadEmail(lead, c));
}

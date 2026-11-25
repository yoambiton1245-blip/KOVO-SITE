/**
 * Vercel Function: contact form ("השאירו פרטים").
 *   POST /api/leads   body { fullName, phone, email, projectType, message, website }  -> 201 { ok: true }
 * The lead is emailed to LEAD_EMAIL_TO (see lib/email.js). Nothing is stored on the server.
 * If email is not set up or sending fails, the visitor gets an error and is asked to use WhatsApp,
 * so a lead is never silently lost.
 */
import { validateLead } from "../lib/lead.validator.js";
import { emailNewLead, isEmailConfigured } from "../lib/email.js";
import { json, error, readJson, toResponse } from "../lib/httpError.js";

export async function POST(request) {
  try {
    const lead = validateLead(await readJson(request));
    if (lead.isBot) return json(201, { ok: true }); // honeypot filled: pretend success, send nothing
    if (!isEmailConfigured()) {
      console.error("leads: email is not configured (SMTP_USER / SMTP_PASS / LEAD_EMAIL_TO)");
      return error(503, "unavailable", "Lead email is not configured");
    }
    try {
      await emailNewLead(lead);
    } catch (err) {
      console.error("leads: email failed", err?.message);
      return error(502, "email_failed", "Could not send");
    }
    return json(201, { ok: true });
  } catch (err) {
    return toResponse(err, "leads error");
  }
}

export function GET() {
  return error(405, "method_not_allowed", "Method not allowed");
}

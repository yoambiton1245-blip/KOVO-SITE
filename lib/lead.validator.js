import { PROJECT_TYPES, LIMITS, PHONE_PATTERN, EMAIL_PATTERN } from "../public/shared/constants.js";
import { cleanText, normalizePhone } from "./sanitize.js";
import { badRequest } from "./httpError.js";

const ALLOWED = new Set(["fullName", "phone", "email", "projectType", "message", "website"]);

/**
 * Validate + sanitize a lead payload. Returns a clean object or throws a 400 with per-field messages.
 * Unknown keys are rejected so the API surface stays explicit.
 */
export function validateLead(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw badRequest("Invalid request body");
  const unknown = Object.keys(body).filter(k => !ALLOWED.has(k));
  if (unknown.length) throw badRequest("Unknown fields: " + unknown.join(", "));

  const fields = {};
  const fullName = cleanText(body.fullName);
  const phoneRaw = cleanText(body.phone);
  const email = cleanText(body.email).toLowerCase();
  const projectType = cleanText(body.projectType);
  const message = cleanText(body.message, { multiline: true });

  if (fullName.length < LIMITS.nameMin || fullName.length > LIMITS.nameMax) fields.fullName = "נא למלא שם מלא";
  const phone = normalizePhone(phoneRaw);
  const digits = phone.replace(/\D/g, "").length;
  if (!PHONE_PATTERN.test(phoneRaw) || digits < LIMITS.phoneMinDigits || digits > LIMITS.phoneMaxDigits) fields.phone = "נא למלא מספר טלפון תקין";
  if (email && (email.length > LIMITS.emailMax || !EMAIL_PATTERN.test(email))) fields.email = "כתובת האימייל אינה תקינה";
  if (!Object.hasOwn(PROJECT_TYPES, projectType)) fields.projectType = "נא לבחור מה מתכננים";
  if (message.length > LIMITS.messageMax) fields.message = `עד ${LIMITS.messageMax} תווים`;

  if (Object.keys(fields).length) throw badRequest("Validation failed", fields);

  return {
    fullName,
    phone,
    email: email || null,
    projectType,
    message: message || null,
    isBot: typeof body.website === "string" && body.website.trim() !== ""
  };
}

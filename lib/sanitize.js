/**
 * Input sanitizing helpers. Values are sent as plain text and always escaped on output,
 * so here we only normalize: trim, collapse whitespace, strip control characters and HTML tags.
 */
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g;

export const cleanText = (v, { multiline = false } = {}) => {
  if (typeof v !== "string") return "";
  let s = v.normalize("NFC").replace(CONTROL, "").replace(/<[^>]*>/g, "");
  s = multiline ? s.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  return s.trim();
};

/** Keep digits and a leading +; convert Israeli local numbers (05x...) to E.164 (+9725x...). */
export const normalizePhone = v => {
  const raw = cleanText(v);
  const plus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (plus) return "+" + digits;
  if (digits.startsWith("972")) return "+" + digits;
  if (digits.startsWith("0")) return "+972" + digits.slice(1);
  return digits;
};

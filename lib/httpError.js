/** Error with an HTTP status and a message that is safe to show to clients. */
export class HttpError extends Error {
  constructor(status, message, { code, fields } = {}) {
    super(message);
    this.status = status;
    this.code = code || "error";
    this.fields = fields;
    this.expose = true;
  }
}
export const badRequest = (msg, fields) => new HttpError(400, msg, { code: "validation_error", fields });

/** JSON response helpers for Vercel Functions (Web standard Request/Response). */
export const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store", ...headers }
});
export const error = (status, code, message, fields) => json(status, { error: { code, message, ...(fields ? { fields } : {}) } });

/** Read a JSON body with a size limit. Throws an HttpError the handler turns into a response. */
export async function readJson(request, maxBytes = 10 * 1024) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) throw new HttpError(415, "JSON required", { code: "unsupported_media_type" });
  const raw = await request.text();
  if (raw.length > maxBytes) throw new HttpError(413, "Body too large", { code: "payload_too_large" });
  try { return JSON.parse(raw); } catch { throw new HttpError(400, "Invalid JSON", { code: "bad_json" }); }
}

/** Turn any thrown error into a safe response; never leak internals. */
export function toResponse(err, label) {
  if (err && err.status && err.expose) return error(err.status, err.code, err.message, err.fields);
  console.error(label, err);
  return error(500, "server_error", "Something went wrong");
}

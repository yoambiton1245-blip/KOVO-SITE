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
export const notFound = (msg = "Not found") => new HttpError(404, msg, { code: "not_found" });
export const unauthorized = () => new HttpError(401, "Unauthorized", { code: "unauthorized" });

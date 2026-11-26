import { HttpError } from "./httpError.js";

/**
 * Refuse requests that a browser sends from another website (cross-site form spam, CSRF-style abuse).
 * Browsers always send Origin / Sec-Fetch-Site on POST, so a page on another domain cannot hide them.
 * Scripts outside a browser can omit them; those are handled by the Vercel Firewall rate-limit rule
 * and the honeypot field.
 */
export function rejectCrossSite(request) {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") throw new HttpError(403, "Forbidden", { code: "forbidden" });
  const origin = request.headers.get("origin");
  if (!origin) return;
  let originHost;
  try { originHost = new URL(origin).host; } catch { throw new HttpError(403, "Forbidden", { code: "forbidden" }); }
  const hosts = new Set([new URL(request.url).host, request.headers.get("host"), request.headers.get("x-forwarded-host")].filter(Boolean));
  if (!hosts.has(originHost)) throw new HttpError(403, "Forbidden", { code: "forbidden" });
}

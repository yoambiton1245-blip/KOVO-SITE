/**
 * Netlify Function: save and load kitchen designs ("שמירה וקישור" in the designer).
 *   POST /api/designs        body { kitchenId, styleId, state }  -> 201 { id }
 *   GET  /api/designs/:id                                       -> 200 { data: { id, kitchenId, styleId, state, createdAt } }
 * Storage: Netlify Blobs (store "kovo-designs"). Validation is shared with the Node backend.
 * No personal data is stored.
 */
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { validateDesign } from "../lib/validators/design.validator.js";

export const config = {
  path: ["/api/designs", "/api/designs/:id"],
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] }
};

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newId = () => Array.from(crypto.randomBytes(10), b => ALPHABET[b % ALPHABET.length]).join("");
const ID = /^[A-Za-z0-9_-]{6,20}$/;
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", ...headers }
});
const error = (status, code, message, fields) => json(status, { error: { code, message, ...(fields ? { fields } : {}) } });

export default async (req, context) => {
  const store = getStore("kovo-designs");
  try {
    if (req.method === "POST" && !context.params?.id) {
      if (!(req.headers.get("content-type") || "").includes("application/json")) return error(415, "unsupported_media_type", "JSON required");
      const raw = await req.text();
      if (raw.length > 10 * 1024) return error(413, "payload_too_large", "Body too large");
      let body;
      try { body = JSON.parse(raw); } catch { return error(400, "bad_json", "Invalid JSON"); }
      const design = validateDesign(body);
      const id = newId();
      await store.setJSON(id, { id, ...design, createdAt: new Date().toISOString() });
      return json(201, { id });
    }
    if (req.method === "GET" && context.params?.id) {
      const id = String(context.params.id).replace(/\.html?$/, ""); // `netlify dev` retries a 404 with .html/.htm appended
      if (!ID.test(id)) return error(400, "validation_error", "Invalid id");
      const data = await store.get(id, { type: "json" });
      if (!data) return error(404, "not_found", "Design not found");
      return json(200, { data }, { "Cache-Control": "public, max-age=86400" });
    }
    return error(405, "method_not_allowed", "Method not allowed");
  } catch (err) {
    if (err.status && err.expose) return error(err.status, err.code, err.message, err.fields);
    console.error("designs function error", err);
    return error(500, "server_error", "Something went wrong");
  }
};

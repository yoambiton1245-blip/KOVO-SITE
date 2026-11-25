/**
 * Vercel Function: load a saved kitchen design.
 *   GET /api/designs/:id   -> 200 { data: { id, kitchenId, styleId, state, createdAt } }
 */
import { ID, loadDesign, isStoreConfigured } from "../../lib/designStore.js";
import { json, error, toResponse } from "../../lib/httpError.js";

export async function GET(request) {
  try {
    const id = decodeURIComponent(new URL(request.url).pathname.split("/").pop() || "");
    if (!ID.test(id)) return error(400, "validation_error", "Invalid id");
    if (!isStoreConfigured()) return error(503, "unavailable", "Design storage is not configured");
    const data = await loadDesign(id);
    if (!data) return error(404, "not_found", "Design not found");
    return json(200, { data }, { "Cache-Control": "public, max-age=86400" });
  } catch (err) {
    return toResponse(err, "designs load error");
  }
}

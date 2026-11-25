/**
 * Vercel Function: save a kitchen design ("שמירה וקישור" in the designer).
 *   POST /api/designs   body { kitchenId, styleId, state }  -> 201 { id }
 */
import { validateDesign } from "../../lib/design.validator.js";
import { newId, saveDesign, isStoreConfigured } from "../../lib/designStore.js";
import { json, error, readJson, toResponse } from "../../lib/httpError.js";

export async function POST(request) {
  try {
    const design = validateDesign(await readJson(request));
    if (!isStoreConfigured()) return error(503, "unavailable", "Design storage is not configured");
    const id = newId();
    await saveDesign(id, { id, ...design, createdAt: new Date().toISOString() });
    return json(201, { id });
  } catch (err) {
    return toResponse(err, "designs save error");
  }
}

export function GET() {
  return error(405, "method_not_allowed", "Method not allowed");
}

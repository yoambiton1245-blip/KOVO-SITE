import { normalizeDesignState, STYLES } from "../shared/kitchenCatalog.js";
import { badRequest } from "./httpError.js";

const KITCHEN_IDS = new Set(["warm-stone"]); // keep in sync with public/config/designer/kitchens.js

export function validateDesign(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw badRequest("Invalid request body");
  const extra = Object.keys(body).filter(k => !["kitchenId", "styleId", "state"].includes(k));
  if (extra.length) throw badRequest("Unknown fields: " + extra.join(", "));
  if (!KITCHEN_IDS.has(body.kitchenId)) throw badRequest("Unknown kitchen", { kitchenId: "unknown" });
  const styleId = body.styleId ?? null;
  if (styleId !== null && !STYLES.some(s => s.id === styleId)) throw badRequest("Unknown style", { styleId: "unknown" });
  const state = normalizeDesignState(body.state);
  if (!state) throw badRequest("Invalid design", { state: "invalid" });
  return { kitchenId: body.kitchenId, styleId, state };
}

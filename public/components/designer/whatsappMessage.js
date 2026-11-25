import { CATEGORIES, FINISHES, STYLES, findOption } from "../../../shared/kitchenCatalog.js";

/** Human-readable summary rows for a design state. */
export function summarize(state) {
  return Object.entries(CATEGORIES).map(([cat, def]) => {
    const raw = state[cat];
    const [id, finish] = Array.isArray(raw) ? raw : [raw];
    const opt = findOption(cat, id);
    let value = opt ? opt.label : "";
    if (def.hasFinish && opt && !opt.original) value += ` (${FINISHES[finish]?.label || ""})`;
    return { category: def.label, value };
  });
}

export const styleLabel = styleId => STYLES.find(s => s.id === styleId)?.label;

/**
 * Pre-written WhatsApp message. Mentions a link to the saved design only when it was saved.
 * The image itself cannot be attached through a wa.me link, so the message does not claim it.
 */
export function buildWhatsappMessage({ state, styleId, kitchenTitle, designUrl }) {
  const lines = ["שלום KOVO 👋", "עיצבתי מטבח באתר ואשמח לשמוע עוד:", ""];
  const style = styleLabel(styleId);
  if (style) lines.push(`• סגנון: ${style}`);
  summarize(state).forEach(r => lines.push(`• ${r.category}: ${r.value}`));
  lines.push("", `מטבח לדוגמה: ${kitchenTitle}`);
  if (designUrl) lines.push(`לצפייה בעיצוב שלי: ${designUrl}`);
  return lines.join("\n");
}

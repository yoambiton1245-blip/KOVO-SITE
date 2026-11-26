import { CATEGORIES, FINISHES, STYLES, findOption } from "../../shared/kitchenCatalog.js";

/**
 * Human-readable summary rows for a design state.
 * categories: the areas the current photo actually has (others are not shown or sent).
 */
export function summarize(state, categories = Object.keys(CATEGORIES)) {
  return Object.entries(CATEGORIES).filter(([cat]) => categories.includes(cat)).map(([cat, def]) => {
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
export function buildWhatsappMessage({ state, styleId, kitchenTitle, designUrl, categories }) {
  // No emoji: WhatsApp's wa.me redirect corrupts 4-byte characters into "�"
  const lines = ["שלום KOVO,", "עיצבתי מטבח באתר ואשמח לשמוע עוד:", ""];
  const style = styleLabel(styleId);
  if (style) lines.push(`• סגנון: ${style}`);
  summarize(state, categories).forEach(r => lines.push(`• ${r.category}: ${r.value}`));
  lines.push("", `מטבח לדוגמה: ${kitchenTitle}`);
  if (designUrl) lines.push(`לצפייה בעיצוב שלי: ${designUrl}`);
  return lines.join("\n");
}

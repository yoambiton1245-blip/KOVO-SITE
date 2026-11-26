/**
 * Kitchen designer catalog: every selectable option.
 * Shared by the frontend (rendering + UI) and the backend (validating saved designs).
 *
 * Material fields:
 *   color     sRGB hex of the material
 *   texture   grayscale detail map name in /assets/designer/textures (optional)
 *   strength  how strongly the texture modulates the color (0..1)
 *   scale     texture density (bigger = smaller pattern)
 *   original  true = keep the photo as it is
 *
 * To add an option: add an entry here. To add a category: add it to CATEGORIES and to the
 * kitchen's `areas` in frontend/config/designer/kitchens.js.
 */

export const FINISHES = Object.freeze({
  matte: { label: "מט", contrast: 0.9, sheen: 0, detail: 0.22 },
  satin: { label: "סאטן", contrast: 1.0, sheen: 0.18, detail: 0.28 },
  gloss: { label: "מבריק", contrast: 1.12, sheen: 0.45, detail: 0.32 }
});

const CABINET_MATERIALS = [
  { id: "original", label: "כמו בתמונה", group: "color", original: true },
  { id: "lacquer-cream", label: "שמנת", group: "color", color: "#E6DCCB" },
  { id: "lacquer-white", label: "לבן", group: "color", color: "#EFEEEA" },
  { id: "lacquer-stone", label: "אפור אבן", group: "color", color: "#A7A196" },
  { id: "lacquer-olive", label: "ירוק זית", group: "color", color: "#6A6E4C" },
  { id: "lacquer-navy", label: "כחול לילה", group: "color", color: "#2A3550" },
  { id: "lacquer-bordeaux", label: "בורדו", group: "color", color: "#6E1D2A" },
  { id: "lacquer-charcoal", label: "פחם", group: "color", color: "#262423" },
  { id: "oak-natural", label: "אלון טבעי", group: "wood", color: "#C29A6E", texture: "wood-rift", strength: 0.5, scale: 1.4 },
  { id: "oak-smoked", label: "אלון מעושן", group: "wood", color: "#7B5B42", texture: "wood-rift", strength: 0.55, scale: 1.4 },
  { id: "walnut", label: "אגוז אמריקאי", group: "wood", color: "#6E4A33", texture: "wood-grain", strength: 0.45, scale: 1.2 },
  { id: "walnut-dark", label: "אגוז כהה", group: "wood", color: "#3F2B20", texture: "wood-grain", strength: 0.5, scale: 1.2 }
];

export const CATEGORIES = Object.freeze({
  upper: {
    label: "ארונות עליונים",
    hasFinish: true,
    options: CABINET_MATERIALS
  },
  lower: {
    label: "ארונות תחתונים",
    hasFinish: true,
    options: CABINET_MATERIALS
  },
  counter: {
    label: "משטח עבודה",
    hasFinish: false,
    finish: "satin",
    options: [
      { id: "original", label: "כמו בתמונה", original: true },
      { id: "quartz-white", label: "קוורץ לבן", color: "#ECEAE5", texture: "concrete", strength: 0.08, scale: 1 },
      { id: "calacatta", label: "שיש קלקטה", color: "#EDE9E2", texture: "marble", strength: 1, scale: 0.9 },
      { id: "granite-black", label: "גרניט שחור", color: "#2B2A29", texture: "granite", strength: 0.6, scale: 2 },
      { id: "concrete", label: "בטון", color: "#9D988F", texture: "concrete", strength: 0.7, scale: 1 },
      { id: "terrazzo", label: "טרצו", color: "#DAD3C8", texture: "terrazzo", strength: 0.7, scale: 1.2 },
      { id: "oak-block", label: "עץ אלון מלא", color: "#B98C60", texture: "wood-rift", strength: 0.45, scale: 1.6 }
    ]
  },
  handles: {
    label: "ידיות",
    hasFinish: false,
    finish: "gloss",
    options: [
      { id: "original", label: "כמו בתמונה", original: true },
      { id: "brass", label: "פליז מוברש", color: "#B9914F", texture: "brushed", strength: 0.4, scale: 3 },
      { id: "steel", label: "נירוסטה", color: "#BFC1C2", texture: "brushed", strength: 0.4, scale: 3 },
      { id: "copper", label: "נחושת", color: "#B4704F", texture: "brushed", strength: 0.4, scale: 3 },
      { id: "black-matte", label: "שחור מט", color: "#1C1C1C" },
      { id: "white", label: "לבן", color: "#E9E7E2" }
    ]
  },
  backsplash: {
    label: "חיפוי קיר",
    hasFinish: false,
    finish: "satin",
    options: [
      { id: "original", label: "כמו בתמונה", original: true },
      { id: "subway-white", label: "אריחי סאבווי לבנים", color: "#ECE8E0", texture: "subway", strength: 0.9, scale: 1.6 },
      { id: "zellige-green", label: "זליג׳ ירוק", color: "#5C7A65", texture: "zellige", strength: 0.9, scale: 1.4 },
      { id: "zellige-white", label: "זליג׳ לבן", color: "#E7E0D3", texture: "zellige", strength: 0.8, scale: 1.4 },
      { id: "calacatta", label: "שיש קלקטה", color: "#EDE9E2", texture: "marble", strength: 1, scale: 0.6 },
      { id: "microcement", label: "מיקרוטופינג", color: "#B7AEA2", texture: "concrete", strength: 0.6, scale: 0.8 },
      { id: "terrazzo", label: "טרצו", color: "#DAD3C8", texture: "terrazzo", strength: 0.7, scale: 1.2 }
    ]
  }
});

/** Ready-made combinations. A style only sets values; the user can change anything afterwards. */
export const STYLES = Object.freeze([
  { id: "warm-modern", label: "מודרני חם", state: { upper: ["lacquer-cream", "matte"], lower: ["walnut", "matte"], counter: "quartz-white", handles: "original", backsplash: "original" } },
  { id: "scandi", label: "סקנדינבי בהיר", state: { upper: ["lacquer-white", "matte"], lower: ["oak-natural", "matte"], counter: "quartz-white", handles: "steel", backsplash: "subway-white" } },
  { id: "dark-luxury", label: "יוקרה כהה", state: { upper: ["lacquer-charcoal", "satin"], lower: ["walnut-dark", "satin"], counter: "calacatta", handles: "brass", backsplash: "calacatta" } },
  { id: "mediterranean", label: "ים תיכוני", state: { upper: ["lacquer-cream", "matte"], lower: ["lacquer-olive", "matte"], counter: "terrazzo", handles: "brass", backsplash: "zellige-green" } },
  { id: "industrial", label: "תעשייתי", state: { upper: ["lacquer-stone", "matte"], lower: ["lacquer-charcoal", "matte"], counter: "concrete", handles: "black-matte", backsplash: "microcement" } },
  { id: "kovo-bordeaux", label: "בורדו KOVO", state: { upper: ["lacquer-cream", "satin"], lower: ["lacquer-bordeaux", "satin"], counter: "calacatta", handles: "brass", backsplash: "original" } }
]);

/** The photo exactly as it is. */
export const DEFAULT_STATE = Object.freeze({
  upper: ["original", "matte"], lower: ["original", "matte"], counter: "original", handles: "original", backsplash: "original"
});

export const findOption = (category, id) => CATEGORIES[category]?.options.find(o => o.id === id);

/**
 * Validate a design state (used by the backend before saving).
 * Returns a normalized copy or null if anything is unknown.
 */
export function normalizeDesignState(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out = {};
  for (const [cat, def] of Object.entries(CATEGORIES)) {
    const v = input[cat];
    if (def.hasFinish) {
      if (!Array.isArray(v) || v.length !== 2) return null;
      if (!findOption(cat, v[0]) || !Object.hasOwn(FINISHES, v[1])) return null;
      out[cat] = [v[0], v[1]];
    } else {
      if (typeof v !== "string" || !findOption(cat, v)) return null;
      out[cat] = v;
    }
  }
  const extra = Object.keys(input).filter(k => !Object.hasOwn(CATEGORIES, k));
  return extra.length ? null : out;
}

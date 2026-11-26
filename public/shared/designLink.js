/**
 * Kitchen designs travel inside the link itself, so sharing needs no server, no storage and no account:
 *   ?d=1.<style|->.<upper>:<finish>.<lower>:<finish>.<counter>.<handles>.<backsplash>
 * "1" is the format version. Option ids (not positions) are used, so adding colours never breaks old links.
 * Separators are "." and ":" only: WhatsApp treats _ * ~ as text formatting, which could break the link.
 * Every link is validated against the catalog before it is applied.
 */
import { CATEGORIES, STYLES, normalizeDesignState } from "./kitchenCatalog.js";

const VERSION = "1";
const ORDER = Object.keys(CATEGORIES); // upper, lower, counter, handles, backsplash
const TOKEN = /^[a-z0-9-]{1,40}$/;

/** Design state + style -> compact link value. */
export function encodeDesign(state, styleId = null) {
  const parts = ORDER.map(cat => (Array.isArray(state[cat]) ? state[cat].join(":") : state[cat]));
  return [VERSION, styleId || "-", ...parts].join(".");
}

/** Link value -> { state, styleId }, or null when the value is malformed or names unknown options. */
export function decodeDesign(value) {
  if (typeof value !== "string" || value.length > 400) return null;
  const [version, style, ...parts] = value.split(".");
  if (version !== VERSION || parts.length !== ORDER.length) return null;
  if (![style, ...parts.flatMap(p => p.split(":"))].every(t => TOKEN.test(t))) return null;
  const input = {};
  ORDER.forEach((cat, i) => { input[cat] = CATEGORIES[cat].hasFinish ? parts[i].split(":") : parts[i]; });
  const state = normalizeDesignState(input);
  if (!state) return null;
  const styleId = style === "-" ? null : style;
  if (styleId && !STYLES.some(s => s.id === styleId)) return null;
  return { state, styleId };
}

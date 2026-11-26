/**
 * Kitchen designs are shared as links that carry the choices (?d=...). No server storage.
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeDesign, decodeDesign } from "../public/shared/designLink.js";
import { STYLES, DEFAULT_STATE, CATEGORIES } from "../public/shared/kitchenCatalog.js";
import { buildWhatsappMessage } from "../public/components/designer/whatsappMessage.js";

test("every ready-made style survives a round trip through the link", () => {
  for (const s of STYLES) {
    const value = encodeDesign(s.state, s.id);
    assert.deepEqual(decodeDesign(value), { state: s.state, styleId: s.id }, s.id);
  }
});

test("a custom design without a style survives a round trip", () => {
  const state = { upper: ["lacquer-navy", "gloss"], lower: ["walnut-dark", "satin"], counter: "granite-black", handles: "original", backsplash: "zellige-green" };
  assert.deepEqual(decodeDesign(encodeDesign(state)), { state, styleId: null });
  assert.deepEqual(decodeDesign(encodeDesign(DEFAULT_STATE)), { state: { ...DEFAULT_STATE }, styleId: null });
});

test("the link value is short, readable, URL-safe and survives WhatsApp formatting", () => {
  const value = encodeDesign(STYLES[2].state, STYLES[2].id);
  assert.match(value, /^[a-z0-9.:-]+$/);
  assert.doesNotMatch(value, /[_*~`]/, "WhatsApp formats _ * ~ and backticks");
  assert.ok(value.length < 140, `too long: ${value.length}`);
  assert.equal(new URL("https://x.test/?d=" + value).searchParams.get("d"), value, "must read back from a URL unchanged");
});

test("malformed or tampered links are rejected instead of half-applied", () => {
  const good = encodeDesign(STYLES[0].state, STYLES[0].id);
  const bad = [
    "", "garbage",
    good.replace(/^1\./, "9."),                                  // unknown format version
    good.replace("quartz-white", "unobtainium"),                 // unknown option
    good.replace(STYLES[0].id, "no-such-style"),                 // unknown style
    good.replace(":matte", ":shiny"),                            // unknown finish
    good + ".extra", good.split(".").slice(0, -1).join("."),     // wrong number of parts
    good.replace("lacquer-cream", "<script>"),                   // injection attempt
    "1.-." + "a.".repeat(300)                                    // oversized
  ];
  for (const v of bad) assert.equal(decodeDesign(v), null, `should reject: ${v.slice(0, 60)}`);
  assert.equal(decodeDesign(undefined), null);
});

test("the link covers every designer category", () => {
  assert.equal(encodeDesign(DEFAULT_STATE).split(".").length, 2 + Object.keys(CATEGORIES).length);
});

test("the WhatsApp message carries the design link and only plain characters", () => {
  const url = "https://kovo-site.vercel.app/?d=" + encodeDesign(STYLES[1].state, STYLES[1].id) + "#design";
  const text = buildWhatsappMessage({ state: STYLES[1].state, styleId: STYLES[1].id, kitchenTitle: "מטבח", designUrl: url, categories: ["upper", "lower", "counter", "backsplash"] });
  assert.ok(text.includes(url));
  assert.doesNotMatch(text, /ידיות/, "areas the photo does not have are left out");
  assert.doesNotMatch(text, /[\u{10000}-\u{10FFFF}]/u, "no emoji: the wa.me redirect corrupts them");
});

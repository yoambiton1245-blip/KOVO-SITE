/**
 * Business contact details have one source: public/config/site.config.js.
 * Every page, the structured data and the scripts must agree with it. Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "../public/config/site.config.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const files = walk(PUB).filter(f => /\.(html|js)$/.test(f)).map(f => ({ f: path.relative(ROOT, f), s: fs.readFileSync(f, "utf8") }));
const digits = v => v.replace(/\D/g, "");
const PHONE = digits(SITE.phoneE164);                    // 972555035890
const WA = digits(SITE.whatsappUrl);                      // 972555035890

test("every tel: link dials the configured phone", () => {
  const found = files.flatMap(({ f, s }) => [...s.matchAll(/tel:(\+?\d+)/g)].map(m => ({ f, n: digits(m[1]) })));
  assert.ok(found.length >= 3, "expected phone links on the pages");
  for (const { f, n } of found) assert.equal(n, PHONE, `${f} dials ${n}`);
});

test("every phone number written on a page is the configured one", () => {
  const local = "0" + PHONE.slice(3);                     // 0555035890
  for (const { f, s } of files) {
    for (const m of s.matchAll(/(?<![\d#])(?:\+972[ -]?\d{2}[ -]?\d{3}[ -]?\d{4}|0\d{1,2}-\d{3}-\d{4})(?!\d)/g)) {
      const d = digits(m[0]);
      assert.ok(d === PHONE || d === local, `${f} shows another number: ${m[0]}`);
    }
  }
});

test("every WhatsApp link goes to the configured number", () => {
  const found = files.flatMap(({ f, s }) => [...s.matchAll(/wa\.me\/(\d+)/g)].map(m => ({ f, n: m[1] })));
  assert.ok(found.length >= 5);
  for (const { f, n } of found) assert.equal(n, WA, `${f} → wa.me/${n}`);
});

test("every email address on the site is the configured one", () => {
  for (const { f, s } of files) {
    for (const m of s.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) {
      if (/example\.|localhost/.test(m[0])) continue;
      assert.equal(m[0].toLowerCase(), SITE.email.toLowerCase(), `${f} shows ${m[0]}`);
    }
  }
});

test("every Instagram link is the configured profile", () => {
  for (const { f, s } of files) for (const m of s.matchAll(/https:\/\/(?:www\.)?instagram\.com\/[^"'\s)]*/g)) assert.equal(m[0], SITE.instagramUrl, f);
});

test("structured data uses the configured phone and email", () => {
  const html = fs.readFileSync(path.join(PUB, "index.html"), "utf8");
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const biz = data["@graph"].find(n => n["@type"] === "HomeAndConstructionBusiness");
  assert.equal(biz.telephone, SITE.phoneE164);
  assert.equal(biz.email, SITE.email);
  assert.ok(biz.sameAs.includes(SITE.instagramUrl));
});

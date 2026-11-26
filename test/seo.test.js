/**
 * SEO and sharing addresses must point at the live site, and every file they reference must exist.
 * Run: npm test. If the site moves to its own domain, change SITE_URL here and in the files it checks.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://kovo-site.vercel.app";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const read = p => fs.readFileSync(path.join(PUB, p), "utf8");
const html = read("index.html");

/** Map an absolute site URL to the file that serves it, and check that it exists. */
const assertServed = url => {
  assert.ok(url.startsWith(SITE_URL + "/"), `${url} should start with ${SITE_URL}/`);
  let rel = url.slice(SITE_URL.length).split("#")[0];
  if (rel === "/" || rel === "") rel = "/index.html";
  assert.ok(fs.existsSync(path.join(PUB, rel)), `${url} points to a missing file (public${rel})`);
};
const meta = (attr, name) => {
  const m = html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`));
  assert.ok(m, `missing <meta ${attr}="${name}">`);
  return m[1];
};

test("no page, script or file in public/ refers to an inactive domain", () => {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
  const offenders = walk(PUB).filter(f => /\.(html|js|css|xml|txt|json)$/.test(f)).filter(f => /kovo\.co\.il/i.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(offenders.map(f => path.relative(ROOT, f)), []);
});

test("canonical and Open Graph URL point to the live home page", () => {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, SITE_URL + "/");
  assert.equal(meta("property", "og:url"), SITE_URL + "/");
});

test("share image (Open Graph + Twitter) is an existing file on the live site", () => {
  assertServed(meta("property", "og:image"));
  assertServed(meta("name", "twitter:image"));
});

test("structured data is valid JSON and every URL in it is served by the site", () => {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(block, "missing JSON-LD");
  const data = JSON.parse(block);
  const urls = [];
  const collect = v => { if (typeof v === "string" && /^https?:\/\//.test(v)) urls.push(v); else if (v && typeof v === "object") Object.values(v).forEach(collect); };
  collect(data);
  const own = urls.filter(u => !u.startsWith("https://schema.org") && !u.includes("instagram.com"));
  assert.ok(own.length >= 5, "expected the site's own URLs in the structured data");
  own.forEach(assertServed);
});

test("sitemap lists only live URLs that exist", () => {
  const locs = [...read("sitemap.xml").matchAll(/<(?:image:)?loc>([^<]+)<\/(?:image:)?loc>/g)].map(m => m[1]);
  assert.ok(locs.length >= 3);
  locs.forEach(assertServed);
});

test("robots.txt points to the live sitemap", () => {
  const line = read("robots.txt").split(/\r?\n/).find(l => l.startsWith("Sitemap:"));
  assert.equal(line, `Sitemap: ${SITE_URL}/sitemap.xml`);
  assert.ok(fs.existsSync(path.join(PUB, "sitemap.xml")));
});

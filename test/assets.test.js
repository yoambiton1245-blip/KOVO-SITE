import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const read = p => readFileSync(join(ROOT, p), "utf8");
const pages = readdirSync(PUBLIC).filter(f => f.endsWith(".html"));
const vercel = JSON.parse(read("vercel.json"));
const header = (source, key) =>
  vercel.headers.find(h => h.source === source)?.headers.find(h => h.key === key)?.value;

test("fonts are served by the site itself, never from Google", () => {
  for (const page of pages) assert.doesNotMatch(read(`public/${page}`), /fonts\.(googleapis|gstatic)\.com/, page);
  const css = read("public/styles/main.css");
  assert.doesNotMatch(css, /fonts\.(googleapis|gstatic)\.com|@import/);
  const urls = [...css.matchAll(/url\("\.\.\/(assets\/fonts\/[^"]+)"\)/g)].map(m => m[1]);
  assert.ok(urls.length >= 4, "expected the Hebrew and Latin files of both fonts");
  for (const u of urls) assert.ok(existsSync(join(PUBLIC, u)), `missing font ${u}`);
  for (const m of read("public/index.html").matchAll(/rel="preload" as="font"[^>]*href="([^"]+)"/g))
    assert.ok(existsSync(join(PUBLIC, m[1])), `missing preloaded font ${m[1]}`);
});

test("Content-Security-Policy allows only the site's own origin", () => {
  const csp = header("/(.*)", "Content-Security-Policy");
  assert.ok(csp, "CSP header is missing");
  assert.doesNotMatch(csp, /https?:|\*|'unsafe-inline'|'unsafe-eval'/);
  for (const d of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "font-src 'self'", "frame-ancestors 'none'"])
    assert.ok(csp.includes(d), `CSP lacks ${d}`);
});

test("cache rules: assets for a day, code always revalidated", () => {
  assert.equal(header("/assets/(.*)", "Cache-Control"), "public, max-age=86400");
  assert.match(header("/(.*)\\.(js|css)", "Cache-Control"), /max-age=0, must-revalidate/);
});

test("every hero video and poster file exists", () => {
  const html = read("public/index.html");
  const refs = [...html.matchAll(/(?:data-src(?:-webm|-mobile)?|poster)="([^"]+)"/g)].map(m => m[1]);
  assert.ok(refs.some(r => r.endsWith(".webm")) && refs.some(r => r.endsWith(".mp4")), "expected WebM + MP4 sources");
  for (const r of refs) assert.ok(existsSync(join(PUBLIC, r)), `missing ${r}`);
});

test("every gallery photo and its smaller version exist", async () => {
  const { PROJECTS } = await import("../public/config/projects.js");
  assert.ok(PROJECTS.length > 0);
  for (const p of PROJECTS) {
    assert.ok(existsSync(join(PUBLIC, p.image)), `missing ${p.image}`);
    if (p.small) {
      assert.ok(existsSync(join(PUBLIC, p.small)), `missing ${p.small}`);
      assert.ok(Number(p.width) > 800, `${p.image} needs its real width for srcset`);
    }
  }
});

test("the Node.js version is pinned to one major version", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.engines?.node ?? "", /^\d+\.x$/);
});

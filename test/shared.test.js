/**
 * Shared code has exactly one copy: public/shared/ (the browser loads it, the server functions import it).
 * Also checks that legacy hosting code is gone and every designer kitchen is wired up. Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KITCHENS } from "../public/config/designer/kitchens.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

test("there is a single copy of the shared code (public/shared)", () => {
  assert.equal(fs.existsSync(path.join(ROOT, "shared")), false, "a second copy in /shared would drift; import from public/shared");
  for (const f of walk("lib").concat(walk("api"))) {
    for (const m of read(f).matchAll(/from "([^"]*shared\/[^"]+)"/g)) {
      assert.match(m[1], /public\/shared\//, `${f} must import the shared code from public/shared`);
      assert.ok(fs.existsSync(path.resolve(path.join(ROOT, path.dirname(f)), m[1])), `${f}: ${m[1]} not found`);
    }
  }
});

test("every relative import in the site resolves to a real file inside public/", () => {
  const pub = path.join(ROOT, "public");
  for (const f of walk("public").filter(f => f.endsWith(".js"))) {
    for (const m of read(f).matchAll(/from "(\.[^"]+)"/g)) {
      const target = path.resolve(path.join(ROOT, path.dirname(f)), m[1]);
      assert.ok(target.startsWith(pub) && fs.existsSync(target), `${f}: ${m[1]} does not resolve inside public/`);
    }
  }
});

test("no Netlify or old self-hosted analytics code is left", () => {
  const files = walk("public").filter(f => /\.(js|html)$/.test(f)).concat(walk("lib"), walk("api"), ["package.json", "vercel.json"]);
  const offenders = files.filter(f => /netlify|\/api\/events|\/api\/projects|\/api\/designs|@vercel\/blob|kovo-hosting/i.test(read(f)));
  assert.deepEqual(offenders, []);
});

test("every designer kitchen's photo and masks exist", async () => {
  for (const k of KITCHENS) {
    assert.ok(fs.existsSync(path.join(ROOT, "public", k.image.split("?")[0])), k.image);
    for (const area of Object.values(k.areas)) if (area.mask) assert.ok(fs.existsSync(path.join(ROOT, "public", area.mask.split("?")[0])), area.mask);
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const credits = readFileSync(join(ROOT, "IMAGE-CREDITS.md"), "utf8");
// "name(-800).webp" in the table covers both the photo and its smaller copy
const listed = file => credits.includes(file) || credits.includes(file.replace(/-800\.webp$/, "(-800).webp")) || credits.includes(file.replace(/\.webp$/, "(-800).webp"));

test("every photo shown on the site has a verified source in IMAGE-CREDITS.md", async () => {
  const { PROJECTS } = await import("../public/config/projects.js");
  const { KITCHENS } = await import("../public/config/designer/kitchens.js");
  const html = readFileSync(join(ROOT, "public/index.html"), "utf8");
  const files = [
    ...PROJECTS.flatMap(p => [p.image, p.small].filter(Boolean)),
    ...KITCHENS.map(k => k.image),
    ...[...html.matchAll(/<img[^>]+src="(assets\/img\/[^"]+\.(?:webp|jpe?g|png))"/g)].map(m => m[1]),
    "assets/img/og-image.jpg"
  ].map(f => basename(f));
  const missing = [...new Set(files)].filter(f => !listed(f));
  assert.deepEqual(missing, [], "add these to IMAGE-CREDITS.md with a verified licence first");
});

/**
 * The browser loads public/shared/*, the server functions import shared/*. They must stay identical.
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KITCHENS } from "../public/config/designer/kitchens.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = p => fs.readFileSync(path.join(ROOT, p), "utf8").replace(/\r\n/g, "\n");

for (const file of fs.readdirSync(path.join(ROOT, "shared"))) {
  test(`shared/${file} and public/shared/${file} are identical`, () => {
    assert.equal(read(`public/shared/${file}`), read(`shared/${file}`), `copy shared/${file} to public/shared/${file}`);
  });
}

test("every designer kitchen is accepted by the server and its files exist", async () => {
  const validator = read("lib/design.validator.js");
  for (const k of KITCHENS) {
    assert.match(validator, new RegExp(`"${k.id}"`), `add "${k.id}" to KITCHEN_IDS in lib/design.validator.js`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", k.image)), k.image);
    for (const area of Object.values(k.areas)) if (area.mask) assert.ok(fs.existsSync(path.join(ROOT, "public", area.mask)), area.mask);
  }
});

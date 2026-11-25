/**
 * Tests for the Vercel Functions in api/. Run: npm test
 * Email and Blob storage are replaced by in-memory stand-ins, so nothing is sent or stored.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setTestTransport } from "../lib/email.js";
import { setTestStore } from "../lib/designStore.js";
import * as leads from "../api/leads.js";
import * as designsIndex from "../api/designs/index.js";
import * as designsId from "../api/designs/[id].js";
import { STYLES } from "../shared/kitchenCatalog.js";

const sent = [];
process.env.SMTP_USER = "sender@example.com";
process.env.SMTP_PASS = "x";
process.env.LEAD_EMAIL_TO = "owner@example.com";

beforeEach(() => {
  sent.length = 0;
  setTestTransport({ sendMail: async m => { sent.push(m); } });
  setTestStore(new Map());
});

const post = (url, body, type = "application/json") =>
  new Request("http://localhost" + url, { method: "POST", headers: { "content-type": type }, body: typeof body === "string" ? body : JSON.stringify(body) });

const goodLead = { fullName: "ישראל ישראלי", phone: "050-123-4567", email: "a@b.co", projectType: "new_kitchen", message: "שלום\nמטבח חדש", website: "" };

test("valid lead is emailed with readable details", async () => {
  const res = await leads.POST(post("/api/leads", goodLead));
  assert.equal(res.status, 201);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "owner@example.com");
  assert.equal(sent[0].replyTo, "a@b.co");
  assert.match(sent[0].subject, /ישראל ישראלי/);
  assert.match(sent[0].text, /\+972501234567/);
  assert.match(sent[0].text, /מטבח חדש/);
});

test("HTML in a lead is stripped and escaped", async () => {
  const res = await leads.POST(post("/api/leads", { ...goodLead, message: "<script>alert(1)</script>hi" }));
  assert.equal(res.status, 201);
  assert.doesNotMatch(sent[0].html, /<script>/);
});

test("invalid lead returns field errors and sends nothing", async () => {
  const res = await leads.POST(post("/api/leads", { ...goodLead, fullName: "", phone: "12" }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error.fields.fullName);
  assert.ok(body.error.fields.phone);
  assert.equal(sent.length, 0);
});

test("unknown fields and non-JSON are rejected", async () => {
  assert.equal((await leads.POST(post("/api/leads", { ...goodLead, admin: true }))).status, 400);
  assert.equal((await leads.POST(post("/api/leads", "name=x", "application/x-www-form-urlencoded"))).status, 415);
  assert.equal((await leads.POST(post("/api/leads", "{bad"))).status, 400);
  assert.equal((await leads.POST(post("/api/leads", JSON.stringify({ ...goodLead, message: "x".repeat(20000) })))).status, 413);
});

test("honeypot lead pretends success but sends nothing", async () => {
  const res = await leads.POST(post("/api/leads", { ...goodLead, website: "http://spam" }));
  assert.equal(res.status, 201);
  assert.equal(sent.length, 0);
});

test("email failure is reported to the visitor, not swallowed", async () => {
  setTestTransport({ sendMail: async () => { throw new Error("smtp down"); } });
  const res = await leads.POST(post("/api/leads", goodLead));
  assert.equal(res.status, 502);
});

test("missing email settings return 503", async () => {
  setTestTransport(null);
  const saved = process.env.SMTP_PASS;
  delete process.env.SMTP_PASS;
  try {
    assert.equal((await leads.POST(post("/api/leads", goodLead))).status, 503);
  } finally {
    process.env.SMTP_PASS = saved;
  }
});

test("design save and load round-trip", async () => {
  const save = await designsIndex.POST(post("/api/designs", { kitchenId: "warm-stone", styleId: STYLES[0].id, state: STYLES[0].state }));
  assert.equal(save.status, 201);
  const { id } = await save.json();
  assert.match(id, /^[A-Za-z0-9]{10}$/);
  const load = await designsId.GET(new Request("http://localhost/api/designs/" + id));
  assert.equal(load.status, 200);
  const { data } = await load.json();
  assert.equal(data.id, id);
  assert.equal(data.kitchenId, "warm-stone");
});

test("design validation and missing ids", async () => {
  assert.equal((await designsIndex.POST(post("/api/designs", { kitchenId: "nope", state: {} }))).status, 400);
  assert.equal((await designsId.GET(new Request("http://localhost/api/designs/abcdefgh12"))).status, 404);
  assert.equal((await designsId.GET(new Request("http://localhost/api/designs/..%2Fx"))).status, 400);
});

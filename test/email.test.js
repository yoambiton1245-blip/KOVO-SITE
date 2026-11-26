/**
 * Lead email settings: the form only reports success when email is fully configured,
 * and the message goes to LEAD_EMAIL_TO (or the sending address when it is not set).
 * Run: npm test. No email is sent.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isEmailConfigured, buildLeadEmail } from "../lib/email.js";

const KEYS = ["SMTP_USER", "SMTP_PASS", "LEAD_EMAIL_TO", "LEAD_EMAIL_FROM", "SMTP_HOST", "SMTP_PORT"];
beforeEach(() => KEYS.forEach(k => delete process.env[k]));
const lead = { fullName: "בדיקה", phone: "+972500000000", email: null, projectType: "new_kitchen", message: null };

test("email is not configured until user, app password and recipient exist", () => {
  assert.equal(isEmailConfigured(), false);
  process.env.SMTP_USER = "sender@example.com";
  assert.equal(isEmailConfigured(), false, "an address without a password must not count as configured");
  process.env.SMTP_PASS = "x";
  assert.equal(isEmailConfigured(), true, "recipient falls back to the sending address");
});

test("leads go to LEAD_EMAIL_TO when it is set", () => {
  process.env.SMTP_USER = "sender@example.com"; process.env.SMTP_PASS = "x"; process.env.LEAD_EMAIL_TO = "owner@example.com";
  const m = buildLeadEmail(lead);
  assert.equal(m.to, "owner@example.com");
  assert.equal(m.from.address, "sender@example.com");
});

test("without LEAD_EMAIL_TO the lead goes to the sending address", () => {
  process.env.SMTP_USER = "sender@example.com"; process.env.SMTP_PASS = "x";
  assert.equal(buildLeadEmail(lead).to, "sender@example.com");
});

test("the email never contains the app password", () => {
  process.env.SMTP_USER = "sender@example.com"; process.env.SMTP_PASS = "very-secret-app-password";
  const m = buildLeadEmail(lead);
  assert.doesNotMatch(JSON.stringify(m), /very-secret-app-password/);
});

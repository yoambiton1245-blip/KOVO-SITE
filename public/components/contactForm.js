import { api } from "../services/api.js";
import { SITE } from "../config/site.config.js";
import { track } from "../services/analytics.js";
import { PROJECT_TYPES, LIMITS, PHONE_PATTERN, EMAIL_PATTERN } from "../../shared/constants.js";

/**
 * Contact form: client-side validation for quick feedback.
 * The server validates and sanitizes again; the client checks are only for UX.
 */
export function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const status = document.getElementById("formStatus");
  const btn = form.querySelector("[type=submit]");

  // Build the project-type options from the shared list so client and server always agree
  const select = document.getElementById("fType");
  select.innerHTML = '<option value="" disabled selected>בחרו</option>' +
    Object.entries(PROJECT_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");

  const rules = {
    fullName: ["fName", v => v.trim().length >= LIMITS.nameMin && v.trim().length <= LIMITS.nameMax, "נא למלא שם מלא"],
    phone: ["fPhone", v => PHONE_PATTERN.test(v.trim()), "נא למלא מספר טלפון תקין"],
    email: ["fEmail", v => !v.trim() || EMAIL_PATTERN.test(v.trim()), "כתובת האימייל אינה תקינה"],
    projectType: ["fType", v => v in PROJECT_TYPES, "נא לבחור מה מתכננים"],
    message: ["fMsg", v => v.length <= LIMITS.messageMax, `עד ${LIMITS.messageMax} תווים`]
  };

  const setError = (id, msg) => {
    const el = document.getElementById(id);
    const errEl = document.getElementById(id + "Err");
    el.closest(".field").classList.toggle("has-error", !!msg);
    el.setAttribute("aria-invalid", String(!!msg));
    if (errEl) { el.setAttribute("aria-describedby", errEl.id); errEl.textContent = msg || ""; }
  };

  const validate = () => {
    let first = null;
    Object.values(rules).forEach(([id, ok, msg]) => {
      const el = document.getElementById(id);
      const valid = ok(el.value);
      setError(id, valid ? "" : msg);
      if (!valid && !first) first = el;
    });
    return first;
  };

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";
    const bad = validate();
    if (bad) { bad.focus(); return; }

    const fd = new FormData(form);
    const payload = {
      fullName: fd.get("name"),
      phone: fd.get("phone"),
      email: fd.get("email"),
      projectType: fd.get("projectType"),
      message: fd.get("message"),
      website: fd.get("website") // honeypot
    };

    btn.disabled = true;
    btn.textContent = "שולח...";
    try {
      if (SITE.hosting === "netlify") await submitToNetlifyForms(form);
      else await api.createLead(payload);
      form.reset();
      status.classList.add("ok");
      status.textContent = "תודה! הפנייה התקבלה, ואור יחזור אליכם בהקדם.";
      track("form_submit", { type: payload.projectType });
    } catch (err) {
      // Map server-side field errors back onto the form
      Object.entries(err.fields || {}).forEach(([field, msg]) => rules[field] && setError(rules[field][0], msg));
      status.classList.add("err");
      track("form_error", { status: String(err.status || 0) });
      status.textContent = err.status === 429
        ? "נשלחו כמה פניות ברצף. נסו שוב בעוד כמה דקות, או כתבו לנו בוואטסאפ."
        : err.status === 400
          ? "יש לתקן את השדות המסומנים."
          : "השליחה לא הצליחה. נסו שוב בעוד רגע, או כתבו לנו בוואטסאפ.";
    } finally {
      btn.disabled = false;
      btn.textContent = "שליחת פנייה";
    }
  });

  form.addEventListener("input", e => {
    const field = e.target.closest(".field");
    if (field?.classList.contains("has-error")) validate();
  });
}

/**
 * Netlify Forms: POST the form fields (urlencoded) to the site root. Netlify stores the submission,
 * filters spam (honeypot "website" + Akismet) and emails it to the address set in the Netlify dashboard.
 */
async function submitToNetlifyForms(form) {
  const fd = new FormData(form);
  fd.set("form-name", form.getAttribute("name") || "contact");
  fd.set("projectType", PROJECT_TYPES[fd.get("projectType")] || fd.get("projectType")); // readable label in the email
  const res = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fd).toString()
  });
  if (!res.ok) { const err = new Error("Netlify form failed"); err.status = res.status; throw err; }
}

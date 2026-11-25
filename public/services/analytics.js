/**
 * Privacy-conscious analytics.
 * - No cookies, no personal data: never send names, phone numbers, emails or message text.
 * - Respects Do Not Track / Global Privacy Control.
 * - Events go to the KOVO backend (/api/events), which stores counts only (no IP, no user agent).
 * - Batched and sent with sendBeacon, so it never slows the page.
 *
 * Usage: track("whatsapp_click", { location: "floating" })
 * Elements can also opt in declaratively: <a data-track="cta_click" data-track-label="hero">
 */
import { SITE } from "../config/site.config.js";

const optedOut = SITE.hosting !== "server" || navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
const queue = [];
let timer = null;

const ALLOWED_PROP = /^[\w\-.:/ א-ת]{0,60}$/;

export function track(name, props = {}) {
  if (optedOut || !/^[a-z_]{2,40}$/.test(name)) return;
  const clean = {};
  for (const [k, v] of Object.entries(props)) {
    if (/^[a-z_]{1,20}$/.test(k) && ALLOWED_PROP.test(String(v))) clean[k] = String(v);
  }
  queue.push({ name, props: clean, path: location.pathname });
  clearTimeout(timer);
  timer = setTimeout(flush, 1500);
}

function flush() {
  if (!queue.length) return;
  const body = JSON.stringify({ events: queue.splice(0, 20) });
  const url = SITE.apiBase + "/api/events";
  const blob = new Blob([body], { type: "application/json" });
  if (!(navigator.sendBeacon && navigator.sendBeacon(url, blob))) {
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }
}

/** Page view + delegated click tracking for [data-track] elements and outbound social links. */
export function initAnalytics() {
  if (optedOut) return;
  track("page_view", { ref: document.referrer ? new URL(document.referrer).hostname.slice(0, 60) : "direct" });
  document.addEventListener("click", e => {
    const el = e.target.closest("a, button");
    if (!el) return;
    if (el.matches("[data-whatsapp]")) return track("whatsapp_click", { location: el.dataset.trackLabel || "link" });
    if (el.matches("[data-instagram]")) return track("instagram_click", { location: el.dataset.trackLabel || "link" });
    if (el.matches('a[href^="tel:"]')) return track("phone_click", { location: el.dataset.trackLabel || "link" });
    if (el.dataset.track) return track(el.dataset.track, { label: el.dataset.trackLabel || "" });
    if (el.closest("#mainNav") && el.getAttribute("href")?.startsWith("#")) return track("nav_click", { target: el.getAttribute("href").slice(1) });
  }, { capture: true });
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
}

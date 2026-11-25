/**
 * Public site configuration.
 * Only public values belong here (anything in this file is visible to every visitor).
 * Secrets, tokens and credentials live in backend/.env and never reach the browser.
 */
export const SITE = Object.freeze({
  whatsappUrl: "https://wa.me/972555035890",
  whatsappMessage: "שלום KOVO, אשמח לשמוע פרטים על תכנון מטבח",
  instagramUrl: "https://www.instagram.com/kovo.kitchen/",
  phoneE164: "+972549778853",
  phoneDisplay: "054-977-8853",
  /** API base URL. Read from <meta name="kovo-api-base">; empty = same origin. */
  apiBase: (document.querySelector('meta[name="kovo-api-base"]')?.content || "").replace(/\/$/, ""),
  /**
   * Hosting mode, from <meta name="kovo-hosting">:
   *  "server"  (default) – Node/Express backend: leads, admin, analytics, saved designs.
   *  "netlify" – static hosting + Netlify Functions: the contact form uses Netlify Forms,
   *              saved designs use a Netlify Function, self-hosted analytics and the gallery API are off.
   */
  hosting: document.querySelector('meta[name="kovo-hosting"]')?.content === "netlify" ? "netlify" : "server"
});

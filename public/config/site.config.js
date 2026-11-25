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
   *  "vercel"  – static hosting + Vercel Functions (api/): the contact form posts to /api/leads (email),
   *              saved designs use /api/designs, self-hosted analytics and the gallery API are off.
   * With "vercel" in the meta tag, a copy still served from *.netlify.app keeps using Netlify Forms,
   * so both hosts work during the move.
   */
  hosting: resolveHosting(document.querySelector('meta[name="kovo-hosting"]')?.content)
});

function resolveHosting(meta) {
  if (meta === "vercel") return location.hostname.endsWith(".netlify.app") ? "netlify" : "vercel";
  return meta === "netlify" ? "netlify" : "server";
}

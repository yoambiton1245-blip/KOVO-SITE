/**
 * Public site configuration.
 * Only public values belong here (anything in this file is visible to every visitor).
 * This is the single source of the business contact details: the static pages repeat them so links
 * work without JavaScript, and test/contact.test.js fails if any page disagrees with this file.
 * Secrets (email password, storage tokens) live only in Vercel Environment Variables and never reach the browser.
 */
export const SITE = Object.freeze({
  whatsappUrl: "https://wa.me/972555035890",
  whatsappMessage: "שלום KOVO, אשמח לשמוע פרטים על תכנון מטבח",
  instagramUrl: "https://www.instagram.com/kovo.kitchen/",
  phoneE164: "+972555035890",
  phoneDisplay: "055-503-5890",
  email: "Kovo.kitchen1@gmail.com"
});

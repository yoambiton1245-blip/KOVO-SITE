import { SITE } from "../config/site.config.js";

/**
 * The WhatsApp and Instagram links are already correct in the HTML (so they work without JS).
 * This only adds the pre-filled WhatsApp message and makes sure every link uses the official URLs.
 */
export function initSocialLinks() {
  const wa = `${SITE.whatsappUrl}?text=${encodeURIComponent(SITE.whatsappMessage)}`;
  document.querySelectorAll("[data-whatsapp]").forEach(a => {
    a.href = wa;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
  document.querySelectorAll("[data-instagram]").forEach(a => {
    a.href = SITE.instagramUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
}

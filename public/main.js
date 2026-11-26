/**
 * KOVO frontend entry point.
 * Each feature lives in its own component under ./components.
 */
import { initHeader } from "./components/header.js";
import { initHeroVideo } from "./components/heroVideo.js";
import { initSocialLinks } from "./components/socialLinks.js";
import { initReveal } from "./components/reveal.js";
import { createLightbox } from "./components/lightbox.js";
import { initGallery } from "./components/gallery.js";
import { initContactForm } from "./components/contactForm.js";
import { initDesigner } from "./components/designer/designer.js";
import { keepHashTargetInView } from "./components/hashAnchor.js";

document.documentElement.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

initSocialLinks();
initHeader();
initHeroVideo(reduceMotion);
initReveal(reduceMotion);
initGallery({ lightbox: createLightbox(), reduceMotion });
initContactForm();
initDesigner({ reduceMotion });
keepHashTargetInView();

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

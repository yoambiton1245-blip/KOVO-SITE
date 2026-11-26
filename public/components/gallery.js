import { SITE } from "../config/site.config.js";
import { api } from "../services/api.js";
import { initReveal } from "./reveal.js";
import { track } from "../services/analytics.js";

/** Minimal HTML escaping for values coming from the API. */
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Allow only images served by this site (relative paths). */
const safeImage = src => (/^(\/)?assets\/img\/[\w\-./]+\.(webp|jpe?g|png|avif)$/i.test(src) ? src : "");

/** Editorial layout sizes: feature (full width), wide, tall (default), half, small. */
const SIZES = new Set(["feature", "wide", "tall", "half", "small"]);
const sizeClass = size => "g-" + (SIZES.has(size) ? size : "tall");

/** On "all", show this many first and reveal the rest on request. */
const INITIAL = 8;

const card = (it, i) => `
  <figure class="g-item ${sizeClass(it.size)} reveal" data-cat="${esc(it.category)}" data-index="${i}">
    <button class="g-btn" type="button">
      <div class="g-frame"><img src="${esc(safeImage(it.image))}" alt="${esc(it.alt)}" loading="lazy" decoding="async"></div>
      <figcaption class="g-meta"><span class="g-title">${esc(it.title)}</span><span class="g-spec">${esc(it.spec)}</span></figcaption>
      <span class="visually-hidden"> – הגדלת התמונה</span>
    </button>
  </figure>`;

/**
 * Gallery with filters. Loads projects once from the API (lazily, when the section approaches
 * the viewport) and filters on the client, so filter clicks cost no requests.
 */
export function initGallery({ lightbox, reduceMotion }) {
  const grid = document.getElementById("gallery");
  if (!grid) return;
  let items = [];
  let visible = [];
  let current = "all";
  let expanded = false;
  const moreBtn = document.getElementById("galleryMore");

  grid.innerHTML = Array.from({ length: 6 }, () => '<div class="g-item"><div class="g-skeleton"></div></div>').join("");

  const render = () => {
    grid.innerHTML = items.map(card).join("") || '<p class="gallery-note">הפרויקטים יעלו בקרוב.</p>';
    applyFilter(current, true);
    initReveal(reduceMotion, grid);
  };

  const applyFilter = (cat, instant = false) => {
    current = cat;
    document.querySelectorAll(".filter").forEach(b => {
      const on = b.dataset.filter === cat;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const els = [...grid.querySelectorAll(".g-item[data-index]")];
    const run = () => {
      visible = [];
      const limited = cat === "all" && !expanded;
      els.forEach(el => {
        const show = (cat === "all" || el.dataset.cat === cat) && (!limited || visible.length < INITIAL);
        el.hidden = !show;
        if (show) { visible.push(+el.dataset.index); el.classList.add("is-visible"); }
      });
      if (moreBtn) moreBtn.hidden = !limited || els.length <= INITIAL;
      requestAnimationFrame(() => els.forEach(el => el.classList.remove("is-hiding")));
    };
    if (instant || reduceMotion) return run();
    els.forEach(el => el.classList.add("is-hiding"));
    setTimeout(run, 250);
  };

  document.querySelectorAll(".filter").forEach(b => b.addEventListener("click", () => { applyFilter(b.dataset.filter); track("gallery_filter", { filter: b.dataset.filter }); }));
  document.querySelectorAll("[data-filter-link]").forEach(a => a.addEventListener("click", () => applyFilter(a.dataset.filterLink)));

  moreBtn?.addEventListener("click", () => {
    expanded = true;
    applyFilter(current, true);
    // Move keyboard focus to the first newly shown project
    grid.querySelector(`.g-item[data-index="${visible[INITIAL]}"] .g-btn`)?.focus();
    track("gallery_more");
  });

  grid.addEventListener("click", e => {
    const fig = e.target.closest(".g-item[data-index]");
    if (!fig) return;
    const list = visible.map(i => items[i]);
    lightbox.open(list, visible.indexOf(+fig.dataset.index));
    track("gallery_open");
  });

  const load = async () => {
    try {
      if (SITE.hosting !== "server") throw new Error("no gallery API on static hosting");
      const { data } = await api.getProjects();
      items = Array.isArray(data) ? data : [];
    } catch {
      // API unavailable (e.g. static hosting without backend): use the bundled fallback list
      const { FALLBACK_PROJECTS } = await import("../config/projects.fallback.js");
      items = FALLBACK_PROJECTS;
    }
    render();
  };

  // Load once: when the gallery approaches, or shortly after the page has loaded, whichever comes first.
  // Loading early fixes the gallery's height before the visitor scrolls past it, so content below
  // (the kitchen designer) never jumps on iPhone, where Safari does not compensate for late layout changes.
  let started = false;
  const start = () => { if (!started) { started = true; load(); } };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: "800px 0px" });
    io.observe(grid);
  }
  const whenIdle = () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 600));
  if (document.readyState === "complete") whenIdle(); else addEventListener("load", whenIdle, { once: true });
}

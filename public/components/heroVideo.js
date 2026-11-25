/**
 * Background video for the opening section.
 * - desktop: data-src (16:9 framed version), mobile/tablet (<=900px): data-src-mobile (vertical)
 * - skipped with prefers-reduced-motion or Save-Data: the poster image stays
 * - paused while off-screen
 */
export function initHeroVideo(reduceMotion) {
  const v = document.getElementById("heroVideo");
  if (!v) return;
  if (reduceMotion || navigator.connection?.saveData) return;

  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const src = (mobile && v.dataset.srcMobile) || v.dataset.src;
  if (!src) return;
  if (mobile && v.dataset.posterMobile) v.poster = v.dataset.posterMobile;

  v.src = src;
  v.addEventListener("playing", () => v.classList.add("is-playing"), { once: true });
  v.addEventListener("error", () => v.remove(), { once: true });
  v.play()?.catch(() => { /* autoplay blocked: poster image remains */ });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())).observe(v);
  }
}

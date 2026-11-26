/**
 * Background video for the opening section.
 * - desktop: data-src (16:9 framed version), mobile/tablet (<=900px): data-src-mobile (vertical)
 * - skipped with prefers-reduced-motion or Save-Data: the poster image stays
 * - paused while off-screen
 * - a pause/play button (#heroPause) lets visitors stop the moving background (WCAG 2.2.2)
 */
export function initHeroVideo(reduceMotion) {
  const v = document.getElementById("heroVideo");
  if (!v) return;
  if (reduceMotion || navigator.connection?.saveData) return;

  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const src = (mobile && v.dataset.srcMobile) || v.dataset.src;
  if (!src) return;
  if (mobile && v.dataset.posterMobile) v.poster = v.dataset.posterMobile;

  const btn = document.getElementById("heroPause");
  let userPaused = false;
  const syncButton = () => {
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(userPaused));
    btn.setAttribute("aria-label", userPaused ? "הפעלת סרטון הרקע" : "עצירת סרטון הרקע");
    btn.classList.toggle("is-paused", userPaused);
  };

  v.src = src;
  v.addEventListener("playing", () => { v.classList.add("is-playing"); if (btn) btn.hidden = false; }, { once: true });
  v.addEventListener("error", () => { v.remove(); if (btn) btn.hidden = true; }, { once: true });
  v.play()?.catch(() => { /* autoplay blocked: poster image remains */ });

  btn?.addEventListener("click", () => {
    userPaused = !userPaused;
    if (userPaused) v.pause(); else v.play().catch(() => {});
    syncButton();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) v.pause();
      else if (!userPaused) v.play().catch(() => {});
    }).observe(v);
  }
}

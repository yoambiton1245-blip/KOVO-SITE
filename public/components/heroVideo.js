/**
 * Background video for the opening section.
 * - desktop: data-src-webm (VP9, smallest) when the browser plays it, else data-src (H.264 MP4)
 * - mobile/tablet (<=900px): data-src-mobile (vertical H.264)
 * - starts only after the page has loaded, so it never competes with the text, images and fonts
 * - skipped with prefers-reduced-motion, Save-Data or a very slow connection: the poster image stays
 * - paused while off-screen
 * - a pause/play button (#heroPause) lets visitors stop the moving background (WCAG 2.2.2)
 */
export function initHeroVideo(reduceMotion) {
  const v = document.getElementById("heroVideo");
  if (!v) return;
  const conn = navigator.connection;
  if (reduceMotion || conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || "")) return;

  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const webm = !mobile && v.dataset.srcWebm && v.canPlayType('video/webm; codecs="vp9"') ? v.dataset.srcWebm : "";
  const src = (mobile && v.dataset.srcMobile) || webm || v.dataset.src;
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

  btn?.addEventListener("click", () => {
    userPaused = !userPaused;
    if (userPaused) v.pause(); else v.play().catch(() => {});
    syncButton();
  });

  const start = () => {
    v.src = src;
    v.addEventListener("playing", () => { v.classList.add("is-playing"); if (btn) btn.hidden = false; }, { once: true });
    v.addEventListener("error", () => { v.remove(); if (btn) btn.hidden = true; }, { once: true });
    v.play()?.catch(() => { /* autoplay blocked: poster image remains */ });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) v.pause();
        else if (!userPaused) v.play().catch(() => {});
      }).observe(v);
    }
  };
  if (document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
}

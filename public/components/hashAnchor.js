/**
 * Keep a link's target section (e.g. a shared design link ending in #design) on screen while the
 * page is still filling in. Sections above it (the gallery) load a moment later and grow, which
 * would otherwise push the target out of view. Stops as soon as the visitor scrolls, taps or types,
 * or after a few seconds.
 */
export function keepHashTargetInView() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target || !("ResizeObserver" in window)) return;

  let done = false;
  const stop = () => {
    if (done) return;
    done = true;
    ro.disconnect();
    USER_EVENTS.forEach(t => removeEventListener(t, stop, true));
  };
  const realign = () => {
    if (done) return;
    // Only when the target has drifted; the CSS scroll-margin keeps it clear of the fixed header
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (Math.abs(target.getBoundingClientRect().top - margin) <= 2) return;
    // Jump without the site's smooth scrolling, so the correction is not seen as a scroll animation
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "start" });
    html.style.scrollBehavior = prev;
  };
  const ro = new ResizeObserver(realign);
  const USER_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"];
  USER_EVENTS.forEach(t => addEventListener(t, stop, { capture: true, passive: true }));
  ro.observe(document.body);
  setTimeout(stop, 6000);
}

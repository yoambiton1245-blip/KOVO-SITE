/** Gentle fade-up on scroll. Content is never left hidden (safety timeout). */
export function initReveal(reduceMotion, root = document) {
  const els = [...root.querySelectorAll(".reveal:not(.is-visible)")];
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach(el => io.observe(el));
  setTimeout(() => els.forEach(el => el.classList.add("is-visible")), 4000);
}

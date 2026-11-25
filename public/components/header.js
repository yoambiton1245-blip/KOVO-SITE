/** Sticky header (changes on scroll), mobile menu, and current-section highlight. */
export function initHeader() {
  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("menuToggle");
  if (!header || !toggle) return;

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = open => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
  };
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  const links = [...document.querySelectorAll("#mainNav ul a")];
  const byId = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove("is-current"));
      byId.get(e.target.id)?.classList.add("is-current");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

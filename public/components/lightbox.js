/** Accessible lightbox: Esc closes, arrows navigate (RTL aware), swipe on touch, focus trap. */
export function createLightbox() {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lbImg");
  const cap = document.getElementById("lbCap");
  const btnClose = document.getElementById("lbClose");
  const btnPrev = document.getElementById("lbPrev");
  const btnNext = document.getElementById("lbNext");
  let items = [];
  let pos = 0;
  let lastFocus = null;

  const show = p => {
    pos = (p + items.length) % items.length;
    const it = items[pos];
    img.src = it.image;
    img.alt = it.alt;
    cap.textContent = `${it.title} · ${it.spec}  (${pos + 1}/${items.length})`;
  };
  const open = (list, index) => {
    items = list;
    lastFocus = document.activeElement;
    show(index);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    btnClose.focus();
  };
  const close = () => {
    lb.hidden = true;
    document.body.style.overflow = "";
    lastFocus?.focus();
  };

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(pos - 1));
  btnNext.addEventListener("click", () => show(pos + 1));
  lb.addEventListener("click", e => { if (e.target === lb) close(); });
  document.addEventListener("keydown", e => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(pos + 1);
    if (e.key === "ArrowRight") show(pos - 1);
    if (e.key === "Tab") {
      const f = [btnClose, btnPrev, btnNext];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let sx = null;
  lb.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(pos + (dx > 0 ? 1 : -1));
    sx = null;
  });

  return { open, close };
}

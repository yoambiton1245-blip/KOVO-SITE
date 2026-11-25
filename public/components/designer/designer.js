/**
 * "עצב את המטבח שלך" – kitchen designer UI.
 * Renders the controls from the shared catalog, keeps an undo history, saves designs to the API,
 * exports a PNG snapshot and builds the WhatsApp message.
 */
import { CATEGORIES, FINISHES, STYLES, DEFAULT_STATE, findOption } from "../../../shared/kitchenCatalog.js";
import { KITCHENS } from "../../config/designer/kitchens.js";
import { SITE } from "../../config/site.config.js";
import { api } from "../../services/api.js";
import { track } from "../../services/analytics.js";
import { KitchenRenderer } from "./engine.js";
import { summarize, buildWhatsappMessage } from "./whatsappMessage.js";

const STORAGE_KEY = "kovo.designer.v1";
const clone = s => JSON.parse(JSON.stringify(s));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const storage = {
  get() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; } },
  set(v) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* private mode */ } }
};

function swatchStyle(el, opt) {
  if (opt.original) { el.classList.add("is-original"); return; }
  el.style.backgroundColor = opt.color;
  if (opt.texture) el.style.backgroundImage = `url("assets/designer/textures/${opt.texture}.webp")`;
}

export function initDesigner({ reduceMotion }) {
  const root = document.getElementById("design");
  if (!root) return;

  const kitchen = KITCHENS[0];
  const el = {
    frame: root.querySelector(".stage-frame"),
    canvases: [...root.querySelectorAll(".stage-canvas")],
    loading: root.querySelector(".stage-loading"),
    compare: root.querySelector("[data-dz-compare]"),
    styles: root.querySelector("[data-dz-styles]"),
    tabs: root.querySelector("[data-dz-tabs]"),
    panels: root.querySelector("[data-dz-panels]"),
    undo: root.querySelector("[data-dz-undo]"),
    reset: root.querySelector("[data-dz-reset]"),
    save: root.querySelector("[data-dz-save]"),
    download: root.querySelector("[data-dz-download]"),
    share: root.querySelector("[data-dz-share]"),
    send: root.querySelector("[data-dz-send]"),
    summary: root.querySelector("[data-dz-summary]"),
    status: root.querySelector("[data-dz-status]"),
    live: root.querySelector("[data-dz-live]")
  };

  let renderer = null;
  let state = clone(DEFAULT_STATE);
  let styleId = null;
  let undoStack = [];
  let front = 0;
  let renderToken = 0;
  let savedId = null; // id of the saved design matching the current state

  const setStatus = (msg, kind = "") => { el.status.textContent = msg; el.status.className = "dz-status " + kind; };

  /* ---------- Controls ---------- */
  el.styles.innerHTML = STYLES.map(s => `<button type="button" class="dz-chip" data-style="${s.id}" aria-pressed="false">${s.label}</button>`).join("");

  const catIds = Object.keys(CATEGORIES);
  el.tabs.innerHTML = catIds.map((c, i) => `
    <button type="button" role="tab" id="dz-tab-${c}" aria-controls="dz-panel-${c}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="dz-tab">${CATEGORIES[c].label}</button>`).join("");

  el.panels.innerHTML = catIds.map((c, i) => {
    const def = CATEGORIES[c];
    const groups = def.hasFinish
      ? [["color", "צבע"], ["wood", "עץ ופורניר"]].map(([g, label]) => ({ label, opts: def.options.filter(o => o.group === g || (g === "color" && o.original)) }))
      : [{ label: "חומר", opts: def.options }];
    return `
      <div role="tabpanel" id="dz-panel-${c}" aria-labelledby="dz-tab-${c}" class="dz-panel" ${i ? "hidden" : ""}>
        ${groups.map(g => `
          <fieldset class="dz-group">
            <legend>${g.label}</legend>
            <div class="dz-options">
              ${g.opts.map(o => `
                <label class="dz-option">
                  <input type="radio" name="dz-${c}" value="${o.id}">
                  <span class="dz-swatch" data-swatch="${c}:${o.id}" aria-hidden="true"></span>
                  <span class="dz-label">${o.label}</span>
                </label>`).join("")}
            </div>
          </fieldset>`).join("")}
        ${def.hasFinish ? `
          <fieldset class="dz-group">
            <legend>גימור</legend>
            <div class="dz-segment">
              ${Object.entries(FINISHES).map(([f, fd]) => `
                <label><input type="radio" name="dz-${c}-finish" value="${f}"><span>${fd.label}</span></label>`).join("")}
            </div>
          </fieldset>` : ""}
      </div>`;
  }).join("");

  root.querySelectorAll("[data-swatch]").forEach(s => {
    const [c, id] = s.dataset.swatch.split(":");
    swatchStyle(s, findOption(c, id));
  });

  // Tabs: click + arrow keys (RTL: ArrowLeft = next)
  const tabs = [...el.tabs.querySelectorAll("[role=tab]")];
  const selectTab = tab => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  el.tabs.addEventListener("click", e => { const t = e.target.closest("[role=tab]"); if (t) selectTab(t); });
  el.tabs.addEventListener("keydown", e => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const dir = { ArrowLeft: 1, ArrowRight: -1, Home: -i, End: tabs.length - 1 - i }[e.key];
    if (dir === undefined) return;
    e.preventDefault();
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    next.focus(); selectTab(next);
  });

  /* ---------- State ---------- */
  const syncControls = () => {
    for (const c of catIds) {
      const raw = state[c];
      const [id, finish] = Array.isArray(raw) ? raw : [raw];
      root.querySelectorAll(`input[name="dz-${c}"]`).forEach(r => { r.checked = r.value === id; });
      if (CATEGORIES[c].hasFinish) {
        const opt = findOption(c, id);
        root.querySelectorAll(`input[name="dz-${c}-finish"]`).forEach(r => { r.checked = r.value === finish; r.disabled = !!opt?.original; });
      }
    }
    el.styles.querySelectorAll("[data-style]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.style === styleId)));
    el.undo.disabled = !undoStack.length;
    el.summary.innerHTML = summarize(state).map(r => `<li><span>${r.category}</span><strong>${r.value}</strong></li>`).join("");
    el.canvases.forEach(cv => cv.setAttribute("aria-label", "הדמיית המטבח: " + summarize(state).map(r => `${r.category} ${r.value}`).join(", ")));
  };

  const commit = (next, nextStyle = null, { record = true } = {}) => {
    if (same(next, state) && nextStyle === styleId) return;
    if (record) undoStack.push({ state: clone(state), styleId });
    if (undoStack.length > 50) undoStack.shift();
    state = clone(next);
    styleId = nextStyle;
    savedId = null;
    storage.set({ state, styleId });
    syncControls();
    scheduleRender();
  };

  root.addEventListener("change", e => {
    const input = e.target;
    if (input.type !== "radio" || !input.name.startsWith("dz-")) return;
    const c = input.name.replace(/^dz-/, "").replace(/-finish$/, "");
    const next = clone(state);
    if (input.name.endsWith("-finish")) next[c][1] = input.value;
    else if (CATEGORIES[c].hasFinish) next[c][0] = input.value;
    else next[c] = input.value;
    commit(next, null);
    track("designer_change", { category: c });
  });

  el.styles.addEventListener("click", e => {
    const b = e.target.closest("[data-style]");
    if (!b) return;
    const s = STYLES.find(x => x.id === b.dataset.style);
    commit(clone(s.state), s.id);
    el.live.textContent = `סגנון ${s.label} הוחל`;
    track("designer_style", { style: s.id });
  });

  el.undo.addEventListener("click", () => {
    const prev = undoStack.pop();
    if (!prev) return;
    commit(prev.state, prev.styleId, { record: false });
    el.live.textContent = "השינוי האחרון בוטל";
  });

  el.reset.addEventListener("click", () => {
    commit(clone(DEFAULT_STATE), null);
    el.live.textContent = "העיצוב אופס למטבח המקורי";
    track("designer_reset");
  });

  /* ---------- Rendering ---------- */
  let raf = 0;
  const scheduleRender = () => {
    if (!renderer) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(renderNow);
  };
  const renderNow = async () => {
    const token = ++renderToken;
    const back = 1 - front;
    const cv = el.canvases[back];
    await renderer.render(state, CATEGORIES, cv.getContext("2d"));
    if (token !== renderToken) return; // a newer render started
    el.canvases[back].classList.add("is-front");
    el.canvases[front].classList.remove("is-front");
    front = back;
  };

  // Hold to compare with the original photo
  const showOriginal = on => el.frame.classList.toggle("is-comparing", on);
  el.compare.addEventListener("pointerdown", () => showOriginal(true));
  ["pointerup", "pointerleave", "pointercancel"].forEach(ev => el.compare.addEventListener(ev, () => showOriginal(false)));
  el.compare.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); showOriginal(true); } });
  el.compare.addEventListener("keyup", () => showOriginal(false));

  /* ---------- Save / share ---------- */
  const designUrl = id => `${location.origin}${location.pathname}?design=${encodeURIComponent(id)}#design`;

  const save = async () => {
    if (savedId) return savedId;
    const { id } = await api.saveDesign({ kitchenId: kitchen.id, styleId, state });
    savedId = id;
    return id;
  };

  el.save.addEventListener("click", async () => {
    el.save.disabled = true;
    setStatus("שומר...");
    try {
      const id = await save();
      const url = designUrl(id);
      window.history.replaceState(null, "", `?design=${encodeURIComponent(id)}#design`);
      let copied = false;
      try { await navigator.clipboard.writeText(url); copied = true; } catch { /* not allowed */ }
      setStatus(copied ? "העיצוב נשמר והקישור הועתק." : `העיצוב נשמר. הקישור: ${url}`, "ok");
      track("designer_save");
    } catch {
      setStatus("לא הצלחנו לשמור כרגע. העיצוב נשמר בדפדפן הזה, ואפשר לשלוח אותו בוואטסאפ.", "err");
    } finally {
      el.save.disabled = false;
    }
  });

  const snapshot = () => new Promise(resolve => {
    const src = el.canvases[front];
    const pad = Math.round(src.width * 0.06);
    const c = document.createElement("canvas");
    c.width = src.width; c.height = src.height + pad;
    const ctx = c.getContext("2d");
    ctx.drawImage(src, 0, 0);
    ctx.fillStyle = "#4A1219";
    ctx.fillRect(0, src.height, c.width, pad);
    ctx.fillStyle = "#F6F0E7";
    ctx.font = `500 ${Math.round(pad * 0.42)}px "Frank Ruhl Libre", serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("K O V O", pad * 0.5, src.height + pad / 2);
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    ctx.font = `400 ${Math.round(pad * 0.32)}px "Assistant", sans-serif`;
    ctx.fillText("העיצוב שלי · הדמיה על תמונת השראה", c.width - pad * 0.5, src.height + pad / 2);
    c.toBlob(b => resolve(b), "image/png");
  });

  el.download.addEventListener("click", async () => {
    const blob = await snapshot();
    if (!blob) return setStatus("לא הצלחנו ליצור תמונה.", "err");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "kovo-my-kitchen.png";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus("התמונה ירדה למכשיר.", "ok");
    track("designer_download");
  });

  // Native share sheet with the image file (mobile). Hidden where unsupported.
  const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob()], "x.png", { type: "image/png" })] }));
  el.share.hidden = !canShareFiles;
  el.share.addEventListener("click", async () => {
    const blob = await snapshot();
    const file = new File([blob], "kovo-my-kitchen.png", { type: "image/png" });
    try {
      await navigator.share({ files: [file], text: "המטבח שעיצבתי באתר KOVO" });
      track("designer_share_image");
    } catch { /* cancelled */ }
  });

  el.send.addEventListener("click", async e => {
    e.preventDefault();
    // Open the window first (synchronously) so pop-up blockers allow it, then fill the URL
    const win = window.open("", "_blank");
    let url = null;
    try { url = designUrl(await save()); } catch { /* message goes out without a link */ }
    const text = buildWhatsappMessage({ state, styleId, kitchenTitle: kitchen.title, designUrl: url });
    const wa = `${SITE.whatsappUrl}?text=${encodeURIComponent(text)}`;
    let opened = false;
    if (win) {
      try { win.opener = null; } catch { /* cross-origin popup (sandboxed preview): nothing to clear */ }
      try { win.location.href = wa; opened = true; } catch { try { win.close(); } catch { /* ignore */ } }
    }
    if (!opened && !window.open(wa, "_blank")) location.href = wa;
    track("designer_send_whatsapp", { saved: url ? "yes" : "no" });
  });

  /* ---------- Boot (lazy) ---------- */
  const boot = async () => {
    try {
      renderer = await new KitchenRenderer(kitchen).init();
      el.canvases.forEach(cv => { cv.width = renderer.w; cv.height = renderer.h; });
      el.canvases[0].getContext("2d").putImageData(renderer.original, 0, 0);
      root.querySelector(".stage-original").src = kitchen.image;

      // Restore: shared link > last session > original photo
      const sharedId = new URLSearchParams(location.search).get("design");
      let restored = null;
      if (sharedId && /^[A-Za-z0-9_-]{6,20}$/.test(sharedId)) {
        try { const { data } = await api.getDesign(sharedId); restored = data; savedId = sharedId; } catch { setStatus("הקישור לעיצוב לא נמצא. אפשר להתחיל עיצוב חדש.", "err"); }
      }
      restored = restored || storage.get();
      if (restored?.state) { state = { ...clone(DEFAULT_STATE), ...restored.state }; styleId = restored.styleId || null; }
      syncControls();
      await renderNow();
      el.frame.classList.add("is-ready");
      el.loading.hidden = true;
      // Warm the texture cache in the background
      renderer.preload(Object.values(CATEGORIES).flatMap(c => c.options.map(o => o.texture).filter(Boolean)));
    } catch (err) {
      el.loading.innerHTML = '<p>לא הצלחנו לטעון את ההדמיה. נסו לרענן את הדף.</p>';
      console.error(err);
    }
  };

  syncControls();
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); boot(); } }, { rootMargin: "600px 0px" });
    io.observe(root);
  } else boot();
}

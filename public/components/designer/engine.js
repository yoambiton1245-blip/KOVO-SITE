/**
 * KitchenRenderer: recolors areas of a kitchen photo while keeping its light, shadow and texture.
 *
 * How it works (2D image-based, not 3D):
 *  1. The photo is converted to linear light, and each area gets a soft mask (polygons or PNG).
 *  2. For every area we separate the photo into
 *       lighting = blurred luminance / the polygon's mean luminance   (shadows, light falloff)
 *       detail   = luminance / blurred luminance                       (edges, grooves, fine texture)
 *  3. The new material color (optionally modulated by a tiling texture map) is multiplied by the
 *     lighting and a little of the detail, then blended back through the mask.
 * Changing an area therefore never touches pixels outside its mask.
 */
import { FINISHES, findOption } from "../../../shared/kitchenCatalog.js";

const TEX_BASE = "assets/designer/textures/";
const TEX_SIZE = 512;

// sRGB <-> linear lookup tables
const toLin = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; toLin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const LUT = 4096;
const toSrgb = new Uint8ClampedArray(LUT + 1);
for (let i = 0; i <= LUT; i++) { const c = i / LUT; toSrgb[i] = Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)); }
const enc = v => toSrgb[v <= 0 ? 0 : v >= 1 ? LUT : (v * LUT) | 0];

const hexToLin = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [toLin[(n >> 16) & 255], toLin[(n >> 8) & 255], toLin[n & 255]];
};

const loadImg = src => new Promise((res, rej) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => res(img);
  img.onerror = () => rej(new Error("Failed to load " + src));
  img.src = src;
});

/** Optional in-memory copies of images (data: URLs), e.g. for embedded previews. */
const EMBEDDED = new Map();
export function registerEmbeddedImages(map) { for (const [k, v] of Object.entries(map)) EMBEDDED.set(k, v); }

/**
 * Load an image so the canvas can read its pixels without "tainting" it.
 *  1. An embedded data: URL, if one was registered (never taints).
 *  2. fetch + createImageBitmap: decoded from bytes, so it is origin-clean even when the page runs
 *     in a sandboxed frame (opaque origin) and needs no img-src permission.
 *  3. A plain <img> as the last resort (works on the normal same-origin site).
 */
const loadImage = async src => {
  if (EMBEDDED.has(src)) {
    const dataUrl = EMBEDDED.get(src);
    try { // decode bytes locally: no network request and no img-src needed
      const [head, b64] = dataUrl.split(",");
      const bin = atob(b64), bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return await createImageBitmap(new Blob([bytes], { type: head.slice(5, head.indexOf(";")) }));
    } catch {
      return loadImg(dataUrl);
    }
  }
  try {
    const res = await fetch(src, { credentials: "same-origin" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await createImageBitmap(await res.blob());
  } catch {
    return loadImg(src);
  }
};

/** Separable box blur of a Float32Array (w*h), radius r, `passes` times. */
function boxBlur(src, w, h, r, passes = 2) {
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  const win = 2 * r + 1;
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const row = y * w; let acc = 0;
      for (let x = -r; x <= r; x++) acc += a[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / win;
        acc += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / win;
        acc += b[Math.min(h - 1, y + r + 1) * w + x] - b[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

export class KitchenRenderer {
  constructor(kitchen) {
    this.kitchen = kitchen;
    this.textures = new Map();
  }

  /** Load the photo and prepare masks and lighting maps. */
  async init() {
    const k = this.kitchen;
    const img = await loadImage(k.image);
    const w = (this.w = img.naturalWidth || img.width), h = (this.h = img.naturalHeight || img.height);
    const sx = w / k.width, sy = h / k.height;

    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    this.original = ctx.getImageData(0, 0, w, h);
    const px = this.original.data;
    const n = w * h;

    // Linear RGB + luminance
    this.lin = new Float32Array(n * 3);
    const L = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      const r = toLin[px[j]], g = toLin[px[j + 1]], b = toLin[px[j + 2]];
      this.lin[i * 3] = r; this.lin[i * 3 + 1] = g; this.lin[i * 3 + 2] = b;
      L[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b + 1e-4;
    }

    this.areas = {};
    for (const [id, def] of Object.entries(k.areas)) {
      const mask = new Float32Array(n);
      const light = new Float32Array(n);
      const detail = new Float32Array(n);
      const parts = def.mask ? [await this.#maskFromPng(def.mask, w, h)] : def.polygons.map(p => this.#maskFromPolygon(p, w, h, sx, sy));

      for (const m of parts) {
        // Masked blur: blur(L*m) / blur(m) keeps lighting from leaking across area edges
        const lm = new Float32Array(n);
        let sum = 0, wsum = 0;
        for (let i = 0; i < n; i++) { lm[i] = L[i] * m[i]; sum += lm[i]; wsum += m[i]; }
        if (!wsum) continue;
        const mean = sum / wsum;
        const r = def.lightBlur ?? 6;
        const bl = boxBlur(lm, w, h, r), bm = boxBlur(m, w, h, r);
        for (let i = 0; i < n; i++) {
          if (m[i] <= 0) continue;
          const blurL = bm[i] > 1e-3 ? bl[i] / bm[i] : L[i];
          if (m[i] > mask[i]) {
            mask[i] = m[i];
            light[i] = blurL / mean;
            detail[i] = L[i] / Math.max(blurL, 1e-4);
          }
        }
      }
      const idx = [];
      for (let i = 0; i < n; i++) if (mask[i] > 0.003) idx.push(i);
      this.areas[id] = { mask, light, detail, idx: Uint32Array.from(idx), detailKeep: def.detailKeep ?? 1 };
    }
    return this;
  }

  #maskFromPolygon(poly, w, h, sx, sy) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.filter = "blur(0.8px)";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x * sx, y * sy) : ctx.moveTo(x * sx, y * sy)));
    ctx.closePath();
    ctx.fill();
    const d = ctx.getImageData(0, 0, w, h).data;
    const m = new Float32Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] / 255;
    return m;
  }

  async #maskFromPng(src, w, h) {
    const img = await loadImage(src);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const m = new Float32Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4] / 255;
    return m;
  }

  async #texture(name) {
    if (!name) return null;
    if (this.textures.has(name)) return this.textures.get(name);
    const p = loadImage(TEX_BASE + name + ".webp").then(img => {
      const c = document.createElement("canvas");
      c.width = TEX_SIZE; c.height = TEX_SIZE;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
      const d = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data;
      const t = new Float32Array(TEX_SIZE * TEX_SIZE);
      let mean = 0;
      for (let i = 0; i < t.length; i++) { t[i] = d[i * 4] / 255; mean += t[i]; }
      mean /= t.length;
      for (let i = 0; i < t.length; i++) t[i] -= mean; // zero-mean: texture adds pattern, not brightness
      return t;
    });
    this.textures.set(name, p);
    return p;
  }

  /** Preload every texture used by the catalog (called once, after first paint). */
  preload(names) { return Promise.all([...new Set(names)].map(n => this.#texture(n).catch(() => null))); }

  /**
   * Render a design state into a canvas 2D context.
   * state: { area: [optionId, finishId] | optionId }  (category id === area id)
   */
  async render(state, categories, ctx) {
    const out = new ImageData(new Uint8ClampedArray(this.original.data), this.w, this.h);
    const o = out.data;
    const { lin, w } = this;

    for (const [area, raw] of Object.entries(state)) {
      const a = this.areas[area];
      if (!a) continue;
      const [optId, finishId] = Array.isArray(raw) ? raw : [raw, categories[area]?.finish || "satin"];
      const opt = findOption(area, optId);
      if (!opt || opt.original) continue;
      const fin = FINISHES[finishId] || FINISHES.satin;
      const [cr, cg, cb] = hexToLin(opt.color);
      const tex = await this.#texture(opt.texture);
      const strength = (opt.strength ?? 0) * 1.6;
      const scale = opt.scale ?? 1;
      const { mask, light, detail, idx, detailKeep } = a;

      for (let k = 0; k < idx.length; k++) {
        const i = idx[k];
        const m = mask[i];
        let f = 1;
        if (tex) {
          const x = i % w, y = (i / w) | 0;
          const tx = ((x * scale) | 0) & (TEX_SIZE - 1), ty = ((y * scale) | 0) & (TEX_SIZE - 1);
          f = 1 + tex[ty * TEX_SIZE + tx] * strength;
        }
        const li = Math.pow(light[i], fin.contrast);
        const de = Math.pow(detail[i], fin.detail * detailKeep);
        const shade = li * de * f;
        const sheen = fin.sheen * Math.max(0, light[i] - 1.05) * 0.6;
        const r = cr * shade + sheen, g = cg * shade + sheen, b = cb * shade + sheen;
        const j = i * 4, q = i * 3;
        o[j] = enc(lin[q] + (r - lin[q]) * m);
        o[j + 1] = enc(lin[q + 1] + (g - lin[q + 1]) * m);
        o[j + 2] = enc(lin[q + 2] + (b - lin[q + 2]) * m);
      }
    }
    ctx.putImageData(out, 0, 0);
  }
}

# KOVO website – notes for Claude Code

KOVO is a **kitchens-only** business (custom kitchens) in Katzrin / Golan Heights. Owner: Or Biton (אור ביטון).
The site is Hebrew, RTL. The owner writes in Hebrew, is not a programmer – answer in simple Hebrew, do technical steps yourself,
and when he must click something, give one step at a time.

## Structure
- `public/` – the website (vanilla ES modules, no build step). Entry `index.html` + `main.js`, styles `styles/main.css`.
- `api/` – Vercel Functions: `leads.js` (contact form → email via SMTP), `designs/` (saved designs in Vercel Blob).
- `lib/` – validation, sanitizing, email, design store used by `api/`. `shared/` – constants + kitchen catalog (browser and server).
- `public/config/site.config.js` – links and hosting mode. `<meta name="kovo-hosting" content="vercel">`; on *.netlify.app it falls back to Netlify Forms.
- Netlify leftovers (`netlify/`, `netlify.toml`, `public/_headers`, `public/_redirects`) stay until the old Netlify site is retired; ignored by Vercel.

## Commands
- `npm test` – function tests (node:test). Must pass before any push.
- `npm run preview` – local site + API on http://localhost:3000 (email printed, designs in memory).

## Workflow (agreed with the owner)
1. Work on a branch, never directly on `main`.
2. Test: `npm test`, local preview on desktop and mobile (375px), no console errors, no horizontal scroll.
3. Push the branch only with the owner's OK → Vercel Preview URL → show it to the owner.
4. Merge to `main` (= live site) only after the owner explicitly approves.

## Fixed facts – do not change without the owner asking
- WhatsApp: https://wa.me/972555035890 · Phone (calls): 054-977-8853 · Instagram: https://www.instagram.com/kovo.kitchen/ · Leads email: Kovo.kitchen@gmail.com
- Hero headline, "הסיפור שלנו" and the three testimonials are the owner's exact text – keep verbatim.
- Logo: burgundy K mark `#630209` (sprite `#i-kovo` in index.html) on light grounds, cream on dark grounds, never on a tile.
- Gallery photos are stock inspiration images, labeled as such until real KOVO photos arrive.
- Don't change the overall design, colours, typography or menu unless asked. Keep accessibility and the strict CSP (no inline scripts/styles).

## Design language (redesign, Nov 2026)
- Minimal editorial / architecture-studio feel. Neutrals only: paper `#F7F4EF`, sand `#EEE8DF`, stone, ink `#1B1916`. Burgundy appears only in the logo.
- Frank Ruhl Libre (light weights) for display, Assistant for body. Hairlines instead of boxes and cards, generous white space.
- One primary call to action per area. Section labels "01 —— name". Gentle fade-in only, no flashy effects.
- Home order: hero (video) → statement → projects → designer → story → process → testimonials → contact → footer.
- Gallery layout comes from `size` in `config/projects.fallback.js` (feature / wide / tall / half / small); the first 8 show, the rest behind "לכל הפרויקטים".
- Text over the hero video must keep AA contrast on the brightest frames; re-measure if the shade or hero text changes.

## Kitchen designer
- Photo: `public/assets/designer/kitchen-walnut-island.webp` (1200x800, the owner's photo). Areas are PNG masks in `assets/designer/masks/` (outline + colour rules, so stools, faucet, lamp and counter objects are never repainted).
- Only areas the photo has are offered (`kitchen.areas`); this kitchen is handle-less, so no "handles" tab.
- A new kitchen id must also go into `KITCHEN_IDS` in `lib/design.validator.js` (a test checks this).
- `shared/` and `public/shared/` must be identical (browser loads `public/shared`); a test checks this.
- Mobile: the preview is pinned (sticky) and kept small; the before/after button must not use `touch-action: none` (it blocked page scrolling).
- Secrets only in Vercel Environment Variables, never in the repo.

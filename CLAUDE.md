# KOVO website – notes for Claude Code

KOVO is a **kitchens-only** business (custom kitchens) in Katzrin / Golan Heights. Owner: Or Biton (אור ביטון).
The site is Hebrew, RTL. The owner writes in Hebrew, is not a programmer – answer in simple Hebrew, do technical steps yourself,
and when he must click something, give one step at a time.

## Structure
- `public/` – the website (vanilla ES modules, no build step). Entry `index.html` + `main.js`, styles `styles/main.css`.
- `api/leads.js` – the only Vercel Function: contact form → email via Gmail SMTP. `lib/` – validation, sanitizing, email, `guard.js` (blocks posts from other sites).
- `public/shared/` – constants + kitchen catalog, the single copy used by the browser and by `lib/` (a test checks there is no second copy).
- `public/config/site.config.js` – **the single source** for phone, WhatsApp, Instagram and email. The HTML repeats them only where scripts can't reach (tel: links, JSON-LD); `test/contact.test.js` checks they all match.
- `public/config/projects.js` – gallery items. `small` + `width` give the browser an 800px version (`*-800.webp`) for phones.
- Fonts are self-hosted in `public/assets/fonts/` (variable woff2, Hebrew + Latin, OFL licences next to them). No Google Fonts: the CSP allows `'self'` only.
- Hero video: `hero-desktop.webm` (VP9) with `hero-desktop.mp4` (H.264) fallback, `hero-mobile.mp4` on phones; loads after the page `load` event.

## Commands
- `npm test` – tests (node:test). Must pass before any push.
- `npm run preview` – local site + form API on http://localhost:3000 (the email is printed, not sent).

## Workflow (agreed with the owner)
1. Work on a branch, never directly on `main`.
2. Test: `npm test`, local preview on desktop and mobile (375px), no console errors, no horizontal scroll.
3. Push the branch only with the owner's OK → Vercel Preview URL → show it to the owner.
4. Merge to `main` (= live site) only after the owner explicitly approves.

## Cache
`/assets/*` is cached for one day. To replace a photo, video or font immediately, give the new file a **new name** and update the reference.
JS and CSS are always revalidated, so code changes show up at once.

## Vercel settings outside the code
- Environment Variables: `SMTP_USER`, `SMTP_PASS` (Gmail app password), `LEAD_EMAIL_TO` – all for `Kovo.kitchen1@gmail.com`. Never in the repo.
- Firewall: one rate-limit rule on `POST /api/leads` (per IP). The function itself also rejects cross-site posts and has a honeypot.
- Node.js is pinned in `package.json` (`engines`) and `.nvmrc`.

## Fixed facts – do not change without the owner asking
- Phone, calls and WhatsApp: 055-503-5890 (`+972555035890`) · Instagram: https://www.instagram.com/kovo.kitchen/ · Email: Kovo.kitchen1@gmail.com
- Site address until a custom domain exists: https://kovo-site.vercel.app (canonical, sitemap, robots, JSON-LD; a test checks no other domain appears).
- Hero headline, "הסיפור שלנו" and the three testimonials are the owner's exact text (real, approved) – keep verbatim.
- Logo: burgundy K mark `#630209` on light grounds, cream on dark grounds, never on a tile.
- Gallery photos are stock inspiration images, labeled as such (section note + lightbox caption) until real KOVO photos arrive.
- Never invent business facts: address, business number, warranty, prices, delivery times, opening hours.
- Don't change the overall design, colours, typography or menu unless asked. Keep accessibility and the strict CSP (no inline scripts/styles, no outside hosts).

## Design language (redesign, Nov 2026)
- Minimal editorial / architecture-studio feel. Neutrals only: paper `#F7F4EF`, sand `#EEE8DF`, stone, ink `#1B1916`. Burgundy appears only in the logo.
- Frank Ruhl Libre (light weights) for display, Assistant for body. Hairlines instead of boxes and cards, generous white space.
- One primary call to action per area. Section labels "01 —— name". Gentle fade-in only, no flashy effects.
- Home order: hero (video) → statement → projects → designer → story → process → testimonials → contact → footer.
- Gallery layout comes from `size` in `config/projects.js` (feature / wide / tall / half / small); the first 8 show, the rest behind "לכל הפרויקטים".
- Text over the hero video must keep AA contrast on the brightest frames; re-measure if the shade or hero text changes.

## Kitchen designer
- Photo: `public/assets/designer/kitchen-walnut-island.webp` (1200x800, the owner's photo). Areas are PNG masks in `assets/designer/masks/` (outline + colour rules, so stools, faucet, lamp and counter objects are never repainted).
- Only areas the photo has are offered (`kitchen.areas`); this kitchen is handle-less, so no "handles" tab.
- "Save and link" keeps nothing on a server: the choices are written into the link (`?d=1.<style>.<upper>.<lower>...#design`, see `public/shared/designLink.js`). Only `.` and `:` as separators – WhatsApp turns `~`/`*`/`_` into formatting. Changing option ids breaks old links; bump `VERSION` if the format changes.
- `components/hashAnchor.js` keeps `#design` on screen while the gallery above it loads (otherwise shared links land on the gallery).
- The renderer (`engine.js`) caches per-area light maps and painted pixels; output must stay pixel-identical when optimising.
- Mobile: the preview is pinned (sticky) and kept small; the before/after button must not use `touch-action: none` (it blocked page scrolling).
- No WhatsApp emoji in prefilled messages: the wa.me redirect corrupts them.
